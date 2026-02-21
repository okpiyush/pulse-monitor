import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Shield, User, Trash2 } from 'lucide-react';

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ username: '', password: '', is_master: false });
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/users/');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/users/', newUser);
            setNewUser({ username: '', password: '', is_master: false });
            fetchUsers();
            alert('User created successfully!');
        } catch (err) {
            alert('Error creating user.');
        }
    };

    const handleDeleteUser = async (id) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await axios.delete(`/api/users/${id}/`);
            fetchUsers();
        } catch (err) {
            alert('Error deleting user.');
        }
    };

    if (loading) return <div className="p-10">Loading Admin...</div>;

    return (
        <div className="space-y-10">
            <header>
                <h1 className="text-4xl font-bold tracking-tight mb-2">User Management</h1>
                <p className="text-secondary">Manage access for other team members.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1 space-y-6">
                    <div className="card">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-primary" />
                            Add User
                        </h2>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-secondary uppercase mb-2">Username</label>
                                <input
                                    type="text"
                                    className="w-full bg-background border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-white"
                                    value={newUser.username}
                                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-secondary uppercase mb-2">Password</label>
                                <input
                                    type="password"
                                    className="w-full bg-background border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-white"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex items-center gap-3 py-2">
                                <input
                                    type="checkbox"
                                    id="is_master"
                                    className="w-5 h-5 rounded border-slate-800 bg-background text-primary focus:ring-primary"
                                    checked={newUser.is_master}
                                    onChange={(e) => setNewUser({ ...newUser, is_master: e.target.checked })}
                                />
                                <label htmlFor="is_master" className="text-sm font-medium">Grant admin privileges</label>
                            </div>
                            <button type="submit" className="btn btn-primary w-full mt-4">Create Account</button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="card">
                        <h2 className="text-xl font-bold mb-6">System Users</h2>
                        <div className="overflow-hidden">
                            <table className="w-100 min-w-full divide-y divide-slate-800 text-left">
                                <thead>
                                    <tr>
                                        <th className="pb-4 text-secondary text-xs font-bold uppercase">Identity</th>
                                        <th className="pb-4 text-secondary text-xs font-bold uppercase">Role</th>
                                        <th className="pb-4 text-secondary text-xs font-bold uppercase text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {users.map(u => (
                                        <tr key={u.id} className="group">
                                            <td className="py-4 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-primary">
                                                    {u.username[0].toUpperCase()}
                                                </div>
                                                <span className="font-medium">{u.username}</span>
                                            </td>
                                            <td className="py-4">
                                                {u.is_master ? (
                                                    <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded">Master</span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-slate-800 text-secondary text-[10px] font-bold uppercase rounded">Member</span>
                                                )}
                                            </td>
                                            <td className="py-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    className="p-2 text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                                                    disabled={u.username === 'master'}
                                                >
                                                    <Trash2 className="w-4 h-4" />
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
