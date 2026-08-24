import { createContext, useEffect, useState } from "react";

import { authService } from "../services/authService";
import {
  clearStoredToken,
  getStoredToken,
  registerUnauthorizedHandler,
  storeToken,
} from "../services/api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(getStoredToken());
  const [isReady, setIsReady] = useState(false);

  const logout = () => {
    clearStoredToken();
    setAccessToken(null);
    setUser(null);
  };

  const login = async (payload) => {
    const response = await authService.login(payload);
    storeToken(response.accessToken);
    setAccessToken(response.accessToken);
    setUser(response.user);
    return response;
  };

  const register = async (payload) => authService.register(payload);

  useEffect(() => {
    registerUnauthorizedHandler(logout);
  }, []);

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      setIsReady(true);
      return;
    }

    const loadUser = async () => {
      try {
        const response = await authService.me();
        setUser(response.user);
        setAccessToken(token);
      } catch (_error) {
        logout();
      } finally {
        setIsReady(true);
      }
    };

    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isReady,
        isAuthenticated: Boolean(user && accessToken),
        login,
        logout,
        register,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
