# StellarInvoice

StellarInvoice is a production-oriented Stellar testnet dApp for creating shareable XLM invoices and paying them through a Soroban smart contract. It is designed as “Stripe Invoicing, but on Stellar,” with a friendly mobile-first interface.

## Live contract

- Network: Stellar Testnet
- Contract: `CAZDIM6GMNYMY7FRY3LOZQ5IOXM3QE55GHMHNOYKNXI52ATE5JZ3QSZL`
- Deployment transaction: `ae2fa58566cc641853b7c5f000570cb0ffef6005855d81009a1147904f0832a1`
- [Contract in Stellar Lab](https://lab.stellar.org/r/testnet/contract/CAZDIM6GMNYMY7FRY3LOZQ5IOXM3QE55GHMHNOYKNXI52ATE5JZ3QSZL)
- [Deployment transaction on Stellar Expert](https://stellar.expert/explorer/testnet/tx/ae2fa58566cc641853b7c5f000570cb0ffef6005855d81009a1147904f0832a1)

## Level 1–3 coverage

- Multi-wallet connection through Stellar Wallets Kit, including Freighter, xBull, Albedo, Rabet, Lobstr, Hana, HOT Wallet, and Klever where available.
- Connected address, XLM balance, disconnect, and Friendbot funding.
- Soroban `create_invoice`, `get_invoice`, and `pay_invoice` functions.
- Inter-contract XLM transfer through the native Stellar Asset Contract.
- Contract events for invoice creation and payment, consumed through Stellar RPC event polling.
- Visible pending, signing, success, failure, transaction hash, and explorer states.
- Specific handling for missing wallets, rejected signatures, insufficient balance, network errors, invalid amounts, duplicate invoices, and repeated payments.
- Responsive create, payment, and dashboard pages.
- Frontend and smart-contract test suites with more than three passing tests.
- GitHub Actions jobs for frontend tests/build, contract tests/build, and WASM artifact upload.
- Repeatable PowerShell deployment workflow.

## Architecture

The React/TanStack Start frontend uses Stellar Wallets Kit for wallet selection and signing. Contract transactions are prepared and submitted through Stellar RPC. Invoice metadata is retained by TanStack server functions in `db.json`, while payment authorization, XLM transfer, status, and events are enforced by Soroban.

```text
Wallet Kit -> React UI -> Stellar RPC -> Invoice Contract
                                        -> Native XLM Contract
                    -> server functions -> db.json metadata index
Contract events -> RPC event poller -> dashboard/payment refresh
```

No wallet secret key is sent to or stored by the application.

## Run locally

Requirements:

- Node.js 20+
- Rust stable
- Stellar CLI 25+
- A Stellar wallet such as Freighter configured for Testnet

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Test

```powershell
npm run test
npm run build
Set-Location contracts/invoice
cargo test
cargo build --target wasm32v1-none --release
```

Current verified local results:

- Frontend: 5 passing tests
- Contract: 4 passing tests
- Production frontend build: passing
- Release WASM build: passing

## Deploy the contract

From PowerShell:

```powershell
Set-Location contracts
.\deploy.ps1
```

The script configures testnet, reuses or creates the local `deployer` identity, builds and deploys the contract, verifies `get_invoice`, and writes the public contract ID to `.env.local`.

## Manual demo flow

1. Open the app on a mobile-sized viewport.
2. Select **Choose Wallet**, pick Freighter or another installed wallet, and approve Testnet access.
3. Confirm the connected wallet name, address, and XLM balance.
4. If needed, select **Fund Wallet** to use Friendbot.
5. Enter an amount, description, and optional due date.
6. Generate the invoice and approve the `create_invoice` contract call.
7. Copy or scan the generated payment link.
8. Open the link with a second testnet wallet.
9. Pay and approve the `pay_invoice` contract call.
10. Confirm the paid state, transaction hash, Stellar Expert link, and automatic dashboard refresh.

## Submission assets still to add

Add these repository-owned assets before submitting:

- Public live frontend URL
- Mobile responsive screenshot
- Wallet selection screenshot
- GitHub Actions passing screenshot
- Test output screenshot showing 3+ passing tests
- Successful payment/contract transaction screenshot
- 1–2 minute demo video link

## Security and production notes

- This deployment is Testnet-only.
- The backend file index is suitable for the challenge demo; replace it with a transactional hosted database before mainnet.
- Add authentication and authorization to private dashboard queries before storing customer-sensitive invoice metadata.
- Complete an independent contract review before mainnet use.
