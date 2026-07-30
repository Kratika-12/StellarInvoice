# StellarInvoice — Project Context

## Overview
**StellarInvoice** is a decentralized application (dApp) built on the Stellar network. It acts as a "Stripe Invoicing, but on Stellar" where users can easily create payment invoices, generate shareable links/QR codes, and payers can fulfill them securely using their Stellar wallets (via Freighter) on the Testnet.

## Goal
The immediate goal of this project is to fulfill all requirements up to **Level 3 (Orange Belt)** of the Stellar dApp challenge. This mandates advanced smart contract development, inter-contract communication (token transfers), event streaming/real-time updates, CI/CD pipeline integration, production-ready frontend design (mobile responsive), and comprehensive automated testing.

## Current State & Achievements
The codebase now implements the technical requirements for Levels 1, 2, and 3:

1. **Frontend (React + Vite + Tailwind CSS)**
   - **Wallet Integration:** Uses Stellar Wallets Kit for multi-wallet selection and transaction signing.
   - **Playful, Production-Ready UI:** Fully mobile-responsive, utilizing modern CSS practices, loading spinners, and robust error/success feedback states (e.g., confetti on success).
   - **Contract Integration:** Creates and pays invoices through the deployed Soroban contract.
   - **Real-Time Event Streaming:** Polls the Stellar RPC contract event stream and refreshes the Dashboard and Pay Invoice pages when events arrive.
   - **Unit Tests:** Vitest currently reports 5 passing frontend tests.

2. **Smart Contracts (Soroban + Rust)**
   - **Location:** `contracts/invoice/src/lib.rs`
   - **Advanced Capabilities:** Manages invoice creation (`create_invoice`), retrieval (`get_invoice`), and fulfillment (`pay_invoice`).
   - **Inter-Contract Communication:** The `pay_invoice` function dynamically invokes the native Stellar Asset Contract using the Soroban `token::Client` to actually transfer XLM from the payer to the creator.
   - **Event Streaming:** Emits `InvoiceCreated` and `InvoicePaid` events using `env.events().publish(...)` for indexing and tracking.
   - **Automated Tests:** Four passing contract tests cover the lifecycle, invalid amounts, duplicate IDs, and repeated payments.

3. **CI/CD Pipeline**
   - **GitHub Actions:** Configured in `.github/workflows/ci.yml`. It automates the execution of frontend Vitest suites and runs `cargo build` and `cargo test` for the Soroban contract on every commit/PR to `main`.

4. **Deployment & Infrastructure**
   - **Stellar CLI:** Installed locally.
   - **Network Config:** Configured for `testnet` with Soroban RPC URL.
   - **Deployer Account:** Successfully generated and funded via Friendbot.
     - Address: `GCPCXNV72AYIECKCK4EVUX4ZDKHLTO7DBCOGXZY4BTYNPU63RTC5WPH5`
   - **Deployment Script:** Automated deployment script available at `contracts/deploy.ps1`.

## Deployment

- **Contract:** `CAZDIM6GMNYMY7FRY3LOZQ5IOXM3QE55GHMHNOYKNXI52ATE5JZ3QSZL`
- **Deployment transaction:** `ae2fa58566cc641853b7c5f000570cb0ffef6005855d81009a1147904f0832a1`
- **Verified builds:** frontend production build and `wasm32v1-none` release build pass locally.

## Submission Work Remaining

1. Push the completed commits and confirm GitHub Actions passes.
2. Deploy the frontend publicly and add its URL to the README.
3. Capture mobile, wallet selector, CI, tests, and successful payment screenshots.
4. Record and link the required 1–2 minute demo video.

## Resources
- **Stellar Developer Docs:** https://developers.stellar.org/docs
- **Soroban Rust SDK:** https://soroban.stellar.org/docs/reference/interfaces
- **Freighter API:** https://docs.freighter.app/
- **Stellar Expert (Testnet):** https://stellar.expert/explorer/testnet
