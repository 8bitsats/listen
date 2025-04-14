use {
    anyhow::Result,
    listen_kit::reasoning_loop::{ReasoningLoop, StreamResponse, Model},
    listen_kit::signer::solana::LocalSolanaSigner,
    listen_kit::signer::SignerContext,
    listen_kit::solana::tools::*,
    listen_kit::solana::util::env,
    std::sync::Arc,
};

use serde_json::json;
use rig_core as rig;

#[tokio::main]
async fn main() -> Result<()> {
    // Set the XAI_API_KEY environment variable if not already set
    if std::env::var("XAI_API_KEY").is_err() {
        std::env::set_var("XAI_API_KEY", "xai-US4r3Z7oIj2LPaZrK8fk86xJE8wXHbQDKqFp6FiXWzGu6NM5GpQpTBDjtznQK2k89fNZrmqSVuS8rkPs");
    }

    // Initialize the Solana signer with the private key from environment
    let signer = LocalSolanaSigner::new(env("SOLANA_PRIVATE_KEY"));

    SignerContext::with_signer(Arc::new(signer), async {
        // Create a Grok reasoning agent with Solana tools
        let agent = create_grok_solana_reasoning_agent().await?;
        
        // Create a reasoning loop with the Grok agent
        let agent = ReasoningLoop::new(Model::Custom(Arc::new(agent))).with_stdout(true);

        // Stream the conversation with the agent
        let messages = agent.stream(
            "Check my Solana balance and explain what it means in terms of USD value. Show your reasoning.".to_string(),
            vec![],
            None,
        )
        .await?;

        // Print the messages for debugging
        tracing::info!("messages: {}", serde_json::to_string_pretty(&messages).unwrap());

        Ok(())
    })
    .await
}

// Create a Grok reasoning agent with Solana tools
async fn create_grok_solana_reasoning_agent() -> Result<impl rig::agent::Agent> {
    use rig::providers::openai::Client;
    use rig::providers::openai::ClientBuilder;
    use rig::completion::Message;
    use rig::agent::Agent;
    
    // Create a custom OpenAI-compatible client for Grok API
    let client = ClientBuilder::new()
        .base_url("https://api.x.ai/v1")
        .api_key(std::env::var("XAI_API_KEY").expect("XAI_API_KEY environment variable not set"))
        .build();
    
    // Create a Grok agent with reasoning capabilities and Solana tools
    let agent = client
        .agent("grok-3-mini-beta")
        .preamble("\
            You are a Solana blockchain assistant with strong reasoning capabilities. \
            You can check balances, transactions, and other information on the Solana blockchain. \
            Think step by step and explain your reasoning clearly. \
            When performing calculations or analysis, show your work.\
        ")
        .max_tokens(1024)
        .custom_param("reasoning_effort", json!("high"))
        // Add Solana tools
        .tool(GetSolBalance)
        .tool(GetSplTokenBalance)
        .tool(FetchTokenPrice)
        .tool(GetPortfolio)
        .build();
    
    Ok(agent)
}
