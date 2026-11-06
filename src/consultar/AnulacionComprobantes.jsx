import React, { useState, useEffect, useRef } from "react";
import api from "../config/axios";
import { useLoading } from "../context/LoadingContext";
import { useEmpresas } from "../context/EmpresaContext";
import "../styles/consultar/comprobantes.css";

const TIPOS_COMPROBANTE = {
    "01": "FAC",
    "03": "LIQ",
    "04": "NC",
    "05": "ND",
    "06": "GUÍA",
    "07": "RET",
};

const ESTADOS = {
    emision: {
        "2": { etiqueta: "Autorizado", accion: "anular" },
        "6": { etiqueta: "Anulado", accion: "reversar" },
    },
    recepcion: {
        RECP: { etiqueta: "Recibido", accion: "anular" },
        ANU: { etiqueta: "Anulado", accion: "reversar" },
    },
};

const ETIQUETA_ACCION = {
    anular: "Anular",
    reversar: "Reversar",
};

const RUTAS = {
    emision: "/comprobantesEmitidos/anulacion",
    recepcion: "/comprobantesRecibidos/anulacion",
};

const AnulacionComprobantes = () => {
    const { setIsLoading } = useLoading();
    const { empresaSeleccionada } = useEmpresas();
    const [comprobantes, setComprobantes] = useState([]);
    const [error, setError] = useState("");
    const [exito, setExito] = useState("");
    const [consultado, setConsultado] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const comprobantesPorPagina = 20;
    const [tipoConsulta, setTipoConsulta] = useState("");
    const [tipoResultado, setTipoResultado] = useState("");
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [numComprobante, setNumComprobante] = useState("");
    const [tipoComprobante, setTipoComprobante] = useState("");
    const [cantidadMostrar, setCantidadMostrar] = useState("20");
    const [ruc, setRuc] = useState("");
    const [filaSeleccionada, setFilaSeleccionada] = useState(null);
    const [showModalConfirmacion, setShowModalConfirmacion] = useState(false);
    const [claveEnProceso, setClaveEnProceso] = useState("");
    const enProcesoRef = useRef(false);
    const consultaIdRef = useRef(0);

    const rolUsuario = localStorage.getItem("rol");
    const esAdmin = rolUsuario === "ADMIN";

    const fechaHoyStr = () => {
        const fechaHoy = new Date();
        const anio = fechaHoy.getFullYear();
        const mes = String(fechaHoy.getMonth() + 1).padStart(2, "0");
        const dia = String(fechaHoy.getDate()).padStart(2, "0");
        return `${anio}-${mes}-${dia}`;
    };

    const ultimoDiaDelMes = (anio, mes) => {
        const ultimoDia = new Date(anio, mes, 0).getDate();
        return `${anio}-${String(mes).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;
    };

    const handleFechaInicioChange = (value) => {
        setFechaInicio(value);
        if (value) {
            const [anio, mes] = value.split("-").map(Number);
            const finMes = ultimoDiaDelMes(anio, mes);
            const hoy = fechaHoyStr();
            setFechaFin(finMes > hoy ? hoy : finMes);
        }
    };

    useEffect(() => {
        const cargarDatos = () => {
            try {
                setIsLoading(true);
                const fechaHoy = new Date();
                const anio = fechaHoy.getFullYear();
                const mes = String(fechaHoy.getMonth() + 1).padStart(2, "0");
                const dia = String(fechaHoy.getDate()).padStart(2, "0");
                setFechaFin(`${anio}-${mes}-${dia}`);

                const primerDiaMes = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth(), 1);
                const anioInicio = primerDiaMes.getFullYear();
                const mesInicio = String(primerDiaMes.getMonth() + 1).padStart(2, "0");
                const diaInicio = String(primerDiaMes.getDate()).padStart(2, "0");
                setFechaInicio(`${anioInicio}-${mesInicio}-${diaInicio}`);
            } catch (errorCarga) {
                console.error("Error cargando datos:", errorCarga);
            } finally {
                setIsLoading(false);
            }
        };
        cargarDatos();
    }, [setIsLoading]);

    const cerrarMesj = () => {
        setError("");
        setExito("");
    };

    const obtenerRuc = () => {
        if (esAdmin) return ruc.trim();
        return empresaSeleccionada?.ruc || "";
    };

    const validarFiltros = () => {
        if (!tipoConsulta) {
            return "Debes seleccionar el tipo de consulta";
        }
        if (!obtenerRuc()) {
            return "Debes ingresar el RUC";
        }
        if (!fechaInicio || !fechaFin) {
            return "Debes seleccionar fecha inicio y fin";
        }
        if (fechaInicio > fechaFin) {
            return "La fecha desde no puede ser mayor que la fecha hasta";
        }
        const cantidad = Number(cantidadMostrar);
        if (!Number.isInteger(cantidad) || cantidad <= 0) {
            return "La cantidad a mostrar debe ser mayor a cero";
        }
        return "";
    };

    const fetchComprobantes = async () => {
        cerrarMesj();
        const mensaje = validarFiltros();
        if (mensaje) {
            setError(`🚫 ${mensaje}`);
            return;
        }

        const tipo = tipoConsulta;
        const consultaId = ++consultaIdRef.current;
        try {
            setIsLoading(true);
            setComprobantes([]);
            setConsultado(false);
            const params = new URLSearchParams({
                ruc: obtenerRuc(),
                fechaInicio,
                fechaFin,
                cantidadMostrar,
            });
            if (tipoComprobante) params.append("tipoComprobante", tipoComprobante);
            if (numComprobante) params.append("numComprobante", numComprobante);

            const { data } = await api.get(`${RUTAS[tipo]}/consulta?${params.toString()}`);
            if (consultaId !== consultaIdRef.current) return;
            setComprobantes(Array.isArray(data) ? data : []);
            setTipoResultado(tipo);
            setConsultado(true);
            setExito("✅ Consulta realizada correctamente");
            setCurrentPage(1);
        } catch (err) {
            if (consultaId !== consultaIdRef.current) return;
            setTipoResultado("");
            setError(`🚫 ${err.response?.data?.message || err.message || "Error al consultar comprobantes"}`);
        } finally {
            if (consultaId === consultaIdRef.current) setIsLoading(false);
        }
    };

    const handleTipoChange = (value) => {
        consultaIdRef.current += 1;
        setIsLoading(false);
        setTipoConsulta(value);
        setComprobantes([]);
        setTipoResultado("");
        setConsultado(false);
        setCurrentPage(1);
        cerrarMesj();
    };

    const indexOfLast = currentPage * comprobantesPorPagina;
    const indexOfFirst = indexOfLast - comprobantesPorPagina;
    const comprobantesPaginados = comprobantes.slice(indexOfFirst, indexOfLast);
    const totalPaginas = Math.ceil(comprobantes.length / comprobantesPorPagina);

    useEffect(() => {
        setCurrentPage(1);
    }, [cantidadMostrar, fechaInicio, fechaFin, tipoComprobante, numComprobante, ruc, tipoConsulta]);

    const infoEstado = (tipo, estado) => ESTADOS[tipo]?.[estado] || null;

    const formatearNombre = (nombre) => {
        if (!nombre) return "—";
        return nombre
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ");
    };

    const abrirConfirmacion = (fila) => {
        if (claveEnProceso || enProcesoRef.current) return;
        setFilaSeleccionada(fila);
        setShowModalConfirmacion(true);
    };

    const cerrarModalConfirmacion = () => {
        if (claveEnProceso || enProcesoRef.current) return;
        setFilaSeleccionada(null);
        setShowModalConfirmacion(false);
    };

    const cambiarEstado = async () => {
        if (!filaSeleccionada || enProcesoRef.current || !tipoResultado) return;
        const clave = filaSeleccionada.claveAcceso;
        enProcesoRef.current = true;
        setClaveEnProceso(clave);
        cerrarMesj();
        try {
            setIsLoading(true);
            const { data } = await api.put(`${RUTAS[tipoResultado]}/${encodeURIComponent(clave)}`);
            setComprobantes((prev) =>
                prev.map((item) =>
                    item.claveAcceso === clave
                        ? { ...item, estado: data?.estadoNuevo ?? item.estado }
                        : item
                )
            );
            setExito(data?.mensaje ? `✅ ${data.mensaje}` : "✅ Estado actualizado");
        } catch (err) {
            setError(`🚫 ${err.response?.data?.message || err.message || "No se pudo cambiar el estado del comprobante"}`);
        } finally {
            enProcesoRef.current = false;
            setClaveEnProceso("");
            setFilaSeleccionada(null);
            setShowModalConfirmacion(false);
            setIsLoading(false);
        }
    };

    const accionSeleccionada = filaSeleccionada
        ? infoEstado(tipoResultado, filaSeleccionada.estado)?.accion
        : null;
    const textoConfirmacion = () => {
        if (!filaSeleccionada) return "";
        const numero = filaSeleccionada.numeroComprobante || "";
        const nombre = (filaSeleccionada.nombre || "").trim();
        const deEmpresa = nombre ? ` de ${nombre}` : "";
        if (accionSeleccionada === "anular") {
            return `¿Desea anular el comprobante ${numero}${deEmpresa}?`;
        }
        if (accionSeleccionada === "reversar") {
            return `¿Desea reversar la anulación del comprobante ${numero}${deEmpresa}?`;
        }
        return "¿Confirmar el cambio de estado?";
    };
    const etiquetaRuc = tipoConsulta === "recepcion"
        ? "RUC Destinatario:"
        : tipoConsulta === "emision"
            ? "RUC Emisor:"
            : "RUC:";
    const etiquetaNombre = tipoResultado === "recepcion"
        ? "Emisor"
        : tipoResultado === "emision"
            ? "Receptor"
            : "Nombre";

    return (
        <div className="container-ts-v2">
            <h2>Anulación de Comprobantes</h2>

            <div className="sect-busqueda-v2">
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <div style={{ display: "inline-grid" }}>
                        <label style={{ color: "#221f1f", marginBottom: "5px" }}>Tipo de consulta:</label>
                        <select
                            name="tipoConsulta"
                            value={tipoConsulta}
                            className="modal-select"
                            style={{ width: "130px", color: "#221f1f", fontSize: "12px", height: "36px" }}
                            onChange={(e) => handleTipoChange(e.target.value)}
                        >
                            <option value="">Seleccione</option>
                            <option value="emision" style={{ color: "#221f1f" }}>Emisión</option>
                            <option value="recepcion" style={{ color: "#221f1f" }}>Recepción</option>
                        </select>
                    </div>

                    {esAdmin && (
                        <div style={{ display: "inline-grid" }}>
                            <label style={{ color: "#221f1f", marginBottom: "5px" }}>{etiquetaRuc}</label>
                            <input
                                type="text"
                                placeholder="Ingrese RUC"
                                value={ruc}
                                maxLength={13}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (/^\d*$/.test(value)) setRuc(value);
                                }}
                                className="modal-input"
                                style={{ width: "120px" }}
                            />
                        </div>
                    )}

                    {!esAdmin && (
                        <div style={{ display: "inline-grid" }}>
                            <label style={{ color: "#221f1f", marginBottom: "5px" }}>{etiquetaRuc}</label>
                            <input
                                type="text"
                                value={empresaSeleccionada?.ruc || ""}
                                disabled
                                className="modal-input"
                                style={{ width: "120px", background: "#FFF" }}
                            />
                        </div>
                    )}

                    <div style={{ display: "inline-grid" }}>
                        <label style={{ color: "#221f1f", marginBottom: "5px" }}>Fecha Inicio:</label>
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => handleFechaInicioChange(e.target.value)}
                            className="modal-date"
                            title="Fecha Inicio"
                            style={{ color: "#221f1f", width: "110px" }}
                        />
                    </div>
                    <div style={{ display: "inline-grid" }}>
                        <label style={{ color: "#221f1f", marginBottom: "5px" }}>Fecha Fin:</label>
                        <input
                            type="date"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                            className="modal-date"
                            title="Fecha Fin"
                            style={{ color: "#221f1f", width: "110px" }}
                        />
                    </div>
                    <div style={{ display: "inline-grid" }}>
                        <label style={{ color: "#221f1f", marginBottom: "5px" }}>No. Comprobante:</label>
                        <input
                            type="text"
                            placeholder="001-001-000000000"
                            value={numComprobante}
                            maxLength={17}
                            className="modal-input"
                            style={{ width: "125px" }}
                            onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, "");
                                if (value.length > 3 && value.length <= 6) {
                                    value = value.slice(0, 3) + "-" + value.slice(3);
                                } else if (value.length > 6) {
                                    value = value.slice(0, 3) + "-" + value.slice(3, 6) + "-" + value.slice(6, 15);
                                }
                                setNumComprobante(value);
                            }}
                        />
                    </div>
                    <div style={{ display: "inline-grid" }}>
                        <label style={{ color: "#221f1f", marginBottom: "5px" }}>Tipo Comprobante:</label>
                        <select
                            name="tipoComprobante"
                            value={tipoComprobante}
                            className="modal-select"
                            style={{ width: "130px", color: "#221f1f", fontSize: "12px", height: "36px" }}
                            onChange={(e) => setTipoComprobante(e.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="01" style={{ color: "#221f1f" }}>Factura</option>
                            <option value="04" style={{ color: "#221f1f" }}>Nota de Crédito</option>
                            <option value="05" style={{ color: "#221f1f" }}>Nota de Débito</option>
                            <option value="07" style={{ color: "#221f1f" }}>Retención</option>
                            <option value="06" style={{ color: "#221f1f" }}>Guía de Remisión</option>
                            <option value="03" style={{ color: "#221f1f" }}>Liquidación</option>
                        </select>
                    </div>
                    <div style={{ display: "inline-grid" }}>
                        <label style={{ color: "#221f1f", marginBottom: "5px" }}>Cantidad:</label>
                        <select
                            name="cantidadMostrar"
                            value={cantidadMostrar}
                            className="modal-select"
                            style={{ width: "80px", color: "#221f1f", fontSize: "12px", height: "36px" }}
                            onChange={(e) => setCantidadMostrar(e.target.value)}
                        >
                            <option value="20" style={{ color: "#221f1f" }}>20</option>
                            <option value="50" style={{ color: "#221f1f" }}>50</option>
                            <option value="100" style={{ color: "#221f1f" }}>100</option>
                        </select>
                    </div>
                </div>
                <div className="btn-acciones">
                    <button className="btn-crear" onClick={fetchComprobantes}>
                        Ejecutar consulta
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: "10px" }}>
                {error !== "" && (
                    <div className="msj-error-consulta-v2">
                        <p>{error}</p>
                        <button className="close-msj-v2" onClick={cerrarMesj}>×</button>
                    </div>
                )}
                {exito !== "" && (
                    <div className="msj-exito-consulta-v2">
                        <p>{exito}</p>
                        <button className="close-msj-v2" onClick={cerrarMesj}>×</button>
                    </div>
                )}
            </div>

            <table className="general-comp">
                <thead>
                    <tr>
                        <th>Comprobante</th>
                        <th>Tipo</th>
                        <th>Fec. Emisión</th>
                        <th>Fec. Autorización</th>
                        <th>{etiquetaNombre}</th>
                        <th>Estado</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {comprobantesPaginados.map((u) => {
                        const estado = infoEstado(tipoResultado, u.estado);
                        const enProceso = claveEnProceso === u.claveAcceso;
                        return (
                            <tr key={u.claveAcceso}>
                                <td title={u.claveAcceso}>{u.numeroComprobante}</td>
                                <td>{TIPOS_COMPROBANTE[u.tipoComprobante] || u.tipoComprobante || "Otros"}</td>
                                <td>
                                    {u.fechaEmision
                                        ? new Date(u.fechaEmision).toLocaleDateString("es-EC", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                        })
                                        : "—"}
                                </td>
                                <td>
                                    {u.fechaAutorizacion
                                        ? new Date(u.fechaAutorizacion).toLocaleDateString("es-EC", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: false,
                                        })
                                        : "—"}
                                </td>
                                <td style={{ textAlign: "left" }}>{formatearNombre(u.nombre)}</td>
                                <td>{estado?.etiqueta || u.estado || "—"}</td>
                                <td>
                                    {estado && (
                                        <button
                                            className="btn-accion"
                                            title={ETIQUETA_ACCION[estado.accion]}
                                            disabled={enProceso || Boolean(claveEnProceso)}
                                            onClick={() => abrirConfirmacion(u)}
                                            style={{
                                                background: estado.accion === "anular" ? "#a33b3b" : "#1a6fb5",
                                                color: "#fff",
                                                opacity: enProceso || claveEnProceso ? 0.6 : 1,
                                                cursor: enProceso || claveEnProceso ? "not-allowed" : "pointer",
                                            }}
                                        >
                                            {enProceso ? "..." : ETIQUETA_ACCION[estado.accion]}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    {consultado && comprobantes.length === 0 && (
                        <tr>
                            <td colSpan={7}>No se encontraron comprobantes</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="general-paginador">
                <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1 || totalPaginas === 0}
                >
                    ◀
                </button>
                <span>
                    Página {currentPage} de {totalPaginas === 0 ? 1 : totalPaginas}
                </span>
                <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPaginas))}
                    disabled={currentPage === totalPaginas || totalPaginas === 0}
                >
                    ▶
                </button>
            </div>

            {showModalConfirmacion && filaSeleccionada && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Confirmar</h3>
                            <button className="modal-close" onClick={cerrarModalConfirmacion} disabled={Boolean(claveEnProceso)}>
                                ×
                            </button>
                        </div>
                        <div className="msj-pregunta">
                            {textoConfirmacion()}
                        </div>
                        <div className="modal-buttons">
                            <button className="modal-btn-save" onClick={cambiarEstado} disabled={Boolean(claveEnProceso)}>
                                {claveEnProceso ? "Procesando..." : "Aceptar"}
                            </button>
                            <button className="modal-btn-cancel" onClick={cerrarModalConfirmacion} disabled={Boolean(claveEnProceso)}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnulacionComprobantes;
