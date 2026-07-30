#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short, token,
    Address, Env, String,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum InvoiceError {
    InvalidAmount = 1,
    InvoiceAlreadyExists = 2,
    InvoiceNotFound = 3,
    InvoiceAlreadyPaid = 4,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Invoice {
    pub id: String,
    pub creator: Address,
    pub amount: i128,
    pub description: String,
    pub status: u32, // 0 = pending, 1 = paid
    pub paid_by: Option<Address>,
}

#[contract]
pub struct InvoiceContract;

#[contractimpl]
impl InvoiceContract {
    /// Creates a new invoice and persists it on the Soroban ledger
    pub fn create_invoice(
        env: Env,
        id: String,
        creator: Address,
        amount: i128,
        description: String,
    ) -> Invoice {
        creator.require_auth();

        if amount <= 0 {
            panic_with_error!(&env, InvoiceError::InvalidAmount);
        }
        if env.storage().instance().has(&id) {
            panic_with_error!(&env, InvoiceError::InvoiceAlreadyExists);
        }

        let invoice = Invoice {
            id: id.clone(),
            creator: creator.clone(),
            amount,
            description,
            status: 0, // pending
            paid_by: None,
        };
        
        env.storage().instance().set(&id, &invoice);
        
        // Publish event for real-time tracking
        env.events().publish((symbol_short!("Created"), id.clone()), invoice.clone());
        
        invoice
    }
    
    /// Retrieves invoice details from the ledger using the invoice ID
    pub fn get_invoice(env: Env, id: String) -> Option<Invoice> {
        env.storage().instance().get(&id)
    }
    
    /// Pays an invoice using the provided token asset, transferring funds to the creator
    pub fn pay_invoice(
        env: Env,
        id: String,
        payer: Address,
        token_address: Address,
    ) -> Invoice {
        payer.require_auth();
        
        let mut invoice: Invoice = env
            .storage()
            .instance()
            .get(&id)
            .unwrap_or_else(|| panic_with_error!(&env, InvoiceError::InvoiceNotFound));
        if invoice.status != 0 {
            panic_with_error!(&env, InvoiceError::InvoiceAlreadyPaid);
        }
        
        // Inter-contract communication: interact with Token contract (e.g. XLM)
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&payer, &invoice.creator, &invoice.amount);
        
        invoice.status = 1; // paid
        invoice.paid_by = Some(payer.clone());
        
        env.storage().instance().set(&id, &invoice);
        
        // Publish event for real-time tracking
        env.events().publish((symbol_short!("Paid"), id.clone()), invoice.clone());
        
        invoice
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env, String};
    use soroban_sdk::token::Client as TokenClient;
    use soroban_sdk::token::StellarAssetClient;

    #[test]
    fn test_create_and_pay_invoice() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, InvoiceContract);
        let client = InvoiceContractClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let payer = Address::generate(&env);
        let admin = Address::generate(&env);
        
        // Set up native token (XLM) mock
        let token_contract = env.register_stellar_asset_contract_v2(admin.clone());
        let token_client = TokenClient::new(&env, &token_contract.address());
        let stellar_asset_client = StellarAssetClient::new(&env, &token_contract.address());
        
        // Mint some tokens to the payer
        stellar_asset_client.mint(&payer, &1000);
        
        // Create an invoice
        let invoice_id = String::from_str(&env, "INV-123");
        let invoice = client.create_invoice(
            &invoice_id,
            &creator,
            &100, // amount
            &String::from_str(&env, "Test Invoice"),
        );
        
        assert_eq!(invoice.status, 0);
        
        // Pay the invoice
        let paid_invoice = client.pay_invoice(&invoice_id, &payer, &token_contract.address());
        
        assert_eq!(paid_invoice.status, 1);
        assert_eq!(paid_invoice.paid_by, Some(payer.clone()));
        
        // Verify token balances changed
        assert_eq!(token_client.balance(&payer), 900);
        assert_eq!(token_client.balance(&creator), 100);
    }

    #[test]
    #[should_panic(expected = "Error(Contract, #1)")]
    fn rejects_zero_amount() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, InvoiceContract);
        let client = InvoiceContractClient::new(&env, &contract_id);
        client.create_invoice(
            &String::from_str(&env, "INV-ZERO"),
            &Address::generate(&env),
            &0,
            &String::from_str(&env, "Invalid"),
        );
    }

    #[test]
    #[should_panic(expected = "Error(Contract, #2)")]
    fn rejects_duplicate_invoice_id() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, InvoiceContract);
        let client = InvoiceContractClient::new(&env, &contract_id);
        let creator = Address::generate(&env);
        let id = String::from_str(&env, "INV-DUP");
        let description = String::from_str(&env, "Duplicate");
        client.create_invoice(&id, &creator, &10, &description);
        client.create_invoice(&id, &creator, &10, &description);
    }

    #[test]
    #[should_panic(expected = "Error(Contract, #4)")]
    fn rejects_double_payment() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, InvoiceContract);
        let client = InvoiceContractClient::new(&env, &contract_id);
        let creator = Address::generate(&env);
        let payer = Address::generate(&env);
        let admin = Address::generate(&env);
        let token_contract = env.register_stellar_asset_contract_v2(admin);
        StellarAssetClient::new(&env, &token_contract.address()).mint(&payer, &100);
        let id = String::from_str(&env, "INV-PAID");
        client.create_invoice(
            &id,
            &creator,
            &10,
            &String::from_str(&env, "Pay once"),
        );
        client.pay_invoice(&id, &payer, &token_contract.address());
        client.pay_invoice(&id, &payer, &token_contract.address());
    }
}
