import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { isConnected, getPublicKey, signTransaction } from "@stellar/freighter-api";
import { Horizon, TransactionBuilder, Networks, Asset, Operation, Transaction } from "@stellar/stellar-sdk";
import {
  serverCreateInvoice,
  serverGetInvoice,
  serverMarkPaid,
  serverGetAllInvoices,
  type InvoiceData,
} from "./server-db";

export type Invoice = InvoiceData;

type WalletState = {
  address: string | null;
  balance: number;
  connecting: boolean;
  funding: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  fundWallet: () => Promise<void>;
};

const WalletContext = createContext<WalletState | null>(null);

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const server = new Horizon.Server(HORIZON_URL);

export async function fetchAccountBalance(address: string): Promise<number> {
  try {
    const account = await server.loadAccount(address);
    const native = account.balances.find((b) => b.asset_type === "native");
    return native ? parseFloat(native.balance) : 0;
  } catch (err: any) {
    if (err.response?.status === 404) {
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

export async function connectWallet(): Promise<{ address: string; balance: number }> {
  const freighterConnected = await isConnected();
  if (!freighterConnected) {
    throw new Error("Freighter wallet is not installed or available.");
  }
  const address = await getPublicKey();
  if (!address) {
    throw new Error("Could not retrieve wallet address from Freighter.");
  }
  const balance = await fetchAccountBalance(address);
  return { address, balance };
}

export async function createInvoice(data: {
  amount: string;
  description: string;
  dueDate?: string;
  from: string;
}): Promise<Invoice> {
  return await serverCreateInvoice(data);
}

export async function payInvoice(id: string): Promise<{ txHash: string }> {
  // 1. Fetch invoice details from server
  const invoice = await serverGetInvoice(id);
  if (!invoice) {
    throw new Error("Invoice not found on the server");
  }
  if (invoice.status === "paid") {
    throw new Error("Invoice has already been paid");
  }

  // 2. Retrieve connected address
  const payerAddress = await getPublicKey();
  if (!payerAddress) {
    throw new Error("Please connect your Freighter wallet to perform the payment");
  }

  // 3. Verify balance
  const balance = await fetchAccountBalance(payerAddress);
  if (parseFloat(invoice.amount) > balance) {
    throw new Error(`Insufficient XLM balance. You need ${invoice.amount} XLM but only have ${balance.toFixed(2)} XLM.`);
  }

  // 4. Fetch account information from horizon (to extract current sequence number)
  const payerAccount = await server.loadAccount(payerAddress);

  // 5. Build payment transaction operation
  const tx = new TransactionBuilder(payerAccount, {
    fee: "100", // base fee in stroops
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination: invoice.from,
        asset: Asset.native(),
        amount: invoice.amount,
      })
    )
    .setTimeout(60)
    .build();

  const xdr = tx.toXDR();

  // 6. Sign transaction via Freighter extension
  const { signedTxXdr, error } = await signTransaction(xdr, {
    network: "TESTNET",
  });

  if (error) {
    throw new Error(error || "Freighter rejected the signature request");
  }

  if (!signedTxXdr) {
    throw new Error("Failed to receive signed transaction from Freighter extension");
  }

  // 7. Submit signed envelope XDR to Stellar Horizon testnet
  const submittedTx = new Transaction(signedTxXdr, Networks.TESTNET);
  const result = await server.submitTransaction(submittedTx);

  if (!result.successful) {
    throw new Error("Stellar Horizon node rejected transaction submission");
  }

  const txHash = result.hash;

  // 8. Update database invoice state
  await serverMarkPaid({ id, txHash });

  return { txHash };
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
  return await serverGetInvoice(id);
}

export function truncateAddr(addr: string) {
  return addr.length > 10 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [funding, setFunding] = useState(false);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const { address, balance } = await connectWallet();
      setAddress(address);
      setBalance(balance);
    } catch (err: any) {
      console.error("Wallet connection failed:", err);
      // Soft failure inside provider, errors are handled at form calls
      throw err;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setBalance(0);
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