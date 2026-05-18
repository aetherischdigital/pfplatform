import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { BRAND } from './config/brand'
import MarketingLayout from './components/marketing/MarketingLayout'
import AppShell from './components/app/AppShell'
import AuthModal, { AuthModalRedirect } from './components/AuthModal'
import RequireAuth from './components/RequireAuth'
import ViewAsBanner from './components/ViewAsBanner'
import RouteFallback from './components/RouteFallback'
import ErrorBoundary from './components/ErrorBoundary'

// Landing eager — first paint on cold cache
import Landing from './pages/marketing/Landing'

// Everything else split per-route so the initial bundle stays small
const HowItWorks = lazy(() => import('./pages/marketing/HowItWorks'))
const Calculator = lazy(() => import('./pages/marketing/Calculator'))
const Pricing = lazy(() => import('./pages/marketing/Pricing'))
const About = lazy(() => import('./pages/marketing/About'))
const Blog = lazy(() => import('./pages/marketing/Blog'))
const BlogPost = lazy(() => import('./pages/marketing/BlogPost'))
const Privacy = lazy(() => import('./pages/marketing/Privacy'))
const Terms = lazy(() => import('./pages/marketing/Terms'))
const Disclosures = lazy(() => import('./pages/marketing/Disclosures'))

const Dashboard = lazy(() => import('./pages/app/Dashboard'))
const Financials = lazy(() => import('./pages/app/Financials'))
const Calculators = lazy(() => import('./pages/app/Calculators'))
const Clients = lazy(() => import('./pages/app/Clients'))
const Account = lazy(() => import('./pages/app/Account'))
const Admin = lazy(() => import('./pages/app/Admin'))

const NotFound = lazy(() => import('./pages/NotFound'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))

export default function App() {
  useEffect(() => {
    document.title = `${BRAND.name} — ${BRAND.headline}`
  }, [])

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ViewAsBanner />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Public marketing */}
            <Route element={<MarketingLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/calculator" element={<Calculator />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/about" element={<About />} />
              {/* Legal placeholders — skeleton only, awaiting counsel-provided content.
                  noindex'd in usePageMeta and excluded from PUBLIC_ROUTES until live. */}
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/disclosures" element={<Disclosures />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Auth — modal-based; legacy URLs redirect home and pop the modal */}
            <Route path="/login" element={<AuthModalRedirect view="login" />} />
            <Route path="/signup" element={<AuthModalRedirect view="signup" />} />

            {/* Password recovery landing — handled outside RequireAuth so the
                recovery session (set by Supabase from the email-link hash)
                doesn't redirect through the auth gate. */}
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Authenticated homeowner/realtor app */}
            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
                <Route path="/app/dashboard" element={<Dashboard />} />
                <Route path="/app/financials" element={<Financials />} />
                <Route path="/app/calculators" element={<Calculators />} />
                <Route path="/app/clients" element={<Clients />} />
                <Route path="/app/account" element={<Account />} />
              </Route>
            </Route>

            {/* Admin — role-gated, same AppShell so admins keep the full sidebar */}
            <Route element={<RequireAuth requiredRole="admin" />}>
              <Route element={<AppShell />}>
                <Route path="/admin" element={<Admin />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>

        <AuthModal />
      </ErrorBoundary>
    </BrowserRouter>
  )
}
