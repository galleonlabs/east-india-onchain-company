import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WagmiProvider, http } from "wagmi";
import { mainnet, base, optimism, arbitrum } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import App from "./App.tsx";
import "./index.css";

const config = getDefaultConfig({
  appName: "East India Onchain Company",
  projectId: "YOUR_PROJECT_ID",
  chains: [mainnet, base, optimism, arbitrum],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
  },
});

const queryClient = new QueryClient();

const customTheme = darkTheme({
  accentColor: "#FEF3E2",
  accentColorForeground: "#27272A",
  borderRadius: 'small',
  fontStack: "system",
  overlayBlur: "small",
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={{
            ...customTheme,
            colors: {
              ...customTheme.colors,
              actionButtonBorder: "#27272A",
              actionButtonBorderMobile: "#27272A",
              actionButtonSecondaryBackground: "#FEF3E2",
              closeButton: "#27272A",
              closeButtonBackground: "#FEF3E2",
              connectButtonBackground: "#FEF3E2",
              connectButtonBackgroundError: "#DC7F5A",
              connectButtonInnerBackground: "#FEF3E2",
              connectButtonText: "#27272A",
              connectButtonTextError: "#FEF3E2",
              connectionIndicator: "#FEF3E2",
              error: "#DC7F5A",
              generalBorder: "#27272A",
              menuItemBackground: "#FEF3E2",
              modalBackground: "#FEF3E2",
              modalBorder: "#27272A",
              modalText: "#27272A",
              modalTextDim: "#4A5568",
              modalTextSecondary: "#4A5568",
              profileForeground: "#FEF3E2",
              selectedOptionBorder: "#FEF3E2",
            },
            fonts: {
              body: "Morion, sans-serif",
            },
            radii: {
              actionButton: "4px",
              connectButton: "4px",
              menuButton: "4px",
              modal: "4px",
              modalMobile: "4px",
            },
            shadows: {
              connectButton: "",
              dialog: "0px 0px 0px 1px #27272A",
              profileDetailsAction: "0px 0px 0px 1px #27272A",
              selectedOption: "0px 0px 0px 1px #27272A",
              selectedWallet: "0px 0px 0px 1px #27272A",
              walletLogo: "0px 0px 0px 1px #27272A",
            },
          }}
        >
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
