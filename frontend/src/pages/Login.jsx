import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Lock, User as UserIcon } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const success = await login(username, password);
        if (success) {
            navigate('/dashboard');
        } else {
            setError('Invalid username or password');
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40 mx-auto mb-6">
                        <Activity className="text-white w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
                    <p className="text-secondary mt-2 font-medium">Please enter your credentials to access the console.</p>
                </div>

                <form onSubmit={handleSubmit} className="card border-slate-800/50 space-y-6 bg-slate-900/40 border backdrop-blur-3xl">
                    {error && <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-xl text-sm font-medium text-center">{error}</div>}

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-secondary uppercase tracking-widest px-1">Username</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-4 text-secondary group-focus-within:text-primary transition-colors">
                                <UserIcon className="w-5 h-5" />
                            </span>
                            <input
                                type="text"
                                className="w-full bg-background/50 border border-slate-800 rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-secondary uppercase tracking-widest px-1">Password</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-4 text-secondary group-focus-within:text-primary transition-colors">
                                <Lock className="w-5 h-5" />
                            </span>
                            <input
                                type="password"
                                className="w-full bg-background/50 border border-slate-800 rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary w-full py-4 text-lg font-bold shadow-xl shadow-primary/20">Sign In</button>
                </form>

                <p className="text-center text-sm text-secondary">
                    System requires authorization. Contact your administrator if you've lost access.
                </p>
            </div>
        </div>
    );
};

export default Login;
