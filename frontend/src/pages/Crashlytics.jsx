import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    AlertTriangle, ServerCrash, Clock, FileWarning, Cpu, HardDrive, Server,
    ArrowRight, Activity, CalendarDays, RefreshCw, CheckCircle2
} from 'lucide-react';

const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return { val: 0, unit: 'B' };
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return {
        val: parseFloat((bytes / Math.pow(k, i)).toFixed(2)),
        unit: sizes[i]
    };
};

const Crashlytics = () => {
    const [snapshots, setSnapshots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSnapshot, setSelectedSnapshot] = useState(null);

    const fetchSnapshots = async () => {
        try {
            setError(null);
            const res = await axios.get('/api/snapshots/');
            setSnapshots(res.data);
            if (res.data.length > 0 && !selectedSnapshot) {
                setSelectedSnapshot(res.data[0]);
            }
        } catch (err) {
            console.error("Failed to fetch snapshots", err);
            setError("Failed to fetch Crashlytics data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSnapshots();
        // Refresh every 30s
        const interval = setInterval(fetchSnapshots, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading && snapshots.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <RefreshCw className="w-8 h-8 text-danger animate-spin" />
                <p className="font-bold text-secondary uppercase tracking-widest text-xs">Loading Crashlytics Engine...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
            <header className="flex justify-between items-end mb-10 pb-6 border-b border-danger/20">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <ServerCrash className="text-danger w-8 h-8" />
                        <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">Crashlytics Diagnostics</h1>
                    </div>
                    <p className="text-danger/60 text-sm font-bold uppercase tracking-widest mt-2">
                        Hardware state snapshots triggered during system failure or excessive load
                    </p>
                </div>
            </header>

            {snapshots.length === 0 && !error ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
                    <CheckCircle2 className="w-16 h-16 text-success/50 mx-auto mb-4" />
                    <h2 className="text-xl font-black tracking-tight mb-2">No Crash Signatures Detected</h2>
                    <p className="text-secondary/60 text-sm">System has remained stable without triggering emergency snapshots.</p>
                </div>
            ) : null}

            {snapshots.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Timestamp List */}
                    <div className="lg:col-span-1 space-y-4">
                        <h3 className="text-[10px] font-black uppercase text-secondary tracking-widest px-2">Incident Timeline</h3>
                        <div className="space-y-3 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {snapshots.map(snap => (
                                <button
                                    key={snap.id}
                                    onClick={() => setSelectedSnapshot(snap)}
                                    className={`w - full text - left p - 4 rounded - xl border transition - all duration - 200 ${selectedSnapshot?.id === snap.id ? 'bg-danger/10 border-danger shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'bg-slate-900/40 border-slate-800 hover:border-danger/50 hover:bg-slate-900/60'} `}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className={`p - 2 rounded - lg ${selectedSnapshot?.id === snap.id ? 'bg-danger/20 text-danger' : 'bg-slate-800 text-secondary'} `}>
                                            <FileWarning className="w-4 h-4" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-secondary/60 tracking-widest flex items-center gap-1">
                                            <CalendarDays className="w-3 h-3" />
                                            {new Date(snap.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-sm text-white mb-1 truncate">{snap.title}</h4>
                                    <p className="text-xs text-secondary/70 truncate">{snap.website_name ? `Service: ${snap.website_name} ` : 'Core Kernel Incident'}</p>
                                    <div className="mt-3 flex items-center justify-between text-[10px] uppercase font-black tracking-widest w-full">
                                        <span className="text-secondary">
                                            {new Date(snap.timestamp).toLocaleTimeString()}
                                        </span>
                                        <ArrowRight className={`w - 3 h - 3 ${selectedSnapshot?.id === snap.id ? 'text-danger' : 'text-slate-700'} `} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Snapshot Inspector */}
                    {selectedSnapshot && (
                        <div className="lg:col-span-2">
                            <div className="card bg-slate-900/40 border-danger/30 h-full relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-danger/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                                <div className="mb-8 border-b border-slate-800 pb-6 relative z-10">
                                    <div className="inline-flex items-center gap-2 bg-danger/10 text-danger px-3 py-1 rounded-full border border-danger/20 mb-4">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Snapshot Captured</span>
                                    </div>
                                    <h2 className="text-2xl font-black text-white mb-2">{selectedSnapshot.title}</h2>
                                    <p className="text-secondary/80 text-sm leading-relaxed whitespace-pre-wrap font-mono bg-slate-950 p-4 rounded-lg border border-slate-800">
                                        {selectedSnapshot.reason}
                                    </p>
                                </div>

                                <h3 className="text-[10px] font-black uppercase text-secondary tracking-widest mb-4">Host Telemetry at Time of Failure</h3>

                                <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
                                    {/* CPU */}
                                    <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 flex flex-col items-center text-center justify-center">
                                        <Cpu className={`w - 6 h - 6 mb - 3 ${selectedSnapshot.cpu > 80 ? 'text-danger' : 'text-primary'} `} />
                                        <span className="text-3xl font-black">{selectedSnapshot.cpu}%</span>
                                        <span className="text-[10px] uppercase font-black text-secondary tracking-widest mt-1">CPU Load</span>
                                    </div>
                                    {/* RAM */}
                                    <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 flex flex-col items-center text-center justify-center">
                                        <Server className={`w - 6 h - 6 mb - 3 ${selectedSnapshot.memory > 80 ? 'text-danger' : 'text-purple-500'} `} />
                                        <span className="text-3xl font-black">{selectedSnapshot.memory}%</span>
                                        <span className="text-[10px] uppercase font-black text-secondary tracking-widest mt-1">Physical RAM</span>
                                    </div>
                                    {/* Disk */}
                                    <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 flex flex-col items-center text-center justify-center">
                                        <HardDrive className={`w - 6 h - 6 mb - 3 ${selectedSnapshot.disk > 80 ? 'text-warning' : 'text-emerald-500'} `} />
                                        <span className="text-3xl font-black">{selectedSnapshot.disk}%</span>
                                        <span className="text-[10px] uppercase font-black text-secondary tracking-widest mt-1">Volume</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 relative z-10">
                                    <div className="bg-slate-950 rounded-xl p-5 border border-slate-800/50">
                                        <div className="flex items-center gap-2 mb-4 text-xs font-black uppercase tracking-widest text-secondary">
                                            <Clock className="w-4 h-4 text-primary" /> OS Load Average
                                        </div>
                                        <div className="flex justify-between text-center">
                                            <div>
                                                <div className="text-xl font-bold">{selectedSnapshot.load_1.toFixed(2)}</div>
                                                <div className="text-[9px] uppercase tracking-widest text-secondary/60 mt-1">1 Min</div>
                                            </div>
                                            <div>
                                                <div className="text-xl font-bold">{selectedSnapshot.load_5.toFixed(2)}</div>
                                                <div className="text-[9px] uppercase tracking-widest text-secondary/60 mt-1">5 Min</div>
                                            </div>
                                            <div>
                                                <div className="text-xl font-bold">{selectedSnapshot.load_15.toFixed(2)}</div>
                                                <div className="text-[9px] uppercase tracking-widest text-secondary/60 mt-1">15 Min</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-950 rounded-xl p-5 border border-slate-800/50">
                                        <div className="flex items-center gap-2 mb-4 text-xs font-black uppercase tracking-widest text-secondary">
                                            <Activity className="w-4 h-4 text-purple-500" /> Network Flow
                                        </div>
                                        <div className="flex justify-between items-center text-center">
                                            <div>
                                                <div className="text-lg font-bold text-indigo-400">
                                                    {formatBytes(selectedSnapshot.net_sent).val} {formatBytes(selectedSnapshot.net_sent).unit}
                                                </div>
                                                <div className="text-[9px] uppercase tracking-widest text-secondary/60 mt-1">Outbound</div>
                                            </div>
                                            <div className="h-4 w-px bg-slate-800"></div>
                                            <div>
                                                <div className="text-lg font-bold text-cyan-400">
                                                    {formatBytes(selectedSnapshot.net_recv).val} {formatBytes(selectedSnapshot.net_recv).unit}
                                                </div>
                                                <div className="text-[9px] uppercase tracking-widest text-secondary/60 mt-1">Inbound</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {selectedSnapshot.response_time && (
                                    <div className="mt-4 bg-danger/5 border border-danger/20 rounded-xl p-4 flex items-center justify-between">
                                        <div className="text-xs font-black uppercase text-danger tracking-widest">Recorded Latency Threshold Breach</div>
                                        <div className="font-mono font-bold text-danger text-lg">{selectedSnapshot.response_time.toFixed(3)}s TTL</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Crashlytics;
