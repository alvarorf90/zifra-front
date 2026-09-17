import React, { useState, useEffect } from "react";
import api from "../config/axios";
import { useLoading } from "../context/LoadingContext";
import { useEmpresas } from "../context/EmpresaContext";
import ModalAdvertencia from "../components/ModalAdvertencia";
import "../styles/consultar/comprobantes.css";

const Recepcion = () => {
    const { setIsLoading } = useLoading();
    const { empresaSeleccionada } = useEmpresas();
    const [filteredRecibidos, setFilteredRecibidos] = useState([]);
    const [error, setError] = useState("");
    const [exito, setExito] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const emitidosPorPagina = 20;
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [numComprobante, setNumComprobante] = useState("");
    const [tipoComprobante, setTipoComprobante] = useState("");
    const [cantidadMostrar, setCantidadMostrar] = useState("20");
    const [rucReceptor, setRucReceptor] = useState("");
    const [rucEmisor, setRucEmisor] = useState("");
    const [tipoFecha, setTipoFecha] = useState("E");
    const [retBcos, setRetBcos] = useState(false);

    const [msjAdv, setMsjAdv] = useState("");
    const [showModalAdvertencia, setShowModalAdvertencia] = useState(false);

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
      const cargarFechas = () => {
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
        } catch (error) {
          console.error("Error cargando datos:", error);
        } finally {
          setIsLoading(false);
        }
      };
      cargarFechas();
    }, [setIsLoading]);

    // --- Cargar comprobantes emitidos ---
    const fetchEmitidos = async () => {
        cerrarMesj();
        if (!fechaInicio || !fechaFin) {
            setError("🚫 Debes seleccionar fecha inicio y fin");
            return;
        }
        if (fechaInicio > fechaFin) {
            setError("🚫 Fecha inicio no puede ser menor a la fecha fin");
            return;
        }
        try {
            setIsLoading(true);
            setFilteredRecibidos([]);
            const params = new URLSearchParams({
              tipoFecha,
              fechaInicio,
              fechaFin,
              cantidadMostrar,
              retBcos,
            });

            if (esAdmin && rucReceptor) params.append("ruc", rucReceptor);
            else if (empresaSeleccionada) params.append("ruc", empresaSeleccionada.ruc);

            if (numComprobante) params.append("numComprobante", numComprobante);
            if (tipoComprobante) params.append("tipoComprobante", tipoComprobante);
            if (!esAdmin && rucEmisor) params.append("rucEmisor", rucEmisor);

            const url = `/comprobantesRecibidos/consulta?${params.toString()}`;            
            const { data } = await api.get(url);
            setFilteredRecibidos(data);
            setExito("✅ Consulta realizada correctamente");
            setCurrentPage(1);
        } catch (err) {
            setError("🚫 "+ (err.response?.data?.message || err.message || "Error al cargar comprobantes recibidos"));
        } finally {
            setIsLoading(false);
        }
    };
    
    const indexOfLast = currentPage * emitidosPorPagina;
    const indexOfFirst = indexOfLast - emitidosPorPagina;
    const emitidosPaginados = filteredRecibidos.slice(indexOfFirst, indexOfLast);
    const totalPaginas = Math.ceil(filteredRecibidos.length / emitidosPorPagina);

    const cerrarMesj = () => {
        setError("");
        setExito("");
    };

    useEffect(() => {
      setCurrentPage(1);
    }, [cantidadMostrar, fechaInicio, fechaFin, tipoComprobante, numComprobante, rucReceptor]);

    // --- Genera RIDE ---
    const generarRide = async (claveAcceso) => {
      try {
          setIsLoading(true); 
          const res = await api.get(`/comprobantesRecibidos/ride/${claveAcceso}`, { responseType: "blob" }); 
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `RIDE_${claveAcceso}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
      } catch (error) {
          console.error(error);
          setMsjAdv("Error al generar el ride. Consulte al administrador");
          setShowModalAdvertencia(true);
      } finally {
          setIsLoading(false);
      }      
    };

    const cerrarModalAdvertencia = () => {
        setMsjAdv("");
        setShowModalAdvertencia(false);
    };


  return (
    <div className="container-ts-v2">
      <h2>Comprobantes Recibidos</h2>

      <div className="sect-busqueda-v2" >       

        <div style={{ display: "flex", gap: "10px" }}>

            {esAdmin && (
                <div style={{display:"inline-grid"}}>
                    <label style={{color: "#221f1f", marginBottom:"5px"}}>RUC Receptor:</label>
                    <input type="text" placeholder="Ingrese RUC" value={rucReceptor} maxLength={13} 
                        onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                                setRucReceptor(value);
                            }
                        }} className="modal-input" style={{width:"110px"}} />
                </div>
            )}
            {!esAdmin && (
                <div style={{display:"inline-grid"}}>
                    <label style={{color: "#221f1f", marginBottom:"5px"}}>RUC Emisor:</label>
                    <input type="text" placeholder="Ingrese RUC" value={rucEmisor} maxLength={13} 
                        onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                                setRucEmisor(value);
                            }
                        }} className="modal-input" style={{width:"110px"}} />
                </div>
            )}
            <div style={{display:"inline-grid"}}>
                <label style={{color: "#221f1f", marginBottom:"5px"}}>Tipo Fecha:</label>
                    <div style={{display:"inline-flex", justifyContent:"space-between"}}>
                      <select name="tipoFecha" value={tipoFecha} className="modal-select" style={{width:"110px", color:"#221f1f", fontSize:"12px", height:"36px"}}  
                          onChange={(e) => setTipoFecha(e.target.value)}>              
                          <option value="E" style={{color: "#221f1f"}}>Emisión</option>
                          <option value="A" style={{color: "#221f1f"}}>Autorización</option>
                      </select>
                </div>
            </div>
            <div style={{display:"inline-grid"}}>
                <label style={{color: "#221f1f", marginBottom:"5px"}}>Fecha Inicio:</label>
                <input type="date" value={fechaInicio} onChange={(e) => handleFechaInicioChange(e.target.value)}
                    className="modal-date" title="Fecha Inicio" style={{color: "#221f1f", width:"110px"}}/>
            </div>
            <div style={{display:"inline-grid"}}>
                <label style={{color: "#221f1f", marginBottom:"5px"}}>Fecha Fin:</label>
                <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
                    className="modal-date" title="Fecha Fin" style={{color: "#221f1f", width:"110px"}}/>
            </div>              
            <div style={{display:"inline-grid"}}>
                <label style={{color: "#221f1f", marginBottom:"5px"}}>No. Comprobante:</label>
                <input type="text" placeholder="001-001-000000000" value={numComprobante} maxLength={17}
                    className="modal-input" style={{width:"125px"}} onChange={(e) => {
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
            <div style={{display:"inline-grid"}}>
                <label style={{color: "#221f1f", marginBottom:"5px"}}>Tipo Comprobante:</label>
                <div style={{display:"inline-flex", justifyContent:"space-between"}}>
                  <select name="tipoComprobante" value={tipoComprobante} className="modal-select" style={{width:"110px", color:"#221f1f", fontSize:"12px", height:"36px"}}  
                      onChange={(e) => setTipoComprobante(e.target.value)}>
                      <option value="" >Todos</option>
                      <option value="01" style={{color: "#221f1f"}}>Factura</option>
                      <option value="04" style={{color: "#221f1f"}}>Nota de Crédito</option>
                      <option value="07" style={{color: "#221f1f"}}>Retención</option>
                  </select>
                </div>
            </div>
            <div style={{display:"inline-grid"}}>
                <label style={{color: "#221f1f", marginBottom:"5px"}}>Cantidad:</label>
                <div style={{display:"inline-flex", justifyContent:"space-between"}}>
                  <select name="cantidadMostrar" value={cantidadMostrar} className="modal-select" style={{width:"80px", color:"#221f1f", fontSize:"12px", height:"36px"}}    
                      onChange={(e) => setCantidadMostrar(e.target.value)}>
                      <option value="20" style={{color: "#221f1f"}}>20</option>
                      <option value="50" style={{color: "#221f1f"}}>50</option>
                      <option value="100" style={{color: "#221f1f"}}>100</option>
                  </select>
                </div>
            </div>

            <div style={{display:"inline-flex", alignItems:"center"}}>     
                <input type="checkbox" checked={retBcos} onChange={(e) => setRetBcos(e.target.checked)}
                    style={{transform:"scale(1.5)", cursor:"pointer", width:"20px", marginTop:"20px", paddingLeft:"50px"}} />                
                <div style={{display:"inline-grid", margin:"17px 10px 0px"}}>
                  <label style={{color: "#221f1f"}}>Omitir Retenciones</label>                
                  <label style={{color: "#221f1f"}}>de Bancos</label>                
                </div>
            </div>

        </div>
        <div className="btn-acciones">
            <button className="btn-crear" onClick={fetchEmitidos} >
                Ejecutar consulta
            </button>  
        </div>        
      </div>

      <div style={{marginBottom:"10px"}}>
          {error !== "" && 
              <div className="msj-error-consulta-v2">
                  <p>{error}</p>
                  <button className="close-msj-v2" onClick={cerrarMesj}>×</button>
              </div>
          }
          {exito !== "" && 
              <div className="msj-exito-consulta-v2">
                  <p>{exito}</p>
                  <button className="close-msj-v2" onClick={cerrarMesj}>×</button>
              </div>
          }
      </div>       

      <table className="general-comp">
        <thead>
          <tr>
            <th>Comprobante</th>
            <th>Tipo</th>
            <th>Fec. Emisión</th>
            <th>Fec. Autorización</th>
            <th>Emisor</th>
            <th>Doc. Asociado</th>
            <th>Total</th>
            <th>Descargar</th>
          </tr>
        </thead>
        <tbody>
          {emitidosPaginados.map((u, i) => (
            <tr key={u.claveAcceso}>
              <td title={u.claveAcceso}>{u.numeroComprobante}</td>
              <td>{u.tipoComprobante === "01" ? "FAC" : u.tipoComprobante === "04" ? "NC" : u.tipoComprobante === "05" ? "ND" : 
                u.tipoComprobante === "07" ? "RET" : u.tipoComprobante === "06" ? "GUÍA" : u.tipoComprobante === "03" ? "LIQ" : "Otros"}</td>
              <td>
                {u.fechaEmision 
                    ? new Date(u.fechaEmision).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
                    : "—"}
              </td>
              <td>
                {u.fechaAutorizacion 
                    ? new Date(u.fechaAutorizacion).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', 
                        hour: '2-digit', minute: '2-digit', hour12: false  }) : "—"}
              </td>
              <td style={{textAlign:"left"}}>
                {u.razonSocial ? u.razonSocial.split(" ")
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ") : "—"}
              </td>
              <td className="texto-doc-asoci">{u.documentoAsociado}</td>
              <td>{u.valorDocumento?.toFixed(2)}</td>
              <td>
                  <button className="btn-desc btn-toggle" title="RIDE" onClick={() => generarRide(u.claveAcceso)}>
                      📙
                  </button>
              </td>
            </tr>
          ))}
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
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPaginas))
          }
          disabled={currentPage === totalPaginas || totalPaginas === 0}
        >
          ▶
        </button>
      </div>

      {/* --- Modal advertencia --- */}
      <ModalAdvertencia
          visible={showModalAdvertencia}
          msjAdvertencia={msjAdv}
          onClose={cerrarModalAdvertencia}
      />    

    </div>
  );
};

export default Recepcion;   