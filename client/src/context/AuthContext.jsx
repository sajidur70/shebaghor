import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() =>
    Boolean(localStorage.getItem("token")),
  ); // only wait if there's a token to check

  // On page load: if we have a token, ask the API who we are.
  useEffect(() => {
    if (!localStorage.getItem("token")) return;

    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem("token")) // expired or invalid → forget it
      .finally(() => setLoading(false));
  }, []);

  function saveSession(data) {
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data.user;
  }

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    return saveSession(data);
  }

  async function register(form) {
    const { data } = await api.post("/auth/register", form);
    return saveSession(data);
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
