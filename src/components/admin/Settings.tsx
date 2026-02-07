/**
 * Maintenance Dashboard
 * Monitor system health, storage, and clean up orphaned assets
 */

import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  Activity,
  Database,
  HardDrive,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Loader,
  Image as ImageIcon,
} from "lucide-react";
import { ConfirmationModal } from "../../components/ConfirmationModal";
import { useToast } from "../Toast";

interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>; // Relaxed type to match Supabase return
}

export const Settings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    storageCount: 0,
    storageSize: 0,
    websiteCount: 0,
    submissionCount: 0,
  });

  // Orphaned Images
  const [scanning, setScanning] = useState(false);
  const [orphanedImages, setOrphanedImages] = useState<StorageFile[]>([]);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setRefreshing(true);

      // 1. Storage Stats (images bucket)
      const { data: files, error: storageError } = await supabase.storage
        .from("images")
        .list();

      let totalSize = 0;
      let count = 0;

      if (!storageError && files) {
        count = files.length;
        totalSize = (files as StorageFile[]).reduce((acc, file) => acc + (file.metadata?.size || 0), 0);
      }

      // 2. Database Stats
      const { count: siteCount } = await supabase
        .from("websites")
        .select("*", { count: "exact", head: true });

      const { count: subCount } = await supabase
        .from("contact_submissions")
        .select("*", { count: "exact", head: true });

      setStats({
        storageCount: count,
        storageSize: totalSize,
        websiteCount: siteCount || 0,
        submissionCount: subCount || 0,
      });

    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const checkForOrphans = async () => {
    try {
      setScanning(true);
      setOrphanedImages([]);
      setScanResult(null);

      // 1. Get all files from storage
      const { data: files, error: storageError } = await supabase.storage
        .from("images")
        .list();

      if (storageError || !files) {
        throw new Error("Could not list storage files");
      }

      // 2. Get all website data to find references
      // Explicitly typing as any[] to avoid 'never' inference issues
      const { data: websites, error: dbError } = await supabase
        .from("websites")
        .select("content, theme, logo, favicon, marketing, messenger");

      if (dbError) throw dbError;

      // 3. Collect all used image filenames
      const usedFilenames = new Set<string>();

      const extractFilenames = (obj: any) => {
        if (!obj) return;
        if (typeof obj === "string") {
          // Check if string contains the pattern for Supabase storage images
          // Common pattern: .../images/filename.ext or just filename.ext if stored relatively
          // We'll look for exact filename matches from the bucket list
          (files as StorageFile[]).forEach(file => {
            if (obj.includes(file.name)) {
              usedFilenames.add(file.name);
            }
          });
        } else if (typeof obj === "object") {
          Object.values(obj).forEach((value) => extractFilenames(value));
        }
      };

      (websites as any[])?.forEach((site) => {
        extractFilenames(site.content);
        extractFilenames(site.theme);
        extractFilenames(site.marketing);
        extractFilenames(site.messenger);
        if (site.logo) extractFilenames(site.logo);
        if (site.favicon) extractFilenames(site.favicon);
      });

      // 4. Identify orphans
      const orphans = (files as StorageFile[]).filter((file) => !usedFilenames.has(file.name) && file.name !== ".emptyFolderPlaceholder");
      setOrphanedImages(orphans);
      setScanResult(`Scan complete. Found ${orphans.length} orphaned images.`);

    } catch (error: any) {
      console.error("Scan error:", error);
      setScanResult(`Scan failed: ${error.message}`);
    } finally {
      setScanning(false);
    }
  };

  const deleteOrphans = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Orphaned Images',
      message: `Are you sure you want to delete ${orphanedImages.length} images? This cannot be undone.`,
      onConfirm: async () => {
        try {
          setDeleting(true);
          const fileNames = orphanedImages.map(f => f.name);

          const { error } = await supabase.storage
            .from("images")
            .remove(fileNames);

          if (error) throw error;

          showToast("Orphaned images deleted successfully!", "success");
          setOrphanedImages([]);
          loadStats(); // Refresh stats
          setConfirmModal(null);
        } catch (error: any) {
          setConfirmModal(null);
          showToast(`Delete failed: ${error.message}`, 'error');
        } finally {
          setDeleting(false);
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <Loader className="animate-spin text-gray-400" size={48} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-600 mt-1">System health and cleanup</p>
        </div>
        <button
          onClick={loadStats}
          disabled={refreshing}
          className="p-2 text-gray-500 hover:text-blue-600 transition disabled:opacity-50"
          title="Refresh Stats"
        >
          <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Storage Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <HardDrive size={24} className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Storage Usage</h2>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Files</span>
              <span className="font-mono font-medium text-gray-900">{stats.storageCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Size</span>
              <span className="font-mono font-medium text-gray-900">{formatBytes(stats.storageSize)}</span>
            </div>
          </div>
        </div>

        {/* Database Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database size={24} className="text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">Database</h2>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Websites</span>
              <span className="font-mono font-medium text-gray-900">{stats.websiteCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Submissions</span>
              <span className="font-mono font-medium text-gray-900">{stats.submissionCount}</span>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity size={24} className="text-green-600" />
            <h2 className="text-lg font-bold text-gray-900">System Status</h2>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded-lg">
              <CheckCircle size={16} />
              <span className="text-sm font-medium">Database Connected</span>
            </div>
            <div className="flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded-lg">
              <CheckCircle size={16} />
              <span className="text-sm font-medium">Storage Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Orphaned Images Scanner */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ImageIcon size={24} className="text-orange-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Orphaned Images</h2>
              <p className="text-sm text-gray-500">Find and remove unused images to save space</p>
            </div>
          </div>
          <div className="flex gap-3">
            {orphanedImages.length > 0 && (
              <button
                onClick={deleteOrphans}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Delete {orphanedImages.length} Files
              </button>
            )}
            <button
              onClick={checkForOrphans}
              disabled={scanning || deleting}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
            >
              {scanning ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Scan for Orphans
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-6 bg-gray-50">
          {scanResult && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${orphanedImages.length > 0 ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}`}>
              {scanResult}
            </div>
          )}

          {orphanedImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {orphanedImages.map((file) => (
                <div key={file.id} className="relative group bg-white p-2 rounded border border-gray-200">
                  <div className="aspect-square bg-gray-100 rounded mb-2 overflow-hidden flex items-center justify-center">
                    {/* Try to show preview if it's an image */}
                    {file.metadata?.mimetype?.startsWith("image") ? (
                      <img
                        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${file.name}`}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    ) : (
                      <ImageIcon size={24} className="text-gray-300" />
                    )}
                  </div>
                  <div className="truncate text-xs font-medium text-gray-700" title={file.name}>
                    {file.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatBytes(file.metadata?.size || 0)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
              <p>System is clean. No orphaned images found.</p>
            </div>
          )}
        </div>
      </div>
      <ConfirmationModal
        isOpen={!!confirmModal?.isOpen}
        title={confirmModal?.title}
        message={confirmModal?.message || ""}
        onClose={() => setConfirmModal(null)}
        onConfirm={confirmModal?.onConfirm || (() => { })}
      />
    </div>
  );
};
