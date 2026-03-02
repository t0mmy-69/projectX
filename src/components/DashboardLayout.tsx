'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
    { icon: 'dashboard', label: 'Overview', href: '/dashboard' },
    { icon: 'rss_feed', label: 'Viral Feed', href: '/viral-feed' },
    { icon: 'topic', label: 'Topics', href: '/topics' },
    { icon: 'edit_note', label: 'Draft Studio', href: '/draft-studio' },
    { icon: 'smart_toy', label: 'Automation', href: '/automation' },
    { icon: 'settings', label: 'Settings', href: '/settings' },
];

function getPageTitle(pathname: string): string {
    const item = NAV_ITEMS.find(n => pathname.startsWith(n.href));
    if (item) return item.label;
    if (pathname.startsWith('/admin')) return 'Admin';
    if (pathname.startsWith('/onboarding')) return 'Onboarding';
    return 'Overview';
}

function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const pageTitle = getPageTitle(pathname);
    const [userName, setUserName] = useState('User');
    const [userTier, setUserTier] = useState('free');

    useEffect(() => {
        try {
            const stored = localStorage.getItem('narrativeOS_auth');
            if (stored) {
                const u = JSON.parse(stored);
                if (u.name) setUserName(u.name);
            }
        } catch {}
        // Also fetch profile for tier info
        const stored = localStorage.getItem('narrativeOS_auth');
        if (stored) {
            try {
                const u = JSON.parse(stored);
                fetch('/api/user/profile', {
                    headers: { Authorization: `Bearer ${u.token}`, 'x-user-id': u.id }
                }).then(r => r.json()).then(data => {
                    if (data.success) {
                        if (data.data.name && !data.data.name.includes('_')) setUserName(data.data.name);
                        setUserTier(data.data.subscription_tier || 'free');
                    }
                }).catch(() => {});
            } catch {}
        }
    }, []);

    const tierLabel = userTier === 'creator' ? 'Creator' : userTier === 'pro' ? 'Pro Member' : 'Free Plan';

    return (
        <div className="flex h-screen bg-black text-white selection:bg-primary selection:text-white font-sans">
            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex w-72 border-r border-white/5 flex-col bg-[#050505]">
                <div className="p-8 flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(129,74,200,0.3)]">
                        <span className="material-symbols-outlined text-white text-xl">auto_awesome</span>
                    </div>
                    <span className="font-extrabold text-xl tracking-tight">NarrativeOS</span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                    {NAV_ITEMS.map(item => (
                        <NavItem
                            key={item.href}
                            icon={item.icon}
                            label={item.label}
                            href={item.href}
                            active={pathname.startsWith(item.href)}
                        />
                    ))}
                </nav>

                <div className="p-6 border-t border-white/5">
                    <Link href="/settings" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all duration-300 cursor-pointer group border border-transparent hover:border-white/5">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-light text-xs font-black group-hover:bg-primary group-hover:text-white transition-all duration-300">
                            {getInitials(userName)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{userName}</p>
                            <p className="text-[10px] text-muted font-black uppercase tracking-widest">{tierLabel}</p>
                        </div>
                    </Link>
                </div>
            </aside>

            {/* Bottom Navigation (Mobile) */}
            <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl flex justify-around p-3 z-50 shadow-2xl">
                {NAV_ITEMS.map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`p-3 rounded-xl transition-all duration-300 ${pathname.startsWith(item.href)
                            ? 'bg-primary text-white shadow-[0_0_20px_rgba(129,74,200,0.3)]'
                            : 'text-muted'
                            }`}
                    >
                        <span className="material-symbols-outlined text-xl">{item.icon}</span>
                    </Link>
                ))}
            </nav>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden bg-black">
                <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-black/50 backdrop-blur-xl">
                    <h1 className="text-xl font-bold tracking-tight">{pageTitle}</h1>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => router.push('/viral-feed')}
                            className="p-2 text-muted hover:text-white transition-all duration-300 relative group"
                            title="View notifications"
                        >
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-black"></span>
                        </button>
                        <button
                            onClick={() => router.push('/draft-studio')}
                            className="px-6 py-2.5 bg-primary hover:bg-primary-light text-white text-sm font-bold rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(129,74,200,0.2)]"
                        >
                            New Narrative
                        </button>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}

function NavItem({ icon, label, href, active = false }: { icon: string; label?: string; href: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 border ${active
                ? 'bg-primary/10 text-primary-light border-primary/20 shadow-[0_0_15px_rgba(129,74,200,0.1)]'
                : 'text-muted border-transparent hover:text-white hover:bg-white/[0.03]'
                }`}
        >
            <span className="material-symbols-outlined text-xl">{icon}</span>
            {label && <span className="tracking-tight">{label}</span>}
        </Link>
    );
}
