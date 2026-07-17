import React, { useEffect, useState, useCallback } from "react";
import api from "../config/axios";
import ModalExito from "../components/ModalExito";
import { useLoading } from "../context/LoadingContext";

const Empresa = () => {
    const { setIsLoading } = useLoading();
    const [empresas, setEmpresas] = useState([]);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredEmpresas, setFilteredEmpresas] = useState([]);
    const empresasPorPagina = 5;
    const [error, setError] = useState(null);
    const [infoMessage, setInfoMessage] = useState("");
    const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
    const [claveCertificado, setClaveCertificado] = useState("");

    // --- Datos Modal ---
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [modalError, setModalError] = useState("");
    const [showModalCertificado, setShowModalCertificado] = useState(false);
    
    // --- Cargar empresas ---
    const fetchEmpresas = useCallback(async () => {
        try {
            setIsLoading(true);
            const { data } = await api.get("/empresas/obtenerEmpresasPorUsuario");
            setEmpresas(data);
            setFilteredEmpresas(data);
            setError(null);
        } catch (err) {
            setError("🚫 " +err.response?.data?.message || err.message || "Error al cargar empresas por usuario");
        } finally {
            setIsLoading(false);
        }
    }, [setIsLoading]);
    
    // --- BUSQUEDA DE EMPRESA ---
    useEffect(() => {
        fetchEmpresas();
    }, [fetchEmpresas]);
    
    useEffect(() => {
        const resultado = empresas.filter((u) =>
            u.ruc.toLowerCase().includes(search.toLowerCase()) || 
            u.razonSocial.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredEmpresas(resultado);
        setCurrentPage(1);
    }, [search, empresas]);

    const indexOfLast = currentPage * empresasPorPagina;
    const indexOfFirst = indexOfLast - empresasPorPagina;
    const empresasPaginados = filteredEmpresas.slice(indexOfFirst, indexOfLast);
    const totalPaginas = Math.ceil(filteredEmpresas.length / empresasPorPagina);

    // --- CERTIFICADO DIGITAL ---
    const mostrarModalCertificado = (empresa) => {
        setEmpresaSeleccionada(empresa); 
        setSearch("");
        setClaveCertificado("");
        setModalError("");
        setShowModalCertificado(true);
    };

    const cerrarModalCertificado = () => {
        setShowModalCertificado(false);
        setEmpresaSeleccionada(null);
        setClaveCertificado("");
        setModalError("");
    };

    const actualizarCertificado = async () => {
        setModalError("");
        if (!claveCertificado || claveCertificado.trim() === "") {
            setModalError("🚫 La clave del certificado no puede estar vacía");
            return;
        }

        try {
            setIsLoading(true);
            const formData = new FormData();
            formData.append("datos",
                new Blob(
                    [
                        JSON.stringify({
                            claveCertificado: claveCertificado,
                        }),
                    ], { type: "application/json" }
                )
            );

            await api.post(`/empresas/${empresaSeleccionada.ruc}/actualizarClave`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            fetchEmpresas();
            setInfoMessage("Clave del certificado actualizada correctamente");
            setShowInfoModal(true);
            cerrarModalCertificado();
        } catch (err) {
            setModalError("🚫 "+ (err.response?.data?.message || "Error al actualizar clave del certificado"));
        } finally {
            setIsLoading(false); 
        }
    };
  
    // --- CERRAR MODAL INFO ---
    const cerrarModalInfo = () => {
        setShowInfoModal(false);
    };

    return (
        <div className="container-ts">
            <h2>Gestión de Empresas</h2>
            <div className="sect-busq-new">
                <input type="text" placeholder="🔎 Buscar..." value={search}
                onChange={(e) => setSearch(e.target.value)} className="general-search" />
            </div>

            {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}

            <table className="general-table">
                <thead>
                <tr>
                    <th>RUC</th>
                    <th>Razón Social</th>
                    <th>Dirección</th>
                    <th>Fecha Caducidad Cert.</th>
                    <th>Acciones</th>
                </tr>
                </thead>
                <tbody>
                {empresasPaginados.map((u) => (
                    <tr key={u.ruc}>
                        <td>{u.ruc}</td>
                        <td>{u.razonSocial}</td>
                        <td>{u.direccionMatriz}</td>
                        <td>
                            {u.fechaCaducidad ? u.fechaCaducidad.split("-").reverse().join("/") : "—"}
                        </td>
                        <td>
                            <button className="btn-accion btn-clave" title="Certificado Digital" onClick={() => mostrarModalCertificado(u)}>
                                📋
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            <div className="general-paginador">
                <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1} >
                    ◀
                </button>
                <span>
                    Página {currentPage} de {totalPaginas}
                </span>
                <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPaginas))}
                    disabled={currentPage === totalPaginas} >
                    ▶
                </button>
            </div>

            {/* --- Modal informativo de exito --- */}
            <ModalExito
                visible={showInfoModal}
                msjExito={infoMessage}
                onClose={cerrarModalInfo}
            />    
           

            {/* --- Modal certificado digital --- */}
            {showModalCertificado && empresaSeleccionada && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Clave de Certificado Digital</h3>
                            <button className="modal-close" onClick={cerrarModalCertificado}>×</button>
                        </div>

                        {modalError && (
                            <div className="msj-error" style={{ marginTop: "0px", marginBottom: "10px" }}>
                            <p>{modalError}</p>
                            </div>
                        )}

                        <div className="modal-body" style={{ display: "inline-grid" }}>
                            <label style={{ color: "#333", marginBottom: "10px" }}>
                                RUC: <b>{empresaSeleccionada.ruc}</b>
                            </label>
                            <label style={{ color: "#333", marginBottom: "10px" }}>
                                Razón social: <b>{empresaSeleccionada.razonSocial}</b>
                            </label>

                            <div style={{ marginTop: "10px", display:"inline-flex"}}>
                                <input type="password" placeholder="Clave del certificado" value={claveCertificado} maxLength={30} autoComplete="new-password" 
                                    onChange={(e) => setClaveCertificado(e.target.value)} className="modal-input" style={{width:"340px", marginRight:"10px"}} />
                            </div>
                        </div>

                        <div className="modal-buttons">
                            <button className="modal-btn-save" onClick={actualizarCertificado}>Guardar</button>
                            <button className="modal-btn-cancel" onClick={cerrarModalCertificado}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
export default Empresa;