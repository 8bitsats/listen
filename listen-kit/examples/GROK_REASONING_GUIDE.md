# Grok Reasoning Loop Guide

This guide explains how to use the Grok reasoning capabilities with the listen-kit project. Grok's reasoning models provide step-by-step thinking before responding, making them ideal for complex tasks like blockchain analysis.

## Overview

Grok 3 Mini is a lightweight, smaller thinking model that excels at reasoning-heavy tasks. Unlike traditional models that generate answers immediately, Grok 3 Mini thinks before responding, making it ideal for:

- Math and quantitative analysis
- Step-by-step problem solving
- Blockchain transaction analysis
- Financial calculations

## Setup

### API Key

You'll need an xAI API key to use Grok. Set it as an environment variable:

```bash
export XAI_API_KEY=your-api-key-here
```

Or in your code:

```rust
std::env::set_var("XAI_API_KEY", "your-api-key-here");
```

### Available Models

For reasoning tasks, use one of these models:

- `grok-3-mini-beta` - Optimized for reasoning with more thinking time
- `grok-3-mini-fast-beta` - Faster reasoning with less thinking time

**Note:** The standard Grok 3 models (`grok-3-beta` and `grok-3-fast-beta`) do not support reasoning.

## Basic Usage

Here's a simple example of using the Grok reasoning loop:

```rust
// Create a Grok reasoning agent
let agent = create_grok_reasoning_agent().await?;

// Create a reasoning loop with the Grok agent
let agent = ReasoningLoop::new(Model::Custom(Arc::new(agent))).with_stdout(true);

// Stream the conversation with the agent
let messages = agent.stream(
    "Calculate the square root of 144 and then add 5 to it. Show your reasoning.".to_string(),
    vec![],
    None,
)
.await?;
```

## Solana Integration

The `grok_solana_reasoning.rs` example demonstrates how to use Grok's reasoning capabilities with Solana blockchain tools:

```rust
// Create a Grok agent with reasoning capabilities and Solana tools
let mut agent = client
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
    .tool(GetTokenPrice)
    .tool(GetPortfolio)
    .tool(GetTokenMetadata)
    .build();
```

## Controlling Reasoning Effort

The `reasoning_effort` parameter controls how much time the model spends thinking before responding:

- `low`: Minimal thinking time, using fewer tokens for quick responses
- `high`: Maximum thinking time, leveraging more tokens for complex problems

Choose the right level based on your task complexity and response time requirements.

## Accessing Reasoning Content

The model's reasoning process is available in the `reasoning_content` field of the response. Our custom wrapper extracts and displays this content:

```rust
// Extract reasoning content if available
if let Some(custom_data) = &result.custom_data {
    if let Some(reasoning) = custom_data.get("reasoning_content") {
        if let Some(reasoning_str) = reasoning.as_str() {
            // Add the reasoning as a system message
            let mut new_result = result.clone();
            new_result.content = Some(format!("**Reasoning:**\n{}\n\n**Response:**\n{}", 
                reasoning_str, 
                result.content.clone().unwrap_or_default()));
            return Ok(new_result);
        }
    }
}
```

## Example Use Cases

1. **Token Analysis**: Analyze token prices and market trends with step-by-step reasoning
2. **Portfolio Evaluation**: Calculate portfolio value and diversification metrics
3. **Transaction Planning**: Determine optimal transaction strategies with fee calculations
4. **Risk Assessment**: Evaluate investment risks with quantitative analysis

## Running the Examples

To run the basic Grok reasoning example:

```bash
cargo run --example grok_reasoning_loop
```

To run the Solana integration example:

```bash
cargo run --example grok_solana_reasoning
```

## Advanced Configuration

You can customize the Grok agent with additional parameters:

```rust
let agent = client
    .agent("grok-3-mini-beta")
    .preamble("Your custom system prompt here")
    .max_tokens(1024)
    .custom_param("reasoning_effort", json!("high"))
    .custom_param("temperature", json!(0.7))
    // Add any other custom parameters
    .build();
```

## Streaming Responses

The Grok reasoning loop supports streaming responses, allowing you to see the model's output in real-time:

```rust
let agent = ReasoningLoop::new(Model::Custom(Arc::new(agent))).with_stdout(true);
```

Set `with_stdout(true)` to see the streaming output in the console.
