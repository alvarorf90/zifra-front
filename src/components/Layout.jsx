import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../config/axios';
import logoZifra from '../img/logo_zifra.png';
import useSessionManager from '../hooks/useSessionManager';
import { clearSessionStorage } from '../utils/session';
import { useLoading } from "../context/LoadingContext";
import { FiFolder, FiFileText, FiSearch, FiHome, FiSettings, FiChevronDown, FiChevronRight,  FiArchive, FiLayers} from "react-icons/fi";

//OTROS ICONOS = FiLayers, FiBookOpen, FiPackage, FiGrid

const RUTAS_SIN_PADDING = [
  '/ats/generar',
  '/ats/compraVentas',
  '/consultar/validacionRetenciones',
];

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sinPadding = RUTAS_SIN_PADDING.some((ruta) => location.pathname.endsWith(ruta));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menu, setMenu] = useState([]);
  const [expandedItem, setExpandedItem] = useState(null);   
  const [username, setUsername] = useState('');
  const { setIsLoading } = useLoading();

  const getIcon = (nombre) => {
    const text = nombre?.toLowerCase();
    if (text.includes("consultar")) return <FiSearch />;
    if (text.includes("administrador")) return <FiSettings />;
    if (text.includes("reportería")) return <FiFileText />;
    if (text.includes("anexos")) return <FiArchive />;
    if (text.includes("formularios")) return <FiLayers />;
    return <FiFolder />; // por defecto
  };

  const getInitial = (nombre) => {
    return nombre ? nombre.charAt(0).toUpperCase() : "?";
  };

  // función para cerrar sesión 
  const handleLogout = useCallback(() => {
    clearSessionStorage();
    navigate('/login');
  }, [navigate]);

  // Hook para manejar sesión e inactividad con config externa
  useSessionManager({
    onLogout: handleLogout,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const menuFromStorage = localStorage.getItem('menu');
    const storedUsername = localStorage.getItem('username');

    if (!token || !menuFromStorage) {
      handleLogout();
      return;
    }

    if (storedUsername) setUsername(storedUsername);

    const validateToken = async () => {
      try {
        setIsLoading(true);
        await api.get('/auth/validate');
        setMenu(JSON.parse(menuFromStorage));        
      } catch (err) {
        handleLogout();
      }finally{
        setIsLoading(false);
      }
    };

    validateToken();
  }, [handleLogout, setIsLoading]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const toggleExpand = (id) => {
    setExpandedItem((prev) => (prev === id ? null : id)); 
  };

  const renderMenu = (items) =>
    items.map((item) => {
      const tieneHijos = item.hijos && item.hijos.length > 0;
      const estaExpandido = expandedItem === item.id;

      return (
        <div key={item.id} style={{ width: '100%' }}>
          {tieneHijos ? (
            <button onClick={() => toggleExpand(item.id)} className="nav-link"
              title={!sidebarOpen ? item.nombre : undefined} >
              <span className="nav-icon">
                {getIcon(item.nombre)}
              </span>
              {sidebarOpen && (
                <>
                  <span className="nav-text">{item.nombre}</span>
                  <span className="nav-arrow">
                    {estaExpandido ? <FiChevronDown /> : <FiChevronRight />}
                  </span>
                </>
              )}
            </button>
          ) : (
            <Link to={item.ruta} className="nav-link" title={!sidebarOpen ? item.nombre : undefined} >
              <span className="nav-icon">
                {sidebarOpen ? null : getInitial(item.nombre)}
              </span>
              {sidebarOpen && (
                <span className="nav-text">{item.nombre}</span>
              )}
            </Link>
          )}

          {tieneHijos && estaExpandido && <div>{renderMenu(item.hijos)}</div>}
        </div>
      );
    });

  return (
    <div className="layout-container">
      {/* Header */}
      <header className="header">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
          <div className="prc-btn">
            <button onClick={toggleSidebar} className="sidebar-button"
              style={{ transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(90deg)'}} >
              ☰
            </button>
          </div>
          <div className="header-logo">
            <img src={logoZifra} alt="Zifra" />
          </div>
        </div>
        <div style={{display:"inline-flex", width:"80%", justifyContent:"flex-end"}}>
          🙎🏻‍♂️
          <span style={{fontSize:"12px", marginTop:"2px", marginLeft:"10px"}}> {username}</span>
        </div>
        <div className="header-user">          
          <button onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </header>

      <div className="layout-main">
        {/* Sidebar */}
        <div
          className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}
          style={{ width: sidebarOpen ? '170px' : '60px',  overflow: 'hidden' }} >
          <nav>
            <Link to="/bienvenido" className="nav-link">
              <span className="nav-icon"><FiHome /></span>
              {sidebarOpen && <span style={{ marginLeft: 10 }}>Inicio</span>}
            </Link>

            {renderMenu(menu)}
          </nav>
        </div>

        {/* Contenido principal */}
        <main className={`main-content${sinPadding ? ' main-content--no-padding' : ''}`}>
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <footer className="footer">
        &copy; {new Date().getFullYear()} Producto de SOFICOT - Derechos Reservados
      </footer>
    </div>
  );
};

export default Layout;
