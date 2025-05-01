export const config = {
  engineEndpoint:
    process.env.NODE_ENV === "production"
      ? "https://api.listen-rs.com/v1/engine"
      : "http://localhost:6966",
  kitEndpoint:
    process.env.NODE_ENV === "production"
      ? "https://api.listen-rs.com/v1/kit"
      : "http://localhost:6969",
  // Solana RPC URL using Helius
  solanaRpcUrl: "https://mainnet.helius-rpc.com/?api-key=c55c146c-71ef-41b9-a574-cb08f359c00c",
  // Birdeye API
  birdeyeApiKey: "", // This will be set through the UI
};
