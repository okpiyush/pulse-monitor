import React, { useState } from 'react';
import axios from 'axios';
import { X, Globe, Clock, Shield, AlertTriangle, Mail, Settings, Activity } from 'lucide-react';

const AddMonitorModal = ({ isOpen, onClose, onRefresh }) => {
    const [formData, setFormData] = useState({
        name: '',
        url: '',
        check_interval: 5,
        failure_poll_interval: 5,
        alert_threshold: 3,
        recovery_threshold: 2,
        alert_email: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post('/api/websites/', formData);
            onRefresh();
            onClose();
            setFormData({
                name: '',
                url: '',
                check_interval: 5,
                failure_poll_interval: 5,
                alert_threshold: 3,
                recovery_threshold: 2,
                alert_email: ''
            });
        } catch (err) {
            alert('Failed to add monitor. Please check the URL and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
            <div className="card w-full max-w-lg shadow-2xl border-slate-700 animate-in fade-in zoom-in duration-200 my-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="text-primary w-6 h-6" />
                        Add New Monitor
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-secondary uppercase tracking-widest px-1">Display Name</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors">
                                <Globe className="w-5 h-5" />
                            </span>
                            <input
                                type="text"
                                className="w-full bg-background/50 border border-slate-800 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-primary transition-all"
                                placeholder="e.g. My Website"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-secondary uppercase tracking-widest px-1">Endpoint URL</label>
                        <input
                            type="url"
                            className="w-full bg-background/50 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"
                            placeholder="https://example.com"
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-secondary uppercase tracking-widest px-1">Check Every</label>
                            <select
                                className="w-full bg-background/50 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all appearance-none"
                                value={formData.check_interval}
                                onChange={(e) => setFormData({ ...formData, check_interval: parseInt(e.target.value) })}
                            >
                                <option value={1}>1 Minute</option>
                                <option value={5}>5 Minutes</option>
                                <option value={15}>15 Minutes</option>
                                <option value={30}>30 Minutes</option>
                                <option value={60}>1 Hour</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-secondary uppercase tracking-widest px-1">Alert Email</label>
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/40 group-focus-within:text-primary transition-colors">
                                    <Mail className="w-4 h-4" />
                                </span>
                                <input
                                    type="email"
                                    className="w-full bg-background/50 border border-slate-800 rounded-lg pl-9 pr-4 py-3 focus:outline-none focus:border-primary transition-all"
                                    placeholder="monitoring@example.com"
                                    value={formData.alert_email}
                                    onChange={(e) => setFormData({ ...formData, alert_email: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-xs font-black uppercase text-primary tracking-widest flex items-center gap-2 hover:opacity-80 transition-all px-1"
                    >
                        <Settings className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                        {showAdvanced ? 'Hide Advanced Logic' : 'Show Advanced Logic'}
                    </button>

                    {showAdvanced && (
                        <div className="space-y-4 p-4 rounded-2xl bg-slate-950/40 border border-slate-800/50 animate-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest">Fail Polling (s)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-background/50 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        value={formData.failure_poll_interval}
                                        onChange={(e) => setFormData({ ...formData, failure_poll_interval: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest">Alert Threshold</label>
                                    <input
                                        type="number"
                                        className="w-full bg-background/50 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        value={formData.alert_threshold}
                                        onChange={(e) => setFormData({ ...formData, alert_threshold: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="flex items-start gap-3 text-secondary/60">
                                <AlertTriangle className="w-4 h-4 mt-1 flex-shrink-0" />
                                <p className="text-[10px] leading-relaxed">
                                    When an outage is detected, pulse frequency increases to <span className="text-primary font-bold">{formData.failure_poll_interval}s</span>.
                                    A critical escalation is triggered after <span className="text-primary font-bold">{formData.alert_threshold}</span> consecutive failures.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={onClose} className="btn btn-outline flex-1 py-3">Cancel</button>
                        <button type="submit" disabled={submitting} className="btn btn-primary flex-1 py-3 group">
                            {submitting ? 'Creating...' : (
                                <span className="flex items-center justify-center gap-2">
                                    Initialize Tracker <Activity className="w-4 h-4 group-hover:animate-pulse" />
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddMonitorModal;
