import { createContext, useContext, useState, useEffect } from "react";
import { loginRequest, registerRequest, verifyTokenRequest } from "../api/auth";
import Cookies from "js-cookie";
import axios from "../api/axios";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Limpiar errores después de 5 segundos
  useEffect(() => {
    if (errors.length > 0) {
      const timer = setTimeout(() => {
        setErrors([]);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  // Para ver cada vez que cambie el 'user':
  useEffect(() => {
    //console.log("User en AuthContext:", user);
  }, [user]);

  // SIGNUP
  const signup = async (user) => {
    try {
      //console.log("Datos enviados a backend:", userData);
      const res = await registerRequest(user);
      if (res.status === 200) {
        setUser(res.data);
        setIsAuthenticated(true);
        setErrors([]); 
      }
    } catch (error) {
      console.error("Error en signup:", error.response?.data?.message);
      setErrors([error.response?.data?.message || "Error en el registro"]);
      throw error; 
    }
  };

  // SIGNIN
  const signin = async (credentials) => {
    try {
      setErrors([]); 
      const res = await loginRequest(credentials); 
      setUser(res.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error al iniciar sesión:", error.response?.data);
      if (error.response?.data?.message) {
        const errArray = Array.isArray(error.response.data.message)
          ? error.response.data.message
          : [error.response.data.message];
        setErrors(errArray);
      } else {
        setErrors(["Error interno al iniciar sesión"]);
      }
    }
  };

  // LOGOUT
  const logout = async () => {
    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true });
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Verificar token al montar
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await verifyTokenRequest();
        if (!res.data) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        setUser(res.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error verificando token:", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    checkLogin();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        signup,
        signin,
        logout,
        loading,
        user,
        isAuthenticated,
        errors,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
