import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import {
  Index,
  UsersPage,
  FormPage,
  SelfDeclarationPage,
  FormDefinitions,
  FormSubmissions,
  SelfDeclarationSubmissions,
  FormStatistics,
  FormParticipation,
  ArbaeenYearsPage,
  ArbaeenProcessionsPage,
  ArbaeenProcessionDetail,
} from "./pages";
import { ProfilePage } from "./pages/ProfilePage";
import { FormBuilder } from "./pages/FormBuilder";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { Toaster } from "./components/ui/sonner";
import { NotFoundPage } from "./pages/NotFoundPage";

// Google OAuth Client ID (should be in env variable)
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

// Vite injects the `base` from vite.config.ts here, e.g. "/ysr-system-front/"
// on the GitHub Pages project site, or "/" on a custom domain. react-router
// needs it to strip the sub-path before matching routes; without it every deep
// link would miss and fall through to NotFoundPage.
const basename = import.meta.env.BASE_URL;

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter basename={basename}>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Catch-all. On GitHub Pages an unknown URL is answered with
                /404.html (a copy of index.html), so react-router still boots
                and this is what the user ends up seeing. */}
            <Route path="*" element={<NotFoundPage />} />

            {/* Protected routes with layout */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Index />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route
                  path="forms/self-declaration"
                  element={<SelfDeclarationPage />}
                />
                <Route path="forms/:formSlug" element={<FormPage />} />
                <Route path="admin/forms" element={<FormDefinitions />} />
                <Route path="admin/forms/new" element={<FormBuilder />} />
                <Route path="admin/forms/:id/edit" element={<FormBuilder />} />
                <Route
                  path="admin/form-submissions"
                  element={<FormSubmissions />}
                />
                <Route
                  path="admin/form-statistics"
                  element={<FormStatistics />}
                />
                <Route
                  path="admin/form-participation"
                  element={<FormParticipation />}
                />
                <Route
                  path="admin/self-declarations"
                  element={<SelfDeclarationSubmissions />}
                />
                <Route path="admin/arbaeen" element={<ArbaeenYearsPage />} />
                <Route
                  path="admin/arbaeen/:yearId"
                  element={<ArbaeenProcessionsPage />}
                />
                <Route
                  path="admin/arbaeen/procession/:id"
                  element={<ArbaeenProcessionDetail />}
                />
              </Route>
            </Route>
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
