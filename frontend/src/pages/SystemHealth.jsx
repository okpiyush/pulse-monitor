import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import {
    Cpu, Activity, HardDrive, Database, Server, Clock, ServerCrash,
    CheckCircle2, XCircle, RefreshCw, UploadCloud, DownloadCloud, Settings, Save, Mail, BellRing
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

const MetricCard = ({ title, value, unit, icon: Icon, description, max, trend = 'neutral' }) => {
    let colorClass = "text-primary bg-primary/10";
    let progressColor = "bg-primary";

    if (max && typeof value === 'number') {
        if (value > 85) { colorClass = "text-danger bg-danger/10"; progressColor = "bg-danger"; }
        else if (value > 70) { colorClass = "text-warning bg-warning/10"; progressColor = "bg-warning"; }
        else { colorClass = "text-success bg-success/10"; progressColor = "bg-success"; }
    } else if (trend === 'up') {
        colorClass = "text-purple-500 bg-purple-500/10";
        progressColor = "bg-purple-500";
    } else if (trend === 'down') {
        colorClass = "text-indigo-400 bg-indigo-500/10";
        progressColor = "bg-indigo-500";
    }

    return (
        <div className="card bg-slate-900/40 border-slate-800/50 hover:bg-slate-900/60 transition-all duration-300 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <h3 className="text-secondary text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-4xl font-black tracking-tight">{value}</span>
                        {unit && <span className="text-sm font-bold text-secondary uppercase tracking-widest">{unit}</span>}
                    </div>
                </div>
                <div className={`p-4 rounded-2xl ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            {max && typeof value === 'number' && (
                <div className="relative z-10">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-secondary mb-2">
                        <span>Utilization</span>
                        <span>{max ? `${max}${unit}` : ''}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${progressColor} transition-all duration-1000 ease-out`}
                            style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
                        />
                    </div>
                </div>
            )}
            {description && (
                <p className="text-xs text-secondary/60 mt-4 leading-relaxed font-medium">
                    {description}
                </p>
            )}
            <div className={`absolute -right-12 -bottom-12 w-32 h-32 rounded-full blur-[60px] opacity-10 transition-opacity duration-500 group-hover:opacity-20 ${progressColor}`}></div>
        </div>
    );
};

const DependencyNode = ({ name, status, type, customUrl }) => {
    const isHealthy = status === 'Healthy';

    return (
        <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${isHealthy ? 'bg-success/5 border-success/20' : 'bg-danger/5 border-danger/20'}`}>
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isHealthy ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger animate-pulse'}`}>
                    {type === 'db' ? <Database className="w-5 h-5" /> : <Server className="w-5 h-5" />}
                </div>
                <div className="overflow-hidden">
                    <h4 className="font-bold text-sm tracking-tight truncate pr-4">{name}</h4>
                    <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${isHealthy ? 'text-success/70' : 'text-danger/70'}`}>
                        {isHealthy ? 'Operational' : 'Critical Failure'}
                    </p>
                    {customUrl && (
                        <p className="text-[10px] text-secondary font-mono truncate mt-1 opacity-60">
                            {customUrl}
                        </p>
                    )}
                </div>
            </div>
            <div className="text-right flex-shrink-0">
                {isHealthy ? (
                    <CheckCircle2 className="w-6 h-6 text-success ml-auto" />
                ) : (
                    <XCircle className="w-6 h-6 text-danger ml-auto" />
                )}
            </div>
        </div>
    );
};

const SystemHealth = () => {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Config state
    const [configForm, setConfigForm] = useState({
        custom_postgres_url: '',
        custom_redis_url: '',
        alert_email: '',
        cpu_alert_threshold: 85,
        memory_alert_threshold: 85,
        disk_alert_threshold: 85,
    });
    const [saving, setSaving] = useState(false);
    const [configOpen, setConfigOpen] = useState(false);

    const fetchHealth = async (silent = false) => {
        try {
            if (!silent) setError(null);
            const res = await axios.get('/api/health/system/');
            setHealth(res.data);
            if (!silent) {
                setConfigForm({
                    custom_postgres_url: res.data.custom_postgres_url || '',
                    custom_redis_url: res.data.custom_redis_url || '',
                    alert_email: res.data.alert_email || '',
                    cpu_alert_threshold: res.data.cpu_alert_threshold || 85,
                    memory_alert_threshold: res.data.memory_alert_threshold || 85,
                    disk_alert_threshold: res.data.disk_alert_threshold || 85,
                });
            }
        } catch (err) {
            console.error(err);
            if (!silent) setError("Failed to fetch system telemetry");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleSaveConfig = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.post('/api/health/system/', configForm);
            await fetchHealth(true);
            setConfigOpen(false);
            alert("System Settings Updated Successfully.");
        } catch (err) {
            alert("Failed to update custom dependencies.");
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        // Poll aggressively on this page
        const interval = setInterval(() => fetchHealth(true), 5000);
        return () => clearInterval(interval);
    }, []);

    const chartData = useMemo(() => {
        if (!health || !health.history) return [];
        return health.history.map(pt => ({
            time: new Date(pt.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            cpu: pt.cpu,
            memory: pt.memory,
            disk: pt.disk
        }));
    }, [health]);

    if (loading && !health) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                <p className="font-bold text-secondary uppercase tracking-widest text-xs">Requesting Hardware Telemetry...</p>
            </div>
        );
    }

    if (error && !health) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <ServerCrash className="w-12 h-12 text-danger animate-bounce" />
                <h2 className="text-2xl font-black tracking-tight text-white mb-2">Engine Unreachable</h2>
                <p className="font-medium text-secondary text-sm">The backend API is not responding to health checks.</p>
                <button onClick={() => fetchHealth(false)} className="btn bg-slate-800 hover:bg-slate-700 mt-4 px-6">Retry Connection</button>
            </div>
        );
    }

    const netSent = formatBytes(health.net_sent);
    const netRecv = formatBytes(health.net_recv);

    return (
        <div className="animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
            <header className="flex justify-between items-end mb-10 pb-6 border-b border-white/5">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="text-primary w-6 h-6 animate-pulse" />
                        <h1 className="text-3xl md:text-4xl font-black tracking-tighter">Hardware Telemetry</h1>
                    </div>
                    <p className="text-secondary text-sm font-medium uppercase tracking-widest mt-2 max-w-xl">
                        Real-time kernel and dependency diagnostics layer
                    </p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black uppercase text-secondary tracking-widest mb-1">Status</p>
                    <div className="inline-flex items-center gap-2 bg-success/10 text-success px-3 py-1.5 rounded-lg border border-success/20">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                        <span className="font-bold text-xs">Observing</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
                <div className="lg:col-span-1">
                    <MetricCard
                        title="Compute (CPU)"
                        value={health.cpu}
                        unit="%"
                        icon={Cpu}
                        max={100}
                    />
                </div>
                <div className="lg:col-span-1">
                    <MetricCard
                        title="Physical RAM"
                        value={health.memory}
                        unit="%"
                        icon={Server}
                        max={100}
                    />
                </div>
                <div className="lg:col-span-1">
                    <MetricCard
                        title="Disk Vol"
                        value={health.disk}
                        unit="%"
                        icon={HardDrive}
                        max={100}
                    />
                </div>
                <div className="lg:col-span-1">
                    <MetricCard
                        title="Net Out"
                        value={netSent.val}
                        unit={netSent.unit}
                        icon={UploadCloud}
                        trend="up"
                    />
                </div>
                <div className="lg:col-span-1">
                    <MetricCard
                        title="Net In"
                        value={netRecv.val}
                        unit={netRecv.unit}
                        icon={DownloadCloud}
                        trend="down"
                    />
                </div>
            </div>

            {/* Historical Load Tracking */}
            <div className="card bg-slate-900/40 border-slate-800/50 mb-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight uppercase">System Resource Flow</h2>
                        <p className="text-secondary text-[10px] font-medium mt-1 uppercase tracking-widest opacity-60">
                            Last 20 Automated Sampling Points
                        </p>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-secondary">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-indigo-500"></div> CPU</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-purple-500"></div> RAM</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-500"></div> DISK</div>
                    </div>
                </div>
                <div className="h-[300px] w-full relative">
                    {chartData.length === 0 ? (
                        <div className="absolute inset-0 z-10 bg-slate-950/20 flex flex-col items-center justify-center rounded-2xl">
                            <Activity className="w-8 h-8 text-secondary/30 mb-2" />
                            <p className="text-xs uppercase font-black text-secondary/30 tracking-widest">Awaiting polling sequence...</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorDisk" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px' }}
                                    itemStyle={{ fontWeight: 'black', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="cpu" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={true} />
                                <Area type="monotone" dataKey="memory" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorMemory)" isAnimationActive={true} />
                                <Area type="monotone" dataKey="disk" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorDisk)" isAnimationActive={true} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Hardware Load Averages */}
                <div className="card bg-slate-900/40 border-slate-800/50 flex flex-col">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" /> OS Load Averages
                    </h3>
                    <div className="flex items-center justify-between gap-4 flex-1">
                        {[
                            { label: '1 Min', val: health.load[0] },
                            { label: '5 Min', val: health.load[1] },
                            { label: '15 Min', val: health.load[2] }
                        ].map((stat, i) => (
                            <div key={i} className="flex-1 bg-slate-950 rounded-xl p-6 text-center border border-slate-800/50 h-full flex flex-col justify-center">
                                <span className="block text-[10px] font-black text-secondary tracking-widest uppercase mb-3">
                                    {stat.label}
                                </span>
                                <span className={`text-3xl font-black tracking-tight ${stat.val > 2 ? 'text-warning' : 'text-white'}`}>
                                    {stat.val.toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
                        <DependencyNode
                            name={health.custom_postgres_url ? "Custom PostgreSQL Node" : "Default Database (SQLite)"}
                            status={health.db_status}
                            type="db"
                            customUrl={health.custom_postgres_url}
                        />
                        <DependencyNode
                            name={health.custom_redis_url ? "Dedicated Redis Cluster" : "Default Task Broker (Redis)"}
                            status={health.redis_status}
                            type="server"
                            customUrl={health.custom_redis_url}
                        />
                    </div>
                </div>

                {/* Subsystem Configuration */}
                <div className="card bg-slate-900/40 border-slate-800/50 flex flex-col relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <Settings className="w-4 h-4 text-primary" /> System Parameters
                        </h3>
                    </div>

                    <form onSubmit={handleSaveConfig} className="space-y-6 flex-1">
                        {/* Alerting Setup */}
                        <div className="space-y-6 bg-slate-950/50 p-6 rounded-xl border border-slate-800/50">
                            <h4 className="text-[10px] font-black uppercase text-secondary tracking-widest mb-2 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-primary" /> Incident Routing
                            </h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest">Alert Email Destination (SysAdmin)</label>
                                    <input
                                        type="email"
                                        placeholder="admin@synomics.in"
                                        value={configForm.alert_email}
                                        onChange={(e) => setConfigForm({ ...configForm, alert_email: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all"
                                    />
                                    <p className="text-[10px] text-secondary opacity-60">Emails will be dispatched if components breach threshold values.</p>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-secondary uppercase tracking-widest">CPU Spike (%)</label>
                                        <input
                                            type="number"
                                            value={configForm.cpu_alert_threshold}
                                            onChange={(e) => setConfigForm({ ...configForm, cpu_alert_threshold: parseInt(e.target.value) })}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary font-mono transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-secondary uppercase tracking-widest">RAM Spike (%)</label>
                                        <input
                                            type="number"
                                            value={configForm.memory_alert_threshold}
                                            onChange={(e) => setConfigForm({ ...configForm, memory_alert_threshold: parseInt(e.target.value) })}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary font-mono transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-secondary uppercase tracking-widest">Disk Spike (%)</label>
                                        <input
                                            type="number"
                                            value={configForm.disk_alert_threshold}
                                            onChange={(e) => setConfigForm({ ...configForm, disk_alert_threshold: parseInt(e.target.value) })}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary font-mono transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DB Configs */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-secondary tracking-widest border-t border-slate-800 pt-6">
                                External Dependency Polling
                            </h4>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest">Custom PostgreSQL Node</label>
                                <input
                                    type="text"
                                    placeholder="postgres://user:pass@host:5432/db"
                                    value={configForm.custom_postgres_url}
                                    onChange={(e) => setConfigForm({ ...configForm, custom_postgres_url: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary font-mono transition-all"
                                />
                                <p className="text-[10px] text-secondary opacity-60">Leave blank to use default SQLite database.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest">Custom Redis Broker</label>
                                <input
                                    type="text"
                                    placeholder="redis://host:6379/1"
                                    value={configForm.custom_redis_url}
                                    onChange={(e) => setConfigForm({ ...configForm, custom_redis_url: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary font-mono transition-all"
                                />
                                <p className="text-[10px] text-secondary opacity-60">Leave blank to use default Celery Broker.</p>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button disabled={saving} type="submit" className="btn btn-primary px-8 py-3 flex items-center gap-2 font-black uppercase tracking-widest text-xs">
                                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Deploy Policy
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SystemHealth;
