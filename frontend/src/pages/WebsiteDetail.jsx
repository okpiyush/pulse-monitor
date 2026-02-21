import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    ArrowLeft, Globe, Clock, ShieldCheck, AlertCircle,
    Settings, ExternalLink, RefreshCw, Trash2, Calendar,
    Activity, Zap, Database, AlertTriangle, ShieldAlert,
    Save, Mail, BellRing
} from 'lucide-react';

const StatCard = ({ label, value, subtext, icon: Icon, colorClass, highlight }) => (
    <div className={`group relative overflow-hidden card bg-slate-900/40 border-slate-800/50 hover:border-slate-700 transition-all duration-300 ${highlight ? 'ring-1 ring-primary/50 shadow-lg shadow-primary/5' : ''}`}>
        <div className={`absolute -right-6 -top-6 w-20 h-20 rounded-full blur-[40px] opacity-10 ${colorClass.split(' ')[1]}`}></div>
        <div className="relative z-10 flex justify-between items-start">
            <div>
                <p className="text-secondary text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-60">{label}</p>
                <div className="flex items-baseline gap-1">
                    <h3 className="text-3xl font-black tracking-tight">{value}</h3>
                </div>
                {subtext && <p className="text-secondary text-[10px] mt-2 font-medium tracking-tight uppercase opacity-80">{subtext}</p>}
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                <Icon className="w-5 h-5" />
            </div>
        </div>
    </div>
);

const WebsiteDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [website, setWebsite] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('live'); // 'live' or '24h'
    const [historyLogs, setHistoryLogs] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('pulse'); // 'pulse' or 'config'

    // Config form state
    const [config, setConfig] = useState(null);
    const [saving, setSaving] = useState(false);

    const fetchDetail = useCallback(async () => {
        try {
            const res = await axios.get(`/api/websites/${id}/`);
            setWebsite(res.data);
            if (!config) setConfig(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id, config]);

    const fetchHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const res = await axios.get(`/api/websites/${id}/history/`, { params: { hours: 24 } });
            setHistoryLogs(res.data);
        } catch (err) {
            console.error("History fetch failed:", err);
        } finally {
            setHistoryLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDetail();
        const interval = setInterval(fetchDetail, 20000);
        return () => clearInterval(interval);
    }, [fetchDetail]);

    useEffect(() => {
        if (timeRange === '24h') {
            fetchHistory();
        }
    }, [timeRange, fetchHistory]);

    const handleSaveConfig = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await axios.patch(`/api/websites/${id}/`, config);
            setWebsite(res.data);
            alert('Infrastructure configuration updated successfully.');
        } catch (err) {
            alert('Failed to update configuration.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this monitor?')) return;
        try {
            await axios.delete(`/api/websites/${id}/`);
            navigate('/dashboard');
        } catch (err) {
            alert('Delete failed');
        }
    };

    const activeLogs = useMemo(() => {
        if (!website) return [];
        return timeRange === 'live' ? website.recent_logs : historyLogs;
    }, [timeRange, website, historyLogs]);

    const chartData = useMemo(() => {
        if (!activeLogs) return [];
        return activeLogs.slice().reverse().map(log => ({
            time: new Date(log.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                ...(timeRange === '24h' ? { day: 'numeric', month: 'short' } : {})
            }),
            ms: Math.round(log.response_time * 1000),
            ttfb: log.ttfb ? Math.round(log.ttfb * 1000) : 0,
            status: log.status_code
        }));
    }, [activeLogs, timeRange]);

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <p className="font-bold text-secondary tracking-widest uppercase text-xs">Synchronizing telemetry streams...</p>
        </div>
    );

    if (!website) return <div className="p-10 text-center uppercase font-black text-secondary">Node offline or unreachable</div>;

    const isUp = website.current_status === 'up';
    const hasIncident = website.active_incident !== null;

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 animate-in fade-in duration-500 pb-20">
            {/* Critical Alert Banner */}
            {hasIncident && (
                <div className="bg-danger/10 border border-danger/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-danger/5 animate-pulse">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-danger/20 rounded-2xl flex items-center justify-center animate-bounce">
                            <ShieldAlert className="w-8 h-8 text-danger" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-danger uppercase tracking-tighter">Active Incident Detected</h2>
                            <p className="text-danger/70 font-medium text-sm mt-0.5">
                                Current check frequency escalated to <span className="font-bold underline">{website.failure_poll_interval}s</span> to pinpoint MTTR.
                            </p>
                        </div>
                    </div>
                    <div className="px-5 py-2.5 bg-danger text-white font-black text-xs rounded-xl uppercase tracking-widest">
                        CRITICAL ERROR: {website.active_incident.reason || "No response from endpoint"}
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-1">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 hover:border-primary transition-all group"
                    >
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl md:text-4xl font-black tracking-tighter">{website.name}</h1>
                            <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isUp ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                                {website.current_status}
                            </div>
                        </div>
                        <a href={website.url} target="_blank" rel="noreferrer" className="text-secondary text-sm font-medium flex items-center gap-1.5 mt-1 hover:text-primary transition-colors">
                            {website.url} <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>

                <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
                    <button
                        onClick={() => setActiveTab('pulse')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'pulse' ? 'bg-primary text-white shadow-lg' : 'text-secondary hover:text-white'}`}
                    >
                        <Zap className="w-4 h-4" /> Pulse
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'config' ? 'bg-primary text-white shadow-lg' : 'text-secondary hover:text-white'}`}
                    >
                        <Settings className="w-4 h-4" /> Config
                    </button>
                </div>
            </header>

            {activeTab === 'pulse' ? (
                <>
                    {/* Performance Metrics Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            label="Uptime Integrity"
                            value={`${website.uptime_percentage}%`}
                            subtext="Availability Rating (30d)"
                            icon={ShieldCheck}
                            colorClass="bg-success/10 text-success"
                            highlight={website.uptime_percentage === 100}
                        />
                        <StatCard
                            label="Avg. Latency"
                            value={`${website.performance_metrics?.avg || 0}ms`}
                            subtext="Aggregated Mean"
                            icon={Zap}
                            colorClass="bg-primary/10 text-primary"
                        />
                        <StatCard
                            label="P95 Tail"
                            value={`${website.performance_metrics?.p95 || 0}ms`}
                            subtext="95th Percentile"
                            icon={Activity}
                            colorClass="bg-warning/10 text-warning"
                        />
                        <StatCard
                            label="P99 Tail"
                            value={`${website.performance_metrics?.p99 || 0}ms`}
                            subtext="Critical Outliers"
                            icon={AlertCircle}
                            colorClass="bg-danger/10 text-danger"
                        />
                    </div>

                    {/* Response Diagnostics Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            label="TTFB"
                            value={`${activeLogs[0]?.ttfb ? Math.round(activeLogs[0].ttfb * 1000) : 0}ms`}
                            subtext="Time to First Byte"
                            icon={Clock}
                            colorClass="bg-indigo-500/10 text-indigo-400"
                        />
                        <StatCard
                            label="Payload"
                            value={`${activeLogs[0]?.payload_size ? (activeLogs[0].payload_size / 1024).toFixed(1) : 0}kb`}
                            subtext="Data Throughput"
                            icon={Database}
                            colorClass="bg-purple-500/10 text-purple-400"
                        />
                        <StatCard
                            label="Resolution"
                            value={`${website.check_interval}m`}
                            subtext="Standard Schedule"
                            icon={Settings}
                            colorClass="bg-slate-500/10 text-slate-400"
                        />
                        <StatCard
                            label="Incidents"
                            value={hasIncident ? "1 Active" : "Clear"}
                            subtext="Current Health State"
                            icon={AlertTriangle}
                            colorClass={hasIncident ? "bg-danger/10 text-danger" : "bg-blue-500/10 text-blue-400"}
                        />
                    </div>

                    {/* Performance Chart */}
                    <div className="card bg-slate-900/40 border-slate-800/50">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight uppercase">
                                    {timeRange === 'live' ? 'Dynamic Latency Track' : 'Global History Pulse'}
                                </h2>
                                <p className="text-secondary text-xs font-medium mt-1 uppercase tracking-widest opacity-60">
                                    {timeRange === 'live' ? 'Live Infrastructure Telemetry' : '24H Historical Performance Aggregation'}
                                </p>
                            </div>
                            <div className="flex gap-2 p-1.5 bg-slate-950/60 rounded-xl border border-slate-800/50 relative z-20">
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); setTimeRange('live'); }}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${timeRange === 'live' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-secondary hover:text-white'}`}
                                >
                                    LIVE
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); setTimeRange('24h'); }}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${timeRange === '24h' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-secondary hover:text-white'}`}
                                >
                                    24H
                                </button>
                            </div>
                        </div>

                        <div className="h-[400px] w-full relative">
                            {historyLoading && (
                                <div className="absolute inset-0 z-10 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                                    <Activity className="w-10 h-10 text-primary animate-spin" />
                                </div>
                            )}
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} key={timeRange}>
                                    <defs>
                                        <linearGradient id="colorMs" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorTtfb" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="4 4" stroke="#1e293b" vertical={false} />
                                    <XAxis
                                        dataKey="time"
                                        stroke="#64748b"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                        interval={timeRange === '24h' ? Math.max(0, Math.floor(chartData.length / 8)) : 0}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) => `${v}ms`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '16px', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)' }}
                                        itemStyle={{ fontWeight: 'black', fontSize: '12px' }}
                                        cursor={{ stroke: '#334155', strokeWidth: 2 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="ms"
                                        name="Total Response"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorMs)"
                                        isAnimationActive={true}
                                        animationDuration={1000}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="ttfb"
                                        name="Network TTFB"
                                        stroke="#818cf8"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        fillOpacity={1}
                                        fill="url(#colorTtfb)"
                                        isAnimationActive={true}
                                        animationDuration={1200}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Log Stream Section */}
                    <div className="card bg-slate-900/40 border-slate-800/50">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-6 h-6 text-primary" />
                                <h2 className="text-2xl font-black tracking-tight uppercase">Infrastructure Telemetry</h2>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black uppercase text-secondary bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                                    {activeLogs.length} Sampling Cycles
                                </span>
                            </div>
                        </div>
                        <div className="overflow-x-auto -mx-6">
                            <table className="w-full text-left min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-white/5 bg-slate-950/30">
                                        <th className="px-6 py-4 text-xs font-black text-secondary uppercase tracking-[0.2em]">Timestamp</th>
                                        <th className="px-6 py-4 text-xs font-black text-secondary uppercase tracking-[0.2em]">Status</th>
                                        <th className="px-6 py-4 text-xs font-black text-secondary uppercase tracking-[0.2em]">Pkt Size</th>
                                        <th className="px-6 py-4 text-xs font-black text-secondary uppercase tracking-[0.2em] text-center">TTFB</th>
                                        <th className="px-6 py-4 text-xs font-black text-secondary uppercase tracking-[0.2em] text-right">Latency</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {activeLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-primary/5 transition-colors group">
                                            <td className="px-6 py-5 text-sm font-bold text-slate-300">
                                                {new Date(log.timestamp).toLocaleDateString()} <span className="text-slate-500 font-medium ml-2">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className={`inline-flex items-center gap-2.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${log.is_success ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${log.is_success ? 'bg-success animate-pulse' : 'bg-danger'}`}></div>
                                                    {log.is_success ? (log.status_code || '200') : (log.status_code || 'ERROR')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-sm font-bold text-slate-400">
                                                {log.payload_size ? (log.payload_size / 1024).toFixed(1) : '0'} <span className="text-[10px] opacity-50 ml-1">KB</span>
                                            </td>
                                            <td className="px-6 py-5 text-center font-mono text-xs font-bold text-indigo-400">
                                                {log.ttfb ? `${Math.round(log.ttfb * 1000)}ms` : '---'}
                                            </td>
                                            <td className="px-6 py-5 text-right flex items-center justify-end gap-2">
                                                <span className="font-mono text-sm font-black text-slate-200">
                                                    {Math.round(log.response_time * 1000)}
                                                </span>
                                                <span className="text-xs font-bold text-secondary">ms</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="lg:col-span-2 space-y-6">
                        <form onSubmit={handleSaveConfig} className="card bg-slate-900/40 border-slate-800/50 space-y-8">
                            <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                                <Settings className="w-6 h-6 text-primary" />
                                <h2 className="text-xl font-black uppercase tracking-tight">Observer Orchestration</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="block text-xs font-black text-secondary uppercase tracking-widest">Polling Frequency</label>
                                    <div className="relative group">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary group-focus-within:text-primary transition-colors" />
                                        <select
                                            value={config.check_interval}
                                            onChange={(e) => setConfig({ ...config, check_interval: parseInt(e.target.value) })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:border-primary appearance-none transition-all"
                                        >
                                            <option value={1}>1 Minute (Real-time)</option>
                                            <option value={5}>5 Minutes (Standard)</option>
                                            <option value={15}>15 Minutes (Low traffic)</option>
                                            <option value={60}>1 Hour (Infrequent)</option>
                                        </select>
                                    </div>
                                    <p className="text-[10px] text-secondary font-medium px-2">Determines the "standard" pulse frequency when the node is operational.</p>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-xs font-black text-secondary uppercase tracking-widest">Incident Alert Recipient</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="email"
                                            value={config.alert_email || ''}
                                            onChange={(e) => setConfig({ ...config, alert_email: e.target.value })}
                                            placeholder="engineering@synomics.in"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:border-primary transition-all"
                                        />
                                    </div>
                                    <p className="text-[10px] text-secondary font-medium px-2">Primary escalation address for critical failure notifications.</p>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-xs font-black text-secondary uppercase tracking-widest">Fail-State Polling (Seconds)</label>
                                    <div className="relative group">
                                        <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="number"
                                            value={config.failure_poll_interval}
                                            onChange={(e) => setConfig({ ...config, failure_poll_interval: parseInt(e.target.value) })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:border-primary transition-all"
                                        />
                                    </div>
                                    <p className="text-[10px] text-secondary font-medium px-2">How fast to pulse when the site is down to detect recovery instantly.</p>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-xs font-black text-secondary uppercase tracking-widest">Escalation Threshold</label>
                                    <div className="relative group">
                                        <BellRing className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="number"
                                            value={config.alert_threshold}
                                            onChange={(e) => setConfig({ ...config, alert_threshold: parseInt(e.target.value) })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:border-primary transition-all"
                                        />
                                    </div>
                                    <p className="text-[10px] text-secondary font-medium px-2">Number of failed pulses required before firing the "Big Alert" email.</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-4 pt-6 mt-6 border-t border-white/5">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn btn-primary px-10 py-4 font-black flex items-center gap-3 shadow-2xl shadow-primary/30"
                                >
                                    {saving ? <RefreshCw className="animate-spin" /> : <Save className="w-5 h-5" />}
                                    Deploy Configuration
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="space-y-6">
                        <div className="card bg-danger/5 border-danger/20 p-8">
                            <h3 className="text-lg font-black text-danger uppercase mb-4">Danger Zone</h3>
                            <p className="text-secondary text-sm mb-6 leading-relaxed font-medium">
                                Terminating this node will permanently erase all historical telemetry and pulse data. This action cannot be undone.
                            </p>
                            <button
                                onClick={handleDelete}
                                className="w-full py-4 rounded-xl border border-danger/30 text-danger font-black uppercase text-xs hover:bg-danger hover:text-white transition-all shadow-lg hover:shadow-danger/20"
                            >
                                Terminate Node
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WebsiteDetail;
