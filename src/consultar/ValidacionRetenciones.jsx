import React from "react";
import { useEmpresas } from "../context/EmpresaContext";
import { buildIframeUrl } from "../config/apiConfig";

const ValidacionRetenciones = () => {
    const { empresaSeleccionada } = useEmpresas();
    const iframeSrc = buildIframeUrl("/retenciones/validacion", {
        ruc: empresaSeleccionada?.ruc,
    });

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden"
            }}
        >
            {iframeSrc ? (
                <iframe
                    title="Validación de Retenciones"
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

export default ValidacionRetenciones;