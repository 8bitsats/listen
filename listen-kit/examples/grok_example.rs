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
        // Create a Grok reasoning agent
        let grok_agent = grok::create_grok_reasoning_agent(None, "high")?;
        
        // Create a reasoning loop with the Grok agent
        let agent = ReasoningLoop::new(Model::Custom(Arc::new(grok_agent))).with_stdout(true);

        // Stream the conversation with the agent
        let messages = agent.stream(
            "Calculate the square root of 144 and then add 5 to it. Show your reasoning.".to_string(),
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
