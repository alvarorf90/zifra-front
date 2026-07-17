import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useEmpresas } from '../context/EmpresaContext';
import { FiCalendar, FiDatabase, FiFileText } from "react-icons/fi";

const Bienvenido = () => {
  const [roles, setRoles] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();

  const { empresas, empresaSeleccionada, setEmpresaSeleccionada } = useEmpresas();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      const tokenRoles = decodedToken.roles || [];
      setRoles(tokenRoles);
      if (tokenRoles.includes('ADMIN')) {
        localStorage.setItem("rol", "ADMIN");
        setMensaje('¡Has iniciado sesión como Administrador!');
      } 
    } catch (error) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (empresas.length > 0 && !empresaSeleccionada) {
      setEmpresaSeleccionada(empresas[0]);
      localStorage.setItem("empresaSeleccionada", JSON.stringify(empresas[0]));
    }
  }, [empresas, empresaSeleccionada, setEmpresaSeleccionada]);

  return (
    <div style={{ padding: "0px 15px" }}>

      <header style={{ marginBottom: "10px" }}>
        <h1 style={{ fontSize: "40px", fontWeight: "bold", }}>
          ZIFRA
        </h1>
        <h2 style={{ fontSize: "24px", color: "rgb(29 72 133)" }}>
          Sistema Integral de Control Tributario
        </h2>
      </header>

      {roles.includes('ADMIN') && (
        <div>
          <p style={{ marginTop: "10px", fontSize: "1.2rem", color: "rgb(19 45 80)" }}>
            {mensaje}
          </p>
        </div> 
      )} 

      {!roles.includes('ADMIN') && empresaSeleccionada && (
          <div key={empresaSeleccionada.ruc} >
            <p style={{ fontSize: "1.2rem", color: "rgb(19 45 80)" }}>
              Razón Social: <strong>{empresaSeleccionada.razonSocial}</strong>
            </p>

            <section className="cards-container">
              {/* Certificado */}
              <div className="card" style={{ borderLeft: "5px solid #81c784" }}>
                <div className="card-icon">
                  <FiCalendar />
                </div>
                <div>
                  <p className="card-label">Fecha Caducidad Certificado</p>
                  <h3 className="card-value">
                    {empresaSeleccionada.fechaCaducidad
                      ? empresaSeleccionada.fechaCaducidad.split("-").reverse().join("/")
                      : "—"}
                  </h3>
                </div>
              </div>

              {/* Pool */}
              {roles.includes('PYMES') && (
                <div className="card" style={{ borderLeft: "5px solid #4fc3f7" }}>
                  <div className="card-icon">
                    <FiDatabase />
                  </div>
                  <div>
                    <p className="card-label">Pool Comprobantes</p>
                    <h3 className="card-value">
                      {empresaSeleccionada.poolComprobantes || 0}
                    </h3>
                  </div>
                </div>
              )}

              {/* Emitidos */}
              {!roles.includes('INT_RECEP') && (
                <div className="card" style={{ borderLeft: "5px solid #f7bc4f" }}>
                  <div className="card-icon">
                    <FiFileText />
                  </div>
                  <div>
                    <p className="card-label">Comprobantes Emitidos</p>
                    <h3 className="card-value">
                      {empresaSeleccionada.totalComprobantes || 0}
                    </h3>
                  </div>
                </div>
              )}

            </section>

            {/* Mensaje de advertencia si se alcanzó el límite */}
            {Number(empresaSeleccionada.poolComprobantes) <= Number(empresaSeleccionada.totalComprobantes) && roles.includes('PYMES') && (
              <div style={{
                backgroundColor: "#816f09",
                color: "#ffffff",
                padding: "15px 20px",
                borderRadius: "8px",
                marginTop: "30px",
                width: "50%",
                marginLeft: "auto",
                marginRight: "auto",
                boxShadow: "0 0 10px rgba(255, 204, 0, 0.5)",
                border: "1px solid #fdf905"
              }}>
                <strong>⚠️ Advertencia:</strong> Has alcanzado el número máximo de comprobantes contratados.
                <br/> Comunícate con el administrador para ampliar tu pool de comprobantes.
              </div>
            )}

          </div>
      )}

    </div>
  );
};

export default Bienvenido;
