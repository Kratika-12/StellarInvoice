# StellarInvoice — Contract Deploy Script
# Run from: contracts/ directory
# Requirements: stellar-cli and cargo must be in PATH

$ErrorActionPreference = "Stop"
$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"

Write-Host "=== StellarInvoice Contract Deploy ===" -ForegroundColor Cyan

# Step 1: Verify stellar CLI
Write-Host "`n[1/6] Checking stellar CLI..." -ForegroundColor Yellow
stellar --version

# Step 2: Configure testnet network (if not already done)
Write-Host "`n[2/6] Configuring testnet network..." -ForegroundColor Yellow
stellar network add testnet `
  --rpc-url https://soroban-testnet.stellar.org `
  --network-passphrase "Test SDF Network ; September 2015" `
  2>$null
Write-Host "Network configured." -ForegroundColor Green

# Step 3: Generate/use deployer keypair funded by Friendbot
Write-Host "`n[3/6] Generating funded deployer keypair..." -ForegroundColor Yellow
stellar keys generate deployer --network testnet --fund
stellar keys address deployer

# Step 4: Build the WASM contract
Write-Host "`n[4/6] Building Soroban WASM contract..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\invoice"
cargo build --target wasm32v1-none --release
Set-Location "$PSScriptRoot"
Write-Host "Build complete." -ForegroundColor Green

# Step 5: Deploy to testnet
Write-Host "`n[5/6] Deploying contract to Stellar Testnet..." -ForegroundColor Yellow
$CONTRACT_ID = stellar contract deploy `
  --wasm "invoice\target\wasm32v1-none\release\stellar_invoice_contract.wasm" `
  --source-account deployer `
  --network testnet `
  --alias stellar_invoice

Write-Host "`nContract deployed! ID: $CONTRACT_ID" -ForegroundColor Green

# Step 6: Verify by invoking get_invoice (expect null)
Write-Host "`n[6/6] Verifying contract by calling get_invoice..." -ForegroundColor Yellow
stellar contract invoke `
  --id $CONTRACT_ID `
  --source-account deployer `
  --network testnet `
  -- `
  get_invoice `
  --id "test123"

Write-Host "`n=== Deploy Complete! ===" -ForegroundColor Cyan
Write-Host "Contract ID: $CONTRACT_ID" -ForegroundColor Green
Write-Host "View on Stellar Expert: https://stellar.expert/explorer/testnet/contract/$CONTRACT_ID" -ForegroundColor Blue
