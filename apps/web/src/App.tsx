import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { PropertiesPage } from './features/properties/PropertiesPage';
import { PropertyDetailPage } from './features/properties/PropertyDetailPage';
import { ProblemsPage } from './features/problems/ProblemsPage';
import { ProblemDetailPage } from './features/problems/ProblemDetailPage';
import { Layout } from './components/Layout';
import { isLoggedIn } from './lib/auth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PropertiesPage />} />
        <Route path="properties/:id" element={<PropertyDetailPage />} />
        <Route path="properties/:propertyId/phases/:phaseId/problems" element={<ProblemsPage />} />
        <Route path="properties/:propertyId/phases/:phaseId/problems/:problemId" element={<ProblemDetailPage />} />
      </Route>
    </Routes>
  );
}
