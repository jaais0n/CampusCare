import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { PageLoader } from "@/components/ui/loader";
import NetworkStatus from "@/components/NetworkStatus";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Appointments from "./pages/Appointments";
import Counseling from "./pages/Counseling";
import Medicines from "./pages/Medicines";
import Wheelchairs from "./pages/Wheelchairs";
import Wellness from "./pages/Wellness";
import SOSPage from "./pages/SOSPage";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import AdminCounseling from "./pages/AdminCounseling";
import AdminWheelchairs from "./pages/AdminWheelchairs";
import AdminMedicalAppointment from "./pages/AdminMedicalAppointment";
import AdminLiveMap from "./pages/AdminLiveMap";
import AdminMedicines from "./pages/AdminMedicines";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Scroll to top on route change
const ScrollToTop = () => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <NetworkStatus />
      <BrowserRouter>
        <ScrollToTop />
        <Header />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/counseling" element={<AdminCounseling />} />
          <Route path="/admin/wheelchairs" element={<AdminWheelchairs />} />
          <Route path="/admin/appointments" element={<AdminMedicalAppointment />} />
          <Route path="/admin/emergency" element={<AdminLiveMap />} />
          <Route path="/admin/medicines" element={<AdminMedicines />} />

          <Route path="/appointments" element={<Appointments />} />
          <Route path="/counseling" element={<Counseling />} />
          <Route path="/medicines" element={<Medicines />} />
          <Route path="/wheelchairs" element={<Wheelchairs />} />
          <Route path="/wellness" element={<Wellness />} />
          <Route path="/emergency" element={<Navigate to="/sos" replace />} />
          <Route path="/sos" element={<SOSPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <MobileNav />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

