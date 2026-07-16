#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};

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
        
        let invoice = Invoice {
            id: id.clone(),
            creator,
            amount,
            description,
            status: 0, // pending
            paid_by: None,
        };
        
        env.storage().instance().set(&id, &invoice);
        
        invoice
    }
    
    /// Retrieves invoice details from the ledger using the invoice ID
    pub fn get_invoice(env: Env, id: String) -> Option<Invoice> {
        env.storage().instance().get(&id)
    }
    
    /// Marks an invoice as paid. In production, this can also check or lock funds.
    pub fn pay_invoice(env: Env, id: String, payer: Address) -> Invoice {
        payer.require_auth();
        
        let mut invoice: Invoice = env.storage().instance().get(&id).expect("Invoice not found");
        if invoice.status != 0 {
            panic!("Invoice already paid");
        }
        
        invoice.status = 1; // paid
        invoice.paid_by = Some(payer);
        
        env.storage().instance().set(&id, &invoice);
        
        invoice
    }
}
