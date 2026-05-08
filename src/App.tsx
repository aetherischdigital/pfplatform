import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { BRAND } from './config/brand'
import MarketingLayout from './components/marketing/MarketingLayout'
import AppShell from './components/app/AppShell'
import AppShellPlaceholder from './components/app/AppShellPlaceholder'
import AuthModal, { AuthModalRedirect } from './components/AuthModal'

import Landing from './pages/marketing/Landing'
import HowItWorks from './pages/marketing/HowItWorks'
import Calculator from './pages/marketing/Calculator'
import Pricing from './pages/marketing/Pricing'
import About from './pages/marketing/About'
import Blog from './pages/marketing/Blog'
import BlogPost from './pages/marketing/BlogPost'

import Dashboard from './pages/app/Dashboard'
import Financials from './pages/app/Financials'
import Account from './pages/app/Account'
import Admin from './pages/app/Admin'

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
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Auth — modal-based; legacy URLs redirect home and pop the modal */}
        <Route path="/login" element={<AuthModalRedirect view="login" />} />
        <Route path="/signup" element={<AuthModalRedirect view="signup" />} />

        {/* Authenticated homeowner/realtor app — running on mock data
            until Supabase auth + PFS schema land */}
        <Route element={<AppShell />}>
          <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/app/dashboard" element={<Dashboard />} />
          <Route path="/app/financials" element={<Financials />} />
          <Route path="/app/account" element={<Account />} />
        </Route>

        {/* Admin — separate placeholder shell, built out post-auth */}
        <Route element={<AppShellPlaceholder />}>
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>

      <AuthModal />
    </BrowserRouter>
  )
}
