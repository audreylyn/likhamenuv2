/**
 * Admin Dashboard
 * Overview statistics and quick actions
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Globe, Plus, ExternalLink, CheckCircle, XCircle } from 'lucide-react';

interface Stats {
  totalWebsites: number;
  activeWebsites: number;
  inactiveWebsites: number;
  totalUsers: number;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalWebsites: 0,
    activeWebsites: 0,
    inactiveWebsites: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get websites count
      const { count: websitesCount } = await supabase
        .from('websites')
        .select('*', { count: 'exact', head: true });

      // Get active websites count
      const { count: activeCount } = await supabase
        .from('websites')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get inactive websites count
      const { count: inactiveCount } = await supabase
        .from('websites')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false);

      setStats({
        totalWebsites: websitesCount || 0,
        activeWebsites: activeCount || 0,
        inactiveWebsites: inactiveCount || 0,
        totalUsers: 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      icon: Globe,
      label: 'Total Websites',
      value: stats.totalWebsites,
      color: 'bg-blue-500',
    },
    {
      icon: CheckCircle,
      label: 'Active Sites',
      value: stats.activeWebsites,
      color: 'bg-green-500',
    },
    {
      icon: XCircle,
      label: 'Inactive Sites',
      value: stats.inactiveWebsites,
      color: 'bg-gray-500',
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening.</p>
        </div>
        <Link
          to="/admin/websites?new=true"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <Plus size={20} />
          New Website
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center text-white`}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/admin/websites"
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white hover:shadow-lg transition group"
        >
          <Globe size={32} className="mb-4" />
          <h3 className="text-xl font-bold mb-2">Manage Websites</h3>
          <p className="text-blue-100 mb-4">Create, edit, and manage all your websites</p>
          <div className="flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all">
            Go to Websites <ExternalLink size={16} />
          </div>
        </Link>

      </div>
    </div>
  );
};

