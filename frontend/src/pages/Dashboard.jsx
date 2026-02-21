import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Globe, Plus, Activity, ExternalLink } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import AddMonitorModal from '../components/AddMonitorModal';

const WebsiteCard = ({ website }) => {
    const isUp = website.current_status === 'up';
    const navigate = useNavigate();

    // Data for the sparkline chart
    const chartData = website.recent_logs.slice().reverse().map(l => ({
        time: new Date(l.timestamp).getTime(),
        val: Math.round(l.response_time * 1000)
    }));

    return (
        <div
            onClick={() => navigate(`/websites/${website.id}`)}
            className="group relative overflow-hidden card bg-slate-900/40 border-slate-800/50 hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-primary/5 hover:translate-y-[-4px]"
        >
            {/* Background Glow */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[80px] opacity-20 transition-all duration-500 group-hover:opacity-40 ${isUp ? 'bg-success' : 'bg-danger'}`}></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-transform duration-500 group-hover:scale-110 ${isUp ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
                            <Globe className="w-6 h-6" />
                        </div>
                        <div className="overflow-hidden">
                            <h3 className="font-bold text-xl tracking-tight truncate group-hover:text-primary transition-colors">{website.name}</h3>
                            <div className="flex items-center gap-1.5 text-secondary text-xs mt-0.5">
                                <p className="truncate max-w-[150px]">{new URL(website.url).hostname}</p>
                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    axios.post(`/api/websites/${website.id}/trigger_check/`);
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-primary/20 hover:text-primary transition-all overflow-hidden"
                                title="Manual Pulse"
                            >
                                <Activity className="w-3 h-3" />
                            </button>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${isUp ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                                {website.current_status}
                            </span>
                        </div>
                        <p className="text-[10px] text-secondary font-medium tracking-tighter">ID: {website.id}</p>
                    </div>

                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
                        <p className="text-secondary text-[10px] uppercase font-black tracking-widest mb-1.5 opacity-60">Uptime</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black">{Math.floor(website.uptime_percentage)}</span>
                            <span className="text-xs font-bold text-secondary">%{String(website.uptime_percentage).split('.')[1] || '0'}</span>
                        </div>
                    </div>
                    <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
                        <p className="text-secondary text-[10px] uppercase font-black tracking-widest mb-1.5 opacity-60">Latency</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black">
                                {website.recent_logs.length > 0 ? Math.round(website.recent_logs[0].response_time * 1000) : '--'}
                            </span>
                            <span className="text-xs font-bold text-secondary">ms</span>
                        </div>
                    </div>
                </div>

                <div className="h-20 -mx-2 -mb-2 relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent pointer-events-none"></div>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <Line
                                    type="monotone"
                                    dataKey="val"
                                    stroke={isUp ? "#10b981" : "#ef4444"}
                                    strokeWidth={3}
                                    dot={false}
                                    animationDuration={1500}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-800 font-black text-[10px] uppercase tracking-widest">
                            Awaiting Signal...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const [websites, setWebsites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchWebsites = async () => {
        try {
            const res = await axios.get('/api/websites/');
            setWebsites(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWebsites();
        const interval = setInterval(fetchWebsites, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <Activity className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
            </div>
            <div className="text-center">
                <p className="text-xl font-bold tracking-tight">Synchronizing Infrastructure</p>
                <p className="text-secondary text-sm font-medium mt-1">Connecting to global heartbeat nodes...</p>
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in duration-700 max-w-7xl mx-auto px-4">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter">Live Monitor</h1>
                    </div>
                    <p className="text-secondary text-lg font-medium max-w-xl leading-relaxed">
                        Real-time latency and uptime analysis across your global infrastructure.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="group btn btn-primary flex items-center gap-3 px-8 py-4 shadow-2xl shadow-primary/30 w-full lg:w-auto text-lg font-black tracking-tight"
                >
                    <Plus className="w-5 h-5 stroke-[3px] group-hover:rotate-90 transition-transform" />
                    New Monitor
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {websites.map(website => (
                    <WebsiteCard key={website.id} website={website} />
                ))}

                {websites.length === 0 && (
                    <div className="col-span-full py-32 card border-dashed border-slate-800/50 bg-slate-900/10 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mb-6 border border-slate-800">
                            <Activity className="w-10 h-10 text-slate-700" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">No Active Monitors</h3>
                        <p className="text-secondary max-w-xs mx-auto text-sm leading-relaxed">
                            Capture your first heartbeat by adding an endpoint to the tracking system.
                        </p>
                    </div>
                )}
            </div>

            <AddMonitorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onRefresh={fetchWebsites}
            />
        </div>
    );
};

export default Dashboard;
