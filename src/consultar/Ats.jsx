import React, { useState, useEffect } from "react";
import api from "../config/axios";
import { useLoading } from "../context/LoadingContext";
import ModalExito from "../components/ModalExito";
import "../styles/consultar/comprobantes.css";
import JSZip from "jszip";

const Ats = () => {
    const { setIsLoading } = useLoading();
    const [data, setData] = useState([]);
    const [error, setError] = useState("");
    const [exito, setExito] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const registrosPorPagina = 20;
    const [mesAnio, setMesAnio] = useState("");
    const [mesCarga, setMesCarga] = useState("");
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [ruc, setRuc] = useState("");
    const [estado, setEstado] = useState("");
    const [archivoATS, setarchivoATS] = useState(null);

    const [showModalMostrarError, setShowModalMostrarError] = useState(false);
    const [msjError, setMsjError] = useState("");

    const [showModalExitoso, setShowModalExitoso] = useState(false);
    const [msjExito, setMsjExito] = useState("");

    const [showModalCargaATS, setShowModalCargaATS] = useState(false);
    const [modalError, setModalError] = useState("");

    const [grupos, setGrupos] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [grupoSeleccionado, setGrupoSeleccionado] = useState("");

    const [progreso, setProgreso] = useState(0);
    const [totalArchivos, setTotalArchivos] = useState(0);
    const [procesados, setProcesados] = useState(0);
    const [archivoActual, setArchivoActual] = useState("");
    const [loadingLocal, setLoadingLocal] = useState(false);
    const [showModalResumen, setShowModalResumen] = useState(false);
    const [resumenCarga, setResumenCarga] = useState({
        total: 0,
        exitosos: 0,
        fallidos: 0,
        errores: []
    });

    const [seleccionados, setSeleccionados] = useState([]);

    /*useEffect(() => {
        const hoy = new Date();
        const anio = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, "0");
        setMesAnio(anio.toString());
        setMesCarga(mes);
    }, []);*/

    useEffect(() => {
        const cargarFechas = () => {
        try {
            setIsLoading(true);
            const fechaHoy = new Date();
            const anio = fechaHoy.getFullYear();
            const mes = String(fechaHoy.getMonth() + 1).padStart(2, "0");
            const dia = String(fechaHoy.getDate()).padStart(2, "0");
            setFechaFin(`${anio}-${mes}-${dia}`);
            setMesAnio(anio.toString());

            const primerDiaMes = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth(), 1);
            const anioInicio = primerDiaMes.getFullYear();
            const mesInicio = String(primerDiaMes.getMonth() + 1).padStart(2, "0");
            const diaInicio = String(primerDiaMes.getDate()).padStart(2, "0");
            setFechaInicio(`${anioInicio}-${mesInicio}-${diaInicio}`);
        } catch (error) {
            console.error("Error cargando datos:", error);
        } finally {
            setIsLoading(false);
        }
        };
        cargarFechas();
    }, [setIsLoading]);

    useEffect(() => {
        const cargarEmpresasInicial = async () => {
            try {
                const { data } = await api.get("/empresas/empresaPorGrupo");
                setEmpresas(data);
            } catch (err) {
                console.error("Error cargando empresas iniciales", err);
            }
        };
        cargarEmpresasInicial();
    }, []);

    useEffect(() => {
        const cargarGrupos = async () => {
            try {
                const response = await api.get("/empresas/grupoEmpresa");
                setGrupos(response.data);
            } catch (err) {
                console.error("Error cargando grupos", err);
            }
        };
        cargarGrupos();
    }, []);

    const cerrarMsj = () => {
        setError("");
        setExito("");
        setMsjExito("");
        setMsjError("");
        setModalError("");
        setShowModalMostrarError(false);
        setShowModalExitoso(false);
        setShowModalCargaATS(false);
        setarchivoATS(null);
        setModalError("");
    };

    const mostrarError = (msj) => {    
      setMsjError(msj === "" ? "Error general, consulte con el administrador" : msj);
      setShowModalMostrarError(true);    
    };

    const cerrarModalError = () => {
      setMsjError("");
      setShowModalMostrarError(false);
    };

    const cerrarModalExito = () => setShowModalExitoso(false);

    const handleGrupoChange = async (value) => {
        const idGrupo = value === "" ? null : value;
        setGrupoSeleccionado(value);
        setRuc("");
        try {
            const { data } = await api.get(
                idGrupo === null
                    ? "/empresas/empresaPorGrupo"
                    : `/empresas/empresaPorGrupo?idGrupo=${idGrupo}`
            );
            setEmpresas(data);
        } catch (err) {
            setEmpresas([]);
            console.error("Error cargando empresas", err);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const nombre = file.name.toLowerCase();

        if (!nombre.endsWith(".xml") && !nombre.endsWith(".zip")) {
            setModalError("🚫 Solo se permiten archivos XML o ZIP");
            return;
        }
        setModalError(""); 
        setarchivoATS(file);
    };

    const cargarXml = async () => {
        setModalError("");
        if (!archivoATS) {
            setModalError("🚫 Debes seleccionar un archivo XML o ZIP");
            return;
        }
        const nombre = archivoATS.name.toLowerCase();
        try {
            setIsLoading(true);
            setLoadingLocal(true);
            if (nombre.endsWith(".xml")) {
                await enviarXml(archivoATS);
                cerrarMsj();
                setMsjExito("ATS cargado correctamente");
                setShowModalExitoso(true);
            } else if (nombre.endsWith(".zip")) {
                await procesarZip(archivoATS);
            } else {
                setModalError("Formato no válido. Solo se permite XML o ZIP");
            }            
        } catch (err) {
            const mensajeError =  err.response?.data?.message ||   
                err.response?.data || err.message || "Error inesperado al cargar el XML";
            mostrarError(mensajeError);
        } finally {
            setIsLoading(false);
            setLoadingLocal(false);
        }
    };

    const enviarXml = async (file, nombre = "archivo.xml") => {
        const formData = new FormData();
        formData.append("xml", file, nombre);
        return await api.post("/ats/cargar", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
    };

    const procesarZip = async (file) => {
        try {
            const zip = await JSZip.loadAsync(file);
            const archivos = Object.keys(zip.files);
            const xmlFiles = archivos.filter(nombre =>
                !zip.files[nombre].dir &&
                nombre.toLowerCase().endsWith(".xml")
            );
            let exitosos = 0;
            let errores = [];
            setTotalArchivos(xmlFiles.length);
            setProcesados(0);
            let index = 0;
            for (const nombre of xmlFiles) {
                index++;
                setArchivoActual(nombre);
                const archivoZip = zip.files[nombre];
                const contenido = await archivoZip.async("blob");
                try {
                    await enviarXml(contenido, nombre);
                    exitosos++;
                } catch (err) {
                    //const mensaje = err.response?.data?.message || err.message;
                    //const errorTexto = `${nombre}: ${mensaje}`;
                    const errorTexto = `${nombre}`;
                    errores.push(errorTexto);
                }
                setProcesados(index);
                setProgreso(Math.round((index / xmlFiles.length) * 100));
            }
            cerrarMsj();
            setResumenCarga({
                total: xmlFiles.length,
                exitosos: exitosos,
                fallidos: errores.length,
                errores: errores
            });
            setShowModalResumen(true);
        } catch (error) {
            console.error(error);
            throw new Error("Error al procesar el archivo ZIP");
        }
    };

    const toggleSeleccion = (uuid) => {
        setSeleccionados((prev) =>
            prev.includes(uuid)
                ? prev.filter((id) => id !== uuid)
                : [...prev, uuid]
        );
    };

    const seleccionarTodos = (checked) => {
        if (checked) {
            const uuids = dataPaginada.map((item) => item.uuid);
            setSeleccionados(uuids);
        } else {
            setSeleccionados([]);
        }
    };

    const descargarRespuestaExcel = async (ids) => {
        try {
            if (!ids || ids.length === 0) {
                setError("🚫 Debes seleccionar al menos un registro");
                return;
            }
            setIsLoading(true);
            const response = await api.post("/ats/respuestaExcel", ids, {
                responseType: "blob",
            });
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const ahora = new Date();
            const fecha = ahora.toISOString().slice(0, 10);
            const hora = ahora.toTimeString().slice(0, 8).replace(/:/g, "-");
            const nombreArchivo = `validacion_${fecha}_${hora}.xlsx`;
            const link = document.createElement("a");
            link.href = url;
            link.download = nombreArchivo;
            link.click();
            window.URL.revokeObjectURL(url);
            cerrarMsj();
            setMsjExito("Descarga de respuesta ATS realizada con éxito");
            setShowModalExitoso(true);            
        } catch (err) {
            const mensajeError =  err.response?.data?.message ||   
                err.response?.data || err.message || "Error al descargar el archivo";
            mostrarError(mensajeError);
        } finally {
            setIsLoading(false);
        }
    };

    const reprocesarAts = async (uuid) => {
        try {
            if (!uuid) {
                setError("🚫 Debes seleccionar un registro");
                return;
            }
            setIsLoading(true);
            await api.post(`/ats/${uuid}/reprocesarAts`);
            cerrarMsj();
            setMsjExito("✅ ATS enviado a reproceso correctamente");
            setShowModalExitoso(true);
        } catch (err) {
            const mensajeError =
                err.response?.data?.message ||
                err.response?.data ||
                err.message ||
                "Error al reprocesar el ATS";
            mostrarError(mensajeError);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchATS = async () => {
        cerrarMsj();
        if (fechaInicio > fechaFin) {
            setError("🚫 Fecha desde no puede ser menor a la fecha hasta");
            return;
        }
        try {
            setIsLoading(true);
            setData([]);
            const body = {
                mesAnio,
                mesCarga,
                fechaCargaDesde: fechaInicio ? `${fechaInicio}T00:00:00` : null,
                fechaCargaHasta: fechaFin ? `${fechaFin}T23:59:59` : null,
                ruc, 
                estado
            };
            const { data } = await api.post("/ats/buscar", body);
            setData(data);
            setExito("✅ Consulta realizada correctamente");
            setCurrentPage(1);
        } catch (err) {
            setError("🚫 " + (err.response?.data?.message || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    const indexOfLast = currentPage * registrosPorPagina;
    const indexOfFirst = indexOfLast - registrosPorPagina;
    const dataPaginada = data.slice(indexOfFirst, indexOfLast);
    const totalPaginas = Math.ceil(data.length / registrosPorPagina);

    return (
        <div className="container-ts-v2">
            <h2>Validación ATS</h2>

            <div className="sect-busqueda-v2">

                <div style={{ display: "flex", gap: "10px"}}>
                    
                    <div style={{ display: "inline-grid" }}>
                        <label>Grupo:</label>
                        <select value={grupoSeleccionado} className="modal-select" style={{ color: "#221f1f" }}
                            onChange={(e) => handleGrupoChange(e.target.value)} >
                            <option value="">Todos</option>
                            {grupos.map((g) => (
                                <option key={g.idGrupo} value={g.idGrupo}>
                                    {g.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: "inline-grid" }}>
                        <label>Empresa:</label>
                        <select value={ruc} className="modal-select" style={{ color: "#221f1f" }}
                            onChange={(e) => {
                                setRuc(e.target.value); 
                            }} >
                            <option value="">Todas</option>
                            {empresas.map((e) => (
                                <option key={e.ruc} value={e.ruc}>
                                    {e.razonSocial}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: "inline-grid" }}>
                        <label>Año:</label>
                        <input type="text" value={mesAnio} maxLength={4} className="modal-input" style={{ width: "80px" }}
                            onChange={(e) => setMesAnio(e.target.value)}/>
                    </div>

                    <div style={{ display: "inline-grid" }}>
                        <label>Mes:</label>
                        <select value={mesCarga} className="modal-select" style={{ color: "#221f1f", width: "100px" }}
                            onChange={(e) => setMesCarga(e.target.value)} >
                            {[
                                { value: "", label: "Todos" },
                                { value: "01", label: "Enero" },
                                { value: "02", label: "Febrero" },
                                { value: "03", label: "Marzo" },
                                { value: "04", label: "Abril" },
                                { value: "05", label: "Mayo" },
                                { value: "06", label: "Junio" },
                                { value: "07", label: "Julio" },
                                { value: "08", label: "Agosto" },
                                { value: "09", label: "Septiembre" },
                                { value: "10", label: "Octubre" },
                                { value: "11", label: "Noviembre" },
                                { value: "12", label: "Diciembre" }
                            ].map((mes) => (
                                <option key={mes.value} value={mes.value}>
                                    {mes.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{display:"inline-grid"}}>
                        <label>Estado:</label>
                        <select value={estado} className="modal-select" style={{ color: "#221f1f", width: "100px" }}
                            onChange={(e) => setEstado(e.target.value)} >
                            <option value="">Todos</option>
                            {[
                                { value: "C", label: "Cargado" },
                                { value: "P", label: "Procesando" },
                                { value: "ER", label: "Fin Electrónico" },
                                { value: "F", label: "Completo" },
                                { value: "EP", label: "Error proceso" },
                                { value: "D", label: "Error estructura" }
                            ].map((estado) => (
                                <option key={estado.value} value={estado.value}>
                                    {estado.label}
                                </option>
                            ))}
                        </select>
                        
                    </div>

                    <div style={{ display: "inline-grid" }}>
                        <label>Fecha Desde:</label>
                        <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="modal-date"
                            style={{color: "#221f1f", width:"120px"}}/>
                    </div>

                    <div style={{ display: "inline-grid" }}>
                        <label>Fecha Hasta:</label>
                        <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="modal-date" 
                            style={{color: "#221f1f", width:"120px"}}/>
                    </div>

                </div>

                <div className="btn-acciones">
                    <button className="btn-cargar" style={{marginRight:"10px"}} onClick={() => setShowModalCargaATS(true)}>
                        Cargar 
                    </button>     

                    <button className="btn-descargar" style={{ marginRight: "10px"}} onClick={() => descargarRespuestaExcel(seleccionados)}>
                        Descargar 
                    </button>               

                    <button className="btn-crear" onClick={fetchATS}>
                        Consultar
                    </button>                    
                </div>
            </div>

            <div style={{marginBottom:"10px"}}>
                {error !== "" && 
                    <div className="msj-error-consulta-v2">
                        <p>{error}</p>
                        <button className="close-msj-v2" onClick={cerrarMsj}>×</button>
                    </div>
                }
                {exito !== "" && 
                    <div className="msj-exito-consulta-v2">
                        <p>{exito}</p>
                        <button className="close-msj-v2" onClick={cerrarMsj}>×</button>
                    </div>
                }
            </div> 

            <table className="general-comp">
                <thead>
                    <tr>
                        <th>
                            <input type="checkbox" onChange={(e) => seleccionarTodos(e.target.checked)}
                                checked={
                                    dataPaginada.length > 0 &&
                                    seleccionados.length === dataPaginada.length
                                } />
                        </th>
                        <th>RUC</th>
                        <th>Razón Social</th>
                        <th>Fecha Carga</th>
                        <th>Mes</th>
                        <th>Año</th>
                        <th>Estado</th>
                        <th>Registros</th>
                        <th>Éxitos</th>
                        <th>Errores</th> 
                        <th>Respuesta</th>                        
                    </tr>
                </thead>
                <tbody>
                    {dataPaginada.map((u) => (
                        <tr key={u.id}>
                            <td>
                                {u.estado === "F" && (
                                    <input type="checkbox" checked={seleccionados.includes(u.uuid)} onChange={() => toggleSeleccion(u.uuid)} />
                                )}
                            </td>
                            <td>{u.ruc}</td>
                            <td>{u.razonSocialCarga}</td>
                            <td>
                                {u.fechaCarga 
                                    ? new Date(u.fechaCarga).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' , 
                                    hour: '2-digit', minute: '2-digit', hour12: false  }) : "—"} 
                            </td>
                            <td>{u.mesCarga}</td>
                            <td>{u.mesAnio}</td>
                            <td style={{textTransform:"capitalize"}}>{(u.descEstado).toLowerCase()}</td>
                            <td>{u.totalRegistros}</td>
                            <td>{u.totalExito}</td>
                            <td>{u.totalError}</td>     
                            <td>
                                {u.estado === "D" && (
                                    <button className="btn-accion btn-error" title="Ver detalle del error" style={{background:"#eb9292"}} 
                                        onClick={() => mostrarError(u.mensajeEstructura)} >
                                        ⛔
                                    </button>
                                )}
                                {u.estado === "F" && (
                                    <button className="btn-accion btn-toggle" title="Descargar" onClick={() => descargarRespuestaExcel([u.uuid])} >
                                        📋
                                    </button>
                                )}
                                {u.estado === "ER" && (
                                    <button className="btn-accion btn-toggle" title="Descargar" onClick={() => descargarRespuestaExcel([u.uuid])} >
                                        📋
                                    </button>
                                )}
                                {u.estado === "EP" && (
                                    <button className="btn-accion btn-toggle" title="Reprocesar" onClick={() => reprocesarAts([u.uuid])} >
                                        🔄
                                    </button>
                                )}
                            </td>                       
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="general-paginador">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1} >
                    ◀
                </button>

                <span>
                    Página {currentPage} de {totalPaginas || 1}
                </span>

                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPaginas))}
                    disabled={currentPage === totalPaginas || totalPaginas === 0}>
                    ▶
                </button>
            </div>

            {showModalCargaATS && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Cargar XML / ZIP - ATS</h3>
                            <button className="modal-close" onClick={cerrarMsj}>×</button>
                        </div>

                        {modalError && (
                            <div className="msj-error" style={{ marginTop: "0px", marginBottom: "10px" }}>
                                <p>{modalError}</p>
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                            <input id="archAts" type="text" placeholder="Archivo debe ser .xml o .zip" value={archivoATS?.name || ""}
                                style={{ width: "300px" }} className="modal-input" readOnly />
                            <button id="cargarAts" className="btn-accion" title="Seleccionar archivo"
                                onClick={() => document.getElementById("fileInputATS").click()} >
                                📤
                            </button>
                            <input type="file" id="fileInputATS" accept=".xml,.zip" style={{ display: "none" }} onChange={handleFileChange} />

                            {loadingLocal && totalArchivos > 0 && (
                                <div style={{ marginTop: "15px" }}>                                    
                                    <div style={{ fontSize: "13px", marginBottom: "5px" }}>
                                        Procesando {procesados} de {totalArchivos}
                                    </div>
                                    <div style={{ fontSize: "12px", marginBottom: "5px", color: "#555" }}>
                                        {archivoActual}
                                    </div>
                                    <div style={{ width: "100%", height: "10px", backgroundColor: "#e0e0e0", borderRadius: "5px" }}>
                                        <div style={{ width: `${progreso}%`, height: "100%", backgroundColor: "#4caf50", borderRadius: "5px", transition: "width 0.3s" }} />
                                    </div>

                                    <div style={{ fontSize: "12px", marginTop: "3px" }}>
                                        {progreso}%
                                    </div>
                                </div>
                            )}

                        </div>

                        {archivoATS && (
                            <div style={{ marginTop: "8px", fontSize: "13px" }}>
                                {archivoATS.name.toLowerCase().endsWith(".zip") ? (
                                    <span>📦 Archivo ZIP detectado (se procesarán múltiples XML)</span>
                                ) : (
                                    <span>📄 Archivo XML detectado</span>
                                )}
                            </div>
                        )}

                        <div className="modal-buttons">
                            <button className="modal-btn-save" onClick={cargarXml}>
                                Subir
                            </button>
                            <button className="modal-btn-cancel" onClick={cerrarMsj}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
  
            <ModalExito
                visible={showModalExitoso}
                msjExito={msjExito}
                onClose={cerrarModalExito}
            />
    
            {showModalMostrarError &&(
                <div className="modal-overlay">
                    <div className="modal-content" style={{width:"450px"}}>
                        <div className="modal-header">
                            <h3>Detalle del error</h3>
                            <button className="modal-close" onClick={cerrarModalError}>
                                ×
                            </button>
                        </div>
    
                        <div className="msj-pregunta" style={{background:"linear-gradient(4deg, #8d4d4d, #690101)"}}>
                            {msjError}
                        </div>
    
                        <div className="modal-buttons">
                            <button className="modal-btn-cancel" onClick={cerrarModalError}>Salir</button>
                        </div>
                    </div>
                </div>
            )}

            {showModalResumen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: "500px" }}>                        
                        <div className="modal-header">
                            <h3>Resumen de carga ATS</h3>
                            <button className="modal-close" onClick={() => setShowModalResumen(false)}>×</button>
                        </div>
                        <div style={{ marginTop: "10px", fontSize: "14px" }}>
                            <p><strong>Total procesados:</strong> {resumenCarga.total}</p>
                            <p style={{ color: "green" }}>
                                <strong>Exitosos:</strong> {resumenCarga.exitosos}
                            </p>
                            <p style={{ color: "red" }}>
                                <strong>Fallidos:</strong> {resumenCarga.fallidos}
                            </p>
                        </div>
                        {resumenCarga.errores.length > 0 && (
                            <div style={{ marginTop: "15px" }}>
                                <div style={{ fontWeight: "bold", color: "red" }}>
                                    Archivos con error:
                                </div>

                                <div style={{ maxHeight: "150px", overflowY: "auto", background: "#fff5f5",
                                    padding: "10px", borderRadius: "5px", marginTop: "5px", fontSize: "12px" }}>
                                    {resumenCarga.errores.map((err, index) => (
                                        <div key={index}>• {err}</div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="modal-buttons">
                            <button className="modal-btn-save" onClick={() => setShowModalResumen(false)} >
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Ats;    