/**
 * Admin Page - Dashboard for Super Admin
 * Manage all websites, users, and content
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Dashboard } from '../components/admin/Dashboard';
import { WebsiteList } from '../components/admin/WebsiteList';
import { WebsiteEditor } from '../components/admin/WebsiteEditor';
import { Settings } from '../components/admin/Settings';
import { SectionManager } from '../components/admin/SectionManager';

export const AdminPage: React.FC = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="websites" element={<WebsiteList />} />
        <Route path="websites/:websiteId" element={<WebsiteEditor />} />
        <Route path="sections" element={<SectionManager />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
};

