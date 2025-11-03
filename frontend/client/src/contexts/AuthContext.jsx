import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // New loading state
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate checking for a token or user session on mount
    const token = localStorage.getItem("token");
    if (token) {
      // In a real app, you would validate the token with your backend
      setIsAuthenticated(true);
      setUser({ username: "testuser" }); // Placeholder user data
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      // Call backend to get real JWT
      const res = await api.post("/auth/login", { username, password });
      const token = res.data?.token;
      if (!token) throw new Error("No token received");
      localStorage.setItem("token", token);
      setIsAuthenticated(true);
      setUser({ username });
      navigate("/dashboard");
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      setIsAuthenticated(false);
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
    navigate("/login"); // Redirect to login on logout
  };

  return <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>{children}</AuthContext.Provider>;
};
