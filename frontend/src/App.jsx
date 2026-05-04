import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import './i18n';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LandingPage    from './pages/LandingPage';
import RegisterOwner  from './pages/RegisterOwner';
import Login          from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword  from './pages/ResetPassword';
import AcceptInvite   from './pages/AcceptInvite';
import Dashboard        from './pages/Dashboard';
import TeamManagement   from './pages/TeamManagement';
import CheckoutSuccess  from './pages/CheckoutSuccess';
import ClassifierPage      from './pages/ClassifierPage';
import PlanManagementPage from './pages/dashboard/PlanManagementPage';
import ChatIAPage         from './pages/dashboard/ChatIAPage';
import ProfilePage        from './pages/dashboard/ProfilePage';

const App = () => (
  <Provider store={store}>
    <BrowserRouter>
      <Routes>
        {/* Landing pública */}
        <Route path="/"                element={<LandingPage />} />

        {/* Rutas públicas */}
        <Route path="/register"        element={<RegisterOwner />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/accept-invite"   element={<AcceptInvite />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />

        {/* Rutas protegidas — redirigen a /login?redirect=<ruta> si no hay sesión */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard"      element={<Dashboard />} />
          <Route path="/dashboard/plan"    element={<PlanManagementPage />} />
          <Route path="/dashboard/chat"    element={<ChatIAPage />} />
          <Route path="/dashboard/profile" element={<ProfilePage />} />
          <Route path="/team"           element={<TeamManagement />} />
          <Route path="/classifier"     element={<ClassifierPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </Provider>
);

export default App;
