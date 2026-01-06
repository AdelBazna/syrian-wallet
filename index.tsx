
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("🚀 Syrian Wallet Ledger: Initializing application...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("❌ Syrian Wallet Ledger: Could not find root element to mount to. Check index.html for <div id='root'></div>");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("✅ Syrian Wallet Ledger: App mounted successfully.");
} catch (error) {
  console.error("❌ Syrian Wallet Ledger: Failed to mount app:", error);
}
