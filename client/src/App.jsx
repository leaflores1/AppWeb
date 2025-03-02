import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./routes";

import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import { LoginPage } from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Feed from "./pages/Feed";
import PhotoPage from "./pages/PhotoPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import ChatPage from "./components/chat/ChatPage";

// Páginas de configuración
import SettingsPage from "./pages/SettingsPage";
import EditProfilePage from "./pages/subpages/EditProfilePage";
import PaymentsPage from "./pages/subpages/PaymentsPage";
import BlockedSettingsPage from "./pages/subpages/BlockedSettingsPage";
import HelpSettingsPage from "./pages/subpages/HelpSettingsPage";
import OtherOptionsSettingsPage from "./pages/subpages/OtherOptionsSettingsPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <main>
          <Navbar />
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy_policies" element={<PrivacyPolicyPage />} />

            {/* Rutas públicas para recuperar contraseña */}
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Rutas protegidas */}
            <Route element={<ProtectedRoute />}>
              <Route path="/feed" element={<Feed />} />
              {/* Ruta para acceder directamente al perfil del usuario */}
              <Route path="/:username" element={<ProfilePage/>} />
              <Route path="/:username/gallery" element={<ProfilePage />} />
              <Route path="/:username/posts" element={<ProfilePage />} />
              <Route path="/:username/albums" element={<ProfilePage />} />
              <Route path="/photo/:photoId" element={<PhotoPage />} />
              <Route path="/inbox/:chatId" element={<ChatPage />} />
              <Route path="/inbox" element={<ChatPage />} />

              {/* Página de Configuración */}
              <Route path="/settings" element={<SettingsPage />}>
                <Route path="profile" element={<EditProfilePage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="blocked" element={<BlockedSettingsPage />} />
                <Route path="help" element={<HelpSettingsPage />} />
                <Route
                  path="other-options"
                  element={<OtherOptionsSettingsPage />}
                />
              </Route>
            </Route>
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
