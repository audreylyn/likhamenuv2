/**
 * Protected Route Components
 * Route guards for authentication and authorization
 * OPTIMIZED: No loading spinners - redirect immediately if not authenticated
 */

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useWebsite } from "../contexts/WebsiteContext";

/**
 * Requires authentication - redirects immediately if no user
 */
export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/**
 * Requires admin role
 */
export const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this area.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
          >
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
export const RequireWebsiteAccess: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, canAccessWebsite } = useAuth();
  const { currentWebsite } = useWebsite();
  const [hasAccess, setHasAccess] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (!user || !currentWebsite) return;

    // Check access when both user and website are available
    canAccessWebsite(currentWebsite)
      .then(setHasAccess)
      .catch(() => setHasAccess(false));
  }, [user, currentWebsite, canAccessWebsite]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!currentWebsite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            No Website Selected
          </h1>
          <p className="text-gray-600 mb-6">
            Please select a website to continue.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  // Show access denied only if explicitly denied
  if (hasAccess === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to edit this website.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  // Render children while checking (optimistic)
  return <>{children}</>;
};
