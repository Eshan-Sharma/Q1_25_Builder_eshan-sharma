import { Wallet } from "./components/wallet";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./App.css";
import "@solana/wallet-adapter-react-ui/styles.css";

function App() {
  return (
    <>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
          <Wallet />
          <Toaster />
        </main>
      </ThemeProvider>
    </>
  );
}

export default App;
