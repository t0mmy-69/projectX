"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function SignupPage() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || !firstName) { setError('Please fill in all required fields'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        setLoading(true);
        setError('');
        const name = `${firstName} ${lastName}`.trim();
        const result = await register(email, password, name);
        setLoading(false);
        if (result.success) {
            router.push('/onboarding');
        } else {
            setError(result.error || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
            <div className="hero-glow !top-1/2 !-translate-y-1/2"></div>
            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(129,74,200,0.3)] mx-auto mb-6">
                        <span className="material-symbols-outlined text-white text-3xl">auto_awesome</span>
                    </div>
                    <h1 className="text-3xl font-extrabold mb-2 tracking-tight">Create Your Weapon</h1>
                    <p className="text-muted text-sm font-medium">Join creators mastering their narrative.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted uppercase tracking-wider">First Name *</label>
                            <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Cuong" required aria-label="First name" autoComplete="given-name"
                                className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted uppercase tracking-wider">Last Name</label>
                            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Vu" aria-label="Last name" autoComplete="family-name"
                                className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-sm" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted uppercase tracking-wider">Email Address *</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" required aria-label="Email address" autoComplete="email"
                            className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-sm" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted uppercase tracking-wider">Password *</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" required aria-label="Password" autoComplete="new-password"
                            className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-sm" />
                    </div>
                    <button type="submit" disabled={loading}
                        className="w-full py-3.5 bg-primary hover:bg-primary-light rounded-xl font-bold text-sm transition-all duration-300 shadow-[0_0_25px_rgba(129,74,200,0.25)] mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {loading ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                </svg>
                                Creating account...
                            </>
                        ) : 'Create Free Account'}
                    </button>
                    <p className="text-[10px] text-center text-muted leading-relaxed px-4">
                        By signing up, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </form>

                <p className="text-center mt-8 text-xs text-muted font-medium">
                    Already have an account? <Link href="/login" className="text-primary font-bold hover:text-primary-light transition-colors">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
