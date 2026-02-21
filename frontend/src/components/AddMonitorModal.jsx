import React, { useState } from 'react';
import axios from 'axios';
import { X, Globe, Clock, Shield } from 'lucide-react';

const AddMonitorModal = ({ isOpen, onClose, onRefresh }) => {
    const [formData, setFormData] = useState({
        name: '',
        url: '',
        check_interval: 5
    });
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post('/api/websites/', formData);
            onRefresh();
            onClose();
            setFormData({ name: '', url: '', check_interval: 5 });
        } catch (err) {
            alert('Failed to add monitor. Please check the URL and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="card w-full max-w-lg shadow-2xl border-slate-700 animate-in fade-in zoom-in duration-200">
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

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-secondary uppercase tracking-widest px-1">Check Interval (Minutes)</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors">
                                <Clock className="w-5 h-5" />
                            </span>
                            <select
                                className="w-full bg-background/50 border border-slate-800 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-primary transition-all appearance-none"
                                value={formData.check_interval}
                                onChange={(e) => setFormData({ ...formData, check_interval: parseInt(e.target.value) })}
                            >
                                <option value={1}>Every 1 Minute</option>
                                <option value={5}>Every 5 Minutes</option>
                                <option value={15}>Every 15 Minutes</option>
                                <option value={30}>Every 30 Minutes</option>
                                <option value={60}>Every 1 Hour</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={onClose} className="btn btn-outline flex-1 py-3">Cancel</button>
                        <button type="submit" disabled={submitting} className="btn btn-primary flex-1 py-3">
                            {submitting ? 'Creating...' : 'Create Monitor'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddMonitorModal;
