use anyhow::Result;
use rig_core as rig;
use serde_json::json;
use std::sync::Arc;

/// Grok agent type for reasoning capabilities
pub type GrokAgent = rig::agent::Agent<rig::providers::openai::CompletionModel>;

/// Creates a Grok reasoning agent with the specified API key
pub fn create_grok_reasoning_agent(
    api_key: Option<String>,
    reasoning_effort: &str,
) -> Result<GrokAgent> {
    // Use provided API key or get from environment
    let api_key = api_key.unwrap_or_else(|| {
        std::env::var("XAI_API_KEY").expect("XAI_API_KEY environment variable not set")
    });
    
    // Create a custom OpenAI-compatible client for Grok API
    let client = rig::providers::openai::ClientBuilder::new()
        .base_url("https://api.x.ai/v1")
        .api_key(api_key)
        .build();
    
    // Create a Grok agent with reasoning capabilities
    let agent = client
        .agent("grok-3-mini-beta")
        .preamble("You are a helpful AI assistant with strong reasoning capabilities. Think step by step.")
        .max_tokens(1024)
        .custom_param("reasoning_effort", json!(reasoning_effort))
        .build();
    
    Ok(agent)
}

/// Creates a Grok reasoning agent with Solana tools
pub fn create_grok_solana_agent(
    api_key: Option<String>,
    reasoning_effort: &str,
) -> Result<GrokAgent> {
    // Use provided API key or get from environment
    let api_key = api_key.unwrap_or_else(|| {
        std::env::var("XAI_API_KEY").expect("XAI_API_KEY environment variable not set")
    });
    
    // Create a custom OpenAI-compatible client for Grok API
    let client = rig::providers::openai::ClientBuilder::new()
        .base_url("https://api.x.ai/v1")
        .api_key(api_key)
        .build();
    
    // Create a Grok agent with reasoning capabilities
    let agent = client
        .agent("grok-3-mini-beta")
        .preamble("\
            You are a Solana blockchain assistant with strong reasoning capabilities. \
            You can check balances, transactions, and other information on the Solana blockchain. \
            Think step by step and explain your reasoning clearly. \
            When performing calculations or analysis, show your work.\
        ")
        .max_tokens(1024)
        .custom_param("reasoning_effort", json!(reasoning_effort))
        .build();
    
    Ok(agent)
}
