# Solana Agent with Interface Integration Guide

This guide explains how to set up and use the Solana Agent with the Listen Interface.

## Overview

This integration consists of two parts:
1. A Rust backend server (`solana_agent_with_interface.rs`) that exposes the Solana agent functionality over HTTP
2. A React component (`SolanaAgentConnector.tsx`) in the listen-interface that communicates with this server

## Setup Instructions

### Step 1: Start the Rust Backend Server

1. Make sure you have the necessary environment variables set in your `.env` file:
   - `SOLANA_PRIVATE_KEY` - Your Solana private key
   - `SOLANA_RPC_URL` - Your Solana RPC URL
   - Model API keys (ANTHROPIC_API_KEY, GEMINI_API_KEY, etc.)

2. Run the Solana Agent server with both solana and http features enabled:
   ```bash
   cd /Users/8bit/Documents/GitHub/listen
   cargo run --example solana_agent_with_interface --features "solana http"
   ```

3. The server will start on `http://localhost:3030` with the following endpoints:
   - `GET /health` - Health check endpoint
   - `POST /agent` - Agent API endpoint that accepts JSON requests

### Step 2: Integrate with the Listen Interface

1. Import the SolanaAgentConnector component:
   ```typescript
   import { SolanaAgentConnector } from './components/SolanaAgentConnector';
   ```

2. Add it to your React application:
   ```jsx
   <SolanaAgentConnector 
     apiUrl="http://localhost:3030" 
     defaultModel="gemini" 
   />
   ```

3. Start the listen-interface application:
   ```bash
   cd /Users/8bit/Documents/GitHub/listen/listen-interface
   npm run dev
   ```

## API Documentation

### Backend API (Rust)

#### Health Check Endpoint
- **URL**: `GET /health`
- **Response**: Plain text indicating the server is running

#### Agent Endpoint
- **URL**: `POST /agent`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "message": "Your message to the agent",
    "model": "gemini", // Optional: "gemini", "claude", "deepseek", etc.
    "features": {      // Optional
      "autonomous": false,
      "deep_research": false
    },
    "language": "en"   // Optional
  }
  ```
- **Response**:
  ```json
  {
    "messages": [
      {
        "role": "assistant",
        "content": "Agent's response",
        "id": "0"
      }
    ]
  }
  ```

### Frontend Component Props (React)

The `SolanaAgentConnector` component accepts these props:

- `apiUrl` (optional): The URL of the Solana Agent API (default: "http://localhost:3030")
- `defaultModel` (optional): The default LLM model to use (default: "gemini")

## Available Models

The following models are available for use:

- Gemini
- Claude
- DeepSeek
- OpenRouter (Llama)
- OpenRouter (Claude)
- OpenRouter (Gemini)
- OpenRouter (OpenAI)

## Troubleshooting

### Common Issues

1. **Connection Error**: 
   - Ensure the Rust backend is running
   - Check that the `apiUrl` prop is correct
   - Verify there are no network issues or firewalls blocking the connection

2. **Authentication Errors**:
   - Verify that all required API keys are set in the `.env` file
   - Check that the Solana private key is valid

3. **Solana Errors**:
   - Ensure the Solana RPC URL is valid and accessible
   - Verify you have SOL in your wallet for transactions

### Logs

- Check the terminal running the Rust backend for server logs
- Check the browser console for frontend errors

## Development

To modify the backend:
- Edit `listen-kit/examples/solana_agent_with_interface.rs`

To modify the frontend component:
- Edit `listen-interface/src/components/SolanaAgentConnector.tsx`
