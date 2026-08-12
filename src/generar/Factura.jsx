import React, { useState, useEffect } from "react";
import api from "../config/axios";
import ModalExito from "../components/ModalExito";
import ModalAdvertencia from "../components/ModalAdvertencia";
import { useLoading } from "../context/LoadingContext";
import { useEmpresas } from "../context/EmpresaContext";
import "../styles/emitir/documentos.css";

const Factura = () => {
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
    const [numGuia, setNumGuia] = useState("");
    const [placa, setPlaca] = useState("");
    
    const [detalle, setDetalle] = useState([]);    

    const [formaPago, setFormaPago] = useState([]);
    const [codigoFP, setCodigoFP] = useState("");
    const [valorFP, setValorFP] = useState(0);
    const [plazoFP, setPlazoFP] = useState(1);
    const [tiempoFP, setTiempoFP] = useState("dias");

    const [infoAdicional, setInfoAdicional] = useState([]);
    const [descripcionIA, setDescripcionIA] = useState("");
    const [valorIA, setValorIA] = useState("");

    const [totales, setTotales] = useState({subtotal: 0, iva: 0, descuento:0, total: 0});
    
    const [showModalProducto, setShowModalProducto] = useState(false);
    const [showModalFormaPago, setShowModalFormaPago] = useState(false);
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
                        params: { tipoDocumento: "01" }
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
                setInfoAdicional((prev) => {
                    const descripcion = "RUC Proveedor";

                    const indice = prev.findIndex(
                        (item) => item.descripcionIA.toLowerCase() === descripcion.toLowerCase()
                    );

                    if (indice >= 0) {
                        const copia = [...prev];
                        copia[indice] = {
                            ...copia[indice],
                            valorIA: "0993403978001",
                        };
                        return copia;
                    }

                    return [
                        ...prev,
                        {
                            descripcionIA: descripcion,
                            valorIA: "0993403978001",
                        },
                    ];
                });
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
                setInfoAdicional((prev) =>
                    prev.filter(
                        (item) => item.descripcionIA.toLowerCase() !== "correo"
                    )
                );
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
        setCurrentPage(1);
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

    // --- Agregar forma de pago ---
    const mostrarModalFormaPago = () => {
        limpiarVariables();
        setCodigoFP("");
        setTiempoFP("dias");
        setValorFP(0);
        setPlazoFP(1);
        setShowModalFormaPago(true);
    };

    const agregarFormaPago = () => {
        setMsjError("");
        if (!codigoFP || codigoFP.trim() === "") {
            setMsjError("🚫 Debe seleccionar una descripción");
            return;
        }
        if (valorFP < 1) {
            setMsjError("🚫 El valor no debe ser mayor a 0");
            return;
        }

        const descripcion = codigoFP === "01" ? "Sin utilización del sist. finan." 
            : codigoFP === "15" ? "Compensación de deudas" 
            : codigoFP === "16" ? "Tarjeta de débito" 
            : codigoFP === "17" ? "Dinero electrónico" 
            : codigoFP === "18" ? "Tarjeta prepago" 
            : codigoFP === "19" ? "Tarjeta de crédito" 
            : codigoFP === "20" ? "Otros con utilización del sist. finan." 
            : "Endoso de títulos";

        setFormaPago(prev => [
            ...prev,
            {
                codigoFP,
                descripcion,
                valorFP,
                plazoFP,
                tiempoFP
            }
        ]);
    };

    const quitarFormaPago = (index) => {
        setFormaPago((prev) => prev.filter((_, idx) => idx !== index));
    };

    const cerrarModalFormaPago = () => {
        limpiarVariables();
        setShowModalFormaPago(false);
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

    // --- Emitir factura ---
    const emitirFactura = async () => {
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
        if(detalle.length === 0){
            setMsjError("Debe agregar detalles.");
            setShowModalAdvertencia(true);
            return;
        }
        if(formaPago.length === 0){
            setMsjError("Debe agregar forma de pago.");
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
                cantidad: d.cantidadDet === null ? 0.0 : Number(d.cantidadDet.toFixed(4)),
                precioUnitario: d.precio === null ? 0.0 : Number(d.precio.toFixed(4)),
                descuento: d.descuentoDet === null ? 0.0 : Number(d.descuentoDet.toFixed(4)),
                precioTotalSinImpuesto: d.subtotal === null ? 0.0 : Number(d.subtotal.toFixed(4)),
                impuestos: [
                    {
                        impuestoCodigo: d.codImp, 
                        impuestoCodigoPorcentaje: d.tarifaIva,
                        impuestoBaseImponible: d.subtotal === null ? 0.0 : Number(d.subtotal.toFixed(4)),
                        impuestoTarifa: (d.porcentajeIva * 100)+".00",
                        impuestoValor: d.iva === null ? 0.00 : Number(d.iva.toFixed(4))
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

            // --- Mapear formas de pago ---
            const formasPagoDTO = formaPago.map((fp) => ({
                codFormaPago: fp.codigoFP,
                total: fp.valorFP,
                plazo: fp.plazoFP,
                unidadTiempo: fp.tiempoFP === null ? "NINGUNO" : fp.tiempoFP
            }));

            // --- Mapear información adicional ---
            const infoAdicionalDTO = infoAdicional.map((ia, index) => ({
                nombre: ia.descripcionIA,
                valor: ia.valorIA,
                orden: index + 1
            }));

            const secuenciaFormateada = String(secuencial).padStart(9, "0");

            // --- Construir DTO completo ---
            const facturaDTO = {
                ruc: empresaSeleccionada?.ruc,
                estab: ptoEmisionSeleccionado.establecimiento,
                ptoEmi: ptoEmisionSeleccionado.puntoEmision,
                secuencia: secuenciaFormateada,
                emails: cliente?.email || "",
                fechaEmision,
                guiaRemision: numGuia || "",
                placa: placa || "",
                dirEstablecimiento: empresaSeleccionada?.direccionMatriz || "",
                tipoIdentificacionComprador: cliente?.tipoIdentificacion || "07",
                razonSocialComprador: cliente?.razonSocial || cliente?.nombreCliente,
                identificacionComprador: cliente?.identificacion || cliente?.identificacionCliente,
                subtotaIva: totales.subtotal,
                subtotal0: 0,
                subtotalNoSujeto: 0,
                totalSinImpuestos: totales.subtotal,
                totalDescuento: totales.descuento,
                ice: 0,
                iva12: totales.iva,
                importeTotal: totales.total,
                propina: 0,
                importeAPagar: totales.total,
                dirComprador: cliente?.direccion || "",
                detalles: detallesDTO,
                formasPago: formasPagoDTO,
                impuestos: impuestosGlobales,
                infoAdicional: infoAdicionalDTO
            };
            const res = await api.post(`/emitirFacturas/crear`, facturaDTO);
            const mensajeBackend = res.data?.[0]?.mensaje || `Comprobante generado correctamente`;
            await api.put(`/puntoEmision/${empresaSeleccionada.ruc}/${ptoEmisionSeleccionado.establecimiento}/${ptoEmisionSeleccionado.puntoEmision}/01/editarPuntoEmision`, {
                secuencial: Number(secuencial)+1,
                activo: true
            });
            const { data } = await api.get(`/puntoEmision/${empresaSeleccionada.ruc}/listaPtoEmisionPorTipo`, {
                params: { tipoDocumento: "01" }
            });
            setPtoEmision(data);
            setDetalle([]);
            setTotales({ subtotal: 0, iva: 0, descuento: 0, total: 0 });
            setFormaPago([]);
            setInfoAdicional([
                {
                    descripcionIA: "RUC Proveedor",
                    valorIA: "0993403978001",
                },
            ]);
            setSecuencial(0);
            setPtoEmisionSeleccionado("");
            setClienteSeleccionado("");            
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
            <h2>Emisión de Factura</h2>
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
                    <div style={{width:"100%" ,display:"inline-flex", gap:"1rem", marginTop:"5px"}}>
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
                        <div className="documento-field" style={{display:"inline-grid", marginRight:"7px"}}>
                            <label>Fecha de emisión:</label>
                            <input type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)}
                                className="documento-fecha" title="Fecha de Emisión" />
                        </div>
                        <div className="documento-field" style={{display:"inline-grid"}}>
                            <label>Guía de Remisión:</label>
                            <input type="text" placeholder="001-001-000000000" value={numGuia} maxLength={17}
                                className="documento-input" onChange={(e) => {
                                    let value = e.target.value.replace(/\D/g, ""); 
                                    if (value.length > 3 && value.length <= 6) {
                                        value = value.slice(0, 3) + "-" + value.slice(3);
                                    } else if (value.length > 6) {
                                        value = value.slice(0, 3) + "-" + value.slice(3, 6) + "-" + value.slice(6, 15);
                                    }
                                    setNumGuia(value);
                                }}
                            />
                        </div>
                        <div className="documento-field" style={{ display: "inline-grid" }}>
                            <label>Placa:</label>
                            <input type="text" placeholder="AAA0000" value={placa} maxLength={7} className="documento-input"
                                onChange={(e) => {
                                    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                                    const letras = value.replace(/[^A-Z]/g, "").slice(0, 3);
                                    const numeros = value.replace(/\D/g, "").slice(0, 4);
                                    setPlaca(letras + numeros);
                                }}
                                onBlur={() => {
                                    if (placa.length >= 6) {
                                        const letras = placa.slice(0, 3);
                                        let numeros = placa.slice(3);
                                        if (numeros.length === 3) {
                                            numeros = "0" + numeros;
                                        }
                                        setPlaca(letras + numeros);
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="documento-section">                    
                    <div style={{display:"inline-flex", width:"100%", marginBottom:"5px", alignItems:"center", justifyContent:"space-between"}}>
                        <h2 className="documento-title" style={{margin:"0px !important"}}>Detalle de la factura</h2>
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
                                    <td>{(d.precio || 0).toFixed(4)}</td>
                                    <td>{(d.descuentoDet || 0).toFixed(2)}</td>
                                    <td>{(d.subtotal || 0).toFixed(4)}</td>                                         
                                    <td>
                                        {d.tarifaIva === "4" ? "15%" : d.tarifaIva === "2" ? "12%" : d.tarifaIva === "3" ? "14%"
                                            : d.tarifaIva === "6" ? "No Objeto Imp." : d.tarifaIva === "7" ? "Exento IVA" : "0%"}
                                    </td>
                                    <td>{(d.total || 0).toFixed(4)}</td>
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
                        <div id="sectFpg">
                            <div style={{display:"inline-flex", width:"100%", marginBottom:"5px", alignItems:"center", justifyContent:"space-between"}}>
                                <h2 className="documento-title" style={{margin:"0px !important"}}>Forma de pago</h2>
                                <button className="modal-btn-save" onClick={mostrarModalFormaPago}>
                                    Agregar
                                </button>
                            </div>
                            <table className="general-table">
                                <thead>
                                    <tr>
                                        <th>Descripción</th>
                                        <th>Valor</th>
                                        <th>Plazo</th>
                                        <th>Tiempo</th> 
                                        <th>Eliminar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formaPago.map((d, cod) => (
                                        <tr key={cod}>
                                            <td className="texto-corto" title={d.descripcion}>{d.descripcion}</td>
                                            <td>{d.valorFP === null ? "0.00" : Number(d.valorFP).toFixed(4)}</td>
                                            <td>{d.plazoFP}</td>
                                            <td style={{textTransform:"capitalize"}}>{d.tiempoFP}</td>
                                            <td>
                                                <button className="btn-accion btn-toggle" title="Quitar detalle" onClick={() => quitarFormaPago(cod)}>
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div> 
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
                                                {d.descripcionIA.toLowerCase() !== "ruc proveedor" && (
                                                    <button className="btn-accion btn-toggle" title="Quitar detalle" onClick={() => quitarInfoAdicional(id)}>
                                                        🗑️
                                                    </button>
                                                )}
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
                        <button className="btn-crear documento-btn-emitir" onClick={emitirFactura} >
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
                                                <input type="number" className="tabla-input sin-flechas" min="1" max="999999"
                                                    value={prd.cantidad || 1}
                                                    onChange={(e) => {
                                                        let valor = parseInt(e.target.value) || 1;
                                                        if (valor < 1) valor = 1;
                                                        if (valor > 999999) valor = 999999;
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
                                            <td>{prd.valorUni.toFixed(4)}</td>
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

            {/* --- Modal Forma de Pago --- */}
            {showModalFormaPago && empresaSeleccionada && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{width:"auto"}}>
                        <div className="modal-header">
                            <h3>Agregar forma de pago</h3>
                            <button className="modal-close" onClick={cerrarModalFormaPago}>×</button>
                        </div>

                        {msjError && (
                            <div className="msj-error" style={{ marginTop: "0px", marginBottom: "10px" }}>
                                <p>{msjError}</p>
                            </div>
                        )}

                        <div className="modal-body" style={{display: "inline-grid", width:"340px"}}>

                            <div style={{display:"inline-flex", alignItems:"center", justifyContent:"space-between"}}>
                                <label style={{color: "#221f1f", marginBottom:"5px"}}>Descripción:</label>
                                <select name="codigoFP" value={codigoFP} className="modal-select" style={{width:"250px", color:"#221f1f"}} onChange={(e) => setCodigoFP(e.target.value)}>
                                    <option value="" disabled>Seleccione</option>
                                    <option value="01" style={{color: "#221f1f"}}>Sin utilización del sist. finan.</option>
                                    <option value="15" style={{color: "#221f1f"}}>Compensación de deudas</option>
                                    <option value="16" style={{color: "#221f1f"}}>Tarjeta de débito</option>
                                    <option value="17" style={{color: "#221f1f"}}>Dinero electrónico</option>
                                    <option value="18" style={{color: "#221f1f"}}>Tarjeta prepago</option>
                                    <option value="19" style={{color: "#221f1f"}}>Tarjeta de crédito</option>
                                    <option value="20" style={{color: "#221f1f"}}>Otros con utilización del sist. finan.</option>
                                    <option value="21" style={{color: "#221f1f"}}>Endoso de títulos</option>
                                </select> 
                            </div>

                            <div style={{display:"inline-flex", alignItems:"center", justifyContent:"space-between", marginTop:"10px"}}>
                                <label style={{color: "#221f1f", marginBottom:"5px"}}>Valor:</label>
                                <input name="valorFP" type="number" value={valorFP} className="modal-input sin-flechas" min="0" max="9999" step="0.01" placeholder="0"
                                    style={{ width: "250px", textAlign: "right" }}  onChange={(e) => {const valor = e.target.value;
                                        if (/^\d{0,9}(\.\d{0,2})?$/.test(valor)) {
                                            setValorFP(valor);
                                        } }}/>    
                            </div>

                            <div style={{display:"inline-flex", alignItems:"center", justifyContent:"space-between", marginTop:"10px"}}>
                                <label style={{color: "#221f1f", marginBottom:"5px"}}>Plazo:</label>
                                <input name="plazoFP" type="number" value={plazoFP} className="modal-input sin-flechas" min="1" max="999" placeholder="1"
                                    style={{ width: "250px", textAlign: "right" }}  onChange={(e) => {const valor = e.target.value;
                                        if (/^\d{1,9}$/.test(valor)) {
                                            setPlazoFP(valor);
                                        } }}/>    
                            </div>
                                
                            <div style={{display:"inline-flex", alignItems:"center", justifyContent:"space-between", marginTop:"10px"}}>
                                <label style={{color: "#221f1f", marginBottom:"5px"}}>Tiempo:</label>
                                <select name="tiempoFP" value={tiempoFP} className="modal-select" style={{width:"250px", color:"#221f1f"}} onChange={(e) => setTiempoFP(e.target.value)}>                                    
                                    <option value="dias" style={{color: "#221f1f"}}>Días</option>
                                    <option value="meses" style={{color: "#221f1f"}}>Meses</option>
                                    <option value="años" style={{color: "#221f1f"}}>Años</option>
                                </select> 
                            </div>                      
                        </div>

                        <div className="modal-buttons">
                            <button className="modal-btn-save" onClick={agregarFormaPago}>Agregar</button>
                            <button className="modal-btn-cancel" onClick={cerrarModalFormaPago}>
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

export default Factura; 