import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './ProtectedRoute';

// Lazy load components for better performance
const LoginPage = lazy(() => import('./LoginPage'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const QuestionnairePage = lazy(() => import('./QuestionnairePage'));
const QuestionnaireManagement = lazy(() => import('./QuestionnaireManagement'));
const DynamicQuestionnaire = lazy(() => import('./DynamicQuestionnaire'));
const QuestionnaireBuilder = lazy(() => import('./QuestionnaireBuilder'));

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <LanguageProvider>
          <AuthProvider>
            <Toaster position="top-right" />
            <Suspense fallback={<LoadingSpinner fullScreen text="Loading..." size="lg" />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/questionnaire" element={<QuestionnairePage />} />
                <Route path="/questionnaire/:id" element={<DynamicQuestionnaire />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/questionnaires"
                  element={
                    <ProtectedRoute>
                      <QuestionnaireManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/questionnaires/builder"
                  element={
                    <ProtectedRoute>
                      <QuestionnaireBuilder />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/questionnaires/builder/:id"
                  element={
                    <ProtectedRoute>
                      <QuestionnaireBuilder />
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<Navigate to="/questionnaire" replace />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </LanguageProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
