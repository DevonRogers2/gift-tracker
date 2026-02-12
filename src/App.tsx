import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './components/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Recipients } from './pages/Recipients';
import { AddRecipient } from './pages/AddRecipient';
import { EditRecipient } from './pages/EditRecipient';
import { RecipientDetail } from './pages/RecipientDetail';
import { Settings } from './pages/Settings';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/recipients"
              element={
                <ProtectedRoute>
                  <Recipients />
                </ProtectedRoute>
              }
            />

            <Route
              path="/recipients/new"
              element={
                <ProtectedRoute>
                  <AddRecipient />
                </ProtectedRoute>
              }
            />

            <Route
              path="/recipients/:recipientId"
              element={
                <ProtectedRoute>
                  <RecipientDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/recipients/:recipientId/edit"
              element={
                <ProtectedRoute>
                  <EditRecipient />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
