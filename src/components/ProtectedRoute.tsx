/**
 * Protected Route Components
 * Route guards for authentication and authorization
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWebsite } from '../contexts/WebsiteContext';

/**
 * Requires authentication
 */
export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/**
 * Requires admin role
 */
export const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access this area.</p>
          <a href="/" className="inline-block px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition">
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Requires editor access to current website
 */
export const RequireWebsiteAccess: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, canAccessWebsite } = useAuth();
  const { currentWebsite, loading: websiteLoading } = useWebsite();
  const [hasAccess, setHasAccess] = React.useState<boolean | null>(null);
  const [checkingAccess, setCheckingAccess] = React.useState(false);

  React.useEffect(() => {
    // Only check access when both user and website are loaded
    if (loading || websiteLoading) {
      return; // Still loading, don't check yet
    }

    if (!user) {
      // User not authenticated, but don't set hasAccess yet - let RequireAuth handle it
      return;
    }

    if (!currentWebsite) {
      // No website detected yet, keep hasAccess as null (still checking)
      return;
    }

    // Both user and website are ready, check access
    checkAccess();
  }, [user, loading, currentWebsite, websiteLoading]);

  const checkAccess = async () => {
    if (!currentWebsite || !user) return;

    setCheckingAccess(true);
    try {
      const access = await canAccessWebsite(currentWebsite);
      setHasAccess(access);
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
    } finally {
      setCheckingAccess(false);
    }
  };

  // Show loading while checking auth/website or checking access
  if (loading || websiteLoading || checkingAccess || (user && currentWebsite && hasAccess === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!currentWebsite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Website Selected</h1>
          <p className="text-gray-600 mb-6">Please select a website to continue.</p>
          <a href="/" className="inline-block px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition">
            Go Home
          </a>
        </div>
      </div>
    );
  }

  // Only show access denied if we've actually checked and confirmed no access
  if (hasAccess === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to edit this website.</p>
          <a href="/" className="inline-block px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition">
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

