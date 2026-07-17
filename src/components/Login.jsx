import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../config/axios";
import logoTS from "../img/logo_zifra_b.png";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/bienvenido");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError("Por favor, complete todos los campos.");
      return;
    }

    setLoading(true);

    try {
      // Login
      const { data } = await api.post("/auth/login", { username, password });

      // Guardamos accessToken y refreshToken
      localStorage.setItem("token", data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }

      localStorage.setItem("username", username);

      // Cargamos menú del usuario
      const menuResponse = await api.get("/opciones");
      localStorage.setItem("menu", JSON.stringify(menuResponse.data));

      navigate("/bienvenido");
    } catch (err) {
      // Mostramos el mensaje del backend sin redirección
      if (err.response && err.response.status === 401) {
        setError(err.response.data?.message || "Usuario o clave incorrecta");
      } else {
        setError("Error de conexión o servidor. Intente nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src={logoTS} alt="Zifra" className="login-logo" />
        <h3>Sistema Integral de Control Tributario</h3>
        <h2>Acceso Seguro a Zifra</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label style={{fontSize:"15px", fontWeight:"500"}}>Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label style={{fontSize:"15px", fontWeight:"500"}}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="login-button">
            {loading ? ". . . . . ." : "Ingresar al sistema"}
          </button>
          <h3 style={{marginTop:"20px"}}>Acceso protegido - Información encriptada</h3>
          <div style={{marginTop:"10px", borderTop:"1px solid #FFF", opacity:"20%"}}></div>
          <div className="login-footer"> 
            <div>&copy; {new Date().getFullYear()} Zifra</div>            
            <div>Soporte: soporte@zifraec.com</div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
