"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import EmptyState from '@/components/EmptyState';
import { getAuthHeaders } from '@/lib/authHeaders';

interface Post {
  id: string;
  author: string;
  content: string;
  created_at: string;
  viral_score?: number;
  category?: string;
}

export default function OverviewPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [draftsCount, setDraftsCount] = useState(0);
  const [topicsCount, setTopicsCount] = useState(0);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load name from localStorage immediately (no API wait)
    const stored = localStorage.getItem('narrativeOS_auth');
    if (stored) {
      try { const u = JSON.parse(stored); if (u.name) setUserName(u.name); } catch {}
    }

    const loadData = async () => {
      setLoading(true);
      const headers = getAuthHeaders();
      try {
        // Load user profile
        const profileRes = await fetch('/api/user/profile', { headers });
        const profileData = await profileRes.json();
        if (profileData.success) {
          if (profileData.data.name && !profileData.data.name.includes('_')) {
            setUserName(profileData.data.name);
          }
          setTopicsCount(profileData.data.topics_count);
          setDraftsCount(profileData.data.drafts_count);
        }
      } catch {}
      try {
        // Load recent posts
        const postsRes = await fetch('/api/posts', { headers });
        const postsData = await postsRes.json();
        if (postsData.success) {
          setPosts((postsData.data || []).slice(0, 3));
        }
      } catch {}
      setLoading(false);
    };
    loadData();
  }, []);

  const categoryColor = (cat: string = '') => {
    if (cat.includes('breaking')) return 'bg-red-500/10 text-red-400';
    if (cat.includes('narrative')) return 'bg-primary/10 text-primary';
    return 'bg-primary/10 text-primary-light';
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-extrabold">
            Welcome back{userName ? `, ${userName.split(' ')[0]}` : ''} 👋
          </h2>
          <p className="text-muted text-sm mt-1">Your narrative weapon is ready.</p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {loading ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : (
            <>
              <MetricCard title="Topics Active" value={String(topicsCount)} />
              <MetricCard title="Drafts Ready" value={String(draftsCount)} />
              <MetricCard title="Viral Score" value={posts.length > 0 ? String(Math.round(posts[0]?.viral_score || 0)) : '—'} trend={posts.length > 0 ? '+12%' : undefined} trendUp={true} />
              <MetricCard title="Posts Tracked" value={String(posts.length)} />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={() => router.push('/topics')} className="p-4 bg-[#0A0A0B] border border-white/5 rounded-xl hover:border-primary/30 transition-all group text-left">
            <span className="material-symbols-outlined text-primary mb-2 block">add_circle</span>
            <p className="text-sm font-bold">Add Topic</p>
            <p className="text-xs text-muted">Monitor a new narrative</p>
          </button>
          <button onClick={() => router.push('/draft-studio')} className="p-4 bg-[#0A0A0B] border border-white/5 rounded-xl hover:border-primary/30 transition-all group text-left">
            <span className="material-symbols-outlined text-primary mb-2 block">edit_note</span>
            <p className="text-sm font-bold">Draft Studio</p>
            <p className="text-xs text-muted">Generate a new post</p>
          </button>
          <button onClick={() => router.push('/viral-feed')} className="p-4 bg-[#0A0A0B] border border-white/5 rounded-xl hover:border-primary/30 transition-all group text-left">
            <span className="material-symbols-outlined text-primary mb-2 block">bolt</span>
            <p className="text-sm font-bold">Viral Feed</p>
            <p className="text-xs text-muted">See what&apos;s trending now</p>
          </button>
        </div>

        {/* Recent Posts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Breaking Narratives</h3>
            <button onClick={() => router.push('/viral-feed')} className="text-xs text-primary hover:text-primary-light font-bold transition-colors">View All →</button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                <PostCard key={post.id} post={post} onDraft={() => router.push('/draft-studio')} categoryColor={categoryColor} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="rss_feed"
              title="No posts yet"
              description="Add topics to start seeing viral content."
              action={<button onClick={() => router.push('/topics')} className="text-primary text-sm font-bold hover:text-primary-light">Add Topics →</button>}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function MetricCardSkeleton() {
  return (
    <div className="bg-[#0A0A0B] p-5 rounded-xl border border-white/5">
      <div className="h-3 w-24 rounded skeleton" />
      <div className="h-8 w-16 mt-3 rounded skeleton" />
      <div className="h-3 w-12 mt-3 rounded skeleton" />
    </div>
  );
}

function MetricCard({ title, value, trend, trendUp }: { title: string; value: string; trend?: string; trendUp?: boolean }) {
  return (
    <div className="bg-[#0A0A0B] p-5 rounded-xl border border-white/5 hover:border-primary/30 transition-all duration-300 group">
      <div className="text-[10px] text-muted uppercase tracking-wider font-bold">{title}</div>
      <div className="text-2xl font-black mt-2">{value}</div>
      {trend && (
        <div className={`text-[10px] mt-2 flex items-center gap-1 font-bold ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
          <span className="material-symbols-outlined text-[12px]">{trendUp ? 'trending_up' : 'trending_down'}</span>
          {trend}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, onDraft, categoryColor }: { post: Post; onDraft: () => void; categoryColor: (c: string) => string }) {
  const category = post.category || 'opinion';
  const displayCat = category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const timeAgo = (d: string) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };
  return (
    <div className="bg-[#0A0A0B] p-6 rounded-xl border border-white/5 hover:border-primary/30 transition-all duration-300 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${categoryColor(category)}`}>{displayCat}</span>
        {post.viral_score !== undefined && post.viral_score > 0 && (
          <div className="flex items-center gap-1 text-[10px] font-black text-green-400 bg-green-500/10 px-2.5 py-1 rounded-lg">
            <span className="material-symbols-outlined text-[12px]">bolt</span>
            {Math.round(post.viral_score)}
          </div>
        )}
      </div>
      <p className="text-sm font-medium leading-relaxed mb-4 flex-1 line-clamp-3">{post.content}</p>
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
        <span className="text-[10px] text-muted font-bold">{timeAgo(post.created_at || new Date().toISOString())}</span>
        <button onClick={onDraft} className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary-light transition-colors">
          Draft Response <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
