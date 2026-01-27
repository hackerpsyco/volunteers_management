import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Sessions from "./pages/Sessions";
import Curriculum from "./pages/Curriculum";
import Facilitators from "./pages/Facilitators";
import Centres from "./pages/Centres";
import AddVolunteer from "./pages/AddVolunteer";
import VolunteerList from "./pages/VolunteerList";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/curriculum" element={<Curriculum />} />
            <Route path="/facilitators" element={<Facilitators />} />
            <Route path="/centres" element={<Centres />} />
            <Route path="/volunteers" element={<VolunteerList />} />
            <Route path="/volunteers/add" element={<AddVolunteer />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
