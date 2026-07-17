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
    const [rucEmpresa, setRucEmpresa] = useState("");
    const [razonSocialEmpresa, setRazonSocialEmpresa] = useState("");
    const [nombreComercialEmpresa, setNombreComercialEmpresa] = useState("");
    const [contribuyenteEspecialEmpresa, setContribuyenteEspecialEmpresa] = useState("");
    const [direccionEmpresa, setDireccionEmpresa] = useState("");
    const [obligadoContabilidadEmpresa, setObligadoContabilidadEmpresa] = useState("");
    const [infoMessage, setInfoMessage] = useState("");
    const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
    const [certificado, setCertificado] = useState(null);
    const [claveCertificado, setClaveCertificado] = useState("");
    const [fechaCaducidad, setFechaCaducidad] = useState(null);
    const [integracionEmpresa, setIntegracionEmpresa] = useState("");
    const [poolComprobantes, setPoolComprobantes] = useState("");
    const [tipoContrato, setTipoContrato] = useState("");
    const [fechaContrato, setFechaContrato] = useState(null);
    const [puntosEmision, setPuntosEmision] = useState([]);
    const [establecimiento, setEstablecimiento] = useState("");
    const [puntoEmision, setPuntoEmision] = useState("");
    const [tipoComprobante, setTipoComprobante] = useState("");
    const [secuencial, setSecuencial] = useState(1);
    const [editingPunto, setEditingPunto] = useState(false);
    const [puntoEdit, setPuntoEdit] = useState(null);

    // --- Datos Modal ---
    const [showModalEditar, setShowModalEditar] = useState(false);
    const [showModalCambioEstado, setShowModalCambioEstado] = useState(false);  
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showModalCrear, setShowModalCrear] = useState(false);
    const [modalError, setModalError] = useState("");
    const [infoExito, setInfoExito] = useState("");    
    const [showModalCertificado, setShowModalCertificado] = useState(false);
    const [showModalPuntoEmision, setShowModalPuntoEmision] = useState(false);
    const [showModalLogo, setShowModalLogo] = useState(false);
    const [logo, setLogo] = useState(null);
    
    // --- Cargar empresas ---
    const fetchEmpresas = useCallback(async () => {
        try {
            setIsLoading(true);
            const { data } = await api.get("/empresas");
            setEmpresas(data);
            setFilteredEmpresas(data);
            setError(null);
        } catch (err) {
            setError("🚫 " +err.response?.data?.message || err.message || "Error al cargar empresas");
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

    // --- CREAR NUEVO EMPRESA ---
    const mostrarModalCrear = () => {
        setRucEmpresa("");
        setRazonSocialEmpresa("");
        setNombreComercialEmpresa("");
        setContribuyenteEspecialEmpresa("");
        setDireccionEmpresa("");
        setObligadoContabilidadEmpresa("");
        setIntegracionEmpresa("");
        setPoolComprobantes("");
        setTipoContrato("");
        setFechaContrato(null);
        setModalError("");
        setShowModalCrear(true);
    };

    const cerrarModalCrear = () => {
        setShowModalCrear(false);
    };

    const crearEmpresa = async () => {
        if (!rucEmpresa || rucEmpresa.trim() === "") {
            setModalError("🚫 El RUC no puede estar vacío");
            return;
        }
        if(rucEmpresa.length !== 13){
            setModalError("🚫 El RUC debe tener 13 caracteres");
            return;
        }
        if (!razonSocialEmpresa || razonSocialEmpresa.trim() === "") {
            setModalError("🚫 La razón social no puede estar vacía");
            return;
        }
        if (!integracionEmpresa || integracionEmpresa.trim() === "") {
            setModalError("🚫 Debe elegir si aplica integración");
            return;
        }
        if (!tipoContrato || tipoContrato.trim() === "") {
            setModalError("🚫 Debe elegir el tipo de contrato");
            return;
        }
        if (!fechaContrato) {
            setModalError("🚫 La fecha fin contraro no puede estar vacía");
            return;
        }
        if(integracionEmpresa === "false"){
            if(!poolComprobantes || poolComprobantes.trim() === ""){
                setModalError("🚫 Debe ingresar el pool de comprobantes");
                return;
            }
        }
        try {
            setIsLoading(true);
            await api.post("/empresas/crear", { 
                ruc: rucEmpresa, 
                razonSocial : razonSocialEmpresa,
                nombreComercial : nombreComercialEmpresa,
                direccionMatriz : direccionEmpresa,
                contribuyenteEspecial : contribuyenteEspecialEmpresa,
                obligadaContabilidad : obligadoContabilidadEmpresa === "" ? null : obligadoContabilidadEmpresa,
                integracion : integracionEmpresa,
                poolComprobantes : poolComprobantes === "" ? null : poolComprobantes,
                tipoContrato : tipoContrato,
                fechaContrato : fechaContrato
            });
            fetchEmpresas();
            cerrarModalCrear();
            setInfoMessage("Empresa creada correctamente");
            setShowInfoModal(true);
        } catch (err) {
            setModalError("🚫 " + (err.response?.data?.message || "Error al crear empresa"));
        } finally {
            setIsLoading(false); 
        }
    };

    // --- CAMBIAR ESTADO ---
    const mostarModalCambioEstado = (empresa) => {
        setEmpresaSeleccionada(empresa);
        setShowModalCambioEstado(true);
    };

    const cerrarModalCambioEstado = () => {
        setShowModalCambioEstado(false);
        setEmpresaSeleccionada(null);
    };

    const actualizarEstadoEmpresa = async () => {
        try {
            setIsLoading(true);
            await api.put(`/empresas/${empresaSeleccionada.ruc}/estado`, { activo: !empresaSeleccionada.activo });
            fetchEmpresas();
            cerrarModalCambioEstado();
            setInfoMessage("Estado actualizado correctamente");
            setShowInfoModal(true);
        } catch (err) {
            setModalError("🚫"+ (err.response?.data?.message || "Error al actualizar estado"));
        } finally {
            setIsLoading(false); 
        }
    };

    // --- EDITAR EMPRESA ---
    const mostrarModalEditar = (empresa) => {
        setEmpresaSeleccionada(empresa);
        setRazonSocialEmpresa(empresa.razonSocial);
        setNombreComercialEmpresa(empresa.nombreComercial);
        setContribuyenteEspecialEmpresa(empresa.contribuyenteEspecial);
        setDireccionEmpresa(empresa.direccionMatriz);
        setObligadoContabilidadEmpresa(empresa.obligadaContabilidad === null ? "" : empresa.obligadaContabilidad);
        setIntegracionEmpresa(empresa.integracion === null ? "" : empresa.integracion);
        setPoolComprobantes(empresa.poolComprobantes === null ? "" : String(empresa.poolComprobantes));
        setTipoContrato(empresa.tipoContrato);
        setFechaContrato(empresa.fechaContrato);
        setModalError("");
        setShowModalEditar(true);
    };

    const cerrarModalEditar = () => {
        setShowModalEditar(false);
        setEmpresaSeleccionada(null);
        setModalError("");
    };

    const actualizarEmpresa = async () => {
        try {
            setIsLoading(true);
            await api.put(`/empresas/${empresaSeleccionada.ruc}/editar`, { 
                razonSocial : razonSocialEmpresa,
                nombreComercial : nombreComercialEmpresa,
                direccionMatriz : direccionEmpresa,
                contribuyenteEspecial : contribuyenteEspecialEmpresa,
                obligadaContabilidad : obligadoContabilidadEmpresa === "" ? null : obligadoContabilidadEmpresa,
                integracion : integracionEmpresa,
                poolComprobantes : poolComprobantes === "" ? null : poolComprobantes,
                tipoContrato : tipoContrato,
                fechaContrato : fechaContrato
            });
            fetchEmpresas();
            cerrarModalEditar();
            setInfoMessage("Empresa actualizada correctamente");
            setShowInfoModal(true);
        } catch (err) {
            setModalError("🚫 "+ (err.response?.data?.message || "Error al actualizar empresa"));
        } finally {
            setIsLoading(false); 
        }
    };

    // --- CERTIFICADO DIGITAL ---
    const mostrarModalCertificado = (empresa) => {
        setEmpresaSeleccionada(empresa); 
        setCertificado(""); 
        setClaveCertificado("");
        setFechaCaducidad(null);
        setModalError("");
        setShowModalCertificado(true);
    };

    const cerrarModalCertificado = () => {
        setShowModalCertificado(false);
        setEmpresaSeleccionada(null);
        setCertificado(""); 
        setClaveCertificado("");
        setFechaCaducidad(null);
        setModalError("");
    };

    const actualizarCertificado = async () => {
        setModalError("");
        if (!certificado) {
            setModalError("🚫 Debe seleccionar un archivo .p12 antes de guardar");
            return;
        }
        if (!claveCertificado || claveCertificado.trim() === "") {
            setModalError("🚫 La clave del certificado no puede estar vacía");
            return;
        }

        if (!fechaCaducidad) {
            setModalError("🚫 La fecha caducidad no puede estar vacía");
            return;
        }

        try {
            setIsLoading(true);
            const formData = new FormData();
            formData.append("archivo", certificado);
            formData.append("datos",
                new Blob(
                    [
                        JSON.stringify({
                            claveCertificado: claveCertificado,
                            fechaCaducidad: fechaCaducidad,
                        }),
                    ], { type: "application/json" }
                )
            );

            await api.post(`/empresas/${empresaSeleccionada.ruc}/certificado`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            fetchEmpresas();
            setInfoMessage("Datos del certificado actualizado correctamente");
            setShowInfoModal(true);
            cerrarModalCertificado();
        } catch (err) {
            setModalError("🚫 "+ (err.response?.data?.message || "Error al actualizar datos certificado"));
        } finally {
            setIsLoading(false); 
        }
    };

    // -----Punto de Emisión--------------
    const mostrarModalPuntoEmision = async (empresa) => {        
        setEmpresaSeleccionada(empresa);
        setShowModalPuntoEmision(true);
        limpiarPuntoEmision();
        try {
            setIsLoading(true);
            const { data } = await api.get(`/puntoEmision/${empresa.ruc}/listaPtoEmisionEmpresa`);
            setPuntosEmision(data);
        } catch (err) {
            setModalError("🚫 "+ (err.response?.data?.message));
        } finally {
            setIsLoading(false); 
        }
    };

    const cerrarModalPuntoEmision = () => {
        setShowModalPuntoEmision(false);
        setEmpresaSeleccionada(null);
        setPuntosEmision([]);
        setPuntoEdit(null);
    };

    const limpiarPuntoEmision = () => {
        setModalError("");
        setInfoExito("");
        setEstablecimiento("");
        setPuntoEmision("");
        setTipoComprobante("")
        setSecuencial(0);
        setEditingPunto(false);
    };

    const crearPuntoEmision = async () => {        
        if (!establecimiento || !puntoEmision || !tipoComprobante) {
            setModalError("🚫 Debes completar establecimiento, punto de emisión y tipo de comprobante");
            return;
        }
        try {
            setIsLoading(true);
            await api.post(`/puntoEmision/${empresaSeleccionada.ruc}/crearPuntoEmision`, {
                establecimiento,
                puntoEmision,
                tipoComprobante,
                secuencial: 1
            });
            const { data } = await api.get(`/puntoEmision/${empresaSeleccionada.ruc}/listaPtoEmisionEmpresa`);
            setPuntosEmision(data);
            limpiarPuntoEmision();
            setInfoExito("Punto emisión creado correctamente");            
        } catch (err) {
            setModalError("🚫 " + (err.response?.data?.message || "Error al crear punto de emisión"));
        } finally {
            setIsLoading(false); 
        }
    };

    const editarSecuencial = (pto) => {
        setModalError("");
        setInfoExito("");
        setPuntoEdit(pto);
        setEditingPunto(true);
        setEstablecimiento(pto.establecimiento);
        setPuntoEmision(pto.puntoEmision);
        setTipoComprobante(pto.tipoComprobante)
        setSecuencial(pto.secuencial);        
    };

    const editarPuntoEmision = async () => {
        try {
            setIsLoading(true);
            await api.put(`/puntoEmision/${empresaSeleccionada.ruc}/${establecimiento}/${puntoEmision}/${tipoComprobante}/editarPuntoEmision`, {
                secuencial,
                activo: puntoEdit.activo
            });
            const { data } = await api.get(`/puntoEmision/${empresaSeleccionada.ruc}/listaPtoEmisionEmpresa`);
            setPuntosEmision(data);
            limpiarPuntoEmision();
            setInfoExito("Punto emisión actualizado correctamente");
        } catch (err) {
            setModalError("🚫 " + (err.response?.data?.message || "Error al editar punto de emisión"));
        } finally {
            setIsLoading(false); 
        }
    };

    const modificarEstadoPtoEmi = async (pto) => {
        limpiarPuntoEmision();
        try {
            setIsLoading(true);
            await api.put(`/puntoEmision/${empresaSeleccionada.ruc}/${pto.establecimiento}/${pto.puntoEmision}/${pto.tipoComprobante}/editarPuntoEmision`, {
                secuencial: pto.secuencial,
                activo: !pto.activo
            });
            const { data } = await api.get(`/puntoEmision/${empresaSeleccionada.ruc}/listaPtoEmisionEmpresa`);
            setPuntosEmision(data);
            limpiarPuntoEmision();
            setInfoExito("Punto emisión "+(pto.activo ? "deshabilitado" : "habilitado")+" correctamente");
        } catch (err) {
            setModalError("🚫 " + (err.response?.data?.message || "Error al editar punto de emisión"));
        } finally {
            setIsLoading(false); 
        }
    };

    // --- LOGO EMPRESA ---
    const mostrarModalLogo = (empresa) => {
        setEmpresaSeleccionada(empresa);
        setLogo(null);
        setModalError("");
        setShowModalLogo(true);
    };

    const cerrarModalLogo = () => {
        setShowModalLogo(false);
        setEmpresaSeleccionada(null);
        setLogo(null);
        setModalError("");
    };

    const actualizarLogo = async () => {
        setModalError("");
        if (!logo) {
            setModalError("🚫 Debe seleccionar un archivo de imagen (PNG o JPG) antes de guardar");
            return;
        }
        try {
            setIsLoading(true);
            const formData = new FormData();
            formData.append("logo", logo);
            await api.post(`/empresas/${empresaSeleccionada.ruc}/logo`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setInfoMessage("Logo actualizado correctamente");
            setShowInfoModal(true);
            cerrarModalLogo();
        } catch (err) {
            setModalError("🚫 " + (err.response?.data || "Error al actualizar logo"));
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
                <button className="btn-crear" onClick={mostrarModalCrear}>
                    + Nueva Empresa
                </button>
            </div>

            {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}

            <table className="general-table">
                <thead>
                <tr>
                    <th>RUC</th>
                    <th>Razón Social</th>
                    <th>Fecha Fin Contrato</th>
                    <th>Activo</th>
                    <th>Acciones</th>
                </tr>
                </thead>
                <tbody>
                {empresasPaginados.map((u) => (
                    <tr key={u.ruc}>
                        <td>{u.ruc}</td>
                        <td>{u.razonSocial}</td>
                        <td>
                            {u.fechaContrato ? u.fechaContrato.split("-").reverse().join("/") : "—"}
                        </td>
                        <td>{u.activo ? "✅" : "❌"}</td>
                        <td>
                            <button className="btn-accion btn-editar" title="Editar" onClick={() => mostrarModalEditar(u)}>
                                ✏️
                            </button>
                            <button className="btn-accion btn-toggle" title={u.activo ? "Deshabilitar" : "Habilitar"}
                                onClick={() => mostarModalCambioEstado(u)}>
                                🔄
                            </button>
                            <button className="btn-accion btn-clave" title="Certificado Digital" onClick={() => mostrarModalCertificado(u)}>
                                📋
                            </button>
                            {!u.integracion && (
                                <button className="btn-accion btn-pto-emi" title="Punto Emisión" onClick={() => mostrarModalPuntoEmision(u)}>
                                    📍
                                </button>
                            )}
                            <button className="btn-accion btn-logo" title="Logo Empresa" onClick={() => mostrarModalLogo(u)}>
                                🖼️
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

            {/* --- Modal Crear Empresa --- */}
            {showModalCrear && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Crear Nueva Empresa</h3>
                            <button className="modal-close" onClick={cerrarModalCrear}>×</button>
                        </div>

                        {modalError && (
                            <div className="msj-error" style={{marginTop:"0px", marginBottom:"10px"}}>
                                <p>{modalError}</p>
                            </div>
                        )}

                        <div className="modal-body" style={{display:"inline-grid"}}>
                            <input type="text" placeholder="Ingrese RUC" value={rucEmpresa} style={{marginBottom:"10px"}} maxLength={13}
                                className="modal-input" onChange={(e) => { const value = e.target.value;
                                    if (/^\d*$/.test(value)) { 
                                        setRucEmpresa(value);
                                    }
                                }}
                            />
                            <input type="text" placeholder="Ingrese razón social" value={razonSocialEmpresa} style={{ marginBottom: "10px" }}
                                maxLength={80} className="modal-input" onChange={(e) => { const value = e.target.value;
                                    if (/^[a-zA-Z0-9.,\s]*$/.test(value)) {  
                                        setRazonSocialEmpresa(value);
                                    }
                                }}                                
                            />
                            <input type="text" placeholder="Ingrese nombre comercial" value={nombreComercialEmpresa} style={{ marginBottom: "10px" }}
                                maxLength={80} className="modal-input" onChange={(e) => { const value = e.target.value;
                                    if (/^[a-zA-Z0-9.,\s]*$/.test(value)) {  
                                        setNombreComercialEmpresa(value);
                                    }
                                }}                                
                            />
                            <input type="text" placeholder="Ingrese dirección" value={direccionEmpresa} style={{marginBottom:"10px"}} maxLength={100}
                                onChange={(e) => setDireccionEmpresa(e.target.value)} className="modal-input" />                             
                            <div style={{display:"inline-flex", justifyContent:"space-between"}}>
                                <input type="text" placeholder="Contrib. Esp." value={contribuyenteEspecialEmpresa} style={{marginBottom:"10px", width:"160px"}} maxLength={5}
                                    className="modal-input" onChange={(e) => { const value = e.target.value;
                                        if (/^\d*$/.test(value)) { 
                                            setContribuyenteEspecialEmpresa(value);
                                        }
                                    }}
                                />                       
                                <select name="obligadoContabilidad" value={obligadoContabilidadEmpresa} className="modal-select"
                                    onChange={(e) => setObligadoContabilidadEmpresa(e.target.value)}>
                                    <option value="" disabled>Oblig. Contab.</option>
                                    <option value="SI" style={{color: "#221f1f"}}>Si</option>
                                    <option value="NO" style={{color: "#221f1f"}}>No</option>
                                </select>
                            </div>
                            <div style={{display:"inline-flex", justifyContent:"space-between"}}>
                                <select name="integracion" value={integracionEmpresa} className="modal-select" style={{marginBottom: "10px"}}
                                    onChange={(e) => {
                                        setIntegracionEmpresa(e.target.value);
                                        if (e.target.value === "true") {
                                            setPoolComprobantes("");
                                        }
                                    }} >
                                    <option value="" disabled>Integración</option>
                                    <option value="true" style={{color: "#221f1f"}}>Si</option>
                                    <option value="false" style={{color: "#221f1f"}}>No</option>
                                </select>                     
                                <select name="tipoContrato" value={tipoContrato} className="modal-select" 
                                    onChange={(e) => setTipoContrato(e.target.value)}>
                                    <option value="" disabled>Tipo Contrato</option>
                                    <option value="E" style={{color: "#221f1f"}}>Emisión</option>
                                    <option value="R" style={{color: "#221f1f"}}>Recepción</option>
                                    <option value="T" style={{color: "#221f1f"}}>Ambos</option>
                                </select>
                            </div>
                            <div style={{display:"inline-flex", justifyContent:"space-between"}}>
                                <input type="text" placeholder="Pool Comprobantes" value={poolComprobantes} style={{marginBottom:"10px", width:"160px"}} maxLength={4}
                                    className="modal-input" onChange={(e) => { const value = e.target.value;
                                        if (/^\d*$/.test(value)) { 
                                            setPoolComprobantes(value);
                                        }
                                    }} disabled={integracionEmpresa === "true"} />                    
                                <input type="date" value={fechaContrato} onChange={(e) => setFechaContrato(e.target.value)}
                                    className="modal-date" style={{height:"36px"}} title="Fecha Fin Contrato"/>
                            </div>
                        </div>                            

                        <div className="modal-buttons">
                            <button className="modal-btn-save" onClick={crearEmpresa}>Crear</button>
                            <button className="modal-btn-cancel" onClick={cerrarModalCrear}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Modal cambio estado --- */}
            {showModalCambioEstado && empresaSeleccionada &&(
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Actualizar Estado</h3>
                            <button className="modal-close" onClick={cerrarModalCambioEstado}>
                                ×
                            </button>
                        </div>

                        <div className="msj-pregunta">
                            ¿Estás seguro que deseas {empresaSeleccionada?.activo ? "deshabilitar" : "habilitar"} la empresa <b>{empresaSeleccionada?.razonSocial}</b>?
                        </div>

                        <div className="modal-buttons">
                            <button className="modal-btn-save" onClick={actualizarEstadoEmpresa}>Aceptar</button>
                            <button className="modal-btn-cancel" onClick={cerrarModalCambioEstado}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Modal editar --- */}
            {showModalEditar && empresaSeleccionada &&(
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Editar Empresa</h3>
                            <button className="modal-close" onClick={cerrarModalEditar}>
                                ×
                            </button>
                        </div>

                        {modalError && (
                            <div className="msj-error" style={{marginTop:"0px", marginBottom:"10px"}}>
                                <p>{modalError}</p>
                            </div>
                        )}

                        <div className="modal-body" style={{display:"inline-grid"}}>
                            <label style={{color:"#333", marginBottom:"10px"}}>RUC: <b>{empresaSeleccionada.ruc}</b></label>
                            <input type="text" placeholder="Ingrese razón social" value={razonSocialEmpresa} style={{ marginBottom: "10px" }}
                                maxLength={80} className="modal-input" onChange={(e) => { const value = e.target.value;
                                    if (/^[a-zA-Z0-9.,\s]*$/.test(value)) {  
                                        setRazonSocialEmpresa(value);
                                    }
                                }}                                
                            />
                            <input type="text" placeholder="Ingrese nombre comercial" value={nombreComercialEmpresa} style={{ marginBottom: "10px" }}
                                maxLength={80} className="modal-input" onChange={(e) => { const value = e.target.value;
                                    if (/^[a-zA-Z0-9.,\s]*$/.test(value)) {  
                                        setNombreComercialEmpresa(value);
                                    }
                                }}                                
                            />
                            <input type="text" placeholder="Ingrese dirección" value={direccionEmpresa} style={{marginBottom:"10px"}} maxLength={100}
                                onChange={(e) => setDireccionEmpresa(e.target.value)} className="modal-input" />                             
                            <div style={{display:"inline-flex", justifyContent:"space-between"}}>
                                <input type="text" placeholder="Contrib. Esp." value={contribuyenteEspecialEmpresa} style={{marginBottom:"10px", width:"160px"}} 
                                    maxLength={5} className="modal-input" onChange={(e) => { const value = e.target.value;
                                        if (/^\d*$/.test(value)) { 
                                            setContribuyenteEspecialEmpresa(value);
                                        }
                                    }}
                                />                          
                                <select name="obligadoContabilidad" value={obligadoContabilidadEmpresa} className="modal-select" 
                                    onChange={(e) => setObligadoContabilidadEmpresa(e.target.value)}>
                                    <option value="" disabled>Oblig. Contab.</option>
                                    <option value="SI" style={{color: "#221f1f"}}>Si</option>
                                    <option value="NO" style={{color: "#221f1f"}}>No</option>
                                </select>
                            </div>

                            <div style={{display:"inline-flex", justifyContent:"space-between"}}>
                                <select name="integracion" value={integracionEmpresa} className="modal-select" style={{ marginBottom: "10px"}}
                                    onChange={(e) => {
                                        setIntegracionEmpresa(e.target.value);
                                        if (e.target.value === "true") {
                                            setPoolComprobantes("");
                                        }
                                    }} disabled>
                                    <option value="" disabled>Integración</option>
                                    <option value="true" style={{color: "#221f1f"}}>Si</option>
                                    <option value="false" style={{color: "#221f1f"}}>No</option>
                                </select>                     
                                <select name="tipoContrato" value={tipoContrato} className="modal-select" onChange={(e) => setTipoContrato(e.target.value)} disabled>
                                    <option value="" disabled>Tipo Contrato</option>
                                    <option value="E" style={{color: "#221f1f"}}>Emisión</option>
                                    <option value="R" style={{color: "#221f1f"}}>Recepción</option>
                                    <option value="T" style={{color: "#221f1f"}}>Ambos</option>
                                </select>
                            </div>
                            <div style={{display:"inline-flex", justifyContent:"space-between"}}>
                                <input type="text" placeholder="Pool Comprobantes" value={poolComprobantes} style={{marginBottom:"10px", width:"160px"}} maxLength={4}
                                    className="modal-input" onChange={(e) => { const value = e.target.value;
                                        if (/^\d*$/.test(value)) { 
                                            setPoolComprobantes(value);
                                        }
                                    }} disabled={integracionEmpresa === "true" || integracionEmpresa === true} />                    
                                <input type="date" value={fechaContrato} onChange={(e) => setFechaContrato(e.target.value)}
                                    className="modal-date" style={{height:"40px"}} title="Fecha Fin Contrato"/>
                            </div>            

                        </div>

                        <div className="modal-buttons">
                            <button className="modal-btn-save" onClick={actualizarEmpresa}>Editar</button>
                            <button className="modal-btn-cancel" onClick={cerrarModalEditar}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Modal certificado digital --- */}
            {showModalCertificado && empresaSeleccionada && (
                <div className="modal-overlay">
                    <div className="modal-content">
                    <div className="modal-header">
                        <h3>Certificado Digital</h3>
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

                        <div style={{ display: "flex", gap: "5px" }}>
                            {/* Input solo lectura para mostrar el nombre del archivo */}
                            <input id="certDig" type="text" placeholder="Archivo .p12" value={certificado?.name || ""}
                                style={{ width: "300px" }} className="modal-input" readOnly />

                            {/* Botón que abre el selector de archivos */}
                            <button id="cargarCert" className="btn-accion" title="Cargar"
                                onClick={() => document.getElementById("fileInputCert").click()} >
                                📤
                            </button>

                            {/* Input oculto tipo file */}
                            <input type="file" id="fileInputCert" accept=".p12" style={{ display: "none" }}
                                onChange={(e) => { const file = e.target.files[0];
                                    if (file && file.name.endsWith(".p12")) {
                                        setCertificado(file); 
                                        setModalError(""); 
                                    } else {
                                        setCertificado(null);
                                        setModalError("Solo se permite archivo .p12");
                                    }
                                }}
                            />
                        </div>

                        <div style={{ marginTop: "10px", display:"inline-flex"}}>
                            <input type="password" placeholder="Clave del certificado" value={claveCertificado} maxLength={30}
                                onChange={(e) => setClaveCertificado(e.target.value)} className="modal-input" style={{width:"190px", marginRight:"10px"}} />

                            <input type="date" value={fechaCaducidad} onChange={(e) => setFechaCaducidad(e.target.value)}
                                className="modal-date" style={{width:"140px"}} title="Fecha Caducidad"/>
                        </div>

                    </div>

                    <div className="modal-buttons">
                        <button className="modal-btn-save" onClick={actualizarCertificado}>Guardar</button>
                        <button className="modal-btn-cancel" onClick={cerrarModalCertificado}>Cancelar</button>
                    </div>
                    </div>
                </div>
            )}

            {/* --- Modal Punto de Emisión --- */}
            {showModalPuntoEmision && empresaSeleccionada && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{width:"auto"}}>
                        <div className="modal-header">
                            <h3>Puntos de Emisión - {empresaSeleccionada.razonSocial}</h3>
                            <button className="modal-close" onClick={cerrarModalPuntoEmision}>×</button>
                        </div>

                        {modalError && (
                            <div className="msj-error" style={{ marginTop: "0px", marginBottom: "10px" }}>
                                <p>{modalError}</p>
                            </div>
                        )}

                        {infoExito && (
                            <div className="msj-exito" style={{ marginTop: "0px", marginBottom: "10px" }}>
                                <p>☑️ {infoExito}</p>
                            </div>
                        )}

                        <div className="modal-body" style={{ display: "inline-grid" }}>
                            <div style={{ display: "inline-flex", gap: "10px", marginBottom: "10px" }}>
                                <input type="text" placeholder="Establecimiento" value={establecimiento} className="modal-input"
                                    style={{ width: "132px" }} maxLength={3} onChange={(e) => { const value = e.target.value;
                                        if (/^\d*$/.test(value)) { 
                                            setEstablecimiento(value);
                                        }
                                    }} />
                                <input type="text" placeholder="Punto Emisión" value={puntoEmision} className="modal-input"
                                    style={{ width: "132px" }} maxLength={3} onChange={(e) => { const value = e.target.value;
                                        if (/^\d*$/.test(value)) { 
                                            setPuntoEmision(value);
                                        }
                                    }}/>
                                <select name="tipoComprobante" value={tipoComprobante} className="modal-select" style={{width:"132px"}}  
                                    onChange={(e) => setTipoComprobante(e.target.value)}>
                                    <option value="" disabled>Tipo Comp.</option>
                                    <option value="01" style={{color: "#221f1f"}}>Factura</option>
                                    <option value="04" style={{color: "#221f1f"}}>Nota Crédito</option>
                                    <option value="05" style={{color: "#221f1f"}}>Nota Débito</option>
                                    <option value="06" style={{color: "#221f1f"}}>Guía Remisión</option>
                                    <option value="07" style={{color: "#221f1f"}}>Retención</option>
                                </select>    
                                <input type="number" placeholder="Secuencial" value={secuencial} className="modal-input" style={{ width: "155px", textAlign: "right" }}
                                    onChange={(e) => {const valor = e.target.value;
                                        if (/^\d{0,9}$/.test(valor)) {
                                            setSecuencial(valor === "" ? "" : Number(valor));
                                        }
                                    }} min="1"  />

                                {editingPunto ? (
                                    <button className="modal-btn-save" onClick={editarPuntoEmision}>
                                        Actualizar
                                    </button>
                                ) : (
                                    <button className="modal-btn-save" onClick={crearPuntoEmision}>
                                        Agregar
                                    </button>
                                )}
                            </div>

                            <table className="general-table">
                                <thead>
                                    <tr>
                                        <th>Establecimiento</th>
                                        <th>Punto Emisión</th>
                                        <th>Tipo Comp.</th>
                                        <th>Secuencial</th>
                                        <th>Activo</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {puntosEmision.map((pto, index) => (
                                        <tr key={index}>
                                            <td>{pto.establecimiento}</td>
                                            <td>{pto.puntoEmision}</td>
                                            <td>{pto.tipoComprobante === "01" ? "FAC" : pto.tipoComprobante === "04" ? "NC" : 
                                                pto.tipoComprobante === "05" ? "ND" : pto.tipoComprobante === "06" ? "GUIA" : "RET"} </td>
                                            <td>{pto.secuencial}</td>
                                            <td>{pto.activo ? "✅" : "❌"}</td>
                                            <td>
                                                <button className="btn-accion btn-editar" title="Editar secuencial" onClick={() => editarSecuencial(pto)} >
                                                    ✏️
                                                </button>
                                                <button className="btn-accion btn-toggle" title={pto.activo ? "Deshabilitar" : "Habilitar"}
                                                    onClick={() => modificarEstadoPtoEmi(pto)}>
                                                    🔄
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="modal-buttons">
                            <button className="modal-btn-cancel" onClick={limpiarPuntoEmision}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Modal Logo --- */}
            {showModalLogo && empresaSeleccionada && (
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className="modal-header">
                        <h3>Logo de la Empresa</h3>
                        <button className="modal-close" onClick={cerrarModalLogo}>×</button>
                    </div>

                    {modalError && (
                        <div className="msj-error" style={{ marginTop: "0px", marginBottom: "10px" }}>
                            <p>{modalError}</p>
                        </div>
                    )}

                    <div className="modal-body" style={{ display: "inline-grid" }}>
                        <label style={{ color: "#333", marginBottom: "10px" }}>
                            Empresa: <b>{empresaSeleccionada.razonSocial}</b>
                        </label>

                        <div style={{ display: "flex", gap: "5px" }}>                            
                            <input type="text" placeholder="Logo formato (PNG/JPG)" value={logo?.name || ""} 
                                style={{ width: "300px" }} className="modal-input" readOnly />

                            <button className="btn-accion" title="Cargar Logo"
                                onClick={() => document.getElementById("fileInputLogo").click()} >
                                📤
                            </button>

                            <input type="file" id="fileInputLogo" accept="image/png, image/jpeg" style={{ display: "none" }}
                                onChange={(e) => { 
                                    const file = e.target.files[0];
                                    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
                                        if (file.size > 50 * 1024) { 
                                            setModalError("🚫 El archivo no debe superar los 50 KB");
                                            setLogo(null);
                                        } else {
                                            setLogo(file);
                                            setModalError("");
                                        }
                                    } else {
                                        setLogo(null);
                                        setModalError("🚫 Solo se permite archivo PNG o JPG");
                                    }
                                }}
                            />
                        </div>

                        {logo && (
                            <div style={{ marginTop: "15px", textAlign:"center" }}>
                                <p style={{ fontSize:"14px", marginBottom:"5px", color:"#333" }}>Vista previa:</p>
                                <img src={URL.createObjectURL(logo)} alt="Vista previa logo" 
                                    style={{ maxWidth: "200px", maxHeight: "100px", border: "1px solid #ccc", borderRadius:"5px" }} />
                            </div>
                        )}
                    </div>

                    <div className="modal-buttons">
                        <button className="modal-btn-save" onClick={actualizarLogo}>Guardar</button>
                        <button className="modal-btn-cancel" onClick={cerrarModalLogo}>Cancelar</button>
                    </div>
                </div>
            </div>
            )}

        </div>
    );
};
export default Empresa;