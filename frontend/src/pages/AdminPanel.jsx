import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Shield, User, Trash2, Globe, Activity, CheckCircle, Circle } from 'lucide-react';

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [websites, setWebsites] = useState([]);
    const [newUser, setNewUser] = useState({ username: '', password: '', is_master: false, can_view_system_health: false, can_view_crashlytics: false, monitor_access: [] });
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [usersRes, websitesRes] = await Promise.all([
                axios.get('/api/users/'),
                axios.get('/api/websites/')
            ]);
            setUsers(usersRes.data);
            setWebsites(websitesRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleWebsiteAccess = (id) => {
        const current = newUser.monitor_access;
        if (current.includes(id)) {
            setNewUser({ ...newUser, monitor_access: current.filter(item => item !== id) });
        } else {
            setNewUser({ ...newUser, monitor_access: [...current, id] });
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/users/', newUser);
            setNewUser({ username: '', password: '', is_master: false, can_view_system_health: false, can_view_crashlytics: false, monitor_access: [] });
            fetchData();
            alert('User created successfully!');
        } catch (err) {
            alert('Error creating user.');
        }
    };

    const handleDeleteUser = async (id) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await axios.delete(`/api/users/${id}/`);
            fetchData();
        } catch (err) {
            alert('Error deleting user.');
        }
    };

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <Activity className="w-8 h-8 text-primary animate-spin" />
            <p className="font-bold text-secondary">Loading Administration Console...</p>
        </div>
    );

    return (
        <div className="space-y-12 max-w-7xl mx-auto px-4 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">User Registry</h1>
                    <p className="text-secondary text-lg font-medium">Provision accounts and delegate infrastructure access.</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
                    <div className="px-4 py-2 bg-primary/10 rounded-xl">
                        <span className="text-primary font-black text-xl">{users.length}</span>
                        <span className="text-[10px] uppercase font-black text-secondary ml-2">Total Users</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Form Column */}
                <div className="lg:col-span-4">
                    <div className="card bg-slate-900/40 border-slate-800/50 sticky top-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <UserPlus className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight">Add Member</h2>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Identity</label>
                                <input
                                    type="text"
                                    placeholder="Username"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-primary transition-all font-bold text-white placeholder:text-slate-700"
                                    value={newUser.username}
                                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Security Key</label>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-primary transition-all font-bold text-white placeholder:text-slate-700"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                                <input
                                    type="checkbox"
                                    id="is_master"
                                    className="w-5 h-5 rounded-lg border-slate-800 bg-background text-primary focus:ring-primary cursor-pointer"
                                    checked={newUser.is_master}
                                    onChange={(e) => setNewUser({ ...newUser, is_master: e.target.checked })}
                                />
                                <label htmlFor="is_master" className="text-sm font-black uppercase tracking-tight cursor-pointer">Global Administrator</label>
                            </div>

                            {!newUser.is_master && (
                                <div className="space-y-4 pt-2">
                                    <div className="flex flex-col gap-3 p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="checkbox"
                                                id="can_view_system_health"
                                                className="w-5 h-5 rounded-lg border-slate-800 bg-background text-primary focus:ring-primary cursor-pointer"
                                                checked={newUser.can_view_system_health}
                                                onChange={(e) => setNewUser({ ...newUser, can_view_system_health: e.target.checked })}
                                            />
                                            <label htmlFor="can_view_system_health" className="text-sm font-black tracking-tight cursor-pointer">Allow System Health Access</label>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="checkbox"
                                                id="can_view_crashlytics"
                                                className="w-5 h-5 rounded-lg border-slate-800 bg-background text-primary focus:ring-primary cursor-pointer"
                                                checked={newUser.can_view_crashlytics}
                                                onChange={(e) => setNewUser({ ...newUser, can_view_crashlytics: e.target.checked })}
                                            />
                                            <label htmlFor="can_view_crashlytics" className="text-sm font-black tracking-tight cursor-pointer">Allow Crashlytics Access</label>
                                        </div>
                                    </div>

                                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1 block mt-2">Monitor Privilege</label>
                                    <div className="max-h-48 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                        {websites.map(ws => (
                                            <div
                                                key={ws.id}
                                                onClick={() => toggleWebsiteAccess(ws.id)}
                                                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${newUser.monitor_access.includes(ws.id) ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-slate-950/30 border-slate-800/50 text-secondary'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Globe className="w-4 h-4 opacity-50" />
                                                    <span className="text-xs font-bold truncate max-w-[150px]">{ws.name}</span>
                                                </div>
                                                {newUser.monitor_access.includes(ws.id) ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4 opacity-20" />}
                                            </div>
                                        ))}
                                        {websites.length === 0 && <p className="text-center py-4 text-xs font-medium text-slate-600 italic">No monitors configured yet.</p>}
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary w-full py-4 text-lg font-black tracking-tight shadow-xl shadow-primary/20">
                                Commit Account
                            </button>
                        </form>
                    </div>
                </div>

                {/* Table Column */}
                <div className="lg:col-span-8">
                    <div className="card bg-slate-900/40 border-slate-800/50">
                        <h2 className="text-2xl font-black tracking-tight mb-8">Existing Infrastructure Accounts</h2>
                        <div className="overflow-x-auto -mx-6">
                            <table className="w-full text-left min-w-[600px]">
                                <thead>
                                    <tr className="border-b border-white/5 bg-slate-950/30">
                                        <th className="px-6 py-4 text-xs font-black text-secondary uppercase tracking-[0.2em]">Identity</th>
                                        <th className="px-6 py-4 text-xs font-black text-secondary uppercase tracking-[0.2em]">Privilege</th>
                                        <th className="px-6 py-4 text-xs font-black text-secondary uppercase tracking-[0.2em]">Scope</th>
                                        <th className="px-6 py-4 text-xs font-black text-secondary uppercase tracking-[0.2em] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-white/5 transition-all">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center font-black text-primary text-xl shadow-inner">
                                                        {u.username[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-100">{u.username}</p>
                                                        <p className="text-[10px] font-medium text-slate-500">ID: {u.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                {u.is_master ? (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                                                        <Shield className="w-3 h-3" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Master</span>
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 text-slate-400 border border-slate-700/50">
                                                        <User className="w-3 h-3" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Technician</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                    {u.is_master ? (
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase italic">Full Infrastructure Access</span>
                                                    ) : (
                                                        <div className="flex flex-col gap-1">
                                                            {u.accessible_websites?.length > 0 ? (
                                                                <span className="text-[10px] font-black text-primary uppercase">
                                                                    {u.accessible_websites.length} Bound Monitors
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-danger/60 uppercase">Zero Access Points</span>
                                                            )}
                                                            {u.can_view_system_health && <span className="text-[10px] font-bold text-emerald-500 uppercase">System Health</span>}
                                                            {u.can_view_crashlytics && <span className="text-[10px] font-bold text-amber-500 uppercase">Crashlytics</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    className="p-3 text-slate-500 hover:text-danger hover:bg-danger/10 rounded-2xl transition-all"
                                                    disabled={u.username === 'master'}
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
