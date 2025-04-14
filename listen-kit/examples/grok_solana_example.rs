use {
    anyhow::Result,
    listen_kit::reasoning_loop::{ReasoningLoop, Model},
    listen_kit::signer::solana::LocalSolanaSigner,
    listen_kit::signer::SignerContext,
    listen_kit::solana::tools::*,
    listen_kit::solana::util::env,
    listen_kit::grok,
    std::sync::Arc,
};

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
        let grok_agent = grok::create_grok_solana_agent(None, "high")?;
        
        // Create a reasoning loop with the Grok agent
        let mut agent_builder = rig_core::providers::openai::ClientBuilder::new()
            .base_url("https://api.x.ai/v1")
            .api_key(std::env::var("XAI_API_KEY").expect("XAI_API_KEY environment variable not set"))
            .build()
            .agent("grok-3-mini-beta")
            .preamble("\
                You are a Solana blockchain assistant with strong reasoning capabilities. \
                You can check balances, transactions, and other information on the Solana blockchain. \
                Think step by step and explain your reasoning clearly. \
                When performing calculations or analysis, show your work.\
            ")
            .max_tokens(1024)
            .custom_param("reasoning_effort", serde_json::json!("high"));
            
        // Add Solana tools
        agent_builder = agent_builder
            .tool(GetSolBalance)
            .tool(GetSplTokenBalance)
            .tool(FetchTokenPrice)
            .tool(GetPortfolio);
            
        let grok_agent = agent_builder.build();
        
        // Create a reasoning loop with the Grok agent
        let agent = ReasoningLoop::new(Model::Custom(Arc::new(grok_agent))).with_stdout(true);

        // Stream the conversation with the agent
        let messages = agent.stream(
            "Check my Solana balance and explain what it means in terms of USD value. Show your reasoning.".to_string(),
            vec![],
            None,
        )
        .await?;

        // Print the messages for debugging
        println!("\n\nCompleted conversation with {} messages", messages.len());

        Ok(())
    })
    .await
}
