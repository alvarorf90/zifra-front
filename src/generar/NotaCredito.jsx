import React, { useState, useEffect } from "react";
import api from "../config/axios";
import ModalExito from "../components/ModalExito";
import ModalAdvertencia from "../components/ModalAdvertencia";
import { useLoading } from "../context/LoadingContext";
import { useEmpresas } from "../context/EmpresaContext";
import "../styles/emitir/documentos.css";

const NotaCredito = () => {
    const { empresaSeleccionada } = useEmpresas();
    const { setIsLoading } = useLoading();
    const [msjError, setMsjError] = useState("");
    const [msjExito, setMsjExito] = useState("");

    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [ptoEmision, setPtoEmision] = useState([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState("");
    const [ptoEmisionSeleccionado, setPtoEmisionSeleccionado] = useState("");
    const [secuencial, setSecuencial] = useState(0);
    const [fechaEmision, setFechaEmision] = useState(""); 
    const [motivo, setMotivo] = useState("");
    
    const [numComprobanteMod, setNumComprobanteMod] = useState(""); 
    const [fechaEmisionMod, setFechaEmisionMod] = useState("");     
    
    const [detalle, setDetalle] = useState([]);    

    const [infoAdicional, setInfoAdicional] = useState([]);
    const [descripcionIA, setDescripcionIA] = useState("");
    const [valorIA, setValorIA] = useState("");

    const [totales, setTotales] = useState({subtotal: 0, iva: 0, descuento:0, total: 0});
    
    const [showModalProducto, setShowModalProducto] = useState(false);
    const [showModalInfoAdicional, setShowModalInfoAdicional] = useState(false);
    
    const [showModalExitoso, setShowModalExitoso] = useState(false);
    const [showModalAdvertencia, setShowModalAdvertencia] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const productosPorPagina = 5;
    const totalPaginas = Math.ceil(productos.length / productosPorPagina);
    const indexOfLast = currentPage * productosPorPagina;
    const indexOfFirst = indexOfLast - productosPorPagina;   
    const productosPaginados = productos.slice(indexOfFirst, indexOfLast);

    useEffect(() => {
        if (currentPage > totalPaginas) {
            setCurrentPage(totalPaginas || 1);
        }
    }, [productos, currentPage, totalPaginas]);

    const limpiarVariables = () => {
        setMsjError("");
        setMsjExito("");
        setShowModalExitoso(false);
        setShowModalAdvertencia(false);
    };

    const cerrarModalExito = () => setShowModalExitoso(false);
    const cerrarModalAdvertencia = () => setShowModalAdvertencia(false);

    // --- Cargar clientes y productos ---
    useEffect(() => {
        if (!empresaSeleccionada) return;
        const cargarDatos = async () => {
            try {
                setIsLoading(true);
                const [resClientes, resProductos, resPtoEmision] = await Promise.all([
                    api.get(`/clientes/${empresaSeleccionada.ruc}/buscarPorRucActivos`),
                    api.get(`/productos/${empresaSeleccionada.ruc}/buscarPorRucActivos`),
                    api.get(`/puntoEmision/${empresaSeleccionada.ruc}/listaPtoEmisionPorTipo`, {
                        params: { tipoDocumento: "04" }
                    }),
                ]);
                setClientes(resClientes.data);
                setProductos(resProductos.data);
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

    // --- Agregar producto al detalle ---
    const mostrarModalAgregarPrd = () => {
        limpiarVariables();
        const productosInicializados = productos.map((prd) => ({
            ...prd,
            cantidad: 1,
            descuento: 0,
        }));
        setProductos(productosInicializados);
        setShowModalProducto(true);
    };

    // --- Agregar producto ---
    const agregarProducto = (prod) => {
        if (!prod) return;

        const { cantidad, descuento, precio, codImp, porcentajeIva, subtotal, iva, total } = calcularTotalesDetalle(prod);
        
        setDetalle(prev => [
            ...prev,
            {
                id: prod.id,
                codPrc: prod.codigoPrincipal,
                codAux: prod.codigoAuxiliar,
                nombre: prod.descripcion,
                precio,
                cantidadDet: cantidad,
                descuentoDet: (descuento * cantidad),
                tarifaIva: prod.tarifaIva,
                codImp,
                porcentajeIva,
                subtotal, 
                iva, 
                total
            }
        ]);
    };

    const quitarProducto = (index) => {
        setDetalle((prev) => prev.filter((_, idx) => idx !== index));
    };
    
    // --- Calcular totales automáticamente cuando cambia detalle ---
    const calcularTotalesDetalle = (prod) => {
        const cantidad = parseFloat(prod.cantidad) || 1;
        const descuento = parseFloat(prod.descuento) || 0;
        const precio = parseFloat(prod.valorUni) || 0;
        const codImp = String(prod.impuesto || "2");
        const tarifa = String(prod.tarifaIva || "0");
        const porcentajeIva = tarifa === "4" ? 0.15 : tarifa === "2" ? 0.12 : tarifa === "3" ? 0.14 : 0;
        const subtotal = (precio * cantidad) - (descuento * cantidad);
        const iva = subtotal * porcentajeIva;
        const total = subtotal + iva;
        return { cantidad, descuento, precio, codImp, porcentajeIva, subtotal, iva, total };
    };

    useEffect(() => {
        let subtotal = 0;
        let totalIva = 0;
        let totalDescuento = 0;

        detalle.forEach((d) => {
            const base = Number(d.precio) * Number(d.cantidadDet);
            const desc = Number(d.descuentoDet);
            const imponible = base - desc;
            subtotal += imponible;
            totalIva += imponible * (Number(d.porcentajeIva) || 0);
            totalDescuento += desc;
        });

        setTotales({
            subtotal: Number(subtotal.toFixed(2)),
            iva: Number(totalIva.toFixed(2)),
            descuento: Number(totalDescuento.toFixed(2)),
            total: Number((subtotal + totalIva).toFixed(2))
        });
    }, [detalle]);

    const cerrarModalAgregarPrd = () => {
        limpiarVariables();
        setShowModalProducto(false);
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

    // --- Emitir NC ---
    const emitirNC = async () => {
        limpiarVariables();
        if(!clienteSeleccionado || clienteSeleccionado.trim() === ""){
            setMsjError("Debe seleccionar cliente");
            setShowModalAdvertencia(true);
            return;
        }
        if(!ptoEmisionSeleccionado || ptoEmisionSeleccionado === null){
            setMsjError("Debe seleccionar punto de emisión.");
            setShowModalAdvertencia(true);
            return;
        }
        if(!numComprobanteMod || numComprobanteMod.trim() === ""){
            setMsjError("Debe agregar el número de la factura");
            setShowModalAdvertencia(true);
            return;
        }
        if(numComprobanteMod.length < 17){
            setMsjError("Debe agregar el número completo de la factura");
            setShowModalAdvertencia(true);
            return;
        }
        if(!fechaEmisionMod || fechaEmisionMod.trim() === ""){
            setMsjError("Debe agregar la fecha de emisión de la factura");
            setShowModalAdvertencia(true);
            return;
        }
        if(!motivo || motivo.trim() === ""){
            setMsjError("Debe agregar el motivo");
            setShowModalAdvertencia(true);
            return;
        }
        if(detalle.length === 0){
            setMsjError("Debe agregar detalles.");
            setShowModalAdvertencia(true);
            return;
        }  

        try {
            setIsLoading(true);
            const cliente = clientes.find((c) => c.id === parseInt(clienteSeleccionado));

            // --- Mapear detalles con impuestos ---
            const detallesDTO = detalle.map((d) => ({
                codigoPrincipal: d.codPrc,
                codigoAuxiliar: d.codAux,
                descripcion: d.nombre,
                cantidad: d.cantidadDet === null ? 0.0 : Number(d.cantidadDet.toFixed(2)),                
                precioUnitario: d.precio === null ? 0.0 : Number(d.precio.toFixed(2)),
                descuento: d.descuentoDet === null ? 0.0 : Number(d.descuentoDet.toFixed(2)),
                precioTotalSinImpuesto: d.subtotal === null ? 0.0 : Number(d.subtotal.toFixed(2)),
                impuestos: [
                    {
                        impuestoCodigo: d.codImp, 
                        impuestoCodigoPorcentaje: d.tarifaIva,
                        impuestoBaseImponible: d.subtotal === null ? 0.0 : Number(d.subtotal.toFixed(2)),
                        impuestoTarifa: (d.porcentajeIva * 100)+".00",
                        impuestoValor: d.iva === null ? 0.00 : Number(d.iva.toFixed(2))
                    }
                ]
            }));

            // --- Agrupar impuestos globales ---
            const impuestosMap = {};
            detallesDTO.forEach((d) => {
                d.impuestos.forEach((i) => {
                    const key = `${i.impuestoCodigo}-${i.impuestoCodigoPorcentaje}`;
                    if (!impuestosMap[key]) {
                        impuestosMap[key] = {
                            codigo: i.impuestoCodigo,
                            codigoPorcentaje: i.impuestoCodigoPorcentaje,
                            tarifa: i.impuestoTarifa,
                            baseImponible: 0,
                            valor: 0,
                            descuentoAdicional: 0
                        };
                    }
                    impuestosMap[key].baseImponible += i.impuestoBaseImponible;
                    impuestosMap[key].valor += i.impuestoValor;
                });
            });
            const impuestosGlobales = Object.values(impuestosMap);

            // --- Mapear información adicional ---
            const infoAdicionalDTO = infoAdicional.map((ia, index) => ({
                nombre: ia.descripcionIA,
                valor: ia.valorIA,
                orden: index + 1
            }));

            // --- Construir DTO completo ---
            const ncDTO = {
                ruc: empresaSeleccionada?.ruc,
                estab: ptoEmisionSeleccionado.establecimiento,
                ptoEmi: ptoEmisionSeleccionado.puntoEmision,
                secuencia: String(secuencial).padStart(9, "0"),
                emails: cliente?.email || "",
                fechaEmision,
                dirEstablecimiento: empresaSeleccionada?.direccionMatriz || "",
                tipoIdentificacionComprador: cliente?.tipoIdentificacion || "07",
                razonSocialComprador: cliente?.razonSocial || cliente?.nombreCliente,
                identificacionComprador: cliente?.identificacion || cliente?.identificacionCliente,
                numDocModificado: numComprobanteMod || "", 
                fechaEmisionDocSustentoCab: fechaEmisionMod || "", 
                valorModificacion: Number(totales.total || 0),
                motivo: motivo || "-", 
                importeTotal: Number(totales.total || 0),
                totalSinImpuestos: Number(totales.subtotal || 0),
                importeAPagar: Number(totales.total || 0),
                detalles: detallesDTO,
                impuestos: impuestosGlobales,
                infoAdicional: infoAdicionalDTO
            };
            const res = await api.post(`/emitirNotasCredito/crear`, ncDTO);
            const mensajeBackend = res.data?.[0]?.mensaje || `Comprobante generado correctamente`;
            await api.put(`/puntoEmision/${empresaSeleccionada.ruc}/${ptoEmisionSeleccionado.establecimiento}/${ptoEmisionSeleccionado.puntoEmision}/04/editarPuntoEmision`, {
                secuencial: Number(secuencial)+1,
                activo: true
            });
            const { data } = await api.get(`/puntoEmision/${empresaSeleccionada.ruc}/listaPtoEmisionPorTipo`, {
                params: { tipoDocumento: "04" }
            });
            setPtoEmision(data);
            setDetalle([]);
            setTotales({ subtotal: 0, iva: 0, descuento: 0, total: 0 });
            setInfoAdicional([]);
            setSecuencial(0);
            setPtoEmisionSeleccionado("");
            setClienteSeleccionado("");
            setMotivo("");
            setNumComprobanteMod("");
            setFechaEmisionMod("");
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
            <h2>Emisión de Nota de Crédito</h2>
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
                        <div className="documento-field" style={{display:"inline-grid"}}>
                            <label>Fecha de emisión:</label>
                            <input type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)}
                                className="documento-fecha" title="Fecha de Emisión" />
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
                            <input type="text" placeholder="001-001-000000000" value={numComprobanteMod} maxLength={17}
                                style={{width:"145px", height:"31px"}} onChange={(e) => {
                                    let value = e.target.value.replace(/\D/g, ""); 
                                    if (value.length > 3 && value.length <= 6) {
                                        value = value.slice(0, 3) + "-" + value.slice(3);
                                    } else if (value.length > 6) {
                                        value = value.slice(0, 3) + "-" + value.slice(3, 6) + "-" + value.slice(6, 15);
                                    }
                                    setNumComprobanteMod(value);
                                }}
                            />
                        </div>
                        <div style={{display:"inline-grid"}}>
                            <label>Fecha de emisión:</label>
                            <input type="date" value={fechaEmisionMod} onChange={(e) => setFechaEmisionMod(e.target.value)}
                                className="documento-fecha" title="Fecha de Emisión de Comprobante" />
                        </div>
                        <div style={{display:"inline-grid"}}>
                            <label>Motivo:</label>
                            <input name="motivo" type="text" value={motivo} style={{ width: "400px", paddingLeft:"5px", height:"31px"}}  maxLength={150} 
                                onChange={(e) => {setMotivo(e.target.value);}}
                            /> 
                        </div>
                    </div>
                </div>

                <div className="documento-section">                    
                    <div style={{display:"inline-flex", width:"100%", marginBottom:"5px", alignItems:"center", justifyContent:"space-between"}}>
                        <h2 className="documento-title" style={{margin:"0px !important"}}>Detalle de la nota de crédito</h2>
                        <button className="modal-btn-save" onClick={mostrarModalAgregarPrd}>
                            Agregar
                        </button>
                    </div>
                    <table className="general-table">
                        <thead>
                            <tr>
                                <th>Cod. Prc.</th>
                                <th>Cod. Aux.</th>
                                <th>Descripción</th>
                                <th>Cantidad</th>
                                <th>Precio Unitario</th>
                                <th>Descuento</th> 
                                <th>SubTotal</th>
                                <th>IVA</th>
                                <th>Valor</th>
                                <th>Eliminar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {detalle.map((d, idx) => (
                                <tr key={idx}>
                                    <td>{d.codPrc}</td>
                                    <td>{d.codAux}</td>
                                    <td>{d.nombre}</td>
                                    <td>{d.cantidadDet}</td>
                                    <td>{(d.precio || 0).toFixed(2)}</td>
                                    <td>{(d.descuentoDet || 0).toFixed(2)}</td>
                                    <td>{(d.subtotal || 0).toFixed(2)}</td>                                         
                                    <td>
                                        {d.tarifaIva === "4" ? "15%" : d.tarifaIva === "2" ? "12%" : d.tarifaIva === "3" ? "14%"
                                            : d.tarifaIva === "6" ? "No Objeto Imp." : d.tarifaIva === "7" ? "Exento IVA" : "0%"}
                                    </td>
                                    <td>{(d.total || 0).toFixed(2)}</td>
                                    <td>
                                        <button className="btn-accion btn-toggle" title="Quitar detalle" onClick={() => quitarProducto(idx)}>
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
                        <div id="sectInfoAdi" style={{marginTop:"20px"}}>
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
                    <div className="documento-totales">
                        <div className="documento-datos">
                            <div><strong>Subtotal sin impuestos:</strong></div>
                            <div>{new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(totales.subtotal)}</div>
                        </div>
                        <div className="documento-datos">
                            <div><strong>Total impuestos:</strong></div>
                            <div>{new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(totales.iva)}</div>
                        </div>
                        <div className="documento-datos">
                            <div><strong>Total descuento:</strong></div>
                            <div>{new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(totales.descuento)}</div>
                        </div>
                        <div className="documento-total">
                            <div><strong>Total:</strong></div>
                            <div>{new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(totales.total)}</div>
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
                        <button className="btn-crear documento-btn-emitir" onClick={emitirNC} >
                            Generar Comprobante
                        </button>
                    )}
                </div>
            </div>

            {/* --- Modal Producto --- */}
            {showModalProducto && empresaSeleccionada && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{width:"auto"}}>
                        <div className="modal-header">
                            <h3>Agregar Producto</h3>
                            <button className="modal-close" onClick={cerrarModalAgregarPrd}>×</button>
                        </div>

                        {msjError && (
                            <div className="msj-error" style={{ marginTop: "0px", marginBottom: "10px" }}>
                                <p>{msjError}</p>
                            </div>
                        )}

                        <div className="modal-body" style={{ display: "inline-grid" }}>                            
                            <table className="general-table">
                                <thead>
                                    <tr>
                                        <th>Cod. Prc.</th>
                                        <th>Cod. Aux.</th>
                                        <th>Descripción</th>
                                        <th>Cantidad</th>
                                        <th>Descuento</th>
                                        <th>IVA</th>
                                        <th>Precio Uni.</th>
                                        <th>Agregar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productosPaginados.map((prd, index) => {
                                        const indexReal = indexOfFirst + index;
                                        return (
                                            <tr key={indexReal}>
                                            <td>{prd.codigoPrincipal}</td>
                                            <td>{prd.codigoAuxiliar}</td>
                                            <td title={prd.descripcion} style={{maxWidth:"200px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}> 
                                                {prd.descripcion === "" ? "-" : prd.descripcion}
                                            </td>
                                            <td>
                                                <input type="number" className="tabla-input sin-flechas" min="1" max="9999"
                                                    value={prd.cantidad || 1}
                                                    onChange={(e) => {
                                                        let valor = parseInt(e.target.value) || 1;
                                                        if (valor < 1) valor = 1;
                                                        if (valor > 9999) valor = 9999;
                                                        const nuevaLista = [...productos];
                                                        nuevaLista[indexReal].cantidad = valor;
                                                        setProductos(nuevaLista);
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <input type="number" className="tabla-input sin-flechas" min="0" max="999" step="0.01"
                                                    value={prd.descuento || 0}
                                                    onChange={(e) => {
                                                        let valor = parseFloat(e.target.value) || 0;
                                                        if (valor < 0) valor = 0;
                                                        if (valor > 999) valor = 999;
                                                        const nuevaLista = [...productos];
                                                        nuevaLista[indexReal].descuento = valor;
                                                        setProductos(nuevaLista);
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                {prd.tarifaIva === "4" ? "15%" : prd.tarifaIva === "2" ? "12%" : prd.tarifaIva === "3" ? "14%"
                                                    : prd.tarifaIva === "6" ? "No Objeto Imp." : prd.tarifaIva === "7" ? "Exento IVA" : "0%"}
                                            </td>
                                            <td>{prd.valorUni.toFixed(2)}</td>
                                            <td>
                                                <button className="btn-accion btn-editar" title="Agregar Detalle" 
                                                        onClick={() => agregarProducto({ ...prd, cantidad: prd.cantidad, descuento: prd.descuento })} >
                                                    ➕
                                                </button>
                                            </td>
                                        </tr>
                                        );
                                    })}
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
                        </div>

                        <div className="modal-buttons" style={{marginTop:"0px"}}>
                            <button className="modal-btn-cancel" onClick={cerrarModalAgregarPrd}>
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

export default NotaCredito; 