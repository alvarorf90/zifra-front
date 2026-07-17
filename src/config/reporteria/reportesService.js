import api from "../axios";

export const descargarReporteRecibido = async (filtros) => {
  return await api.post("/reportes/recibidos",
    filtros,
    {
      responseType: "blob",
    }
  );
};