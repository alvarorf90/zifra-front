import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';
import Bienvenido from './components/Bienvenido';
import Usuario from './administrador/Usuario';
import Empresa from './administrador/Empresa';
import EmpresaCliente from './administrador/EmpresaCliente';
import Clientes from './administrador/Clientes';
import Productos from './administrador/Productos';
import Emision from './consultar/Emision';
import Factura from './generar/Factura';
import NotaCredito from './generar/NotaCredito';
import Retencion from './generar/Retencion';
import GuiaRemision from './generar/GuiaRemision';
import Recepcion from './consultar/Recepcion';
import ReporteRecibidos from './reporteria/ReporteRecibidos';
import Ats from './consultar/Ats';
import Generar from './ats/Generar';

import { LoadingProvider } from './context/LoadingContext';
import { EmpresaProvider } from './context/EmpresaContext';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Página de Login fuera del layout y sin contextos extras */}
        <Route path="/login" element={<Login />} />

        {/* Rutas privadas con Layout */}
        <Route path="/" element={
            <LoadingProvider>
              <EmpresaProvider>
                <Layout />
              </EmpresaProvider>
            </LoadingProvider>
          }
        >
          <Route path="bienvenido" element={<Bienvenido />} />
          <Route path="usuario" element={<Usuario />} />
          <Route path="empresa" element={<Empresa />} />
          <Route path="empresaCliente" element={<EmpresaCliente />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="productos" element={<Productos />} />
          <Route path="consultar/emision" element={<Emision />} />
          <Route path="consultar/recepcion" element={<Recepcion />} />
          <Route path="generar/factura" element={<Factura />} />
          <Route path="generar/nota-credito" element={<NotaCredito />} />
          <Route path="generar/retencion" element={<Retencion />} />
          <Route path="generar/guia" element={<GuiaRemision />} />
          <Route path="reporteria/reporte-recibidos" element={<ReporteRecibidos />} />
          <Route path="consultar/ats" element={<Ats />} />
          <Route path="ats/generar" element={<Generar />} />

          {/* Redirigir raíz a /bienvenido */}
          <Route index element={<Navigate to="bienvenido" />} />
        </Route>

        {/* Catch-all → redirige al login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
