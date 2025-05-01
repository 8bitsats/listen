import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { config } from "../config";
import { usePrivyWallets } from "./usePrivyWallet";

export const useSolBalance = () => {
  const connection = new Connection(config.solanaRpcUrl);
  const { data: wallets } = usePrivyWallets();

  const fetchSOLBalance = async (): Promise<number> => {
    try {
      if (!wallets?.solanaWallet) {
        throw new Error("No pubkey available");
      }

      const balance = await connection.getBalance(
        new PublicKey(wallets.solanaWallet),
      );
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error("Error fetching SOL balance:", error);
      throw error;
    }
  };

  return useQuery<number, Error>({
    queryKey: ["sol-balance"],
    queryFn: fetchSOLBalance,
    refetchInterval: 20000,
    staleTime: 20000,
    enabled: !!wallets?.solanaWallet,
  });
};
