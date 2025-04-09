"use client";

import { createContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem("token");

        if (token) {
          // Set axios default header
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          try {
            const res = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/users/me`
            );
            setUser(res.data);
            setIsAuthenticated(true);
          } catch (err) {
            console.error(
              "Auth check error:",
              err.response?.data?.message || "Authentication failed"
            );

            // If token is invalid or expired, clear it
            if (err.response?.status === 401) {
              localStorage.removeItem("token");
              delete axios.defaults.headers.common["Authorization"];
            }

            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        console.error("Auth check error:", err);
      }

      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  // Register user
  const register = async (formData) => {
    try {
      setError(null);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/users/register`,
        formData
      );

      if (res.data?.token && res.data?.user) {
        localStorage.setItem("token", res.data.token);
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${res.data.token}`;

        setUser(res.data.user);
        setIsAuthenticated(true);
        return true;
      } else {
        setError("Invalid server response");
        return false;
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      return false;
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setError(null);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/users/login`,
        { email, password }
      );

      localStorage.setItem("token", res.data.token);
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${res.data.token}`;

      setUser(res.data.user);
      setIsAuthenticated(true);

      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
      return false;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    setIsAuthenticated(false);
  };

  // Update profile
  const updateProfile = async (formData) => {
    try {
      setError(null);
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/users/profile`,
        formData
      );

      setUser(res.data);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Profile update failed");
      return false;
    }
  };

  // Upload profile picture
  const uploadProfilePicture = async (file) => {
    try {
      setError(null);
      const formData = new FormData();
      formData.append("profilePicture", file);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/users/profile-picture`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUser({ ...user, profilePicture: res.data.profilePicture });
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        register,
        login,
        logout,
        updateProfile,
        uploadProfilePicture,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
