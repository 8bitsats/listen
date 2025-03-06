import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { arbitrum } from "viem/chains";
import { WagmiProvider, createConfig, http } from "wagmi";
import { ModalProvider } from "./contexts/ModalContext";
import { ToastProvider } from "./contexts/ToastContext";
import i18n from "./i18n";
import "./index.css";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

const config = createConfig({
  chains: [arbitrum],
  transports: {
    [arbitrum.id]: http(),
  },
});

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <PrivyProvider
        appId={"cm6c7ifqd00ar52m1qxfgbkkn"}
        config={{
          appearance: {
            theme: "dark",
            walletChainType: "ethereum-and-solana",
          },
          externalWallets: {
            solana: {
              connectors: toSolanaWalletConnectors({ shouldAutoConnect: true }),
            },
          },
        }}
      >
        <ToastProvider>
          <WagmiProvider config={config}>
            <QueryClientProvider client={new QueryClient()}>
              <ModalProvider>
                <RouterProvider router={router} />
              </ModalProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </ToastProvider>
      </PrivyProvider>
    </I18nextProvider>
  </StrictMode>
);
