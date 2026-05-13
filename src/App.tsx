import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { BRAND } from './config/brand'
import MarketingLayout from './components/marketing/MarketingLayout'
import AppShell from './components/app/AppShell'
import AppShellPlaceholder from './components/app/AppShellPlaceholder'
import AuthModal, { AuthModalRedirect } from './components/AuthModal'
import RequireAuth from './components/RequireAuth'
import RequireAdmin from './components/RequireAdmin'

import Landing from './pages/marketing/Landing'
import HowItWorks from './pages/marketing/HowItWorks'
import Calculator from './pages/marketing/Calculator'
import Pricing from './pages/marketing/Pricing'
import About from './pages/marketing/About'
import Blog from './pages/marketing/Blog'
import BlogPost from './pages/marketing/BlogPost'
import Social from './pages/marketing/Social'
import Privacy from './pages/marketing/Privacy'
import Terms from './pages/marketing/Terms'
import Disclosures from './pages/marketing/Disclosures'

import Dashboard from './pages/app/Dashboard'
import Financials from './pages/app/Financials'
import Account from './pages/app/Account'
import Admin from './pages/app/Admin'
import AdminBlog from './pages/app/AdminBlog'
import AdminBlogEdit from './pages/app/AdminBlogEdit'

import NotFound from './pages/NotFound'

export default function App() {
  useEffect(() => {
    document.title = `${BRAND.name} — ${BRAND.headline}`
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public marketing */}
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/social" element={<Social />} />
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

        {/* Authenticated homeowner/realtor app — PFS pages still on mock
            data until the Supabase schema lands */}
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/app/dashboard" element={<Dashboard />} />
            <Route path="/app/financials" element={<Financials />} />
            <Route path="/app/account" element={<Account />} />
          </Route>

          {/* Admin — gated on profiles.role === 'admin' via RequireAdmin */}
          <Route element={<RequireAdmin />}>
            <Route element={<AppShellPlaceholder />}>
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/blog" element={<AdminBlog />} />
              <Route path="/admin/blog/new" element={<AdminBlogEdit isNew />} />
              <Route path="/admin/blog/:id/edit" element={<AdminBlogEdit />} />
            </Route>
          </Route>
        </Route>
      </Routes>

      <AuthModal />
    </BrowserRouter>
  )
}
