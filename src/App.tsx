import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { useAuthStore } from './store/authStore'
import { SceneErrorBoundary } from './components/shared/SceneErrorBoundary'
import { motion } from 'framer-motion'

// ─── Code-split every route-level page ──────────────────────────────────
const DashboardPage = lazy(() => import('./pages/Dashboard'))
const GmailPage = lazy(() => import('./pages/Gmail'))
const LinkedInPage = lazy(() => import('./pages/LinkedIn'))
const CRMPage = lazy(() => import('./pages/CRM'))
const CortexPage = lazy(() => import('./pages/Cortex'))
const SettingsPage = lazy(() => import('./pages/Settings'))
const KnowledgeGraphPage = lazy(() => import('./pages/KnowledgeGraph'))
const CodebasePage = lazy(() => import('./pages/Codebase'))
const MomentumPage = lazy(() => import('./pages/Momentum'))
const LoginPage = lazy(() => import('./pages/Login'))
const BookkeepingPage = lazy(() => import('./pages/Bookkeeping'))
const CodingPage = lazy(() => import('./pages/Coding'))

/** Ambient loading state — a soft breathing glow, not a spinner */
function SceneSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex h-[50vh] items-center justify-center"
        >
          <motion.div
            animate={{ opacity: [0.15, 0.3, 0.15] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
            className="h-2 w-2 rounded-full bg-primary"
          />
        </motion.div>
      }
    >
      {children}
    </Suspense>
  )
}

/** Wrap a page with error boundary + suspense */
function Scene({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <SceneErrorBoundary sceneName={name}>
      <SceneSuspense>{children}</SceneSuspense>
    </SceneErrorBoundary>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<SceneSuspense><LoginPage /></SceneSuspense>} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Scene name="Atmospheric Vitals"><DashboardPage /></Scene>} />
          <Route path="/gmail" element={<Scene name="Digital Curator"><GmailPage /></Scene>} />
          <Route path="/linkedin" element={<Scene name="Social Resonance"><LinkedInPage /></Scene>} />
          <Route path="/crm" element={<Scene name="Flow State"><CRMPage /></Scene>} />
          <Route path="/crm/:clientId" element={<Scene name="Flow State"><CRMPage /></Scene>} />
          <Route path="/cortex" element={<Scene name="Cortex"><CortexPage /></Scene>} />
          <Route path="/codebase" element={<Scene name="Codebase Mind"><CodebasePage /></Scene>} />
          <Route path="/knowledge-graph" element={<Scene name="Knowledge Graph"><KnowledgeGraphPage /></Scene>} />
          <Route path="/momentum" element={<Scene name="Momentum"><MomentumPage /></Scene>} />
          <Route path="/settings" element={<Scene name="System Nodes"><SettingsPage /></Scene>} />
          <Route path="/bookkeeping" element={<Scene name="Ledger"><BookkeepingPage /></Scene>} />
          <Route path="/coding" element={<Scene name="Auto-Developer"><CodingPage /></Scene>} />
          {/* Redirects for consolidated pages */}
          <Route path="/finance" element={<Navigate to="/bookkeeping" replace />} />
          <Route path="/kg-explorer" element={<Navigate to="/knowledge-graph" replace />} />
          <Route path="/workspace" element={<Navigate to="/settings" replace />} />
          <Route path="/factory-dev" element={<Navigate to="/coding" replace />} />
          <Route path="/claude-code" element={<Navigate to="/settings" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
