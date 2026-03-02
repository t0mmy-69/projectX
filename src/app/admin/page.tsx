"use client";

import React, { useEffect, useMemo, useState } from 'react';
import AdminAPIKeysPanel from '@/app/components/AdminAPIKeysPanel';
import { getAuthHeaders } from '@/lib/authHeaders';

type OverviewData = {
  database_metrics?: {
    users: number;
    topics: number;
    posts: number;
    drafts: number;
  };
  ai_api_usage?: {
    total_tokens: number;
    total_calls: number;
    total_cost: number;
  };
  performance?: {
    response_time_ms: number;
  };
  alerts?: string[];
};

type MetricsData = {
  growth?: {
    new_users_24h: number;
    new_posts_24h: number;
  };
  ai_api_health?: {
    success_rate_percent: number;
    avg_response_time_ms: number;
  };
  recommendations?: string[];
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [forbidden, setForbidden] = useState(false);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [overviewRes, metricsRes] = await Promise.all([
          fetch('/api/admin/overview', { headers: getAuthHeaders() }),
          fetch('/api/admin/metrics', { headers: getAuthHeaders() }),
        ]);

        const overviewJson = await overviewRes.json();
        const metricsJson = await metricsRes.json();

        if (overviewRes.status === 403 || metricsRes.status === 403) {
          setForbidden(true);
          throw new Error('Admin role required');
        }
        if (!overviewRes.ok || !overviewJson.success) {
          throw new Error(overviewJson.error || 'Failed to load admin overview');
        }
        if (!metricsRes.ok || !metricsJson.success) {
          throw new Error(metricsJson.error || 'Failed to load admin metrics');
        }

        setOverview(overviewJson.data);
        setMetrics(metricsJson.data);
      } catch (e: any) {
        setError(e.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const cards = useMemo(() => {
    const users = overview?.database_metrics?.users ?? 0;
    const posts = overview?.database_metrics?.posts ?? 0;
    const tokens = overview?.ai_api_usage?.total_tokens ?? 0;
    const latency = overview?.performance?.response_time_ms ?? 0;
    return [
      { label: 'Total Users', value: String(users), sub: `${metrics?.growth?.new_users_24h ?? 0} new today` },
      { label: 'Tracked Posts', value: String(posts), sub: `${metrics?.growth?.new_posts_24h ?? 0} in 24h` },
      { label: 'AI Tokens Used', value: String(tokens), sub: `${overview?.ai_api_usage?.total_calls ?? 0} calls` },
      { label: 'System Latency', value: `${Math.round(latency)}ms`, sub: `${Math.round(metrics?.ai_api_health?.success_rate_percent ?? 0)}% success` },
    ];
  }, [overview, metrics]);

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {forbidden ? (
          <div className="p-6 border border-red-500/20 rounded-2xl bg-red-500/5">
            <h2 className="text-lg font-bold text-red-300">Access denied</h2>
            <p className="text-sm text-muted mt-2">Your account does not have admin privileges.</p>
          </div>
        ) : (
          <>
        <div className="flex justify-between items-center bg-[#0A0A0B] p-6 rounded-2xl border border-white/5">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">terminal</span>
              System Control Center
            </h1>
            <p className="text-sm text-muted">Live infrastructure and AI usage metrics.</p>
          </div>
        </div>

        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {cards.map(c => (
            <AdminStatCard key={c.label} label={c.label} value={c.value} sub={c.sub} loading={loading} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-[0.15em] text-muted">System Alerts</h3>
            {loading ? (
              <p className="text-sm text-muted">Loading...</p>
            ) : (overview?.alerts?.length ?? 0) > 0 ? (
              <ul className="space-y-2 text-sm text-gray-300">
                {(overview?.alerts || []).map((a, i) => <li key={i}>• {a}</li>)}
              </ul>
            ) : (
              <p className="text-sm text-green-400">No active alerts.</p>
            )}
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-[0.15em] text-muted">Recommendations</h3>
            {loading ? (
              <p className="text-sm text-muted">Loading...</p>
            ) : (metrics?.recommendations?.length ?? 0) > 0 ? (
              <ul className="space-y-2 text-sm text-gray-300">
                {(metrics?.recommendations || []).map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
            ) : (
              <p className="text-sm text-green-400">No recommendations at the moment.</p>
            )}
          </div>
        </div>

        <AdminAPIKeysPanel />
          </>
        )}
      </div>
    </div>
  );
}

function AdminStatCard({ label, value, sub, loading }: { label: string; value: string; sub: string; loading: boolean }) {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-primary/30 transition-all duration-300">
      <p className="text-[10px] text-muted font-black uppercase mb-2 tracking-[0.15em]">{label}</p>
      <p className="text-2xl font-black mb-1">{loading ? '...' : value}</p>
      <p className="text-[10px] text-green-400 font-bold">{loading ? 'Loading' : sub}</p>
    </div>
  );
}
