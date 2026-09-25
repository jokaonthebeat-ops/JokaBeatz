import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PopupProvider } from "@/contexts/PopupContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";

import Index from "./pages/Index";
import Beats from "./pages/Beats";
import Services from "./pages/Services";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import FreeBeats from "./pages/FreeBeats";
import FreeGuide from "./pages/FreeGuide";
import Contact from "./pages/Contact";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminFreeBeats from "./pages/admin/AdminFreeBeats";
import AdminBeats from "./pages/admin/AdminBeats";
import AppBuyBeat from "./pages/AppBuyBeat";
import AdminAppContent from "./pages/admin/AdminAppContent";
import AdminRecordings from "./pages/admin/AdminRecordings";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminFreeBeatLeads from "./pages/admin/AdminFreeBeatLeads";
import AdminNewsletterLeads from "./pages/admin/AdminNewsletterLeads";
import AdminEmails from "./pages/admin/AdminEmails";
import AdminCampaignDetail from "./pages/admin/AdminCampaignDetail";
import AdminSequences from "./pages/admin/AdminSequences";
import AdminSequenceDetail from "./pages/admin/AdminSequenceDetail";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminMusicVideoSettings from "./pages/admin/AdminMusicVideoSettings";
import AdminMusicVideoOrders from "./pages/admin/AdminMusicVideoOrders";
import MusicVideos from "./pages/MusicVideos";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import LicensingTerms from "./pages/legal/LicensingTerms";
import NotFound from "./pages/NotFound";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminBlogSettings from "./pages/admin/AdminBlogSettings";
import AdminServiceOrders from "./pages/admin/AdminServiceOrders";
import AdminMastering from "./pages/admin/AdminMastering";
import CustomBeats from "./pages/services/CustomBeats";
import Consultation from "./pages/services/Consultation";
import AIMastering from "./pages/AIMastering";
import AdminYouTubeUploader from "./pages/admin/AdminYouTubeUploader";
import OAuthConsent from "./pages/OAuthConsent";
import Plugins from "./pages/Plugins";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PopupProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/beats" element={<Beats />} />
              <Route path="/plugins" element={<Plugins />} />
              <Route path="/app/buy/:beatSlug" element={<AppBuyBeat />} />
              <Route path="/services" element={<Services />} />
              <Route path="/services/custom-beats" element={<CustomBeats />} />
              <Route path="/services/mixing" element={<Navigate to="/ai-mastering" replace />} />
              <Route path="/services/mastering" element={<Navigate to="/ai-mastering" replace />} />
              <Route path="/services/consultation" element={<Consultation />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/shop/:productId" element={<ProductDetail />} />
              <Route path="/free-beats" element={<FreeBeats />} />
              <Route path="/free-guide" element={<FreeGuide />} />
              <Route path="/music-videos" element={<MusicVideos />} />
              <Route path="/ai-mastering" element={<AIMastering />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-canceled" element={<PaymentCanceled />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/licensing-terms" element={<LicensingTerms />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />

              {/* OAuth consent for MCP / external agent integrations */}
              <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />

              {/* Protected user routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<AdminOverview />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="free-beats" element={<AdminFreeBeats />} />
                <Route path="beats" element={<AdminBeats />} />
                <Route path="app-content" element={<AdminAppContent />} />
                <Route path="recordings" element={<AdminRecordings />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="leads/free-beats" element={<AdminFreeBeatLeads />} />
                <Route path="leads/newsletter" element={<AdminNewsletterLeads />} />
                <Route path="emails" element={<AdminEmails />} />
                <Route path="emails/:campaignId" element={<AdminCampaignDetail />} />
                <Route path="sequences" element={<AdminSequences />} />
                <Route path="sequences/:sequenceId" element={<AdminSequenceDetail />} />
                <Route path="messages" element={<AdminMessages />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="music-video-settings" element={<AdminMusicVideoSettings />} />
                <Route path="music-video-orders" element={<AdminMusicVideoOrders />} />
                <Route path="blog" element={<AdminBlog />} />
                <Route path="blog-settings" element={<AdminBlogSettings />} />
                <Route path="service-orders" element={<AdminServiceOrders />} />
                <Route path="mastering" element={<AdminMastering />} />
                <Route path="youtube-uploader" element={<AdminYouTubeUploader />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PopupProvider>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
