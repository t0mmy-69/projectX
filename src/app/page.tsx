"use client";

import React, { useEffect, useRef } from 'react';

export default function LandingPage() {
    const revealRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        revealRefs.current.forEach(ref => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, []);

    const addToRefs = (el: HTMLDivElement | null) => {
        if (el && !revealRefs.current.includes(el)) {
            revealRefs.current.push(el);
        }
    };

    return (
        <div className="bg-black text-white selection:bg-primary selection:text-white">
            {/* Navbar */}
            <nav className="fixed w-full z-50 top-0 border-b border-white/5 bg-black/50 backdrop-blur-xl">
                <div className="max-w-[1240px] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(129,74,200,0.4)]">
                            <span className="material-symbols-outlined text-white text-xl">auto_awesome</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight">NarrativeOS</span>
                    </div>
                    <div className="hidden md:flex items-center gap-10 text-[15px] font-medium text-muted">
                        <a className="hover:text-white transition-all duration-300" href="#features">Features</a>
                        <a className="hover:text-white transition-all duration-300" href="#workflow">Workflow</a>
                        <a className="hover:text-white transition-all duration-300" href="#pricing">Pricing</a>
                    </div>
                    <div className="flex items-center gap-6">
                        <a className="text-[15px] font-medium text-muted hover:text-white transition-all duration-300" href="#">Log in</a>
                        <a className="text-[15px] font-semibold bg-primary hover:bg-primary-light px-6 py-2.5 rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(129,74,200,0.2)]" href="/onboarding">Get Started</a>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative pt-44 pb-32 px-6 overflow-hidden">
                <div className="hero-glow"></div>
                <div className="max-w-[1240px] mx-auto text-center relative z-10">
                    <div ref={addToRefs} className="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-10">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        <span className="text-[11px] font-bold text-muted uppercase tracking-[0.2em]">Next-Gen Creator OS</span>
                    </div>
                    <h1 ref={addToRefs} className="reveal text-6xl md:text-8xl font-extrabold tracking-tight leading-[1.05] mb-8 gradient-text">
                        Revolutionize Your <br />
                        <span className="purple-gradient-text">Creator Workflow</span>
                    </h1>
                    <p ref={addToRefs} className="reveal text-xl text-muted mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        The elite intelligence layer for X creators. Identify trends before they explode, automate your drafting, and dominate the narrative with precision.
                    </p>
                    <div ref={addToRefs} className="reveal flex flex-col sm:flex-row gap-5 justify-center pt-4">
                        <button onClick={() => window.location.href = '/onboarding'} className="px-10 py-4 bg-primary hover:bg-primary-light text-white font-bold rounded-xl transition-all duration-500 shadow-[0_0_30px_rgba(129,74,200,0.3)] flex items-center justify-center gap-3 group">
                            Start Free Trial
                            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </button>
                        <button className="px-10 py-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold rounded-xl transition-all duration-500 flex items-center justify-center gap-3">
                            <span className="material-symbols-outlined">play_circle</span>
                            Watch Demo
                        </button>
                    </div>
                </div>

                {/* Dashboard Preview */}
                <div ref={addToRefs} className="reveal mt-32 max-w-[1100px] mx-auto relative group">
                    <div className="absolute -inset-4 bg-primary/20 rounded-[2.5rem] blur-[80px] opacity-0 group-hover:opacity-100 transition-all duration-1000"></div>
                    <div className="relative bg-[#050505] border border-white/[0.08] rounded-[2rem] shadow-2xl overflow-hidden aspect-[16/10]">
                        <div className="h-12 border-b border-white/[0.08] bg-[#0A0A0B] flex items-center px-6 justify-between">
                            <div className="flex gap-2.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/40"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40"></div>
                            </div>
                            <div className="text-[11px] text-muted font-mono tracking-wider">app.narrative.os</div>
                            <div className="w-12"></div>
                        </div>
                        <div className="p-8 grid grid-cols-12 gap-8 h-full">
                            <div className="col-span-3 hidden md:flex flex-col gap-6 border-r border-white/5 pr-6 h-full">
                                <div className="flex items-center gap-3 text-primary text-xs font-bold bg-primary/10 p-3 rounded-xl">
                                    <span className="material-symbols-outlined text-lg">dashboard</span>
                                    Overview
                                </div>
                                <div className="flex items-center gap-3 text-muted text-xs font-bold hover:text-white p-3 rounded-xl hover:bg-white/5 transition-all">
                                    <span className="material-symbols-outlined text-lg">rss_feed</span>
                                    Viral Feed
                                </div>
                                <div className="flex items-center gap-3 text-muted text-xs font-bold hover:text-white p-3 rounded-xl hover:bg-white/5 transition-all">
                                    <span className="material-symbols-outlined text-lg">edit_note</span>
                                    Draft Studio
                                </div>
                            </div>
                            <div className="col-span-12 md:col-span-9 flex flex-col gap-6">
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="bg-[#0A0A0B] p-5 rounded-2xl border border-white/5 hover:border-primary/30 transition-all">
                                        <div className="text-[10px] text-muted font-bold uppercase tracking-widest">Viral Score</div>
                                        <div className="text-3xl font-black text-white mt-1.5">98.4</div>
                                        <div className="text-[10px] text-green-400 mt-2 flex items-center gap-1.5 font-bold">
                                            <span className="material-symbols-outlined text-[12px]">trending_up</span> +12%
                                        </div>
                                    </div>
                                    <div className="bg-[#0A0A0B] p-5 rounded-2xl border border-white/5 hover:border-primary/30 transition-all">
                                        <div className="text-[10px] text-muted font-bold uppercase tracking-widest">Impressions</div>
                                        <div className="text-3xl font-black text-white mt-1.5">2.4M</div>
                                        <div className="text-[10px] text-green-400 mt-2 flex items-center gap-1.5 font-bold">
                                            <span className="material-symbols-outlined text-[12px]">trending_up</span> +8%
                                        </div>
                                    </div>
                                    <div className="bg-[#0A0A0B] p-5 rounded-2xl border border-white/5 hover:border-primary/30 transition-all">
                                        <div className="text-[10px] text-muted font-bold uppercase tracking-widest">Drafts Ready</div>
                                        <div className="text-3xl font-black text-white mt-1.5">14</div>
                                    </div>
                                </div>
                                <div className="bg-[#0A0A0B] flex-1 rounded-2xl border border-white/5 p-6 relative overflow-hidden">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="text-sm font-bold tracking-tight">Engagement Trend</div>
                                        <div className="text-[10px] text-muted font-bold uppercase">Last 7 Days</div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-primary/10 to-transparent"></div>
                                    <svg className="w-full h-auto text-primary overflow-visible opacity-80" viewBox="0 0 100 40">
                                        <path d="M0 35 Q 10 30, 20 32 T 40 20 T 60 25 T 80 10 T 100 5" fill="none" stroke="currentColor" strokeWidth="1" />
                                        <circle cx="20" cy="32" fill="currentColor" r="1.5" />
                                        <circle cx="60" cy="25" fill="currentColor" r="1.5" />
                                        <circle cx="100" cy="5" fill="white" r="2.5" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section id="features" className="py-40 relative">
                <div className="max-w-[1240px] mx-auto px-6">
                    <div ref={addToRefs} className="reveal text-center mb-24">
                        <h2 className="text-5xl font-extrabold mb-6 tracking-tight">The Modern Creator's <span className="purple-gradient-text">Secret Weapon</span></h2>
                        <p className="text-muted text-xl max-w-2xl mx-auto font-medium">Built for those who demand more than base-level visibility.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: 'visibility_off',
                                color: 'from-red-500/20 to-red-600/5',
                                textColor: 'text-red-400',
                                title: 'Anticipate Trends',
                                text: 'Detect viral shifts hours before they hit the mainstream. Stay ahead of the curve, always.'
                            },
                            {
                                icon: 'show_chart',
                                color: 'from-primary/20 to-primary/5',
                                textColor: 'text-primary',
                                title: 'Strategic Growth',
                                text: 'Turn data into decisions. Our engine maps your niche to predict which topics will ignite engagement.'
                            },
                            {
                                icon: 'psychology',
                                color: 'from-purple-500/20 to-purple-600/5',
                                textColor: 'text-purple-400',
                                title: 'AI Drafting Studio',
                                text: 'Generate high-fidelity threads and posts that capture your unique voice and personality effortlessly.'
                            }
                        ].map((feature, i) => (
                            <div key={i} ref={addToRefs} className="reveal p-10 rounded-[2rem] bg-secondary-bg border border-white/5 card-hover transition-all duration-500 group">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-8 ${feature.textColor} border border-white/5`}>
                                    <span className="material-symbols-outlined text-2xl">{feature.icon}</span>
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                                <p className="text-muted text-[15px] leading-relaxed font-medium">
                                    {feature.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Workflow Section */}
            <section id="workflow" className="py-40 bg-secondary-bg border-y border-white/5">
                <div className="max-w-[1240px] mx-auto px-6">
                    <div ref={addToRefs} className="reveal text-center mb-24">
                        <span className="text-primary font-bold text-xs tracking-[0.3em] uppercase mb-4 block">Workflow</span>
                        <h2 className="text-5xl font-extrabold tracking-tight">From Noise to <span className="purple-gradient-text">Dominance</span></h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-20 relative">
                        <div className="absolute top-24 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent hidden md:block"></div>
                        {[
                            { icon: 'add_circle', step: '01', title: 'Define Niche', text: 'Map out your expertise and audience. Tell the AI exactly who you are building for.' },
                            { icon: 'radar', step: '02', title: 'Scan narratives', text: 'Our engine parses thousands of data points to find the missing links in current trends.' },
                            { icon: 'rocket_launch', step: '03', title: 'Execute Drafts', text: 'Deploy high-impact content instantly. Scale your output without sacrificing your soul.' }
                        ].map((item, i) => (
                            <div key={i} ref={addToRefs} className="reveal flex flex-col items-center text-center group">
                                <div className="w-28 h-28 rounded-[2.5rem] bg-black border border-white/10 group-hover:border-primary group-hover:shadow-[0_0_40px_rgba(129,74,200,0.2)] flex items-center justify-center mb-10 transition-all duration-500 relative">
                                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-black">{item.step}</div>
                                    <span className="material-symbols-outlined text-4xl text-muted group-hover:text-primary transition-all">{item.icon}</span>
                                </div>
                                <h3 className="text-2xl font-extrabold mb-4">{item.title}</h3>
                                <p className="text-muted text-[15px] leading-relaxed font-medium max-w-[280px]">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-40 px-6">
                <div className="max-w-[1240px] mx-auto">
                    <div ref={addToRefs} className="reveal text-center mb-24">
                        <h2 className="text-5xl font-extrabold mb-6 tracking-tight">Scale Your <span className="purple-gradient-text">Voice</span></h2>
                        <p className="text-muted text-xl font-medium">Architect your growth with precision tools.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-10 max-w-[1100px] mx-auto">
                        {/* Starter */}
                        <div ref={addToRefs} className="reveal p-10 rounded-[2.5rem] border border-white/5 bg-secondary-bg/50 hover:bg-secondary-bg transition-all duration-500">
                            <h3 className="text-lg font-bold text-muted mb-2">Starter</h3>
                            <div className="text-5xl font-black mb-10">$0<span className="text-sm font-bold text-muted ml-2">/mo</span></div>
                            <ul className="space-y-4 mb-12 text-[15px] text-muted font-bold">
                                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> 1 Topic Monitor</li>
                                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> 5 AI Drafts / day</li>
                                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> Basic Analytics</li>
                            </ul>
                            <button className="w-full py-4 rounded-xl border border-white/10 hover:bg-white/5 transition-all font-bold text-sm">Join Free</button>
                        </div>
                        {/* Creator */}
                        <div ref={addToRefs} className="reveal p-10 rounded-[2.5rem] border-2 border-primary bg-black relative transform scale-105 shadow-[0_0_50px_rgba(129,74,200,0.15)]">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-5 py-1.5 rounded-full uppercase tracking-[0.2em]">Recommended</div>
                            <h3 className="text-lg font-bold text-primary-light mb-2">Creator</h3>
                            <div className="text-5xl font-black mb-10 text-white">$29<span className="text-sm font-bold text-muted ml-2">/mo</span></div>
                            <ul className="space-y-4 mb-12 text-[15px] text-gray-200 font-bold">
                                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> 10 Topic Monitors</li>
                                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> Unlimited AI Drafts</li>
                                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> Alpha Feed Predictor</li>
                                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> Browser Core Access</li>
                            </ul>
                            <button className="w-full py-4 rounded-xl bg-primary hover:bg-primary-light transition-all text-white font-bold text-sm shadow-[0_0_20px_rgba(129,74,200,0.3)]">Get Full Access</button>
                        </div>
                        {/* Agency */}
                        <div ref={addToRefs} className="reveal p-10 rounded-[2.5rem] border border-white/5 bg-secondary-bg/50 hover:bg-secondary-bg transition-all duration-500">
                            <h3 className="text-lg font-bold text-muted mb-2">Agency</h3>
                            <div className="text-5xl font-black mb-10">$99<span className="text-sm font-bold text-muted ml-2">/mo</span></div>
                            <ul className="space-y-4 mb-12 text-[15px] text-muted font-bold">
                                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> Unlimited monitors</li>
                                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> Team Workspaces</li>
                                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> Narrative API Access</li>
                                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> Dedicated Success</li>
                            </ul>
                            <button className="w-full py-4 rounded-xl border border-white/10 hover:bg-white/5 transition-all font-bold text-sm">Contact Sales</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 bg-black py-24">
                <div className="max-w-[1240px] mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-16 mb-20">
                        <div className="col-span-2 md:col-span-1">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-base">auto_awesome</span>
                                </div>
                                <span className="font-extrabold text-xl tracking-tight">NarrativeOS</span>
                            </div>
                            <p className="text-[15px] text-muted leading-relaxed font-medium">
                                Master your narrative.<br />
                                Dominate your audience.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-8 uppercase text-xs tracking-widest">Product</h4>
                            <ul className="space-y-4 text-[15px] text-muted font-medium">
                                <li><a className="hover:text-primary transition-all" href="#">Viral Feed</a></li>
                                <li><a className="hover:text-primary transition-all" href="#">Draft Studio</a></li>
                                <li><a className="hover:text-primary transition-all" href="#">Intelligence</a></li>
                                <li><a className="hover:text-primary transition-all" href="#">Extension</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-8 uppercase text-xs tracking-widest">Company</h4>
                            <ul className="space-y-4 text-[15px] text-muted font-medium">
                                <li><a className="hover:text-primary transition-all" href="#">About</a></li>
                                <li><a className="hover:text-primary transition-all" href="#">Changelog</a></li>
                                <li><a className="hover:text-primary transition-all" href="#">Careers</a></li>
                                <li><a className="hover:text-primary transition-all" href="#">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-8 uppercase text-xs tracking-widest">Social</h4>
                            <ul className="space-y-4 text-[15px] text-muted font-medium">
                                <li><a className="hover:text-primary transition-all" href="#">Twitter / X</a></li>
                                <li><a className="hover:text-primary transition-all" href="#">Discord</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-12 border-t border-white/5 flex flex-col md:row justify-between items-center gap-6">
                        <p className="text-xs text-muted font-bold tracking-widest uppercase">© 2026 NarrativeOS Inc. Built for the elite.</p>
                        <div className="flex gap-8">
                            <a className="text-muted hover:text-white transition-all duration-300" href="#">
                                <span className="sr-only">Twitter</span>
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
