import { createContext, useContext, useState, useEffect } from "react";
import axios from "../config/axios";

const EmpresaContext = createContext();

export const EmpresaProvider = ({ children }) => {
  const [empresas, setEmpresas] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const fetchEmpresas = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setEmpresas([]);
        setEmpresaSeleccionada(null);
        localStorage.removeItem("empresaSeleccionada");
        setInitialized(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await axios.get("/empresas/usuarioEmpresa", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const empresasBackend = Array.isArray(response.data)
          ? response.data
          : [];

        setEmpresas(empresasBackend);

        let empresaFinal = null;

        const saved = localStorage.getItem("empresaSeleccionada");
        const empresaGuardada = saved ? JSON.parse(saved) : null;

        if (empresaGuardada?.ruc) {
          empresaFinal = empresasBackend.find(
            (e) => e.ruc === empresaGuardada.ruc
          );
        }

        if (!empresaFinal && empresasBackend.length > 0) {
          empresaFinal = empresasBackend[0];
        }

        setEmpresaSeleccionada(empresaFinal);

        if (empresaFinal) {
          localStorage.setItem(
            "empresaSeleccionada",
            JSON.stringify(empresaFinal)
          );
        } else {
          localStorage.removeItem("empresaSeleccionada");
        }

      } catch (error) {
        console.error("Error al cargar empresas:", error);
        setEmpresas([]);
        setEmpresaSeleccionada(null);
        localStorage.removeItem("empresaSeleccionada");
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    fetchEmpresas();
  }, []);

  return (
    <EmpresaContext.Provider
      value={{
        empresas,
        empresaSeleccionada,
        setEmpresaSeleccionada,
        loading,
        initialized,
      }}
    >
      {children}
    </EmpresaContext.Provider>
  );
};

export const useEmpresas = () => {
  const context = useContext(EmpresaContext);
  if (!context) {
    throw new Error("useEmpresas debe usarse dentro de EmpresaProvider");
  }
  return context;
};
