use anyhow::{Result, anyhow};
use dotenv::dotenv;
use serde::{Deserialize, Serialize};
use solana_client::rpc_client::RpcClient;
use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;
use std::env;

#[tokio::main]
async fn main() -> Result<()> {
    // Load environment variables from .env file if it exists
    dotenv().ok();
    
    // Get API keys and URLs from environment
    let rpc_url = env::var("SOLANA_RPC_URL")
        .unwrap_or_else(|_| "https://api.mainnet-beta.solana.com".to_string());
    
    // Get wallet address from environment or use default
    let wallet_address = env::var("WALLET_ADDRESS")
        .unwrap_or_else(|_| "71uG8CcGJYxvm4WzX25qMZd8ELAhSKrofXFRdc63Sbo8".to_string());
    
    println!("===== Solana Wallet Analysis (Helius RPC) =====\n");
    println!("Using Helius RPC API for wallet analysis");
    println!("Analyzing wallet: {}\n", wallet_address);

    // Create RPC client for Solana
    let client = RpcClient::new(rpc_url);
    
    // Get SOL balance from Solana RPC
    let sol_balance = get_sol_balance(&client, &wallet_address).await?;
    println!("SOL Balance: {} SOL", sol_balance);
    
    // Get an approximate SOL price (hardcoded for now since we don't have Birdeye)
    let sol_price = 150.0; // Approximate current SOL price in USD
    println!("Approximate SOL Price: ${:.2}", sol_price);
    
    // Calculate SOL USD value
    let sol_usd_value = sol_balance * sol_price;
    println!("SOL USD Value: ${:.2}\n", sol_usd_value);
    
    // Get token accounts
    let token_accounts = match get_token_accounts(&client, &wallet_address).await {
        Ok(accounts) => accounts,
        Err(e) => {
            println!("Error fetching token accounts: {}", e);
            vec![]
        }
    };
    
    println!("===== Token Accounts =====");
    println!("Number of token accounts: {}", token_accounts.len());
    
    for (i, account) in token_accounts.iter().enumerate().take(5) {
        println!("{}. Token account: {}", i+1, account);
    }
    
    if token_accounts.len() > 5 {
        println!("   ... and {} more token accounts", token_accounts.len() - 5);
    }
    
    // Provide reasoning about the wallet
    println!("\n===== Wallet Analysis =====");
    println!("Step 1: Retrieved the SOL balance of wallet {}", wallet_address);
    println!("Step 2: Found the wallet holds {} SOL (approx. ${:.2})", sol_balance, sol_usd_value);
    println!("Step 3: Found {} token accounts associated with this wallet", token_accounts.len());
    
    // Provide context about the holdings
    let context = if sol_balance > 100.0 {
        "This is a significant wallet with a large SOL balance, suggesting it may be a whale account or an institutional wallet."
    } else if sol_balance > 10.0 {
        "This represents a moderate investment in the Solana ecosystem."
    } else if sol_balance > 1.0 {
        "This is a retail investor wallet, likely for personal use or small trading."
    } else if sol_balance > 0.0 {
        "This is a minimal balance wallet, possibly used for gas fees or small transactions."
    } else {
        "This wallet appears to be inactive or has minimal SOL value."
    };
    
    println!("\nWallet Assessment: {}", context);
    
    // Security reminder
    println!("\n===== Security Reminder =====");
    println!("This analysis is read-only. Remember to keep private keys secure and never share them.");
    println!("The wallet data was obtained using public APIs and contains no private information.");
    
    Ok(())
}

// Get the SOL balance for a Solana address
async fn get_sol_balance(client: &RpcClient, address: &str) -> Result<f64> {
    let pubkey = Pubkey::from_str(address)
        .map_err(|e| anyhow!("Invalid Solana address: {}", e))?;
    
    let balance = client.get_balance(&pubkey)
        .map_err(|e| anyhow!("Failed to get balance: {}", e))?;
    
    // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
    let sol_balance = balance as f64 / 1_000_000_000.0;
    
    Ok(sol_balance)
}

// Get token accounts for a wallet
async fn get_token_accounts(client: &RpcClient, wallet_address: &str) -> Result<Vec<String>> {
    let pubkey = Pubkey::from_str(wallet_address)
        .map_err(|e| anyhow!("Invalid Solana address: {}", e))?;
    
    let accounts = client.get_token_accounts_by_owner(
        &pubkey,
        solana_client::rpc_request::TokenAccountsFilter::ProgramId(
            Pubkey::from_str("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA").unwrap()
        )
    ).map_err(|e| anyhow!("Failed to get token accounts: {}", e))?;
    
    let account_addresses = accounts.iter()
        .map(|account| account.pubkey.to_string())
        .collect();
    
    Ok(account_addresses)
}
