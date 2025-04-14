use crate::signer::TransactionSigner;
use anyhow::Result;
use std::sync::Arc;

pub mod agent;
pub mod agents;
pub mod common;
pub mod cross_chain;
pub mod data;
pub mod dexscreener;
pub mod distiller;
pub mod faster100x;
pub mod grok;
pub mod lunarcrush;
pub mod mongo;
pub mod reasoning_loop;
pub mod signer;
pub mod think;
pub mod tokenizer;
pub mod twitter;
pub mod web;

#[cfg(feature = "http")]
pub mod http;

#[cfg(feature = "solana")]
pub mod solana;

#[cfg(feature = "evm")]
pub mod evm;

#[ctor::ctor]
fn init() {
    dotenv::dotenv().ok();
    // std::env::set_var("RUST_LOG", "debug");
    listen_tracing::setup_tracing();
}

pub async fn ensure_solana_wallet_created(
    signer: Arc<dyn TransactionSigner>,
) -> Result<()> {
    if signer.pubkey().is_none() {
        return Err(anyhow::anyhow!("Wallet unavailable"));
    }
    Ok(())
}

pub async fn ensure_evm_wallet_created(
    signer: Arc<dyn TransactionSigner>,
) -> Result<()> {
    if signer.address().is_none() {
        return Err(anyhow::anyhow!("Wallet unavailable"));
    }
    Ok(())
}
