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
import SessionRecording from "./pages/SessionRecording";
import StudentPerformance from "./pages/StudentPerformance";
import FeedbackSelection from "./pages/FeedbackSelection";
import FeedbackDetails from "./pages/FeedbackDetails";
import Curriculum from "./pages/Curriculum";
import Facilitators from "./pages/Facilitators";
import { Coordinators } from "./pages/Coordinators";
import Centres from "./pages/Centres";
import Classes from "./pages/Classes";
import ClassStudents from "./pages/ClassStudents";
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
            <Route path="/feedback" element={<FeedbackSelection />} />
            <Route path="/sessions/:sessionId/recording" element={<SessionRecording />} />
            <Route path="/sessions/:sessionId/feedback-details" element={<FeedbackDetails />} />
            <Route path="/student-performance/:sessionId" element={<StudentPerformance />} />
            <Route path="/curriculum" element={<Curriculum />} />
            <Route path="/facilitators" element={<Facilitators />} />
            <Route path="/coordinators" element={<Coordinators />} />
            <Route path="/centres" element={<Centres />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/classes/:classId/students" element={<ClassStudents />} />
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
