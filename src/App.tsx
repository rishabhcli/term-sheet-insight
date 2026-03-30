import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./features/term-sheet-tarot/hooks/useAuth";
import Index from "./pages/Index";
import DemoPage from "./pages/Demo";
import FallbackPage from "./pages/Fallback";
import ScenariosPage from "./pages/Scenarios";
import SharePage from "./pages/Share";
import AboutPage from "./pages/About";
import HowItWorksPage from "./pages/HowItWorks";
import PrivacyPage from "./pages/Privacy";
import TermsPage from "./pages/Terms";
import BuildScenarioPage from "./pages/BuildScenario";
import ComparePage from "./pages/Compare";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/fallback" element={<FallbackPage />} />
            <Route path="/scenarios" element={<ScenariosPage />} />
            <Route path="/build" element={<BuildScenarioPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/share/:slug" element={<SharePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
