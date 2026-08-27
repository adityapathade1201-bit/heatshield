import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/AppLayout.tsx';
import { Home } from './pages/Home.tsx';
import { HeatCheck } from './pages/HeatCheck.tsx';
import { Alerts } from './pages/Alerts.tsx';
import { Profile } from './pages/Profile.tsx';
import { Survey } from './pages/Survey.tsx';
import { Welcome } from './pages/Welcome.tsx';
import { OnboardingPermissions } from './pages/OnboardingPermissions.tsx';
import { ErrorScreen } from './pages/ErrorScreen.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';

function AppRoutes() {
  const { isAuthenticated, isOnboarded } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    );
  }

  if (!isOnboarded) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingPermissions />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/check" element={<HeatCheck />} />
        <Route path="/survey" element={<Survey />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/error" element={<ErrorScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}