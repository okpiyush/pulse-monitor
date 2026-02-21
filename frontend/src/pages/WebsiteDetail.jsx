import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    ArrowLeft, Globe, Clock, ShieldCheck, AlertCircle,
    Settings, ExternalLink, RefreshCw, Trash2, Calendar
} from 'lucide-react';

const StatCard = ({ label, value, subtext, icon: Icon, colorClass }) => (
    <div className="group relative overflow-hidden card bg-slate-900/40 border-slate-800/50 hover:border-slate-700 transition-all duration-300">
        <div className={`absolute -right-6 -top-6 w-20 h-20 rounded-full blur-[40px] opacity-10 ${colorClass.split(' ')[1]}`}></div>
        <div className="relative z-10 flex justify-between items-start">
            <div>
                <p className="text-secondary text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-60">{label}</p>
                <h3 className="text-3xl font-black tracking-tight">{value}</h3>
                {subtext && <p className="text-secondary text-xs mt-2 font-medium">{subtext}</p>}
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

    const fetchDetail = async () => {
        try {
            const res = await axios.get(`/api/websites/${id}/`);
            setWebsite(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
        const interval = setInterval(fetchDetail, 20000);
        return () => clearInterval(interval);
    }, [id]);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this monitor?')) return;
        try {
            await axios.delete(`/api/websites/${id}/`);
            navigate('/dashboard');
        } catch (err) {
            alert('Delete failed');
        }
    };

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <p className="font-bold text-secondary">Aggregating log streams...</p>
        </div>
    );

    if (!website) return <div className="p-10 text-center">Website not found</div>;

    const isUp = website.current_status === 'up';
    const chartData = website.recent_logs.slice().reverse().map(log => ({
        time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ms: Math.round(log.response_time * 1000),
        status: log.status_code
    }));

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
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
                <div className="flex gap-3">
                    <button onClick={fetchDetail} className="btn btn-outline flex items-center gap-2 h-12 px-6">
                        <RefreshCw className="w-4 h-4" /> <span>Sync</span>
                    </button>
                    <button onClick={handleDelete} className="btn bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 flex items-center gap-2 h-12 px-6">
                        <Trash2 className="w-4 h-4" /> <span>Destroy</span>
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Current Status"
                    value={isUp ? "Online" : "Offline"}
                    subtext={website.last_check_time ? `Last check: ${new Date(website.last_check_time).toLocaleTimeString()}` : "No checks yet"}
                    icon={isUp ? ShieldCheck : AlertCircle}
                    colorClass={isUp ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}
                />
                <StatCard
                    label="Uptime"
                    value={`${website.uptime_percentage}%`}
                    subtext="Last 30 days"
                    icon={Globe}
                    colorClass="bg-primary/10 text-primary"
                />
                <StatCard
                    label="Latency"
                    value={`${chartData.length > 0 ? chartData[chartData.length - 1].ms : 0}ms`}
                    subtext="Latest measurement"
                    icon={Clock}
                    colorClass="bg-warning/10 text-warning"
                />
                <StatCard
                    label="Schedule"
                    value={`${website.check_interval}m`}
                    subtext="Check frequency"
                    icon={Settings}
                    colorClass="bg-secondary/10 text-secondary"
                />
            </div>

            {/* Performance Chart */}
            <div className="card bg-slate-900/40 border-slate-800/50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Response Latency</h2>
                        <p className="text-secondary text-sm font-medium mt-1">Millisecond-level timing for your recent monitoring cycles</p>
                    </div>
                    <div className="flex gap-2 p-1.5 bg-slate-950/60 rounded-xl border border-slate-800/50">
                        <button className="px-4 py-1.5 rounded-lg text-xs font-black bg-primary text-white shadow-lg shadow-primary/20">LIVE</button>
                        <button className="px-4 py-1.5 rounded-lg text-xs font-black text-secondary hover:text-white transition-colors">24H</button>
                    </div>
                </div>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorMs" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
                            />
                            <YAxis
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v) => `${v}ms`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '12px' }}
                                itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                                cursor={{ stroke: '#334155', strokeWidth: 2 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="ms"
                                stroke="#6366f1"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorMs)"
                                animationDuration={2000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Logs Table */}
            <div className="card bg-slate-900/40 border-slate-800/50">
                <div className="flex items-center gap-3 mb-8">
                    <Calendar className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-black tracking-tight">Execution History</h2>
                </div>
                <div className="overflow-x-auto -mx-6">
                    <table className="w-full text-left min-w-[600px]">
                        <thead>
                            <tr className="border-b border-white/5 bg-slate-950/30">
                                <th className="px-6 py-4 text-xs font-black text-secondary uppercase tracking-[0.2em]">Timestamp</th>
                                <th className="px-6 py-4 text-xs font-black text-secondary uppercase tracking-[0.2em]">Result</th>
                                <th className="px-6 py-4 text-xs font-black text-secondary uppercase tracking-[0.2em] text-center">Protocol Status</th>
                                <th className="px-6 py-4 text-xs font-black text-secondary uppercase tracking-[0.2em] text-right">Timing</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {website.recent_logs.map(log => (
                                <tr key={log.id} className="hover:bg-primary/5 transition-colors group">
                                    <td className="px-6 py-5 text-sm font-bold text-slate-300">
                                        {new Date(log.timestamp).toLocaleDateString()} <span className="text-slate-500 font-medium ml-2">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className={`inline-flex items-center gap-2.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${log.is_success ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${log.is_success ? 'bg-success animate-pulse' : 'bg-danger'}`}></div>
                                            {log.is_success ? 'Optimal' : 'Disturbed'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className="bg-slate-950 text-slate-400 px-3 py-1 rounded-lg text-xs font-mono font-bold border border-slate-800">
                                            {log.status_code || 'ERROR'}
                                        </span>
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
        </div>
    );
};

export default WebsiteDetail;
