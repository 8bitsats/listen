#[cfg(feature = "solana")]
use {
    anyhow::Result,
    listen_kit::solana::signer::local::LocalSigner,
    listen_kit::solana::signer::SignerContext,
    listen_kit::solana::tools::Portfolio,
    listen_kit::solana::util::env,
    rig::streaming::{stream_to_stdout, StreamingPrompt},
    std::sync::Arc,
};

#[cfg(feature = "solana")]
#[tokio::main]
async fn main() -> Result<()> {
    let signer = LocalSigner::new(env("SOLANA_PRIVATE_KEY"));
    SignerContext::with_signer(Arc::new(signer), async {
    let agent = rig::providers::anthropic::Client::from_env()
        .agent(rig::providers::anthropic::CLAUDE_3_5_SONNET)
        .preamble("you are a portfolio checker, if you do wanna call a tool, outline the reasoning why that tool")
        .max_tokens(1024)
        .tool(Portfolio)
        .build();

    let mut stream = agent
        .stream_prompt("whats the portfolio looking like?")
        .await.unwrap(); // FIXME accept Result for the closure

    stream_to_stdout(agent, &mut stream).await.unwrap(); // FIXME accept Result for the closure
    }).await;

    Ok(())
}

#[cfg(not(feature = "solana"))]
fn main() {
    println!("enable the solana feature to run this example");
}
