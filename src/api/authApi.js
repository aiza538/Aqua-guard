import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  isLoggedIn: false,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem("aquaguard_token");
        const storedUser = await AsyncStorage.getItem("aquaguard_user");
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.warn("Auth load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    await AsyncStorage.setItem("aquaguard_token", authToken);
    await AsyncStorage.setItem("aquaguard_user", JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem("aquaguard_token");
    await AsyncStorage.removeItem("aquaguard_user");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, isLoggedIn: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
