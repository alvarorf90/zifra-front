import axios from "axios";

//const SERVER = "http://localhost:9090"; //DESA
const SERVER = process.env.REACT_APP_API_URL || "";

const api = axios.create({ 
  baseURL: `${SERVER}/api`,
});

//Valida y renueva el accessToken si está a punto de expirar 
const validateAndRefreshToken = async () => { 
  const token = localStorage.getItem("token"); 
  
  if (!token) return null;

  try {
    const { data } = await axios.get(`${SERVER}/api/auth/validate`, { 
      headers: { Authorization: `Bearer ${token}` }, 
    }); 
    
    if (data.accessToken) { 
      localStorage.setItem("token", data.accessToken); 
      return data.accessToken; 
    } 
    return token; 
  } catch (error) { 
    // Token expirado o inválido console.warn("El accessToken ya expiró"); 
    return await tryRefreshToken(); 
  } 
};

//Usa refreshToken para obtener un nuevo accessToken 
const tryRefreshToken = async () => { 
  const refreshToken = localStorage.getItem("refreshToken"); 
  if (!refreshToken) { 
    clearSession(); 
    return null; 
  } 
  
  try { 
    const { data } = await axios.post(`${SERVER}/api/auth/refresh`, { 
      refreshToken, 
    }); 
    if (data.accessToken) { 
      localStorage.setItem("token", data.accessToken); 
      return data.accessToken; 
    } 
    
    clearSession(); 
    return null; 
  } catch (error) { 
    console.error("Refresh token inválido o expirado:", error.message); 
    clearSession(); 
    return null; 
  } 
}; 

// Limpia sesión y redirige al login 
const clearSession = () => { 
  localStorage.removeItem("token"); 
  localStorage.removeItem("refreshToken"); 
  localStorage.removeItem("menu"); 
  window.location.href = "/"; 
}; 

// Interceptor de request → agrega token válido/renovado   
api.interceptors.request.use( 
  async (config) => { 
    let token = localStorage.getItem("token"); 
    if (token) { 
      token = await validateAndRefreshToken(); 
      if (token) { 
        config.headers.Authorization = `Bearer ${token}`; 
      } 
    } 
    return config; 
  }, (error) => { 
    console.error("Error en request:", error); 
    return Promise.reject(error); 
  }

); 
  
// Interceptor de response → maneja 401, login fallido o expiración 
api.interceptors.response.use( 
  (response) => response, 
  async (error) => { 
    if (error.response) {
      const originalRequest = error.config; 
      
      // Evita redirigir automáticamente en caso de login fallido 
      if (error.response.status === 401 && originalRequest.url.includes("/auth/login")) { 
        return Promise.reject(error); 
      } 
      
      // Intento de refresh si la request aún no ha sido reintentada 
      if (error.response.status === 401 && !originalRequest._retry) { 
        originalRequest._retry = true; 
        const newToken = await tryRefreshToken(); 
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`; 
          return api(originalRequest); // Reintenta la request original 
        } 
      } 
        
      // Si ya no se puede refrescar → limpiar sesión 
      if (error.response.status === 401) { 
        clearSession(); 
      } 
    } else { 
      console.error("Error de red/servidor:", error.message); 
    } 

    return Promise.reject(error); 
  } 
); 

export default api;
