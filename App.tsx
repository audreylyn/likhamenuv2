/**
 * Main App Router
 * Handles routing between public site, editor, and admin
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './src/contexts/AuthContext';
import { WebsiteProvider } from './src/contexts/WebsiteContext';
import { RequireAuth, RequireAdmin } from './src/components/ProtectedRoute';
import { WebsiteSelector } from './src/components/WebsiteSelector';
import { getCurrentMode } from './src/lib/website-detector';

// Pages
import { Login } from './src/pages/Login';
import { PublicSite } from './src/pages/PublicSite';
import { EditorPage } from './src/pages/EditorPage';
import { AdminPage } from './src/pages/AdminPage';

// Root Router Component - Shows PublicSite when website is specified
const PublicSiteRouter: React.FC = () => {
  const hasWebsiteParam = new URLSearchParams(window.location.search).has('site');
  
  // Only show public site if website is specified via query param
  if (hasWebsiteParam) {
    return <PublicSite />;
  }
  
  // Otherwise redirect to login (root)
  return <Navigate to="/" replace />;
};

// Helper function to check if hostname is a valid subdomain (not Vercel/deployment domains)
const isValidSubdomain = (hostname: string): boolean => {
  if (hostname === 'localhost' || hostname.startsWith('127.0.0.1')) {
    return false;
  }
  
  // Exclude Vercel and other deployment domains
  if (hostname.includes('.vercel.app') || 
      hostname.includes('.netlify.app') || 
      hostname.includes('.github.io') ||
      hostname.includes('.pages.dev')) {
    return false;
  }
  
  // Check if it's a subdomain of the main domain
  const domain = import.meta.env.VITE_DOMAIN || 'likhasiteworks.studio';
  const parts = hostname.split('.');
  
  // Must have at least 3 parts and match the domain
  if (parts.length < 3) {
    return false;
  }
  
  // Check if it ends with the main domain
  const domainParts = domain.split('.');
  const hostnameDomain = parts.slice(-domainParts.length).join('.');
  
  return hostnameDomain === domain && parts[0] !== 'www' && parts[0] !== 'admin';
};

// Root Route Component - Detects subdomain and shows appropriate page
// This check is synchronous and happens immediately to prevent any flash
const RootRoute: React.FC = () => {
  // Synchronous check - window.location is available immediately
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const hasWebsiteParam = params.has('site') || params.has('website');
  
  // Check if we're on a valid subdomain (production) or have website param (development)
  const isLocalhost = hostname === 'localhost' || hostname.startsWith('127.0.0.1');
  const hasSubdomain = !isLocalhost && isValidSubdomain(hostname);
  
  // If we have a valid subdomain or website param, show public site immediately
  if (hasSubdomain || hasWebsiteParam) {
    return <PublicSite />;
  }
  
  // Otherwise show login page (for main domain, deployment domains, or localhost)
  return <Login />;
};

// Login Route Component - Redirects to public site if on valid subdomain
const LoginRoute: React.FC = () => {
  // Synchronous check - window.location is available immediately
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  // Check if we're on a valid subdomain (production)
  const isLocalhost = hostname === 'localhost' || hostname.startsWith('127.0.0.1');
  const hasSubdomain = !isLocalhost && isValidSubdomain(hostname);
  
  // If on valid subdomain, redirect to public site (clients shouldn't see login)
  if (hasSubdomain) {
    return <Navigate to="/" replace />;
  }
  
  // Otherwise show login page (localhost, main domain, or deployment domains)
  return <Login />;
};

// Editor Route Component - Allows public access on valid subdomains, requires auth on localhost
const EditorRoute: React.FC = () => {
  // Synchronous check - window.location is available immediately
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const hasWebsiteParam = params.has('site') || params.has('website');
  
  // Check if we're on a valid subdomain (production) or have website param (development)
  const isLocalhost = hostname === 'localhost' || hostname.startsWith('127.0.0.1');
  const hasSubdomain = !isLocalhost && isValidSubdomain(hostname);
  
  // If on valid subdomain or has website param, allow public access (no auth required)
  if (hasSubdomain || hasWebsiteParam) {
    return <EditorPage />;
  }
  
  // Otherwise allow access (no restrictions - can edit by URL)
  return <EditorPage />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WebsiteProvider>
          <Routes>
            {/* Root Route - Shows PublicSite if subdomain detected, otherwise Login */}
            <Route path="/" element={<RootRoute />} />

            {/* Login Route - Redirects to public site if on subdomain */}
            <Route path="/login" element={<LoginRoute />} />

            {/* Website Selector (Protected) - For localhost development */}
            <Route
              path="/websites"
              element={
                <RequireAuth>
                  <WebsiteSelector />
                </RequireAuth>
              }
            />

            {/* Public Site - Only when website is specified */}
            <Route path="/site" element={<PublicSiteRouter />} />

            {/* Editor Route - Public on subdomains, protected on localhost */}
            <Route
              path="/edit"
              element={<EditorRoute />}
            />

            {/* Admin Routes (Protected) */}
            <Route
              path="/admin/*"
              element={
                <RequireAuth>
                  <RequireAdmin>
                    <AdminPage />
                  </RequireAdmin>
                </RequireAuth>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </WebsiteProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;