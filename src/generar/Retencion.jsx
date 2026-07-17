import React, { useState, useEffect } from "react";
import api from "../config/axios";
import ModalExito from "../components/ModalExito";
import ModalAdvertencia from "../components/ModalAdvertencia";
import { useLoading } from "../context/LoadingContext";
import { useEmpresas } from "../context/EmpresaContext";
import "../styles/emitir/documentos.css";
import { impuestoRetencion } from "../config/impuestosRetencion";

const Retencion = () => {
    const { empresaSeleccionada } = useEmpresas();
    const { setIsLoading } = useLoading();
    const [msjError, setMsjError] = useState("");
    const [msjExito, setMsjExito] = useState("");

    const [clientes, setClientes] = useState([]);
    const [ptoEmision, setPtoEmision] = useState([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState("");
    const [ptoEmisionSeleccionado, setPtoEmisionSeleccionado] = useState("");
    const [secuencial, setSecuencial] = useState(0);
    const [fechaEmision, setFechaEmision] = useState(""); 
    const [periodoFiscal, setPeriodoFiscal] = useState(""); 

    const [numFactura, setNumFactura] = useState(""); 
    const [fechaEmisionFac, setFechaEmisionFac] = useState(""); 
    const [impuestoRet, setImpuestoRet] = useState(""); 
    const [codigoRet, setCodigoRet] = useState(""); 
    const [porcentajeRet, setPorcentajeRet] = useState("");
    const [baseImponible, setBaseImponible] = useState(0);
    const [codigosDisponibles, setCodigosDisponibles] = useState([]);
    
    const [detalle, setDetalle] = useState([]);    

    const [infoAdicional, setInfoAdicional] = useState([]);
    const [descripcionIA, setDescripcionIA] = useState("");
    const [valorIA, setValorIA] = useState("");

    const [totalRetenido, setTotalRetenido] = useState(0);
    
    const [showModalImpuesto, setShowModalImpuesto] = useState(false);
    const [showModalInfoAdicional, setShowModalInfoAdicional] = useState(false);
    
    const [showModalExitoso, setShowModalExitoso] = useState(false);
    const [showModalAdvertencia, setShowModalAdvertencia] = useState(false);

    const limpiarVariables = () => {
        setMsjError("");
        setMsjExito("");
        setShowModalExitoso(false);
        setShowModalAdvertencia(false);
        setImpuestoRet("");
        setCodigoRet("");
        setPorcentajeRet("");
        setNumFactura("");
        setFechaEmisionFac("");
        setBaseImponible("");
        setCodigosDisponibles([]);
    };

    const cerrarModalExito = () => setShowModalExitoso(false);
    const cerrarModalAdvertencia = () => setShowModalAdvertencia(false);

    //Selecciona Impuesto
    useEffect(() => {
        if (impuestoRet) {
            setCodigosDisponibles(impuestoRetencion[impuestoRet].codigos);
            setCodigoRet("");
            setPorcentajeRet("");
        } else {
            setCodigosDisponibles([]);
        }
    }, [impuestoRet]);

    //Selecciona el codigo
    useEffect(() => {
        if (codigoRet && impuestoRet) {
            const codigoSeleccionado = impuestoRetencion[impuestoRet].codigos.find(
                (c) => c.codigo === codigoRet
            );
            setPorcentajeRet(codigoSeleccionado ? codigoSeleccionado.porcentaje : "");
        } else {
            setPorcentajeRet("");
        }
    }, [codigoRet, impuestoRet]);

    // --- Cargar clientes ---
    useEffect(() => {
        if (!empresaSeleccionada) return;
        const cargarDatos = async () => {
            try {
                setIsLoading(true);
                const [resClientes, resPtoEmision] = await Promise.all([
                    api.get(`/clientes/${empresaSeleccionada.ruc}/buscarPorRucActivos`),
                    api.get(`/puntoEmision/${empresaSeleccionada.ruc}/listaPtoEmisionPorTipo`, {
                        params: { tipoDocumento: "07" }
                    }),
                ]);
                setClientes(resClientes.data);
                setPtoEmision(resPtoEmision.data);
                const fechaHoy = new Date();
                const anio = fechaHoy.getFullYear();
                const mes = String(fechaHoy.getMonth() + 1).padStart(2, "0");
                const dia = String(fechaHoy.getDate()).padStart(2, "0");
                setFechaEmision(`${anio}-${mes}-${dia}`);                
            } catch (error) {
                console.error("Error cargando datos:", error);
            } finally {
                setIsLoading(false);
            }
        };
        if (empresaSeleccionada?.ruc) cargarDatos();
    }, [empresaSeleccionada, setIsLoading]);

    //Agregar correo
    useEffect(() => {
        if (!clienteSeleccionado || clienteSeleccionado === "") return;

        try {
            setIsLoading(true);
            const cliente = clientes.find((c) => c.id === parseInt(clienteSeleccionado));
            if (cliente && cliente.email) {
                setInfoAdicional((prev) => {
                    const yaExiste = prev.some(
                        (item) => item.descripcionIA.toLowerCase() === "correo"
                    );
                    if (yaExiste) {
                        return prev.map((item) =>
                            item.descripcionIA.toLowerCase() === "correo"
                                ? { ...item, valorIA: cliente.email }
                                : item
                        );
                    } else {
                        return [
                            ...prev,
                            { descripcionIA: "Correo", valorIA: cliente.email },
                        ];
                    }
                });
            } else {
                setInfoAdicional([]);            
            }
        } catch (error) {
            console.error("Error cargando correos:", error);
        } finally {
            setIsLoading(false);
        }
    }, [clienteSeleccionado, clientes, setIsLoading]);

    // --- Agregar impuesto ret ---
    const mostrarModalAgregarImp = () => {
        limpiarVariables();
        setShowModalImpuesto(true);
    };

    const agregarImpuestoRet = () => {
        setMsjError("");

        if(!numFactura || numFactura.trim() === ""){
            setMsjError("Debe agregar el número de la factura");
            return;
        }
        if(numFactura.length < 17){
            setMsjError("Debe agregar el número completo de la factura");
            return;
        }
        if (!fechaEmisionFac) {
            setMsjError("Ingrese fecha de emisión de la factura");
            return;
        }
        if (!impuestoRet) {
            setMsjError("Seleccione un impuesto");
            return;
        }
        if (!codigoRet) {
            setMsjError("Seleccione un código de retención");
            return;
        }
        if (!baseImponible || Number(baseImponible) <= 1) {
            setMsjError("Ingrese una base imponible superior a 0");
            return;
        }

        // Buscar los datos del código seleccionado
        const codigoSeleccionado = codigosDisponibles.find(c => c.codigo === codigoRet);
        if (!codigoSeleccionado) {
            setMsjError("Código de impuesto no válido");
            return;
        }

        // Agregar el detalle al arreglo
        setDetalle(prev => [
            ...prev,
            {
                numFactura: numFactura.replaceAll("-", ""),
                fechaEmisionFac: fechaEmisionFac,
                baseImponible: Number(baseImponible),
                codigo: impuestoRet, 
                codigoRetencion: codigoSeleccionado.codigo,
                tipoImpuesto: codigoSeleccionado.descripcion,
                porcentajeRetener: codigoSeleccionado.porcentaje, 
                valorRetenido: Number(((baseImponible * codigoSeleccionado.porcentaje) / 100).toFixed(2)) 
            }
        ]);
        setShowModalImpuesto(false);
    };   

    const quitarProducto = (index) => {
        setDetalle((prev) => prev.filter((_, idx) => idx !== index));
    };
    
    useEffect(() => {
        let totalReten = 0;

        detalle.forEach((d) => {
            totalReten += Number(d.valorRetenido);
        });
        
        setTotalRetenido(Number(totalReten.toFixed(2)));
    }, [detalle]);

    const cerrarModalAgregarImp = () => {
        limpiarVariables();
        setShowModalImpuesto(false);
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

    // --- Emitir RET ---
    const emitirRet = async () => {
        limpiarVariables();
        if(!clienteSeleccionado || clienteSeleccionado.trim() === ""){
            setMsjError("Debe seleccionar cliente");
            setShowModalAdvertencia(true);
            return;
        }
        if(!ptoEmisionSeleccionado || ptoEmisionSeleccionado === null){
            setMsjError("Debe seleccionar punto de emisión");
            setShowModalAdvertencia(true);
            return;
        }
        if(!periodoFiscal){
            setMsjError("Debe ingresar período fiscal");
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
            const cliente = clientes.find((c) => c.id === parseInt(clienteSeleccionado));

            // === MAPEO RETENCIONES ===
            const retencionesDTO = detalle.map((d) => ({
                codigo: d.codigo,                     
                codigoRetencion: d.codigoRetencion,   
                baseImponible: Number(d.baseImponible?.toFixed(2) || 0),
                porcentajeRetener: Number(d.porcentajeRetener?.toFixed(2) || 0),
                valorRetenido: Number(d.valorRetenido?.toFixed(2) || 0),
                numDocSustento: d.numFactura,
                fechaEmisionDocSustento: d.fechaEmisionFac
            }));

            // === INFO ADICIONAL ===
            const infoAdicionalDTO = infoAdicional.map((ia, index) => ({
                nombre: ia.descripcionIA,
                valor: ia.valorIA,
                orden: index + 1
            }));

            const secuenciaFormateada = String(secuencial).padStart(9, "0");
            const partes = periodoFiscal.split("-"); 
            const periodoFiscalFinal = `${partes[1]}/${partes[0]}`; 

            // --- Construir DTO completo ---
            const retDTO  = {
                ruc: empresaSeleccionada?.ruc,
                estab: ptoEmisionSeleccionado.establecimiento,
                ptoEmi: ptoEmisionSeleccionado.puntoEmision,
                secuencia: secuenciaFormateada,
                emails: cliente?.email || "",
                fechaEmision,
                dirEstablecimiento: empresaSeleccionada?.direccionMatriz || "",
                tipoIdentificacionSujetoRetenido: cliente?.tipoIdentificacion || "07",
                razonSocialSujetoRetenido: cliente?.razonSocial || cliente?.nombreCliente,
                identificacionSujetoRetenido: cliente?.identificacion || cliente?.identificacionCliente,
                periodoFiscal: periodoFiscalFinal,
                retenciones: retencionesDTO,
                infoAdicional: infoAdicionalDTO
            };
            console.log("retDTO ",retDTO);
            const res = await api.post(`/emitirRetenciones/crear`, retDTO);
            const mensajeBackend = res.data?.[0]?.mensaje || `Comprobante generado correctamente`;
            await api.put(`/puntoEmision/${empresaSeleccionada.ruc}/${ptoEmisionSeleccionado.establecimiento}/${ptoEmisionSeleccionado.puntoEmision}/07/editarPuntoEmision`, {
                secuencial: Number(secuencial)+1,
                activo: true
            });
            const { data } = await api.get(`/puntoEmision/${empresaSeleccionada.ruc}/listaPtoEmisionPorTipo`, {
                params: { tipoDocumento: "07" }
            });
            setPtoEmision(data);
            setDetalle([]);
            setInfoAdicional([]);
            setSecuencial(0);
            setPtoEmisionSeleccionado("");
            setClienteSeleccionado("");
            setPeriodoFiscal("");
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
            <h2>Emisión de Retención</h2>
            <div className="documento-container">
                <div className="documento-section">
                    <h2 className="documento-title">Empresa: {empresaSeleccionada.razonSocial}</h2>
                    <div className="documento-grid">
                        <div className="documento-field">
                            <label>Razón social del cliente:</label>
                            <select value={clienteSeleccionado} onChange={(e) => setClienteSeleccionado(e.target.value)} >
                                <option value="">Seleccione</option>
                                <option value="9999999999999">Consumidor final - 9999999999999</option>
                                {clientes.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.razonSocial} - {c.identificacion}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
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
                            <label>Fecha de emisión:</label>
                            <input type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)}
                                className="documento-fecha" title="Fecha de Emisión" />
                        </div>   
                        <div className="documento-field" style={{display:"inline-grid"}}>
                            <label>Período fiscal:</label>
                            <input type="month" value={periodoFiscal} onChange={(e) => setPeriodoFiscal(e.target.value)} 
                                className="documento-mes" title="Período Fiscal" />
                        </div>                        
                    </div>
                </div>

                <div className="documento-section">            
                    <div style={{display:"inline-flex", width:"100%", marginBottom:"5px", alignItems:"center", justifyContent:"space-between"}}>
                        <h2 className="documento-title" style={{margin:"0px !important"}}>Detalle de la retención</h2>
                        <button className="modal-btn-save" onClick={mostrarModalAgregarImp}>
                            Agregar
                        </button>
                    </div>
                    <table className="general-table">
                        <thead>
                            <tr>
                                <th>No. Factura</th>
                                <th>Fecha Emisión</th>
                                <th>Base Imponible</th>
                                <th>Impuesto</th> 
                                <th>Tipo</th>
                                <th>Valor Retenido</th>
                                <th>Eliminar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {detalle.map((d, idx) => (
                                <tr key={idx}>
                                    <td>{d.numFactura}</td>
                                    <td>
                                        {d.fechaEmisionFac 
                                            ? new Date(d.fechaEmisionFac).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
                                            : "—"}
                                    </td>
                                    <td>{(d.baseImponible || 0).toFixed(2)}</td>
                                    <td>{d.codigo === "1" ? "Imp. Renta" : d.codigo === "2" ? "IVA Retención" : d.codigo === "6" ? "Imp. Salida Divisas" : "Otros"}</td>
                                    <td className="texto-corto" title={d.tipoImpuesto}>{d.tipoImpuesto}</td> 
                                    <td>{(d.valorRetenido || 0).toFixed(2)}</td>
                                    <td>
                                        <button className="btn-accion btn-toggle" title="Quitar impuesto" onClick={() => quitarProducto(idx)}>
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

                    {/* Totales */}
                    <div className="documento-totales" style={{height:"50px"}}>
                        <div className="documento-total" style={{paddingTop:"0px"}}>
                            <div><strong>Total Retenido:</strong></div>
                            <div>{new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(totalRetenido)}</div>
                        </div>
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
                        <button className="btn-crear documento-btn-emitir" onClick={emitirRet} >
                            Generar Comprobante
                        </button>
                    )}
                </div>
            </div>

            {/* --- Modal Impuesto --- */}
            {showModalImpuesto && empresaSeleccionada && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{width:"auto"}}>
                        <div className="modal-header">
                            <h3>Agregar Impuesto</h3>
                            <button className="modal-close" onClick={cerrarModalAgregarImp}>×</button>
                        </div>

                        {msjError && (
                            <div className="msj-error" style={{ marginTop: "0px", marginBottom: "10px" }}>
                                <p>{msjError}</p>
                            </div>
                        )}

                        <div className="modal-body" style={{display: "inline-grid"}}>

                            <div style={{display: "inline-grid", width:"100%"}}>
                                <div style={{display:"inline-flex", marginBottom:"5px"}}>
                                    <h2 className="documento-title" style={{margin:"0px !important"}}>Factura objeto de retención</h2>
                                </div>
                                <div style={{ display: "inline-flex", gap: "15px"}}>
                                    <div className="documento-field" style={{display:"inline-grid"}}>
                                        <label>No. Factura:</label>
                                        <input type="text" placeholder="001-001-000000000" value={numFactura} maxLength={17}
                                            style={{width:"145px", height:"31px", paddingLeft:"5px"}} onChange={(e) => {
                                                let value = e.target.value.replace(/\D/g, ""); 
                                                if (value.length > 3 && value.length <= 6) {
                                                    value = value.slice(0, 3) + "-" + value.slice(3);
                                                } else if (value.length > 6) {
                                                    value = value.slice(0, 3) + "-" + value.slice(3, 6) + "-" + value.slice(6, 15);
                                                }
                                                setNumFactura(value);
                                            }}
                                        />
                                    </div>
                                    <div className="documento-field" style={{display:"inline-grid"}}>
                                        <label>Fecha de emisión:</label>
                                        <input type="date" value={fechaEmisionFac} onChange={(e) => setFechaEmisionFac(e.target.value)}
                                            className="documento-fecha" title="Fecha de Emisión" />
                                    </div>  
                                    
                                </div>
                            </div>

                            <div className="lineaSeparadora"></div>

                            <div style={{display: "inline-grid", width:"100%"}}>
                                <div style={{display:"inline-flex", marginBottom:"5px"}}>
                                    <h2 className="documento-title" style={{margin:"0px !important"}}>Valores retenidos</h2>
                                </div>
                                <div style={{ display: "inline-grid"}}>
                                    <div className="documento-field" style={{display:"inline-grid"}}>
                                        <label>Impuesto:</label>
                                        <div style={{ display: "inline-flex", gap: "15px"}}>
                                            <select name="impuestoRet" value={impuestoRet} className="modal-select" style={{width:"145px", paddingLeft:"5px", color:"#221f1f"}}  
                                                onChange={(e) => setImpuestoRet(e.target.value)}>
                                                <option value="" disabled>Seleccione</option>
                                                <option value="1" style={{color: "#221f1f"}}>Imp. Renta</option>
                                                <option value="6" style={{color: "#221f1f"}}>Imp. Salida Divisas</option>
                                                <option value="2" style={{color: "#221f1f"}}>IVA Retención</option>
                                            </select>  
                                            <select name="codigoRet" value={codigoRet} className="modal-select" 
                                                style={{width:"300px", paddingLeft:"5px", textOverflow:"ellipsis", whiteSpace:"nowrap", color:"#221f1f", paddingRight:"25px"}}  
                                                onChange={(e) => setCodigoRet(e.target.value)} disabled={!impuestoRet}>
                                                <option value="" disabled>Seleccione</option>
                                                {codigosDisponibles.map((c) => (
                                                    <option key={c.codigo} value={c.codigo}>
                                                    {c.codigo} - {c.descripcion}
                                                    </option>
                                                ))}
                                            </select>  
                                        </div>
                                    </div>
                                    <div className="documento-field" style={{display:"inline-flex", marginTop:"5px", gap: "15px"}}>
                                        <div style={{display:"inline-grid", width:"145px"}}>
                                            <label>Porc. Retención:</label>
                                            <input type="text" value={porcentajeRet} className="modal-input" style={{paddingLeft:"5px"}} readOnly/>
                                        </div>  
                                        <div style={{display:"inline-grid"}}>
                                            <label>Base imponible:</label>
                                            <input name="baseImponible" type="number" value={baseImponible} className="modal-input sin-flechas" min="0" max="99999" step="0.01" placeholder="0"
                                                style={{textAlign: "right", paddingRight:"5px", width:"145px"}}  onChange={(e) => {const valor = e.target.value;
                                                    if (/^\d{0,9}(\.\d{0,2})?$/.test(valor)) {
                                                        setBaseImponible(valor);
                                                    } }}/>   
                                        </div> 
                                    </div>
                                    
                                    
                                </div>
                            </div>
                                                   
                        </div>

                        <div className="modal-buttons">
                            <button className="modal-btn-save" onClick={agregarImpuestoRet}>Agregar</button>
                            <button className="modal-btn-cancel" onClick={cerrarModalAgregarImp}>
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

export default Retencion; 