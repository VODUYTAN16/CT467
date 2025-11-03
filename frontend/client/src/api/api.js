import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
// Attach token from localStorage (if present) to each request
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // ignore
    }
    return config;
  },
  (error) => Promise.reject(error)
);
// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || "An error occurred";
    // You can add toast notification here
    return Promise.reject(error);
  }
);


export const getTopEquipment = (limit) => api.get(`/reports/equipment/top?limit=${limit}`);
export const getRevenueByPackage = () => api.get('/reports/revenue/packages');
export const getMembersExpiringSoon = (days) => api.get(`/reports/members/expiring?days=${days}`);

export const getMembers = () => api.get('/members');
export const getEquipment = () => api.get('/equipment');
export const getPackages = () => api.get('/packages');
export const getSubscriptions = () => api.get('/subscriptions');

// Default export for convenience
export default api;
