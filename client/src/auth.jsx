import { createContext, useState, useContext, useEffect, useCallback } from "react";
import { get, post } from "./utilities";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await get("/api/whoami");
      setCurrentUser(user);
    } catch (err) {
      // This is expected if the user is not logged in
      // console.log("Not logged in or error fetching user:", err.message);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email, password) => {
    try {
      const user = await post("/api/login", { email, password });
      setCurrentUser(user);
      return user;
    } catch (error) {
      // console.error("Login API call failed:", error);
      throw error; // Re-throw to be caught by the calling component
    }
  };

  const register = async (name, email, password) => {
    try {
      const user = await post("/api/register", { name, email, password });
      setCurrentUser(user);
      return user;
    } catch (error) {
      // console.error("Register API call failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await post("/api/logout");
      setCurrentUser(null);
    } catch (error) {
      // console.error("Logout API call failed:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, login, register, logout, isLoading, fetchCurrentUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
