import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "./hooks/useWallet";
import Layout from "./components/Layout";
import Home from "./pages/home";
import Upload from "./pages/upload";
import Trade from "./pages/trade";
import Transactions from "./pages/transactions";
import Liquidity from "./pages/liquidity";
import WalletPage from "./pages/WalletPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/upload" component={Upload} />
        <Route path="/trade" component={Trade} />
        <Route path="/transactions" component={Transactions} />
        <Route path="/liquidity" component={Liquidity} />
        <Route path="/wallet" component={WalletPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
