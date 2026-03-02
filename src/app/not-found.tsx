import React from 'react';
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-sans p-6">
            <div className="w-24 h-24 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary text-5xl" aria-hidden="true">explore_off</span>
            </div>
            <h1 className="text-6xl font-extrabold text-primary mb-3">404</h1>
            <p className="text-base md:text-xl text-muted mb-8 text-center">Page not found. The link may be outdated or moved.</p>
            <div className="flex gap-3">
                <Link href="/" className="px-6 py-3 bg-primary hover:bg-primary-light rounded-xl text-white font-bold transition-all duration-300 btn-glow">
                    Go Home
                </Link>
                <Link href="/dashboard" className="px-6 py-3 border border-white/10 hover:border-primary/30 rounded-xl text-white font-bold transition-all duration-300">
                    Dashboard
                </Link>
            </div>
        </div>
    );
}
