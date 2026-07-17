import React, { useState, useEffect } from "react";
import { descargarReporteRecibido } from "../config/reporteria/reportesService";
import { useLoading } from "../context/LoadingContext";
import { useEmpresas } from "../context/EmpresaContext";
import "../styles/emitir/documentos.css";

const ReporteRecibidos = () => {
  const { setIsLoading } = useLoading();
  const { empresaSeleccionada } = useEmpresas();
  const [rucDest, setRucDest] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const rolUsuario = localStorage.getItem("rol");
  const esAdmin = rolUsuario === "ADMIN";

  const hoy = new Date();
  const periodoInicial = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
  const [periodo, setPeriodo] = useState(periodoInicial);
  const [fechaIni, setFechaIni] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [rucEmisor, setRucEmisor] = useState("");
  const [tipoDoc, setTipoDoc] = useState("");

  useEffect(() => {
    if (periodo) {
      const [anio, mes] = periodo.split("-");
      const fechaInicio = `${anio}-${mes}-01`;
      const ultimoDia = new Date(anio, mes, 0).getDate();
      const fechaFinMes = `${anio}-${mes}-${String(ultimoDia).padStart(2, "0")}`;
      setFechaIni(fechaInicio);
      setFechaFin(fechaFinMes);
    }
  }, [periodo]);

  useEffect(() => {
    if (!esAdmin && empresaSeleccionada) {
      setRucDest(empresaSeleccionada.ruc);
    }
  }, [empresaSeleccionada, esAdmin]);

  const handleDescargar = async () => {
    try {
      cerrarMesj();

      let rucFinal = "";
      if (esAdmin) {
        rucFinal = rucDest;
      } else if (empresaSeleccionada) {
        rucFinal = empresaSeleccionada.ruc;
      }

      if (esAdmin && (!rucFinal || rucFinal.trim() === "")) {
        setError("🚫 Debes ingresar el ruc");
        return;
      }

      setIsLoading(true);
      const filtros = {
        fechaInicio: fechaIni,
        fechaFin: fechaFin,
        rucDestinatario: rucFinal,
        rucEmisor: rucEmisor,
        tipoDoc: tipoDoc,
      };

      const response = await descargarReporteRecibido(filtros);

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const contentDisposition = response.headers["content-disposition"];
      let fileName = "Reporte_Recibidos.xlsx";

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match.length === 2) {
          fileName = match[1];
        }
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
      setExito("☑️ Descarga de reporte realizada correctamente");

    } catch (error) {
      setError("🚫 Error al descargar el reporte");
    } finally {
      setIsLoading(false);
    }
  };

  const cerrarMesj = () => {
        setError("");
        setExito("");
    };

  return (
    <div className="container-ts">
      <h2>Reporte Tributario</h2>

      <div className="sect-busqueda" >       

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>

            {esAdmin && (
                <div style={{display:"inline-grid"}}>
                    <label style={{color: "#221f1f", marginBottom:"5px"}}>RUC:</label>
                    <input type="text" placeholder="Ingrese RUC" value={rucDest} maxLength={13} 
                        onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                                setRucDest(value);
                            }
                        }} className="modal-input" style={{width:"110px", padding:"5px 8px 6px"}} />
                </div>
            )}

            {!esAdmin && empresaSeleccionada && (
                <div style={{display:"inline-grid"}}>
                    <label style={{color: "#221f1f", marginBottom:"5px"}}>RUC:</label>
                    <input type="text" value={empresaSeleccionada.ruc} disabled
                      className="modal-input" style={{width:"110px", padding:"5px 8px 6px", background:"#FFF"}} />
                </div>
            )}

            <div className="documento-field" style={{display:"inline-grid"}}>
                <label>Período:</label>
                <input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} 
                    className="documento-mes" title="Período" />
            </div> 

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

            <div style={{display:"inline-grid"}}>
                <label style={{color: "#221f1f", marginBottom:"5px"}}>Tipo Comprobante:</label>
                <div style={{display:"inline-flex", justifyContent:"space-between"}}>
                  <select name="tipoDoc" value={tipoDoc} className="modal-select" style={{width:"110px", color:"#221f1f", fontSize:"12px", height:"36px"}}  
                      onChange={(e) => setTipoDoc(e.target.value)}>
                      <option value="" >Todos</option>
                      <option value="01" style={{color: "#221f1f"}}>Factura</option>
                      <option value="04" style={{color: "#221f1f"}}>Nota de Crédito</option>
                      <option value="07" style={{color: "#221f1f"}}>Retención</option>
                  </select>
                </div>
            </div>
            
        </div>
            
      </div>

      <div className="btn-acciones" style={{marginTop:"0px"}}>
        <button className="btn-crear" onClick={handleDescargar}>
            Descargar Excel 
        </button>

        <div style={{marginLeft:"20px"}}>
            {error !== "" && 
                <div className="msj-error-consulta">
                    <p>{error}</p>
                    <button className="close-msj" onClick={cerrarMesj}>×</button>
                </div>
            }
            {exito !== "" && 
                <div className="msj-exito-consulta">
                    <p>{exito}</p>
                    <button className="close-msj" onClick={cerrarMesj}>×</button>
                </div>
            }
        </div>   
      </div>

    </div>  

  );
};

export default ReporteRecibidos;