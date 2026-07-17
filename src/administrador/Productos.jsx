import React, { useEffect, useState, useCallback } from "react";
import api from "../config/axios";
import ModalExito from "../components/ModalExito";
import { useLoading } from "../context/LoadingContext";
import { useEmpresas } from "../context/EmpresaContext";

const Productos = () => {
  const { setIsLoading } = useLoading();
  const { empresaSeleccionada } = useEmpresas();
  const [productos, setProductos] = useState([]);
  const [filteredProductos, setfilteredProductos] = useState([]);
  const [error, setError] = useState(null);
  const [msjError, setMsjError] = useState("");
  const [msjExito, setMsjExito] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const productosPorPagina = 10;
  //VARIABLES PRODUCTO
  const [descripcionPrd, setDescripcionPrd] = useState("");
  const [impuesto, setImpuesto] = useState("");
  const [codPrd, setCodPrd] = useState("");
  const [codAux, setCodAux] = useState("");
  const [tarifaIva, setTarifaIva] = useState("");
  const [valorUnitario, setValorUnitario] = useState(0);

  const [productoSeleccionado, setProductoseleccionado] = useState(null);
  
  //MODAL
  const [showModalCrear, setShowModalCrear] = useState(false);
  const [showModalExitoso, setShowModalExitoso] = useState(false);
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [showModalCambioEstado, setShowModalCambioEstado] = useState(false); 

  // --- Cargar productos ---
  const fetchProductos = useCallback(async () => {
    if (!empresaSeleccionada) return;
    try {
      setIsLoading(true);
      const { data } = await api.get(`/productos/${empresaSeleccionada.ruc}/buscarPorRuc`);
      setProductos(data);
      setfilteredProductos(data);
      setError(null);
    } catch (err) {
      setError("🚫 "+ (err.response?.data?.message || err.message || "Error al cargar productos"));
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, empresaSeleccionada]);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);
  
  useEffect(() => {
    const resultado = productos.filter((u) =>
        u.codigoPrincipal.toLowerCase().includes(search.toLowerCase()) || 
        u.descripcion.toLowerCase().includes(search.toLowerCase())
    );
    setfilteredProductos(resultado);
    setCurrentPage(1);
  }, [search, productos]);

  const indexOfLast = currentPage * productosPorPagina;
  const indexOfFirst = indexOfLast - productosPorPagina;
  const productosPaginados = filteredProductos.slice(indexOfFirst, indexOfLast);
  const totalPaginas = Math.ceil(filteredProductos.length / productosPorPagina);

  const limpiarVariables = () => {
    setCodPrd(""); 
    setCodAux("");
    setDescripcionPrd("");
    setImpuesto("");
    setTarifaIva("");
    setValorUnitario(0);
    setMsjError("");
    setMsjExito("");
  };

  const cerrarModalExito = () => setShowModalExitoso(false);

  const validarVariables = () => {
    setMsjError("");
    if (!codPrd || codPrd.trim() === "") {
      setMsjError("🚫 El código principal no puede estar vacío");
      return false;
    }
    if (!descripcionPrd || descripcionPrd.trim() === "") {
      setMsjError("🚫 La descripción no puede estar vacía");
      return false;
    }
    if (!impuesto || impuesto === "") {
      setMsjError("🚫 Debe elegir el impuesto");
      return false;
    }
    if(impuesto === "2"){
      if(!tarifaIva || tarifaIva === ""){
            setMsjError("🚫 Debe elegir tarifa de IVA");
            return false;
        }
    }
    return true;
  };

  // --- CREAR NUEVO PRODUCTO ---
  const mostrarModalCrear = () => {    
    limpiarVariables();
    setShowModalCrear(true);    
  };

  const cerrarModalCrear = () => {
    setShowModalCrear(false);
  };

  const crearProducto = async () => {
    if (!validarVariables()) return;
    try {
      setIsLoading(true);
      await api.post(`/productos/${empresaSeleccionada.ruc}/crear`, {         
        codigoPrincipal : codPrd,
        codigoAuxiliar : codAux,
        descripcion : descripcionPrd,
        valorUni : valorUnitario,
        impuesto : impuesto,
        tarifaIva : tarifaIva
      });
      fetchProductos();
      cerrarModalCrear();
      setMsjExito("Producto creado correctamente");
      setShowModalExitoso(true);
    } catch (err) {
      setMsjError("🚫 " + (err.response?.data?.message || "Error al crear usuario"));
    }finally {
      setIsLoading(false); 
    }
  };

  // --- EDITAR Producto ---
  const mostrarModalEditar = (prd) => {
    limpiarVariables();
    setProductoseleccionado(prd);
    setCodPrd(prd.codigoPrincipal); 
    setCodAux(prd.codigoAuxiliar); 
    setDescripcionPrd(prd.descripcion);
    setImpuesto(prd.impuesto);
    setTarifaIva(prd.tarifaIva);
    setValorUnitario(prd.valorUni);
    setShowModalEditar(true);
  };

  const cerrarModalEditar = () => {
    setShowModalEditar(false);
    setProductoseleccionado(null);
  };

  const editarProducto = async () => {
    if (!validarVariables()) return;
    try {
      setIsLoading(true);
      await api.put(`/productos/${productoSeleccionado.id}/editar`, { 
        codigoPrincipal : codPrd,
        codigoAuxiliar : codAux,
        descripcion : descripcionPrd,
        valorUni : valorUnitario,
        impuesto : impuesto,
        tarifaIva : tarifaIva
      });
      fetchProductos();
      cerrarModalEditar();
      setMsjExito("Datos actualizado correctamente");
      setShowModalExitoso(true);
    } catch (err) {
      setMsjError("🚫 "+ (err.response?.data?.message || "Error al actualizar datos"));
    }finally {
      setIsLoading(false);
    }
  };

  // --- CAMBIAR ESTADO ---
  const mostarModalCambioEstado = (prd) => {
      setProductoseleccionado(prd);
      setShowModalCambioEstado(true);
  };

  const cerrarModalCambioEstado = () => {
      setShowModalCambioEstado(false);
      setProductoseleccionado(null);
  };

  const actualizarEstado = async () => {
      try {
          setIsLoading(true);
          await api.put(`/productos/${productoSeleccionado.id}/estado`, { activo: !productoSeleccionado.activo });
          fetchProductos();
          cerrarModalCambioEstado();
          setMsjExito("Estado actualizado correctamente");
          setShowModalExitoso(true);
      } catch (err) {
          setMsjError("🚫 "+ (err.response?.data?.message || "Error al actualizar estado"));
      } finally {
          setIsLoading(false); 
      }
  };

  return (
    <div className="container-ts">
      <h2>Gestión de Productos</h2>
      <div className="sect-busq-new">
        <input type="text" placeholder="🔎 Buscar por nombre o identificación..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="general-search" />
        <button className="btn-crear" onClick={mostrarModalCrear} >
          + Nuevo Producto
        </button>
      </div>

      {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}

      <table className="general-table">
        <thead>
          <tr>
            <th>Cod. Princ.</th>
            <th>Cod. Aux.</th>
            <th>Descripción</th>
            <th>Valor Uni.</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productosPaginados.map((u) => (
            <tr key={u.id}>
              <td>{u.codigoPrincipal}</td>
              <td>{u.codigoAuxiliar === null ? "-" :  u.codigoAuxiliar}</td>
              <td title={u.descripcion} style={{maxWidth:"200px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}> {u.descripcion === "" ? "-" : u.descripcion}</td>
              <td>{u.valorUni === null ? "0.0000" : Number(u.valorUni).toFixed(4)}</td>
              <td>{u.activo ? "✅" : "❌"}</td>
              <td>
                <button className="btn-accion btn-editar" onClick={() => mostrarModalEditar(u)} title="Editar" >
                  ✏️
                </button>
                <button className="btn-accion btn-toggle" onClick={() => mostarModalCambioEstado(u)} title={u.activo ? "Deshabilitar" : "Habilitar"} >
                  🔄
                </button>                
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="general-paginador">
        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || totalPaginas === 0} >
          ◀
        </button>
        <span>
          Página {currentPage} de {totalPaginas === 0 ? 1 : totalPaginas}
        </span>
        <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPaginas))}
            disabled={currentPage === totalPaginas || totalPaginas === 0} >
          ▶
        </button>
      </div>

      {/* --- Modal exito --- */}
      <ModalExito
        visible={showModalExitoso}
        msjExito={msjExito}
        onClose={cerrarModalExito}
      />

      {/* --- Modal Crear Producto --- */}
      {showModalCrear && (
        <div className="modal-overlay">
          <div className="modal-content" style={{width:"auto"}}>
            <div className="modal-header">
              <h3>Crear Nuevo Producto</h3>
              <button className="modal-close" onClick={cerrarModalCrear}>×</button>
            </div>

            {msjError && (
              <div className="msj-error" style={{margin:"0px 0px 10px"}}>
                <p>{msjError}</p>
              </div>
            )}

            <div className="modal-body" style={{display:"inline-grid", width:"400px"}}>

              <div style={{display:"inline-grid"}}>
                <label style={{color: "#221f1f", marginBottom:"5px"}}>Código Principal</label>
                <input type="text" placeholder="Ingrese código principal" value={codPrd} maxLength={25} 
                    className="modal-input" onChange={(e) => {setCodPrd(e.target.value);}} />
              </div>

              <div style={{display:"inline-grid"}}>
                <label style={{color: "#221f1f", marginBottom:"5px"}}>Código Auxiliar</label>
                <input type="text" placeholder="Ingrese código auxiliar" value={codAux} maxLength={25} 
                    className="modal-input" onChange={(e) => {setCodAux(e.target.value);}} />
              </div>

              <div style={{display:"inline-grid", marginTop:"10px"}}>
                <label style={{color: "#221f1f", marginBottom:"5px"}}>Descripción</label>
                <input type="text" placeholder="Ingrese descripción" value={descripcionPrd} maxLength={200} 
                    className="modal-input" onChange={(e) => {setDescripcionPrd(e.target.value);}} />
              </div>              

              <div style={{display:"inline-grid", marginTop:"10px"}}>
                <label style={{color: "#221f1f", marginBottom:"5px"}}>Impuesto</label>
                <div style={{display:"inline-flex", justifyContent:"space-between"}}>
                  <select name="impuesto" value={impuesto} className="modal-select" 
                      onChange={(e) => setImpuesto(e.target.value)}>
                      <option value="" disabled>Tipo</option>
                      <option value="2" style={{color: "#221f1f"}}>IVA</option>
                      <option value="3" style={{color: "#221f1f", display:"none"}}>ICE</option>
                      <option value="5" style={{color: "#221f1f", display:"none"}}>IRBPNR</option>
                  </select>
                  <select name="tarifaIva" value={tarifaIva} className="modal-select" 
                      onChange={(e) => setTarifaIva(e.target.value)} disabled={impuesto !== "2"}>
                      <option value="" disabled>Tarifa</option>
                      <option value="0" style={{color: "#221f1f"}}>0%</option>
                      <option value="2" style={{color: "#221f1f"}}>12%</option>
                      <option value="3" style={{color: "#221f1f"}}>14%</option>
                      <option value="4" style={{color: "#221f1f"}}>15%</option>
                      <option value="6" style={{color: "#221f1f"}}>No Objeto Imp.</option>
                      <option value="7" style={{color: "#221f1f"}}>Exento IVA</option>
                  </select>
                </div> 
              </div>

              <div style={{display:"inline-grid", marginTop:"10px"}}>
                <label style={{color: "#221f1f", marginBottom:"5px"}}>Valor Unitario</label>
                <input type="number" value={valorUnitario} className="modal-input sin-flechas" min="0" step="0.0001" placeholder="0"
                  style={{ width: "160px", textAlign: "right" }}  onChange={(e) => {const valor = e.target.value;
                    if (/^\d{0,9}(\.\d{0,4})?$/.test(valor)) {
                        setValorUnitario(valor);
                    } }}/>    
              </div>             
              
            </div>              

            <div className="modal-buttons">
              <button className="modal-btn-save btn-size" onClick={crearProducto}>Crear</button>
              <button className="modal-btn-cancel btn-size" onClick={cerrarModalCrear}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal editar --- */}
      {showModalEditar && productoSeleccionado &&(
        <div className="modal-overlay">
            <div className="modal-content" style={{width:"auto"}}>
                <div className="modal-header">
                    <h3>Editar Producto</h3>
                    <button className="modal-close" onClick={cerrarModalEditar}>
                        ×
                    </button>
                </div>

                {msjError && (
                    <div className="msj-error" style={{marginTop:"0px", marginBottom:"10px"}}>
                        <p>{msjError}</p>
                    </div>
                )}

                <div className="modal-body" style={{display:"inline-grid", width:"400px"}}>

                  <div style={{display:"inline-grid"}}>
                    <label style={{color: "#221f1f", marginBottom:"5px"}}>Código Principal</label>
                    <input type="text" placeholder="Ingrese código principal" value={codPrd} maxLength={25} 
                        className="modal-input" onChange={(e) => {setCodPrd(e.target.value);}} />
                  </div>

                  <div style={{display:"inline-grid"}}>
                    <label style={{color: "#221f1f", marginBottom:"5px"}}>Código Auxiliar</label>
                    <input type="text" placeholder="Ingrese código auxiliar" value={codAux} maxLength={25} 
                        className="modal-input" onChange={(e) => {setCodAux(e.target.value);}} />
                  </div>

                  <div style={{display:"inline-grid", marginTop:"10px"}}>
                    <label style={{color: "#221f1f", marginBottom:"5px"}}>Descripción</label>
                    <input type="text" placeholder="Ingrese descripción" value={descripcionPrd} maxLength={200} 
                        className="modal-input" onChange={(e) => {setDescripcionPrd(e.target.value);}} />
                  </div>

                  <div style={{display:"inline-grid", marginTop:"10px"}}>
                    <label style={{color: "#221f1f", marginBottom:"5px"}}>Impuesto</label>
                    <div style={{display:"inline-flex", justifyContent:"space-between"}}>
                      <select name="impuesto" value={impuesto} className="modal-select" 
                          onChange={(e) => setImpuesto(e.target.value)}>
                          <option value="" disabled>Tipo</option>
                          <option value="2" style={{color: "#221f1f"}}>IVA</option>
                          <option value="3" style={{color: "#221f1f"}}>ICE</option>
                          <option value="5" style={{color: "#221f1f"}}>IRBPNR</option>
                      </select>
                      <select name="tarifaIva" value={tarifaIva} className="modal-select" 
                          onChange={(e) => setTarifaIva(e.target.value)} disabled={impuesto !== "2"}>
                          <option value="" disabled>Tarifa</option>
                          <option value="0" style={{color: "#221f1f"}}>0%</option>
                          <option value="2" style={{color: "#221f1f"}}>12%</option>
                          <option value="3" style={{color: "#221f1f"}}>14%</option>
                          <option value="4" style={{color: "#221f1f"}}>15%</option>
                          <option value="6" style={{color: "#221f1f"}}>No Objeto Imp.</option>
                          <option value="7" style={{color: "#221f1f"}}>Exento IVA</option>
                      </select>
                    </div> 
                  </div>

                  <div style={{display:"inline-grid"}}>
                    <label style={{color: "#221f1f", marginBottom:"5px"}}>Valor Unitario</label>
                    <div style={{display:"inline-flex", justifyContent:"space-between"}}>
                      <input type="number" value={valorUnitario} className="modal-input sin-flechas" min="0" step="0.0001" placeholder="0"
                        style={{ width: "160px", textAlign: "right", height:"36px" }}  onChange={(e) => {const valor = e.target.value;
                          if (/^\d{0,9}(\.\d{0,4})?$/.test(valor)) {
                              setValorUnitario(valor);
                          } }}/> 
                      <div className="modal-buttons" style={{marginTop:"0px"}}>
                          <button className="modal-btn-save btn-size" onClick={editarProducto}>Editar</button>
                          <button className="modal-btn-cancel btn-size" onClick={cerrarModalEditar}>Cancelar</button>
                      </div>    
                    </div>
                  </div>   

                </div>               

                
            </div>
        </div>
      )}

      {/* --- Modal cambio estado --- */}
      {showModalCambioEstado && productoSeleccionado &&(
          <div className="modal-overlay">
              <div className="modal-content">
                  <div className="modal-header">
                      <h3>Actualizar Estado</h3>
                      <button className="modal-close" onClick={cerrarModalCambioEstado}>
                          ×
                      </button>
                  </div>

                  <div className="msj-pregunta">
                      ¿Estás seguro de {productoSeleccionado?.activo ? "deshabilitar" : "habilitar"} al producto <b>{productoSeleccionado?.razonSocial}</b>?
                  </div>

                  <div className="modal-buttons">
                      <button className="modal-btn-save" onClick={actualizarEstado}>Aceptar</button>
                      <button className="modal-btn-cancel" onClick={cerrarModalCambioEstado}>Cancelar</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Productos;
