import React, { useState, useEffect } from "react";
import api from "../config/axios";
import ModalExito from "../components/ModalExito";
import ModalAdvertencia from "../components/ModalAdvertencia";
import { useLoading } from "../context/LoadingContext";
import { useEmpresas } from "../context/EmpresaContext";
import "../styles/emitir/documentos.css";

const GuiaRemision = () => {
    const { empresaSeleccionada } = useEmpresas();
    const { setIsLoading } = useLoading();
    const [msjError, setMsjError] = useState("");
    const [msjExito, setMsjExito] = useState("");

    const [ptoEmision, setPtoEmision] = useState([]);
    const [ptoEmisionSeleccionado, setPtoEmisionSeleccionado] = useState("");
    const [secuencial, setSecuencial] = useState(0);

    const [dirPartida, setDirPartida] = useState(""); 
    const [razonSocialTransportista, setRazonSocialTransportista] = useState(""); 
    const [rucTransportista, setRucTransportista] = useState(""); 
    const [fechaIniTransporte, setFechaIniTransporte] = useState("");
    const [fechaFinTransporte, setFechaFinTransporte] = useState("");
    const [placa, setPlaca] = useState("");
    const [identificacionDestinatario, setIdentificacionDestinatario] = useState("");
    const [razonSocialDestinatario, setRazonSocialDestinatario] = useState("");
    const [dirDestinatario, setDirDestinatario] = useState("");
    const [motivoTraslado, setMotivoTraslado] = useState("");
    const [ruta, setRuta] = useState("");
    const [numDocSustento, setNumDocSustento] = useState("");
    const [numAutDocSustento, setNumAutDocSustento] = useState("");
    const [fechaEmisionDocSustento, setFechaEmisionDocSustento] = useState("");
    
    const [detalle, setDetalle] = useState([]);    
    const [codigoPrincipal, setCodigoPrincipal] = useState("");
    const [codigoAuxiliar, setCodigoAuxiliar] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [cantidad, setCantidad] = useState(0);

    const [infoAdicional, setInfoAdicional] = useState([]);
    const [descripcionIA, setDescripcionIA] = useState("");
    const [valorIA, setValorIA] = useState("");
    
    const [showModalDetalle, setShowModalDetalle] = useState(false);
    const [showModalInfoAdicional, setShowModalInfoAdicional] = useState(false);
    
    const [showModalExitoso, setShowModalExitoso] = useState(false);
    const [showModalAdvertencia, setShowModalAdvertencia] = useState(false);

    const limpiarVariables = () => {
        setMsjError("");
        setMsjExito("");
        setShowModalExitoso(false);
        setShowModalAdvertencia(false);
    };

    const cerrarModalExito = () => setShowModalExitoso(false);
    const cerrarModalAdvertencia = () => setShowModalAdvertencia(false);

    // --- Cargar clientes ---
    useEffect(() => {
        if (!empresaSeleccionada) return;
        const cargarDatos = async () => {
            try {
                setIsLoading(true);
                const [resPtoEmision] = await Promise.all([
                    api.get(`/puntoEmision/${empresaSeleccionada.ruc}/listaPtoEmisionPorTipo`, {
                        params: { tipoDocumento: "06" }
                    }),
                ]);
                setPtoEmision(resPtoEmision.data);
                const fechaHoy = new Date();
                const anio = fechaHoy.getFullYear();
                const mes = String(fechaHoy.getMonth() + 1).padStart(2, "0");
                const dia = String(fechaHoy.getDate()).padStart(2, "0");
                setFechaIniTransporte(`${anio}-${mes}-${dia}`);                
                setFechaFinTransporte(`${anio}-${mes}-${dia}`);
            } catch (error) {
                console.error("Error cargando datos:", error);
            } finally {
                setIsLoading(false);
            }
        };
        if (empresaSeleccionada?.ruc) cargarDatos();
    }, [empresaSeleccionada, setIsLoading]);

    // --- Agregar impuesto ret ---
    const mostrarModalAgregarDet = () => {
        limpiarVariables();
        setCodigoPrincipal("");
        setCodigoAuxiliar("");
        setDescripcion("");
        setCantidad(0);
        setShowModalDetalle(true);
    };

    const agregarDetalle = () => {
        setMsjError("");

        if (!codigoPrincipal || codigoPrincipal.trim() === "") {
            setMsjError("🚫 Debe agregar código principal");
            return;
        }
        if (!descripcion || descripcion.trim() === "") {
            setMsjError("🚫 Debe agregar descripción");
            return;
        }  
        if (cantidad < 1) {
            setMsjError("🚫 Cantidad debe ser mayor a 0");
            return;
        }  

        setDetalle(prev => [
            ...prev,
            {
                codigoPrincipal,
                codigoAuxiliar,
                descripcion,
                cantidad
            }
        ]);
        setShowModalDetalle(false);
    };   

    const quitarDetalle = (index) => {
        setDetalle((prev) => prev.filter((_, idx) => idx !== index));
    };
    
    const cerrarModalAgregarDet = () => {
        limpiarVariables();
        setShowModalDetalle(false);
    };

    // --- Agregar Info Adicional ---
    const mostrarModalInfoAdicional = () => {
        limpiarVariables();
        setDescripcionIA("");
        setValorIA("");
        setShowModalInfoAdicional(true);
    };

    const agregarInfoAdicional = () => {
        setMsjError("");
        if (!descripcionIA || descripcionIA.trim() === "") {
            setMsjError("🚫 Debe agregar descripción");
            return;
        }
        if (!valorIA || valorIA.trim() === "") {
            setMsjError("🚫 Debe agregar valor");
            return;
        }

        setInfoAdicional(prev => [
            ...prev,
            {
                descripcionIA,
                valorIA
            }
        ]);
    };

    const quitarInfoAdicional = (index) => {
        setInfoAdicional((prev) => prev.filter((_, idx) => idx !== index));
    };

    const cerrarModalInfoAdicional = () => {
        limpiarVariables();
        setShowModalInfoAdicional(false);
    };

    // --- Emitir GUIA ---
    const emitirGuia = async () => {
        limpiarVariables();
        if(!ptoEmisionSeleccionado || ptoEmisionSeleccionado === null){
            setMsjError("Debe seleccionar punto de emisión");
            setShowModalAdvertencia(true);
            return;
        }
        if((!dirPartida || dirPartida.trim() === "") || (!razonSocialTransportista || razonSocialTransportista.trim() === "") || (!rucTransportista || rucTransportista.trim() === "")
            || (!placa || placa.trim() === "") || !fechaIniTransporte || !fechaFinTransporte ){
            setMsjError("Debe ingresar todos los datos de transportista");
            setShowModalAdvertencia(true);
            return;
        }
        if((!identificacionDestinatario || identificacionDestinatario.trim() === "") || (!razonSocialDestinatario || razonSocialDestinatario.trim() === "") || (!dirDestinatario || dirDestinatario.trim() === "")
            || (!motivoTraslado || motivoTraslado.trim() === "") || (!ruta || ruta.trim() === "") ){
            setMsjError("Debe ingresar todos los datos de destinatario");
            setShowModalAdvertencia(true);
            return;
        }
        if(!numDocSustento || numDocSustento.trim() === ""){
            setMsjError("Debe agregar el número de la factura");
            setShowModalAdvertencia(true);
            return;
        }
        if(numDocSustento.length < 17){
            setMsjError("Debe agregar el número completo de la factura");
            setShowModalAdvertencia(true);
            return;
        }
        if(!fechaEmisionDocSustento){
            setMsjError("Debe agregar la fecha de emisión de la factura");
            setShowModalAdvertencia(true);
            return;
        }
        if(detalle.length === 0){
            setMsjError("Debe agregar detalles");
            setShowModalAdvertencia(true);
            return;
        }  
        
        try {
            setIsLoading(true);            
            
            const infoAdicionalDTO = infoAdicional.map((ia, index) => ({
                nombre: ia.descripcionIA,
                valor: ia.valorIA,
                orden: index + 1
            }));
            
            // --- Construir DTO completo ---
            const guiaDTO  = {
                ruc: empresaSeleccionada?.ruc,
                estab: ptoEmisionSeleccionado.establecimiento,
                ptoEmi: ptoEmisionSeleccionado.puntoEmision,
                secuencia: String(secuencial).padStart(9, "0"),
                dirEstablecimiento: empresaSeleccionada?.direccionMatriz || "",
                dirPartida, 

                // === DATOS DEL TRANSPORTISTA ===
                razonSocialTransportista,
                rucTransportista,
                fechaIniTransporte, 
                fechaFinTransporte, 
                placa,

                // === DATOS DEL DESTINATARIO ===
                identificacionDestinatario,
                razonSocialDestinatario,
                dirDestinatario,
                motivoTraslado,
                ruta,

                // === DOCUMENTO DE SUSTENTO ===
                numDocSustento,
                numAutDocSustento,
                fechaEmisionDocSustento, 

                // === DETALLES ===
                detalles: detalle.map((item) => ({
                    codigoPrincipal: item.codigoPrincipal,
                    codigoAuxiliar: item.codigoAuxiliar,
                    descripcion: item.descripcion,
                    cantidad: item.cantidad,
                })),

                // === INFO ADICIONAL ===
                infoAdicional: infoAdicionalDTO
            };
            const res = await api.post(`/emitirGuia/crear`, guiaDTO);
            const mensajeBackend = res.data?.[0]?.mensaje || `Comprobante generado correctamente`;
            await api.put(`/puntoEmision/${empresaSeleccionada.ruc}/${ptoEmisionSeleccionado.establecimiento}/${ptoEmisionSeleccionado.puntoEmision}/06/editarPuntoEmision`, {
                secuencial: Number(secuencial)+1,
                activo: true
            });
            const { data } = await api.get(`/puntoEmision/${empresaSeleccionada.ruc}/listaPtoEmisionPorTipo`, {
                params: { tipoDocumento: "06" }
            });
            setPtoEmision(data);
            setDetalle([]);
            setInfoAdicional([]);
            setSecuencial(0);
            setPtoEmisionSeleccionado("");
            setMsjExito(mensajeBackend);
            setShowModalExitoso(true);
        } catch (error) {
            console.error(error);
            setMsjError("Error al emitir el comprobante. Consulte con el administrador.");
            setShowModalAdvertencia(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container-ts">
            <h2>Emisión de Guía de Remisión</h2>
            <div className="documento-container">
                <div className="documento-section">
                    <h2 className="documento-title">Empresa: {empresaSeleccionada.razonSocial}</h2> 
                    <div style={{width:"100%" ,display:"inline-flex", gap:"0.5rem", marginTop:"5px"}}>
                        <div className="documento-field" style={{display:"inline-grid"}}>
                            <label>Punto de emisión:</label>
                            <div style={{width:"100%" ,display:"inline-flex", gap:"1rem"}}>
                                <select value={ptoEmisionSeleccionado ? `${ptoEmisionSeleccionado.establecimiento}-${ptoEmisionSeleccionado.puntoEmision}` : ""}
                                    onChange={(e) => { const seleccionado = ptoEmision.find(
                                        (c) => `${c.establecimiento}-${c.puntoEmision}` === e.target.value
                                    );
                                        setPtoEmisionSeleccionado(seleccionado || null);
                                        setSecuencial(seleccionado ? seleccionado.secuencial : "");
                                    }} style={{width: "45%"}}>
                                    <option value="">Seleccione</option>
                                    {ptoEmision.map((c) => (
                                        <option key={`${c.establecimiento}-${c.puntoEmision}`} value={`${c.establecimiento}-${c.puntoEmision}`}>
                                            {c.establecimiento} - {c.puntoEmision}
                                        </option>
                                    ))}
                                </select>
                                <input type="number" value={secuencial} className="sin-flechas" disabled 
                                    style={{ width: "45%", textAlign: "right", paddingRight:"5px", background:"#FFF" }} />
                            </div>
                        </div>
                        <div className="documento-field" style={{display:"inline-grid", marginRight:"10px"}}>
                            <label>Fecha inicio:</label>
                            <input type="date" value={fechaIniTransporte} onChange={(e) => setFechaIniTransporte(e.target.value)}
                                className="documento-fecha" title="Fecha Inicio" />
                        </div>
                        <div className="documento-field" style={{display:"inline-grid", marginRight:"10px"}}>
                            <label>Fecha fin:</label>
                            <input type="date" value={fechaFinTransporte} onChange={(e) => setFechaFinTransporte(e.target.value)}
                                className="documento-fecha" title="Fecha Fin" />
                        </div>                 
                    </div>
                </div>

                <div className="documento-section">                    
                    <div style={{display:"inline-flex", width:"100%", marginBottom:"5px", alignItems:"center", justifyContent:"space-between"}}>
                        <h2 className="documento-title" style={{margin:"0px !important"}}>Datos de transportista</h2>
                    </div>
                    <div className="documento-field" style={{width:"100%", display:"inline-grid"}}>                        
                        <div style={{width:"100%" ,display:"inline-flex", gap:"1rem"}}>
                            <div style={{display:"inline-grid"}}>
                                <label>Identificación:</label>
                                <input name="rucTransportista" type="text" value={rucTransportista} style={{ width: "145px", paddingLeft:"5px", height:"31px"}}  maxLength={13} 
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (/^\d*$/.test(value)) {
                                            setRucTransportista(value);
                                        }
                                    }}
                                />
                            </div>
                            <div style={{display:"inline-grid"}}>
                                <label>Razón social:</label>
                                <input type="text" name="razonSocialTransportista" value={razonSocialTransportista} maxLength={80} 
                                    style={{ width: "522px", paddingLeft:"5px", height:"31px"}} onChange={(e) => { const value = e.target.value;
                                    if (/^[a-zA-Z0-9.,\s]*$/.test(value)) {
                                        setRazonSocialTransportista(value);
                                    } }} />
                            </div>
                        </div>
                        <div style={{width:"100%" ,display:"inline-grid", marginTop:"5px"}}>
                            <label>Dirección de partida:</label>
                            <input type="text" name="dirPartida" value={dirPartida} maxLength={250} 
                                    style={{ width: "682px", paddingLeft:"5px", height:"31px"}} onChange={(e) => {setDirPartida(e.target.value);}}
                            />
                        </div>
                        <div style={{width:"100%" ,display:"inline-flex", gap:"1rem", marginTop:"5px"}}>
                            <div style={{display:"inline-grid"}}>
                                <label>Placa:</label>
                                <input type="text" name="placa" value={placa} maxLength={10} 
                                    style={{ width: "145px", paddingLeft:"5px", height:"31px"}} onChange={(e) => { const value = e.target.value;
                                    if (/^[a-zA-Z0-9.,\s]*$/.test(value)) {
                                        setPlaca(value);
                                    } }} />
                            </div>                          
                        </div>
                    </div>
                </div>

                <div className="documento-section">                    
                    <div style={{display:"inline-flex", width:"100%", marginBottom:"5px", alignItems:"center", justifyContent:"space-between"}}>
                        <h2 className="documento-title" style={{margin:"0px !important"}}>Datos de destinatario</h2>
                    </div>
                    <div className="documento-field" style={{width:"100%", display:"inline-grid"}}>                        
                        <div style={{width:"100%" ,display:"inline-flex", gap:"1rem"}}>
                            <div style={{display:"inline-grid"}}>
                                <label>Identificación:</label>
                                <input name="identificacionDestinatario" type="text" value={identificacionDestinatario} style={{ width: "145px", paddingLeft:"5px", height:"31px"}}  maxLength={13} 
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (/^\d*$/.test(value)) {
                                            setIdentificacionDestinatario(value);
                                        }
                                    }}
                                />
                            </div>
                            <div style={{display:"inline-grid"}}>
                                <label>Razón social:</label>
                                <input type="text" name="razonSocialDestinatario" value={razonSocialDestinatario} maxLength={80} 
                                    style={{ width: "522px", paddingLeft:"5px", height:"31px"}} onChange={(e) => { const value = e.target.value;
                                    if (/^[a-zA-Z0-9.,\s]*$/.test(value)) {
                                        setRazonSocialDestinatario(value);
                                    } }} />
                            </div>
                        </div>
                        <div style={{width:"100%" ,display:"inline-grid", marginTop:"5px"}}>
                            <label>Dirección de destino:</label>
                            <input type="text" name="dirDestinatario" value={dirDestinatario} maxLength={250} 
                                    style={{ width: "682px", paddingLeft:"5px", height:"31px"}} onChange={(e) => {setDirDestinatario(e.target.value);}}
                            />
                        </div>
                        <div style={{width:"100%" ,display:"inline-flex", gap:"1rem", marginTop:"5px"}}>
                            <div style={{display:"inline-grid"}}>
                                <label>Motivo de traslado:</label>
                                <input type="text" name="motivoTraslado" value={motivoTraslado} maxLength={250} 
                                    style={{ width: "332px", paddingLeft:"5px", height:"31px"}} onChange={(e) => { setMotivoTraslado(e.target.value); }} />
                            </div>        
                            <div style={{display:"inline-grid"}}>
                                <label>Ruta:</label>
                                <input type="text" name="ruta" value={ruta} maxLength={250} 
                                    style={{ width: "332px", paddingLeft:"5px", height:"31px"}} onChange={(e) => { setRuta(e.target.value); }} />
                            </div>                                               
                        </div>
                    </div>
                </div>

                <div className="documento-section">                    
                    <div style={{display:"inline-flex", width:"100%", marginBottom:"5px", alignItems:"center", justifyContent:"space-between"}}>
                        <h2 className="documento-title" style={{margin:"0px !important"}}>Datos de la factura</h2>
                    </div>
                    <div className="documento-field" style={{width:"100%" ,display:"inline-flex", gap:"1rem"}}>                        
                        <div style={{display:"inline-grid"}}>
                            <label>No. Factura:</label>
                            <input type="text" name="numDocSustento" placeholder="001-001-000000000" value={numDocSustento} maxLength={17}
                                style={{width:"145px", height:"31px"}} onChange={(e) => {
                                    let value = e.target.value.replace(/\D/g, ""); 
                                    if (value.length > 3 && value.length <= 6) {
                                        value = value.slice(0, 3) + "-" + value.slice(3);
                                    } else if (value.length > 6) {
                                        value = value.slice(0, 3) + "-" + value.slice(3, 6) + "-" + value.slice(6, 15);
                                    }
                                    setNumDocSustento(value);
                                }}
                            />
                        </div>
                        <div style={{display:"inline-grid"}}>
                            <label>Fecha de emisión:</label>
                            <input type="date" value={fechaEmisionDocSustento} onChange={(e) => setFechaEmisionDocSustento(e.target.value)}
                                className="documento-fecha" title="Fecha de Emisión de Factura" />
                        </div>
                        <div style={{display:"inline-grid"}}>
                            <label>No. Autorización:</label>
                            <input name="numAutDocSustento" type="text" value={numAutDocSustento} style={{ width: "365px", paddingLeft:"5px", height:"31px"}}  maxLength={49} 
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (/^\d*$/.test(value)) {
                                        setNumAutDocSustento(value);
                                    }
                                }}
                            /> 
                        </div>
                    </div>
                </div>

                <div className="documento-section">            
                    <div style={{display:"inline-flex", width:"100%", marginBottom:"5px", alignItems:"center", justifyContent:"space-between"}}>
                        <h2 className="documento-title" style={{margin:"0px !important"}}>Detalle de la guía</h2>
                        <button className="modal-btn-save" onClick={mostrarModalAgregarDet}>
                            Agregar
                        </button>
                    </div>
                    <table className="general-table">
                        <thead>
                            <tr>
                                <th>Cod. Principal</th>
                                <th>Cod. Auxiliar</th>
                                <th>Descripción</th>
                                <th>Cantidad</th>
                                <th>Eliminar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {detalle.map((d, idx) => (
                                <tr key={idx}>
                                    <td>{d.codigoPrincipal}</td>
                                    <td>{d.codigoAuxiliar}</td>
                                    <td>{d.descripcion}</td>
                                    <td>{d.cantidad}</td>                                    
                                    <td>
                                        <button className="btn-accion btn-toggle" title="Quitar impuesto" onClick={() => quitarDetalle(idx)}>
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>                    
                </div>

                <div className="documento-section documento-grid-totales"> 
                    <div className="documento-field" style={{width:"48%"}}>
                        <div id="sectInfoAdi">
                            <div style={{display:"inline-flex", width:"100%", marginBottom:"5px", alignItems:"center", justifyContent:"space-between"}}>
                                <h2 className="documento-title" style={{margin:"0px !important"}}>Información adicional</h2>
                                <button className="modal-btn-save" onClick={mostrarModalInfoAdicional}>
                                    Agregar
                                </button>
                            </div>
                            <table className="general-table">
                                <thead>
                                    <tr>
                                        <th>Descripción</th>
                                        <th>Valor</th>
                                        <th>Eliminar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {infoAdicional.map((d, id) => (
                                        <tr key={id}>
                                            <td>{d.descripcionIA}</td>
                                            <td className="texto-corto" title={d.valorIA}>{d.valorIA}</td>
                                            <td>
                                                <button className="btn-accion btn-toggle" title="Quitar detalle" onClick={() => quitarInfoAdicional(id)}>
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Botón Emitir */}
                    <div className="documento-footer">
                        {Number(empresaSeleccionada.poolComprobantes) <= Number(empresaSeleccionada.totalComprobantes) && (                        
                            <button className="btn-deshabilitado documento-btn-emitir" disabled>
                                Generar Comprobante 
                            </button>
                        )}
                        {Number(empresaSeleccionada.poolComprobantes) > Number(empresaSeleccionada.totalComprobantes) && (
                            <button className="btn-crear documento-btn-emitir" onClick={emitirGuia} >
                                Generar Comprobante
                            </button>
                        )}
                    </div>                    

                </div>                
            </div>

            {/* --- Modal Detalle --- */}
            {showModalDetalle && empresaSeleccionada && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{width:"auto"}}>
                        <div className="modal-header">
                            <h3>Agregar Detalle</h3>
                            <button className="modal-close" onClick={cerrarModalAgregarDet}>×</button>
                        </div>

                        {msjError && (
                            <div className="msj-error" style={{ marginTop: "0px", marginBottom: "10px" }}>
                                <p>{msjError}</p>
                            </div>
                        )}

                        <div className="modal-body" style={{display: "inline-grid", width:"340px"}}>

                            <div style={{display:"inline-flex", alignItems:"center", justifyContent:"space-between", marginTop:"10px"}}>
                                <label style={{color: "#221f1f", marginBottom:"5px", width:"80px"}}>Cod. Principal:</label>
                                <input name="codigoPrincipal" type="text" value={codigoPrincipal} maxLength={10} style={{width:"260px"}} 
                                    className="modal-input" onChange={(e) => {setCodigoPrincipal(e.target.value);}} />  
                            </div>

                            <div style={{display:"inline-flex", alignItems:"center", justifyContent:"space-between", marginTop:"10px"}}>
                                <label style={{color: "#221f1f", marginBottom:"5px", width:"80px"}}>Cod. Auxiliar:</label>
                                <input name="codigoAuxiliar" type="text" value={codigoAuxiliar} maxLength={10} style={{width:"260px"}} 
                                    className="modal-input" onChange={(e) => {setCodigoAuxiliar(e.target.value);}} />  
                            </div>

                            <div style={{display:"inline-flex", alignItems:"center", justifyContent:"space-between", marginTop:"10px"}}>
                                <label style={{color: "#221f1f", marginBottom:"5px"}}>Descripción:</label>
                                <input name="descripcion" type="text" value={descripcion} maxLength={80} style={{width:"260px"}} 
                                    className="modal-input" onChange={(e) => {setDescripcion(e.target.value);}} />  
                            </div>

                            <div style={{display:"inline-flex", alignItems:"center", justifyContent:"space-between", marginTop:"10px"}}>
                                <label style={{color: "#221f1f", marginBottom:"5px"}}>Cantidad:</label>
                                <input type="number" className="tabla-input sin-flechas" min="1" max="999999" value={cantidad}
                                    onChange={(e) => {setCantidad(e.target.value);}} 
                                    style={{width:"260px", borderRadius:"4px", height:"31px", textAlign:"end", paddingRight:"5px"}}
                                />  
                            </div>
                                                   
                        </div>

                        <div className="modal-buttons">
                            <button className="modal-btn-save" onClick={agregarDetalle}>Agregar</button>
                            <button className="modal-btn-cancel" onClick={cerrarModalAgregarDet}>
                                Cancelar
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* --- Modal Info Adicional --- */}
            {showModalInfoAdicional && empresaSeleccionada && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{width:"auto"}}>
                        <div className="modal-header">
                            <h3>Agregar información adicional</h3>
                            <button className="modal-close" onClick={cerrarModalInfoAdicional}>×</button>
                        </div>

                        {msjError && (
                            <div className="msj-error" style={{ marginTop: "0px", marginBottom: "10px" }}>
                                <p>{msjError}</p>
                            </div>
                        )}

                        <div className="modal-body" style={{display: "inline-grid", width:"340px"}}>

                            <div style={{display:"inline-flex", alignItems:"center", justifyContent:"space-between", marginTop:"10px"}}>
                                <label style={{color: "#221f1f", marginBottom:"5px"}}>Descripción:</label>
                                <input name="descripcionIA" type="text" value={descripcionIA} maxLength={80} style={{width:"260px"}} 
                                    className="modal-input" onChange={(e) => {setDescripcionIA(e.target.value);}} />  
                            </div>

                            <div style={{display:"inline-flex", alignItems:"center", justifyContent:"space-between", marginTop:"10px"}}>
                                <label style={{color: "#221f1f", marginBottom:"5px"}}>Valor:</label>
                                <input name="valorIA" type="text" value={valorIA} maxLength={200} style={{width:"260px"}} 
                                    className="modal-input" onChange={(e) => {setValorIA(e.target.value);}} />  
                            </div>
                                                   
                        </div>

                        <div className="modal-buttons">
                            <button className="modal-btn-save" onClick={agregarInfoAdicional}>Agregar</button>
                            <button className="modal-btn-cancel" onClick={cerrarModalInfoAdicional}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Modal exito --- */}
            <ModalExito
                visible={showModalExitoso}
                msjExito={msjExito}
                onClose={cerrarModalExito}
            />

            {/* --- Modal advertencia --- */}
            <ModalAdvertencia
                visible={showModalAdvertencia}
                msjAdvertencia={msjError}
                onClose={cerrarModalAdvertencia}
            />

        </div>    
    );

};

export default GuiaRemision; 