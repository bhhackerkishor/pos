import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const authStorage = localStorage.getItem('auth-storage-v2');
            //console.log(authStorage);
            if (authStorage) {
                try {
                    const parsed = JSON.parse(authStorage);
                    const token = parsed?.state?.token;
                    //console.log(token);
                    if (token) config.headers.Authorization = `Bearer ${token}`;
                } catch (err) {
                    console.error('Failed to parse auth-storage-v2', err);
                }
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
