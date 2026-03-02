"use client";

import React from 'react';
import AdminAPIKeysPanel from '@/app/components/AdminAPIKeysPanel';

export default function AdminDashboard() {
    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center bg-[#0A0A0B] p-6 rounded-2xl border border-white/5">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">terminal</span>
                            System Control Center
                        </h1>
                        <p className="text-sm text-muted">Global infrastructure health and AI consumption metrics.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="px-4 py-2.5 bg-red-500/10 text-red-400 text-xs font-bold rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-all duration-300">Emergency Kill-Switch</button>
                        <button className="px-4 py-2.5 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(129,74,200,0.2)]">Restart Scrapers</button>
                    </div>
                </div>

                {/* Global Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <AdminStatCard label="Total Users" value="10,245" sub="124 new today" />
                    <AdminStatCard label="Active Proxies" value="482/500" sub="Healthy" />
                    <AdminStatCard label="AI Token Usage" value="1.2M" sub="72% of daily limit" />
                    <AdminStatCard label="Scraper Latency" value="450ms" sub="Within SLA" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Logs Area */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass-panel p-6 rounded-2xl border border-white/5">
                            <h3 className="text-sm font-black uppercase tracking-[0.15em] mb-6 flex items-center gap-2 text-muted">
                                <span className="material-symbols-outlined text-sm">list_alt</span>
                                Real-time Scraper Logs
                            </h3>
                            <div className="font-mono text-[10px] space-y-2 max-h-[400px] overflow-y-auto bg-black/60 p-4 rounded-xl border border-white/5 custom-scrollbar">
                                <LogEntry time="16:05:12" level="INFO" msg="Successfully crawled 24 posts from topic: AI Trends" />
                                <LogEntry time="16:05:08" level="WARN" msg="Proxy [192.168.1.55] timed out. Rotating to next pool..." />
                                <LogEntry time="16:04:55" level="INFO" msg="AI Generation: Hook created for user @cuongvu69" />
                                <LogEntry time="16:04:30" level="ERROR" msg="X Scraper: DOM structure changed. Selector #main_nav failed." />
                                <LogEntry time="16:04:22" level="INFO" msg="Database: Narrative shift analysis completed for 'Solana'" />
                                <LogEntry time="16:04:10" level="DEBUG" msg="Connection pool refreshed (24 active connections)" />
                            </div>
                        </div>
                    </div>

                    {/* User Management Overview */}
                    <div className="space-y-6">
                        <div className="glass-panel p-6 rounded-2xl border border-white/5">
                            <h3 className="text-sm font-black uppercase tracking-[0.15em] mb-6 text-muted">Revenue Metrics</h3>
                            <div className="space-y-4">
                                <RevenueItem label="MRR" value="$42,500" change="+15%" />
                                <RevenueItem label="Churn Rate" value="2.4%" change="-0.2%" />
                                <RevenueItem label="Avg Order Value" value="$49" change="+2%" />
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 space-y-4">
                            <h3 className="text-sm font-bold">Maintenance Mode</h3>
                            <p className="text-[10px] text-muted leading-relaxed">Schedule a global maintenance window to update AI persona weights.</p>
                            <button className="w-full py-2.5 bg-primary/10 text-primary border border-primary/30 rounded-xl text-xs font-bold hover:bg-primary/20 transition-all duration-300">Set Schedule</button>
                        </div>
                    </div>
                </div>

                {/* API Keys Management */}
                <AdminAPIKeysPanel />
            </div>
        </div>
    );
}

function AdminStatCard({ label, value, sub }: any) {
    return (
        <div className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-primary/30 transition-all duration-300">
            <p className="text-[10px] text-muted font-black uppercase mb-2 tracking-[0.15em]">{label}</p>
            <p className="text-2xl font-black mb-1">{value}</p>
            <p className="text-[10px] text-green-400 font-bold">{sub}</p>
        </div>
    );
}

function LogEntry({ time, level, msg }: any) {
    const levelColors: any = {
        INFO: 'text-primary',
        WARN: 'text-yellow-400',
        ERROR: 'text-red-400',
        DEBUG: 'text-muted/50',
    };
    return (
        <div className="flex gap-3">
            <span className="text-white/20">[{time}]</span>
            <span className={`font-black ${levelColors[level]}`}>{level}</span>
            <span className="text-gray-300">{msg}</span>
        </div>
    );
}

function RevenueItem({ label, value, change }: any) {
    return (
        <div className="flex justify-between items-end border-b border-white/5 pb-2">
            <div>
                <p className="text-[10px] text-muted uppercase font-black tracking-wider">{label}</p>
                <p className="text-lg font-black">{value}</p>
            </div>
            <p className={`text-[10px] font-black ${change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{change}</p>
        </div>
    );
}
