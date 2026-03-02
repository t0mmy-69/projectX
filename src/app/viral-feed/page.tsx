"use client";

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem('narrativeOS_auth');
  if (!stored) return {};
  try {
    const u = JSON.parse(stored);
    return { 'Authorization': `Bearer ${u.token}`, 'x-user-id': u.id, 'Content-Type': 'application/json' };
  } catch { return {}; }
}

interface Post {
  id: string;
  author: string;
  content: string;
  likes: number;
  reposts: number;
  replies: number;
  posted_at: string;
  viral_score?: number;
  engagement_rate?: number;
  category?: string;
}

export default function ViralFeedPage() {
  const [filter, setFilter] = useState('All');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const router = useRouter();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/posts', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setPosts(data.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const triggerScrape = async () => {
    setScraping(true);
    try {
      await fetch('/api/scrape', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({}) });
      await new Promise(r => setTimeout(r, 1500));
      await fetchPosts();
    } catch {}
    setScraping(false);
  };

  const filteredPosts = filter === 'All' ? posts : posts.filter(p => {
    const cat = (p.category || '').replace(/_/g, ' ');
    return cat.toLowerCase().includes(filter.toLowerCase());
  });

  const getCategoryColor = (cat: string = '') => {
    if (cat.includes('breaking')) return { bg: 'bg-red-500/20 text-red-400', label: 'Breaking News' };
    if (cat.includes('narrative')) return { bg: 'bg-primary/20 text-primary', label: 'Narrative Shift' };
    if (cat.includes('opinion')) return { bg: 'bg-primary/10 text-primary-light', label: 'Opinion' };
    return { bg: 'bg-white/10 text-muted', label: cat.replace(/_/g, ' ') || 'Post' };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Filter Bar */}
        <div className="glass-panel p-4 rounded-xl border border-white/5 flex flex-wrap items-center gap-4">
          <div className="flex bg-[#0A0A0B] rounded-lg p-1 border border-white/5">
            {['All', 'Breaking News', 'Narrative Shift', 'Opinion'].map((cat) => (
              <button key={cat} onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filter === cat ? 'bg-primary/20 text-primary' : 'text-muted hover:text-white'}`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted">{posts.length} posts tracked</span>
            <button onClick={triggerScrape} disabled={scraping}
              className="px-3 py-1.5 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">{scraping ? 'sync' : 'refresh'}</span>
              {scraping ? 'Scraping...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 space-y-4 border border-dashed border-white/10 rounded-2xl">
            <span className="material-symbols-outlined text-6xl text-muted/20">rss_feed</span>
            <p className="text-muted text-sm">No viral posts yet. Add topics and click Refresh to scrape content.</p>
            <button onClick={() => router.push('/topics')} className="text-primary text-sm font-bold hover:text-primary-light">Add Topics →</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPosts.map(post => {
              const { bg, label } = getCategoryColor(post.category);
              return (
                <div key={post.id} className="bg-[#0A0A0B] border border-white/5 rounded-xl overflow-hidden hover:border-primary/30 transition-all duration-300">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-32 bg-black/40 p-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5">
                      <div className="text-2xl font-black text-white">{Math.round(post.viral_score || 0)}</div>
                      <div className="text-[10px] font-black text-green-400 mt-1 uppercase tracking-tighter">Viral Score</div>
                      <div className={`mt-4 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider ${bg}`}>{label}</div>
                    </div>
                    <div className="flex-1 p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex-shrink-0" />
                        <span className="text-sm font-bold text-white">{post.author}</span>
                        <span className="text-[10px] text-muted ml-auto font-bold">
                          {Math.floor((Date.now() - new Date(post.posted_at || Date.now()).getTime()) / 60000)}m ago
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 italic line-clamp-3">&ldquo;{post.content}&rdquo;</p>
                      <div className="flex items-center gap-4 text-[10px] text-muted font-bold">
                        <span>❤️ {post.likes}</span>
                        <span>🔁 {post.reposts}</span>
                        <span>💬 {post.replies}</span>
                      </div>
                    </div>
                    <div className="w-full md:w-44 p-4 bg-black/20 flex flex-col justify-center gap-2">
                      <button onClick={() => router.push('/draft-studio')}
                        className="w-full py-2 bg-primary hover:bg-primary-light text-white text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 shadow-[0_0_15px_rgba(129,74,200,0.15)]">
                        <span className="material-symbols-outlined text-sm">edit_note</span>
                        Generate Draft
                      </button>
                      <button className="w-full py-2 bg-transparent border border-white/5 hover:border-primary/30 text-white text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-sm">smart_toy</span>
                        Auto Reply
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
