import React from "react";
import { useEmpresas } from "../context/EmpresaContext";
import { buildIframeUrl, resolveIframeBaseUrl } from "../config/apiConfig";
import useParametros from "../hooks/useParametros";

const CompraVentas = () => {
    const { empresaSeleccionada } = useEmpresas();
    const { parametros, loading } = useParametros();
    const iframeSrc = buildIframeUrl(
        "/regulatorios/anexoCompraVentas",
        { ruc: empresaSeleccionada?.ruc },
        resolveIframeBaseUrl(parametros)
    );

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden"
            }}
        >
            {loading ? null : iframeSrc ? (
                <iframe
                    title="Anexo Compras y Ventas"
                    src={iframeSrc}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{
                        border: "none"
                    }}
                />
            ) : (
                <div style={{ padding: "20px" }}>
                    Servicio no disponible, por favor consulte con el administrador.
                </div>
            )}
        </div>
    );
};

export default CompraVentas;