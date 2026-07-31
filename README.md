# StellarInvoice | Smart Invoicing on Stellar

![Stellar](https://img.shields.io/badge/Stellar-Testnet-7B61FF?style=for-the-badge&logo=stellar&logoColor=white)
![Soroban](https://img.shields.io/badge/Soroban-Smart_Contract-FF7A66?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-9_Passing-2EA44F?style=for-the-badge)
![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)

**StellarInvoice** is a mobile-responsive Stellar testnet dApp for creating shareable XLM invoices and paying them through a Soroban smart contract.

It combines multi-wallet support, QR-code payment links, native XLM transfers, contract events, transaction tracking, automated tests, and a deployment pipeline in one end-to-end invoicing experience.

> Stripe Invoicing, but on Stellar.

---

## Live Demo

| Resource               | Link                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend               | Add the public deployment URL before submission                                                                                       |
| Contract               | [Open in Stellar Lab](https://lab.stellar.org/r/testnet/contract/CAZDIM6GMNYMY7FRY3LOZQ5IOXM3QE55GHMHNOYKNXI52ATE5JZ3QSZL)            |
| Deployment transaction | [View on Stellar Expert](https://stellar.expert/explorer/testnet/tx/ae2fa58566cc641853b7c5f000570cb0ffef6005855d81009a1147904f0832a1) |
| Demo video             | Add the 1–2 minute demo video before submission                                                                                       |

---

## Levels 1–3 Submission Coverage

| Level | Requirement | Implementation | Evidence needed |
| --- | --- | --- | --- |
| Level 1 | Freighter and Testnet | Freighter is available through Stellar Wallets Kit and the app uses Testnet | Wallet-connected screenshot |
| Level 1 | Connect and disconnect | Wallet selector, persistent state, guarded routes, and disconnect redirect | Demo recording |
| Level 1 | XLM balance | Horizon balance fetch, balance badge, and Friendbot funding action | Balance screenshot |
| Level 1 | XLM transaction | `pay_invoice` transfers native XLM through the Stellar Asset Contract | Payment hash and screenshot |
| Level 1 | Transaction feedback | Signing, pending, success, failure, hash, and Explorer states | Transaction screenshot |
| Level 2 | Multi-wallet support | Stellar Wallets Kit wallet selector | Wallet-selector screenshot |
| Level 2 | Three error types | Missing wallet, rejected request, insufficient balance, network, and validation errors | Demo or documentation |
| Level 2 | Deployed contract | Testnet contract address and deployment transaction are documented below | Explorer link |
| Level 2 | Frontend contract calls | Frontend invokes `create_invoice`, `get_invoice`, and `pay_invoice` | Interaction hash |
| Level 2 | Real-time events | Soroban RPC event polling refreshes invoice views | Demo recording |
| Level 3 | Advanced contract | Authenticated lifecycle, validation, persistent state, and payment protection | Source and tests |
| Level 3 | Inter-contract communication | Invoice contract calls the native Stellar Asset Contract | Test and payment hash |
| Level 3 | CI/CD | Actions runs lint, typecheck, frontend tests/build, contract tests/build, and uploads WASM | Actions screenshot |
| Level 3 | Deployment workflow | Repeatable PowerShell Testnet deployment script | `contracts/deploy.ps1` |
| Level 3 | Responsive production UI | Public landing, protected create/dashboard routes, payer page, and complete states | Mobile screenshot |
| Level 3 | Automated tests | 5 frontend and 4 contract tests pass locally | Test screenshot |
| Level 3 | Documentation | Setup, architecture, deployment, testing, and demo walkthrough are documented here | Live URL and video |

## Orange Belt Submission Checklist

| Requirement                             | Status                                        |
| --------------------------------------- | --------------------------------------------- |
| Advanced smart-contract development     | ✅ Complete                                   |
| Inter-contract communication            | ✅ Native XLM Stellar Asset Contract transfer |
| Event streaming and real-time updates   | ✅ Soroban RPC event polling                  |
| CI/CD pipeline                          | ✅ GitHub Actions workflow configured         |
| Smart-contract deployment workflow      | ✅ PowerShell deployment script               |
| Mobile-responsive frontend              | ✅ Verified at 375 px                         |
| Error handling and loading states       | ✅ Complete                                   |
| Frontend tests                          | ✅ 5 passing                                  |
| Smart-contract tests                    | ✅ 4 passing                                  |
| Production-ready architecture practices | ✅ Implemented and documented                 |
| Public GitHub repository                | ⏳ Remote configured; confirm public visibility |
| Minimum 10 meaningful commits           | ✅ 11 commits prepared                        |
| Deployed contract address               | ✅ Published below                            |
| Contract deployment transaction         | ✅ Published below                            |
| Live frontend URL                       | ⏳ Deploy and add before submission           |
| Successful interaction transaction     | ⏳ Create/pay an invoice and add its hash     |
| Required screenshots                    | ⏳ Capture after the CI and payment demo      |
| Demo video                              | ⏳ Record before submission                   |

---

## Features

| Feature                     | Description                                                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Multi-wallet connection     | Freighter, xBull, Albedo, Rabet, Lobstr, Hana, HOT Wallet, Klever, and other supported wallets through Stellar Wallets Kit |
| Testnet wallet funding      | Request test XLM from Friendbot inside the interface                                                                       |
| Balance display             | Fetch and display the connected wallet’s native XLM balance                                                                |
| Invoice creation            | Create an invoice with an amount, description, and optional due date                                                       |
| On-chain invoice state      | Store invoice creator, amount, description, status, and payer in Soroban                                                   |
| Shareable payment links     | Generate a dedicated payer URL for every invoice                                                                           |
| QR-code payments            | Scan a generated QR code to open the payer page                                                                            |
| Contract-based payment      | Invoke `pay_invoice` instead of bypassing the contract                                                                     |
| Inter-contract XLM transfer | Invoice contract calls the native Stellar Asset Contract to transfer XLM                                                   |
| Transaction lifecycle       | Display pending, signing, submitted, successful, and failed states                                                         |
| Real-time synchronization   | Refresh dashboard and payer state when the contract emits an event                                                         |
| Invoice dashboard           | Search and filter pending and paid invoices                                                                                |
| Explorer links              | Open successful transactions directly in Stellar Expert                                                                    |
| Automated CI                | Test and build the frontend and contract on pushes and pull requests                                                       |

---

## Error Handling

StellarInvoice provides specific, recoverable feedback for:

- Wallet extension not installed or unavailable
- Wallet connection or signature rejection
- Insufficient XLM balance
- Stellar RPC or network failure
- Invalid, zero, negative, or over-precision amounts
- Missing contract configuration
- Duplicate invoice IDs
- Unknown invoices
- Repeated invoice payments
- Failed or long-pending contract transactions

No wallet secret key is transmitted to or stored by the application.

---

## Contracts and Transactions

| Item                   | Value                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| Network                | Stellar Testnet                                                    |
| Invoice contract ID    | `CAZDIM6GMNYMY7FRY3LOZQ5IOXM3QE55GHMHNOYKNXI52ATE5JZ3QSZL`         |
| Deployment transaction | `ae2fa58566cc641853b7c5f000570cb0ffef6005855d81009a1147904f0832a1` |
| Contract functions     | `create_invoice`, `get_invoice`, `pay_invoice`                     |
| Contract events        | `Created`, `Paid`                                                  |
| Payment asset          | Native XLM Stellar Asset Contract                                  |
| Deployer address       | `GCMURRXBRCMC6CKA7V34LNJJLXGXF75RN74H4TI5JTUUPVOI4XMPXFD6`         |

### Contract behavior

`create_invoice`:

- Requires creator authorization
- Rejects zero or negative amounts
- Rejects duplicate invoice IDs
- Stores the invoice on the Soroban ledger
- Publishes a `Created` event

`pay_invoice`:

- Requires payer authorization
- Rejects unknown or already-paid invoices
- Calls the native token contract to transfer XLM
- Records the payer and paid status
- Publishes a `Paid` event

---

## Tests

### Verified results

| Suite                     | Result   |
| ------------------------- | -------- |
| Frontend test files       | 2 passed |
| Frontend tests            | 5 passed |
| Soroban contract tests    | 4 passed |
| TypeScript typecheck      | Passed   |
| Production frontend build | Passed   |
| Release WASM build        | Passed   |

### Run the frontend checks

```powershell
npm install
npm run test
npm run typecheck
npm run lint
npm run build
```

Run every frontend quality gate with one command:

```powershell
npm run verify
```

### Run the contract checks

```powershell
Set-Location contracts/invoice
cargo test
rustup target add wasm32v1-none
cargo build --target wasm32v1-none --release
```

---

## Setup

### Requirements

- Node.js 22.12 or newer
- npm
- Rust stable
- Stellar CLI 25 or newer
- A supported Stellar wallet configured for Testnet

### Install and run

```powershell
git clone https://github.com/Kratika-12/StellarInvoice.git
Set-Location StellarInvoice
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open the local URL printed by Vite. The current development configuration normally uses:

```text
http://localhost:8080
```

### Environment configuration

```env
VITE_CONTRACT_ID=CAZDIM6GMNYMY7FRY3LOZQ5IOXM3QE55GHMHNOYKNXI52ATE5JZ3QSZL
```

Only public contract configuration belongs in Vite environment variables. Never add wallet secret keys.

---

## Soroban Contract Deployment

The automated PowerShell workflow configures Testnet, creates or reuses the local deployer identity, builds the WASM, deploys the contract, verifies `get_invoice`, and writes the public contract ID to `.env.local`.

```powershell
Set-Location contracts
.\deploy.ps1
```

### Manual deployment

```powershell
Set-Location contracts/invoice

rustup target add wasm32v1-none
cargo build --target wasm32v1-none --release

stellar contract deploy `
  --wasm target/wasm32v1-none/release/stellar_invoice_contract.wasm `
  --source-account deployer `
  --network testnet `
  --alias stellar_invoice
```

Verify the deployed contract:

```powershell
stellar contract invoke `
  --id CAZDIM6GMNYMY7FRY3LOZQ5IOXM3QE55GHMHNOYKNXI52ATE5JZ3QSZL `
  --source-account deployer `
  --network testnet `
  -- `
  get_invoice `
  --id VERIFY-NOT-FOUND
```

The expected result for an unknown invoice is `null`.

---

## Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                  React + TanStack Start                 │
│ Create Invoice │ Pay Invoice │ Dashboard │ Wallet UI   │
└──────────────────────────┬──────────────────────────────┘
                           │
                 Stellar Wallets Kit
                           │
             Wallet selection and transaction signing
                           │
                 Stellar Testnet RPC/Horizon
                    ┌──────┴──────┐
                    │             │
          Invoice Contract    Contract Events
                    │             │
         Native XLM Contract      └── UI synchronization
                    │
              XLM transfer

TanStack server functions ── db.json metadata index
```

### Transaction flow

1. The creator connects a Testnet wallet.
2. The frontend validates and converts XLM to stroops.
3. The wallet signs a `create_invoice` Soroban invocation.
4. The contract stores the invoice and emits `Created`.
5. The app saves searchable off-chain display metadata.
6. A payer opens the invoice link and connects another wallet.
7. The wallet signs `pay_invoice`.
8. The invoice contract invokes the native XLM contract.
9. The contract stores the paid state and emits `Paid`.
10. The dashboard detects the event and refreshes automatically.

---

## Project Structure

```text
stellar-spark-main/
|-- .github/
|   `-- workflows/
|       `-- ci.yml
|-- contracts/
|   |-- deploy.ps1
|   `-- invoice/
|       |-- Cargo.toml
|       |-- Cargo.lock
|       `-- src/
|           `-- lib.rs
|-- public/
|-- src/
|   |-- components/
|   |   |-- AppShell.tsx
|   |   `-- ui/
|   |-- lib/
|   |   |-- invoice.ts
|   |   |-- invoice.test.ts
|   |   |-- server-db.ts
|   |   |-- stellar.tsx
|   |   `-- utils.test.ts
|   |-- routes/
|   |   |-- index.tsx
|   |   |-- create.tsx
|   |   |-- dashboard.tsx
|   |   `-- pay.$id.tsx
|   `-- styles.css
|-- .env.example
|-- CONTEXT.md
|-- brand.md
|-- package.json
|-- README.md
`-- vitest.config.ts
```

---

## Demo Walkthrough

1. Open StellarInvoice at a mobile viewport.
2. Select **Choose Wallet** and connect a Testnet wallet.
3. Verify the wallet name, address, and XLM balance.
4. Use **Fund Wallet** if the account needs test XLM.
5. Create an invoice and approve the contract call.
6. Copy or scan the generated payment link.
7. Open the link with a second Testnet wallet.
8. Pay the invoice and approve the contract transaction.
9. Show the successful transaction hash and Stellar Expert page.
10. Return to the dashboard and show the automatic Paid update.

---

## Screenshots

Add the final submission screenshots under `assets/`:

| View                               | Suggested file               |
| ---------------------------------- | ---------------------------- |
| Landing and wallet-connected state | `assets/landing-wallet.png`  |
| Multi-wallet selector              | `assets/wallet-selector.png` |
| Mobile create-invoice UI           | `assets/mobile-create.png`   |
| Generated invoice and QR code      | `assets/invoice-created.png` |
| Successful payment transaction     | `assets/payment-success.png` |
| Paid invoice dashboard             | `assets/dashboard-paid.png`  |
| Passing GitHub Actions workflow    | `assets/ci-passing.png`      |
| Frontend and contract test output  | `assets/tests-passing.png`   |

## Final Submission Actions

These steps require the project owner’s browser, wallet approval, hosting account, or submission
account and cannot be completed by a local build alone:

1. Push the current working tree to the public GitHub repository.
2. Confirm the updated GitHub Actions workflow passes on `main`.
3. Deploy the frontend and replace the Live Demo placeholder with its public URL.
4. Connect two funded Testnet wallets, create an invoice, and pay it.
5. Add the successful contract interaction/payment transaction hash and Explorer link above.
6. Capture the eight screenshots listed in the Screenshots section.
7. Record and upload the 1–2 minute walkthrough described in Demo Walkthrough.
8. Add the video URL and submit the repository for each selected challenge period.

---

## Next Iteration Plan

- Replace the local JSON metadata index with a transactional hosted database.
- Add authenticated, wallet-scoped dashboard queries.
- Store and query the complete invoice index from contract events.
- Add invoice expiry and partial-payment support.
- Add USD estimates, templates, recurring invoices, and payment reminders.
- Complete an independent contract security review before Mainnet.

---

## Documentation

- [Project context](CONTEXT.md)
- [Development plan](../StellarInvoice-Dev-Plan.md)
- [Stellar developer documentation](https://developers.stellar.org/docs)
- [Stellar Wallets Kit](https://stellarwalletskit.dev)
- [Stellar Expert Testnet Explorer](https://stellar.expert/explorer/testnet)

---

## License

This project is currently provided for the Stellar challenge and Testnet demonstration. Add an explicit open-source license file before public production distribution.
