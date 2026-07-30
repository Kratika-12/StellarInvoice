import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import {
  Address,
  Asset,
  BASE_FEE,
  Contract,
  Horizon,
  nativeToScVal,
  Networks,
  rpc,
  Transaction,
  TransactionBuilder,
  type xdr,
} from "@stellar/stellar-sdk";
import {
  serverCreateInvoice,
  serverGetInvoice,
  serverMarkPaid,
  serverGetAllInvoices,
  type InvoiceData,
} from "./server-db";
import { classifyWalletError, xlmToStroops } from "./invoice";

export type Invoice = InvoiceData;

type WalletState = {
  address: string | null;
  balance: number;
  connecting: boolean;
  funding: boolean;
  walletName: string | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  fundWallet: () => Promise<void>;
};

const WalletContext = createContext<WalletState | null>(null);

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const RPC_URL = "https://soroban-testnet.stellar.org";
export const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID?.trim() ?? "";
const server = new Horizon.Server(HORIZON_URL);
const rpcServer = new rpc.Server(RPC_URL);

type WalletKit = import("@creit.tech/stellar-wallets-kit").StellarWalletsKit;
let walletKitPromise: Promise<WalletKit> | null = null;

async function getWalletKit(): Promise<WalletKit> {
  if (!walletKitPromise) {
    walletKitPromise = import("@creit.tech/stellar-wallets-kit").then(
      ({ StellarWalletsKit, WalletNetwork, allowAllModules, FREIGHTER_ID }) =>
        new StellarWalletsKit({
          network: WalletNetwork.TESTNET,
          selectedWalletId: FREIGHTER_ID,
          modules: allowAllModules(),
        }),
    );
  }
  return walletKitPromise;
}

export async function fetchAccountBalance(address: string): Promise<number> {
  try {
    const account = await server.loadAccount(address);
    const native = account.balances.find((b) => b.asset_type === "native");
    return native ? parseFloat(native.balance) : 0;
  } catch (err: unknown) {
    const status =
      typeof err === "object" &&
      err !== null &&
      "response" in err &&
      typeof err.response === "object" &&
      err.response !== null &&
      "status" in err.response
        ? err.response.status
        : undefined;
    if (status === 404) {
      return 0; // Account not active yet
    }
    console.error("Error loading account balance:", err);
    return 0;
  }
}

export async function fundWithFriendbot(address: string): Promise<boolean> {
  try {
    const res = await fetch(`https://friendbot.stellar.org?addr=${address}`);
    if (res.ok) {
      // Wait a moment for transaction to clear on testnet ledger
      await new Promise((r) => setTimeout(r, 2000));
      return true;
    }
    return false;
  } catch (err) {
    console.error("Friendbot error:", err);
    return false;
  }
}

export async function connectWallet(): Promise<{
  address: string;
  balance: number;
  walletName: string;
}> {
  const kit = await getWalletKit();
  return await new Promise((resolve, reject) => {
    void kit.openModal({
      modalTitle: "Choose a Stellar testnet wallet",
      notAvailableText: "Not installed",
      onClosed: (error) => error && reject(error),
      onWalletSelected: async (wallet) => {
        try {
          kit.setWallet(wallet.id);
          const { address } = await kit.getAddress();
          if (!address) throw new Error("The selected wallet did not return an address.");
          resolve({
            address,
            balance: await fetchAccountBalance(address),
            walletName: wallet.name,
          });
        } catch (error) {
          reject(error);
        }
      },
    });
  });
}

export async function createInvoice(data: {
  amount: string;
  description: string;
  dueDate?: string;
  from: string;
}): Promise<Invoice> {
  assertContractConfigured();
  const id = `INV-${Date.now().toString(36).toUpperCase()}`;
  const contractTxHash = await submitContractCall(
    data.from,
    new Contract(CONTRACT_ID).call(
      "create_invoice",
      nativeToScVal(id),
      new Address(data.from).toScVal(),
      nativeToScVal(xlmToStroops(data.amount), { type: "i128" }),
      nativeToScVal(data.description),
    ),
  );
  return await serverCreateInvoice({ data: { ...data, id, contractTxHash } });
}

export async function payInvoice(id: string): Promise<{ txHash: string }> {
  // 1. Fetch invoice details from server
  const invoice = await serverGetInvoice({ data: id });
  if (!invoice) {
    throw new Error("Invoice not found on the server");
  }
  if (invoice.status === "paid") {
    throw new Error("Invoice has already been paid");
  }

  assertContractConfigured();
  const kit = await getWalletKit();
  const { address: payerAddress } = await kit.getAddress();
  if (!payerAddress) {
    throw new Error("Please connect your Freighter wallet to perform the payment");
  }

  // 3. Verify balance
  const balance = await fetchAccountBalance(payerAddress);
  if (parseFloat(invoice.amount) > balance) {
    throw new Error(
      `Insufficient XLM balance. You need ${invoice.amount} XLM but only have ${balance.toFixed(2)} XLM.`,
    );
  }

  const nativeTokenContract = Asset.native().contractId(Networks.TESTNET);
  const txHash = await submitContractCall(
    payerAddress,
    new Contract(CONTRACT_ID).call(
      "pay_invoice",
      nativeToScVal(id),
      new Address(payerAddress).toScVal(),
      new Address(nativeTokenContract).toScVal(),
    ),
  );

  // 8. Update database invoice state
  await serverMarkPaid({ data: { id, txHash } });

  return { txHash };
}

function assertContractConfigured() {
  if (!CONTRACT_ID) {
    throw new Error(
      "The invoice contract is not configured. Set VITE_CONTRACT_ID after deploying to testnet.",
    );
  }
}

async function signWithSelectedWallet(transaction: Transaction): Promise<Transaction> {
  const kit = await getWalletKit();
  const { signedTxXdr } = await kit.signTransaction(transaction.toXDR(), {
    networkPassphrase: Networks.TESTNET,
  });
  if (!signedTxXdr) throw new Error("The wallet did not return a signed transaction.");
  return new Transaction(signedTxXdr, Networks.TESTNET);
}

async function submitContractCall(source: string, operation: xdr.Operation): Promise<string> {
  try {
    const account = await server.loadAccount(source);
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(operation)
      .setTimeout(60)
      .build();
    const prepared = await rpcServer.prepareTransaction(transaction);
    const signed = await signWithSelectedWallet(prepared);
    const sent = await rpcServer.sendTransaction(signed);

    if (sent.status === "ERROR") {
      throw new Error("The Stellar RPC rejected the contract transaction.");
    }

    for (let attempt = 0; attempt < 20; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const result = await rpcServer.getTransaction(sent.hash);
      if (result.status === "SUCCESS") return sent.hash;
      if (result.status === "FAILED") {
        throw new Error("The contract transaction failed on the Stellar testnet.");
      }
    }
    throw new Error("The transaction is still pending. Check Stellar Expert using its hash.");
  } catch (error) {
    throw new Error(classifyWalletError(error));
  }
}

export async function readInvoices(): Promise<Invoice[]> {
  try {
    return await serverGetAllInvoices();
  } catch (err) {
    console.error("Failed to read server invoices:", err);
    return [];
  }
}

export async function findInvoice(id: string): Promise<Invoice | null> {
  return await serverGetInvoice({ data: id });
}

export function subscribeToInvoiceEvents(
  onEvent: (txHash: string) => void,
  onError?: (error: Error) => void,
): () => void {
  if (!CONTRACT_ID) return () => undefined;
  let active = true;
  let cursor: string | undefined;
  let startLedger: number | undefined;

  async function poll() {
    try {
      if (startLedger === undefined) {
        startLedger = (await rpcServer.getLatestLedger()).sequence;
      }
      const response = await rpcServer.getEvents(
        cursor
          ? { filters: [{ type: "contract", contractIds: [CONTRACT_ID] }], cursor, limit: 50 }
          : {
              filters: [{ type: "contract", contractIds: [CONTRACT_ID] }],
              startLedger,
              limit: 50,
            },
      );
      if (!active) return;
      cursor = response.cursor;
      response.events.forEach((event) => onEvent(event.txHash));
    } catch (error) {
      if (active && onError) onError(new Error(classifyWalletError(error)));
    }
  }

  void poll();
  const timer = window.setInterval(() => void poll(), 5000);
  return () => {
    active = false;
    window.clearInterval(timer);
  };
}

export function truncateAddr(addr: string) {
  return addr.length > 10 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [funding, setFunding] = useState(false);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const { address, balance, walletName } = await connectWallet();
      setAddress(address);
      setBalance(balance);
      setWalletName(walletName);
    } catch (err) {
      console.error("Wallet connection failed:", err);
      const message = classifyWalletError(err);
      setError(message);
      throw new Error(message);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setBalance(0);
    setWalletName(null);
    setError(null);
  }, []);

  const fundWallet = useCallback(async () => {
    if (!address) return;
    setFunding(true);
    try {
      const success = await fundWithFriendbot(address);
      if (success) {
        const bal = await fetchAccountBalance(address);
        setBalance(bal);
      }
    } finally {
      setFunding(false);
    }
  }, [address]);

  return (
    <WalletContext.Provider
      value={{
        address,
        balance,
        connecting,
        funding,
        walletName,
        error,
        connect,
        disconnect,
        fundWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
