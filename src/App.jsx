import './App.css'
import { Suspense } from 'react'
import { Toaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import PageSkeleton from '@/components/PageSkeleton';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BureauAtmosphere, BureauFooter } from '@/components/bureau';

// Routes that require authentication
const PROTECTED_ROUTES = ['Profile', 'settings', 'saved'];
// Routes that require admin access
const ADMIN_ROUTES = ['admin'];

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClientInstance}>
        <AuthProvider>
          <Router>
            <LayoutWrapper currentPageName={mainPageKey}>
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  <Route path="/" element={<MainPage />} />
                  {Object.entries(Pages).map(([path, Page]) => {
                    // Wrap protected routes with auth guard
                    if (ADMIN_ROUTES.includes(path)) {
                      return (
                        <Route
                          key={path}
                          path={`/${path}`}
                          element={
                            <ProtectedRoute requireAdmin>
                              <Page />
                            </ProtectedRoute>
                          }
                        />
                      );
                    }
                    if (PROTECTED_ROUTES.includes(path)) {
                      return (
                        <Route
                          key={path}
                          path={`/${path}`}
                          element={
                            <ProtectedRoute>
                              <Page />
                            </ProtectedRoute>
                          }
                        />
                      );
                    }
                    // Public routes
                    return <Route key={path} path={`/${path}`} element={<Page />} />;
                  })}
                  <Route path="/stories/:slug" element={<Pages.StoryDetail />} />
                  <Route path="/ecosystem/founder-asks" element={<Navigate to="/Opportunities" replace />} />
                  <Route path="*" element={
                    <div className="min-h-screen relative" data-page="not-found">
                      <BureauAtmosphere />
                      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
                        <div className="text-center max-w-md">
                          {/* Bureau Header Tag */}
                          <span className="font-mono text-[10px] text-white/20 uppercase tracking-[0.2em] block mb-6">
                            [ERROR: 404]
                          </span>

                          {/* 404 Icon */}
                          <div className="w-24 h-24 border border-white/10 flex items-center justify-center mx-auto mb-8">
                            <span className="font-mono text-3xl text-white/20">404</span>
                          </div>

                          {/* Title */}
                          <h1 className="font-serif text-3xl md:text-4xl text-white mb-4">
                            Page Not Found
                          </h1>

                          <p className="text-white/50 text-sm leading-relaxed mb-8">
                            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
                          </p>

                          {/* CTA Buttons */}
                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                              to="/"
                              className="font-mono text-[11px] uppercase tracking-[0.1em] px-6 py-3 bg-white text-black hover:bg-white/90 transition-colors cursor-crosshair inline-block"
                            >
                              Go Home
                            </Link>
                            <Link
                              to="/opportunities"
                              className="font-mono text-[11px] uppercase tracking-[0.1em] px-6 py-3 border border-white/20 text-white/50 hover:bg-white/5 transition-colors cursor-crosshair inline-block"
                            >
                              Browse Asks
                            </Link>
                          </div>

                          {/* Help text */}
                          <p className="text-white/30 text-xs mt-8 font-mono">
                            Need help? <a href="mailto:hello@chistartuphub.com" className="text-white/50 hover:text-white underline">Contact us</a>
                          </p>
                        </div>
                      </div>
                      <BureauFooter />
                    </div>
                  } />
                </Routes>
              </Suspense>
            </LayoutWrapper>
          </Router>
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: '#0F0F0F',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontFamily: 'ui-monospace, SFMono-Regular, Monaco, Menlo, monospace',
                fontSize: '12px',
              },
            }}
          />
          <Analytics />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
