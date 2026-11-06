import React from "react";
import { buildIframeUrl, resolveIframeBaseUrl } from "../config/apiConfig";
import useParametros from "../hooks/useParametros";

const TrsfAtsXml = () => {
    const { parametros, loading } = useParametros();
    const iframeSrc = buildIframeUrl(
        "/regulatorios/ats/desde-excel",
        {},
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
                    title="Transformar Excel a ATS(XML)"
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

export default TrsfAtsXml;
