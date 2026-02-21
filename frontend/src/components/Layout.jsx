import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, LayoutDashboard, Settings, LogOut, ShieldCheck, Menu, X } from 'lucide-react';

const NavItem = ({ to, icon: Icon, children, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${isActive ? 'bg-primary/10 text-primary shadow-sm' : 'text-secondary hover:text-white hover:bg-slate-800'}`}
    >
        <Icon className="w-5 h-5" />
        {children}
    </NavLink>
);

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const sidebarContent = (
        <>
            <div className="flex items-center gap-3 mb-10 group/logo cursor-pointer">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)] group-hover/logo:shadow-primary/50 transition-all duration-500">
                    <Activity className="text-white w-7 h-7 animate-pulse-soft" />
                </div>
                <div>
                    <span className="font-black text-2xl tracking-tighter leading-none block">Pulse</span>
                    <span className="text-[10px] uppercase font-black text-primary tracking-[0.3em] mt-0.5 block">Monitor</span>
                </div>
            </div>


            <nav className="flex-1 space-y-2">
                <NavItem to="/dashboard" icon={LayoutDashboard} onClick={() => setIsMobileMenuOpen(false)}>Dashboard</NavItem>
                {user?.is_master && (
                    <NavItem to="/admin" icon={ShieldCheck} onClick={() => setIsMobileMenuOpen(false)}>Admin Panel</NavItem>
                )}
            </nav>

            <div className="pt-6 border-t border-slate-800">
                <div className="flex items-center gap-3 p-2 mb-4 bg-slate-900/50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-xs text-white">
                        {user?.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="font-bold text-sm truncate">{user?.username}</p>
                        <p className="text-[10px] text-secondary uppercase font-black">{user?.is_master ? 'Master' : 'Developer'}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-danger hover:bg-danger/10 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-background">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-72 bg-card border-r border-slate-800 flex-col p-6 space-y-8 sticky top-0 h-screen shrink-0">
                {sidebarContent}
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-card border-b border-slate-800 sticky top-0 z-40">
                <div className="flex items-center gap-2">
                    <Activity className="text-primary w-6 h-6" />
                    <span className="font-bold">Uptime Pulse</span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-secondary hover:text-white"
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-50 bg-background flex flex-col p-6 animate-in slide-in-from-top duration-300">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-2">
                            <Activity className="text-primary w-8 h-8" />
                            <span className="font-bold text-xl uppercase tracking-tighter">Menu</span>
                        </div>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">
                            <X className="w-8 h-8" />
                        </button>
                    </div>
                    {sidebarContent}
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-10 lg:p-12 overflow-x-hidden">
                {children}
            </main>
        </div>
    );
};

export default Layout;
