import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const res = await axios.get('/api/users/me/');
            setUser(res.data);
        } catch (err) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const login = async (username, password) => {
        try {
            await axios.post('/api/login/', { username, password });
            await fetchUser();
            return true;
        } catch (err) {
            return false;
        }
    };

    const logout = async () => {
        try {
            await axios.post('/api/logout/');
            setUser(null);
        } catch (err) { }
    };


    return (
        <AuthContext.Provider value={{ user, loading, login, logout, fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
