use anyhow::{Result, anyhow};
use dotenv::dotenv;
use reqwest::{Client, header};
use serde::{Deserialize, Serialize};
use solana_client::rpc_client::RpcClient;
use solana_client::rpc_request::TokenAccountsFilter;
use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;
use std::env;
use std::collections::HashMap;

// Define Birdeye API response structures
#[derive(Debug, Deserialize)]
struct BirdeyeResponse<T> {
    success: bool,
    data: Option<T>,
    error: Option<String>,
}

#[derive(Debug, Deserialize)]
struct TokenListResponse {
    tokens: Vec<TokenInfo>,
    #[serde(rename = "totalHoldings")]
    total_holdings: f64,
}

#[derive(Debug, Deserialize)]
struct TokenInfo {
    address: String,
    symbol: String,
    #[serde(rename = "displayName")]
    display_name: Option<String>,
    price: f64,
    value: f64,
    supply: Option<f64>,
    decimals: i32,
    amount: f64,
    #[serde(rename = "logoURI")]
    logo_uri: Option<String>,
}

#[derive(Debug, Deserialize)]
struct TokenOverview {
    address: String,
    symbol: String,
    name: String,
    price: f64,
    #[serde(rename = "priceChange24h")]
    price_change_24h: f64,
    #[serde(rename = "volumeUSD24h")]
    volume_usd_24h: f64,
    #[serde(rename = "marketCapUSD")]
    market_cap_usd: f64,
    #[serde(rename = "dilutedMarketCapUSD")]
    diluted_market_cap_usd: Option<f64>,
}

#[tokio::main]
async fn main() -> Result<()> {
    // Load environment variables from .env file if it exists
    dotenv().ok();
    
    // Get API keys and URLs from environment
    let rpc_url = env::var("SOLANA_RPC_URL")
        .unwrap_or_else(|_| "https://api.mainnet-beta.solana.com".to_string());
    
    let birdeye_api_key = env::var("BIRDEYE_API_KEY")
        .expect("BIRDEYE_API_KEY must be set in the environment or .env file");
    
    // Get wallet address from environment or use default
    let wallet_address = env::var("WALLET_ADDRESS")
        .unwrap_or_else(|_| "71uG8CcGJYxvm4WzX25qMZd8ELAhSKrofXFRdc63Sbo8".to_string());
    
    println!("===== Solana Wallet Analysis =====\n");
    println!("Using Helius RPC and Birdeye APIs for comprehensive analysis");
    println!("Analyzing wallet: {}\n", wallet_address);

    // Create RPC client for Solana
    let client = RpcClient::new(rpc_url);
    
    // Get SOL balance from Solana RPC
    let sol_balance = get_sol_balance(&client, &wallet_address).await?;
    println!("SOL Balance: {} SOL", sol_balance);
    
    // Get current SOL price from Birdeye
    let sol_overview = get_token_overview(&birdeye_api_key, "So11111111111111111111111111111111111111112").await?;
    let sol_price = sol_overview.price;
    
    println!("Current SOL Price: ${:.2} ({:.2}% 24h)", 
             sol_price, 
             sol_overview.price_change_24h);
    
    // Calculate SOL USD value
    let sol_usd_value = sol_balance * sol_price;
    println!("SOL USD Value: ${:.2}\n", sol_usd_value);
    
    // Get wallet portfolio from Birdeye
    println!("===== Token Portfolio =====");
    let portfolio = get_wallet_portfolio(&birdeye_api_key, &wallet_address).await?;
    
    if portfolio.tokens.is_empty() {
        println!("No SPL tokens found in this wallet.\n");
    } else {
        // Calculate total portfolio value including SOL
        let token_value = portfolio.total_holdings;
        let total_value = token_value + sol_usd_value;
        
        println!("Total Portfolio Value: ${:.2}", total_value);
        println!("Token Holdings Value: ${:.2}", token_value);
        println!("Number of SPL Tokens: {}\n", portfolio.tokens.len());
        
        // Display token details
        println!("Top Token Holdings:");
        for (i, token) in portfolio.tokens.iter().enumerate().take(5) {
            let token_name = token.display_name.clone().unwrap_or(token.symbol.clone());
            println!("{}. {} ({})", i + 1, token_name, token.symbol);
            println!("   Amount: {:.6}", token.amount);
            println!("   Value: ${:.2}", token.value);
            println!("   Price: ${:.6}", token.price);
        }
        
        if portfolio.tokens.len() > 5 {
            println!("   ... and {} more tokens", portfolio.tokens.len() - 5);
        }
    }
    
    // Get current market trends (top gainers)
    println!("\n===== Market Trends =====");
    let gainers = get_top_gainers(&birdeye_api_key).await?;
    println!("Top 5 Gainers (1 Week PnL):");
    for (i, gainer) in gainers.iter().enumerate().take(5) {
        println!("{}. {} - {:.2}%", i + 1, gainer, 0.0); // Only using addresses for now
    }
    
    // Provide reasoning about the wallet
    println!("\n===== Wallet Analysis =====");
    println!("Step 1: Retrieved the SOL balance of wallet {}", wallet_address);
    println!("Step 2: Found the wallet holds {} SOL (${:.2})", sol_balance, sol_usd_value);
    println!("Step 3: Analyzed token portfolio with {} SPL tokens", portfolio.tokens.len());
    
    // Calculate portfolio breakdown
    let token_value = portfolio.total_holdings;
    let total_value = token_value + sol_usd_value;
    
    if total_value > 0.0 {
        let sol_percentage = (sol_usd_value / total_value) * 100.0;
        let token_percentage = (token_value / total_value) * 100.0;
        
        println!("Step 4: Portfolio breakdown: {:.1}% in SOL, {:.1}% in other tokens", 
                 sol_percentage, token_percentage);
    }
    
    // Provide context about the holdings
    let context = if total_value > 10000.0 {
        "This is a significant portfolio, suggesting this may be a whale account or an institutional wallet."
    } else if total_value > 1000.0 {
        "This represents a moderate investment in the Solana ecosystem."
    } else if total_value > 100.0 {
        "This is a retail investor portfolio, likely for personal use or small trading."
    } else if total_value > 0.0 {
        "This is a minimal balance wallet, possibly used for gas fees or small transactions."
    } else {
        "This wallet appears to be inactive or has minimal value."
    };
    
    println!("\nPortfolio Assessment: {}", context);
    
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

// Get wallet portfolio from Birdeye API
async fn get_wallet_portfolio(api_key: &str, wallet_address: &str) -> Result<TokenListResponse> {
    let url = format!("https://public-api.birdeye.so/v1/wallet/token_list?wallet={}", wallet_address);
    
    let client = Client::new();
    let response = client.get(&url)
        .header("X-API-KEY", api_key)
        .header("accept", "application/json")
        .header("x-chain", "solana")
        .send()
        .await
        .map_err(|e| anyhow!("Failed to fetch wallet portfolio: {}", e))?;
    
    let response_text = response.text().await
        .map_err(|e| anyhow!("Failed to get response text: {}", e))?;
    
    let birdeye_response: BirdeyeResponse<TokenListResponse> = serde_json::from_str(&response_text)
        .map_err(|e| anyhow!("Failed to parse Birdeye response: {}", e))?;
    
    if !birdeye_response.success {
        return Err(anyhow!("Birdeye API error: {}", 
                         birdeye_response.error.unwrap_or_else(|| "Unknown error".to_string())));
    }
    
    Ok(birdeye_response.data.unwrap_or(TokenListResponse {
        tokens: Vec::new(),
        total_holdings: 0.0,
    }))
}

// Get token overview from Birdeye API
async fn get_token_overview(api_key: &str, token_address: &str) -> Result<TokenOverview> {
    let url = format!("https://public-api.birdeye.so/defi/token_overview?address={}", token_address);
    
    let client = Client::new();
    let response = client.get(&url)
        .header("X-API-KEY", api_key)
        .header("accept", "application/json")
        .header("x-chain", "solana")
        .send()
        .await
        .map_err(|e| anyhow!("Failed to fetch token overview: {}", e))?;
    
    let response_text = response.text().await
        .map_err(|e| anyhow!("Failed to get response text: {}", e))?;
    
    let birdeye_response: BirdeyeResponse<TokenOverview> = serde_json::from_str(&response_text)
        .map_err(|e| anyhow!("Failed to parse Birdeye response: {}", e))?;
    
    if !birdeye_response.success {
        return Err(anyhow!("Birdeye API error: {}", 
                         birdeye_response.error.unwrap_or_else(|| "Unknown error".to_string())));
    }
    
    birdeye_response.data.ok_or_else(|| anyhow!("No token overview data returned"))
}

// Get top gainers from Birdeye API
async fn get_top_gainers(api_key: &str) -> Result<Vec<String>> {
    let url = "https://public-api.birdeye.so/trader/gainers-losers?type=1W&sort_by=PnL&sort_type=desc&offset=0&limit=5";
    
    let client = Client::new();
    let response = client.get(url)
        .header("X-API-KEY", api_key)
        .header("accept", "application/json")
        .header("x-chain", "solana")
        .send()
        .await
        .map_err(|e| anyhow!("Failed to fetch top gainers: {}", e))?;
    
    // For simplicity, just return addresses of top gainers
    // In a full implementation, you'd parse the complete response
    Ok(vec!["Top gainer data will be parsed in a future version".to_string()])
}
