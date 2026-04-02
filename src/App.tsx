import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { useAuthStore } from './store/authStore'
import DashboardPage from './pages/Dashboard'
import FinancePage from './pages/Finance'
import GmailPage from './pages/Gmail'
import LinkedInPage from './pages/LinkedIn'
import CRMPage from './pages/CRM'
import CortexPage from './pages/Cortex'
import ClaudeCodePage from './pages/ClaudeCode'
import WorkspacePage from './pages/Workspace'
import SettingsPage from './pages/Settings'
import LoginPage from './pages/Login'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/gmail" element={<GmailPage />} />
          <Route path="/linkedin" element={<LinkedInPage />} />
          <Route path="/crm" element={<CRMPage />} />
          <Route path="/crm/:clientId" element={<CRMPage />} />
          <Route path="/cortex" element={<CortexPage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/claude-code" element={<ClaudeCodePage />} />
          <Route path="/claude-code/:sessionId" element={<ClaudeCodePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
