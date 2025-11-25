import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
// Cüzdan sağlayıcısını import ediyoruz
import { WalletContextProvider } from "./features/wallet/WalletContextProvider";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WalletContextProvider>
      <App />
    </WalletContextProvider>
  </React.StrictMode>
);