import React, { useEffect, useState, useCallback } from "react";
import api from "../config/axios";
import ModalExito from "../components/ModalExito";
import { useLoading } from "../context/LoadingContext";
import { useEmpresas } from "../context/EmpresaContext";

const Clientes = () => {
  const { setIsLoading } = useLoading();
  const { empresaSeleccionada } = useEmpresas();
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [error, setError] = useState(null);
  const [msjError, setMsjError] = useState("");
  const [msjExito, setMsjExito] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const clientesPorPagina = 10;
  //VARIABLES CLIENTE
  const [identificacionCliente, setIdentificacionCliente] = useState("");
  const [tipoIdentificacionCliente, setTipoIdentificacionCliente] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [direccionCliente, setDireccionCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  const [correoCliente, setCorreoCliente] = useState("");

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  
  //MODAL
  const [showModalCrear, setShowModalCrear] = useState(false);
  const [showModalExitoso, setShowModalExitoso] = useState(false);
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [showModalCambioEstado, setShowModalCambioEstado] = useState(false); 

  // --- Cargar clientes ---
  const fetchClientes = useCallback(async () => {
    if (!empresaSeleccionada) return;
    try { 
      setIsLoading(true);
      const { data } = await api.get(`/clientes/${empresaSeleccionada.ruc}/buscarPorRuc`);
      setClientes(data);
      setFilteredClientes(data);
      setError(null);
    } catch (err) {
      setError("🚫 "+ (err.response?.data?.message || err.message || "Error al cargar clientes"));
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, empresaSeleccionada]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);
  
  useEffect(() => {
    const resultado = clientes.filter((u) =>
        u.identificacion.toLowerCase().includes(search.toLowerCase()) || 
        u.razonSocial.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredClientes(resultado);
    setCurrentPage(1);
  }, [search, clientes]);

  const indexOfLast = currentPage * clientesPorPagina;
  const indexOfFirst = indexOfLast - clientesPorPagina;
  const clientesPaginados = filteredClientes.slice(indexOfFirst, indexOfLast);
  const totalPaginas = Math.ceil(filteredClientes.length / clientesPorPagina);

  const limpiarVariables = () => {
    setNombreCliente(""); 
    setIdentificacionCliente("");
    setTipoIdentificacionCliente("");
    setDireccionCliente("");
    setTelefonoCliente("");
    setCorreoCliente("");
    setMsjError("");
    setMsjExito("");
  };

  const cerrarModalExito = () => setShowModalExitoso(false);

  const validarVariables = () => {
    setMsjError("");
    if (!identificacionCliente || identificacionCliente.trim() === "") {
      setMsjError("🚫 La identificación del cliente no puede estar vacía");
      return false;
    }
    if (!nombreCliente || nombreCliente.trim() === "") {
      setMsjError("🚫 El nombre del cliente no puede estar vacío");
      return false;
    }
    if (!correoCliente || correoCliente.trim() === "") {
      setMsjError("🚫 El correo del cliente no puede estar vacío");
      return false;
    }
    if (!tipoIdentificacionCliente || tipoIdentificacionCliente === "") {
      setMsjError("🚫 Debe elegir tipo de identificación");
      return false;
    }
    if(tipoIdentificacionCliente === "04"){
      if(identificacionCliente.length !== 13){
            setMsjError("🚫 El RUC debe tener 13 caracteres");
            return false;
        }
    }
    if(tipoIdentificacionCliente === "05"){
      if(identificacionCliente.length !== 10){
            setMsjError("🚫 La cédula debe tener 10 caracteres");
            return false;
        }
    }
    return true;
  };

  // --- CREAR NUEVO CLIENTE ---
  const mostrarModalCrear = () => {    
    limpiarVariables();
    setShowModalCrear(true);    
  };

  const cerrarModalCrear = () => {
    setShowModalCrear(false);
  };

  const crearCliente = async () => {
    if (!validarVariables()) return;
    try {
      setIsLoading(true);
      await api.post(`/clientes/${empresaSeleccionada.ruc}/crear`, {         
        identificacion: identificacionCliente,
        tipoIdentificacion: tipoIdentificacionCliente,
        razonSocial: nombreCliente,
        direccion : direccionCliente,
        email : correoCliente,
        telefono : telefonoCliente
      });
      fetchClientes();
      cerrarModalCrear();
      setMsjExito("Cliente creado correctamente");
      setShowModalExitoso(true);
    }catch (err) {
      setMsjError("🚫 " + (err.response?.data?.message || "Error creando cliente"));
    }finally {
      setIsLoading(false); 
    }
  };

  // --- EDITAR CLIENTE ---
  const mostrarModalEditar = (cliente) => {
    limpiarVariables();
    setClienteSeleccionado(cliente);
    setNombreCliente(cliente.razonSocial); 
    setIdentificacionCliente(cliente.identificacion);
    setTipoIdentificacionCliente(cliente.tipoIdentificacion);
    setDireccionCliente(cliente.direccion);
    setTelefonoCliente(cliente.telefono);
    setCorreoCliente(cliente.email);
    setShowModalEditar(true);
  };

  const cerrarModalEditar = () => {
    setShowModalEditar(false);
    setClienteSeleccionado(null);
  };

  const editarCliente = async () => {
    if (!validarVariables()) return;
    try {
      setIsLoading(true);
      await api.put(`/clientes/${clienteSeleccionado.id}/editar`, { 
        identificacion: identificacionCliente,
        tipoIdentificacion: tipoIdentificacionCliente,
        razonSocial: nombreCliente,
        direccion : direccionCliente,
        email : correoCliente,
        telefono : telefonoCliente
      });
      fetchClientes();
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
  const mostarModalCambioEstado = (cliente) => {
      setClienteSeleccionado(cliente);
      setShowModalCambioEstado(true);
  };

  const cerrarModalCambioEstado = () => {
      setShowModalCambioEstado(false);
      setClienteSeleccionado(null);
  };

  const actualizarEstado = async () => {
      try {
          setIsLoading(true);
          await api.put(`/clientes/${clienteSeleccionado.id}/estado`, { activo: !clienteSeleccionado.activo });
          fetchClientes();
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
      <h2>Gestión de Clientes</h2>
      <div className="sect-busq-new">
        <input type="text" placeholder="🔎 Buscar por nombre o identificación..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="general-search" />
        <button className="btn-crear" onClick={mostrarModalCrear} >
          + Nuevo Cliente
        </button>
      </div>

      {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}

      <table className="general-table">
        <thead>
          <tr>
            <th>Identificación</th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientesPaginados.map((u) => (
            <tr key={u.id}>
              <td>{u.identificacion}</td>
              <td>{u.razonSocial}</td>
              <td title={u.email} style={{maxWidth:"200px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}> {u.email === "" ? "-" : u.email}</td>
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

      {/* --- Modal Crear Cliente --- */}
      {showModalCrear && (
        <div className="modal-overlay">
          <div className="modal-content" style={{width:"auto"}}>
            <div className="modal-header">
              <h3>Crear Nuevo Cliente</h3>
              <button className="modal-close" onClick={cerrarModalCrear}>×</button>
            </div>

            {msjError && (
              <div className="msj-error" style={{margin:"0px 0px 10px"}}>
                <p>{msjError}</p>
              </div>
            )}

            <div className="modal-body" style={{display:"inline-grid", width:"400px"}}>

              <div style={{display:"inline-grid"}}>
                <label style={{color: "#221f1f", marginBottom:"5px"}}>Identificación</label>
                <div style={{display:"inline-flex", justifyContent:"space-between"}}>
                  <input type="text" placeholder="Ingrese identificación" value={identificacionCliente} maxLength={20} 
                    className="modal-input" style={{width:"250px"}} onChange={(e) => { const value = e.target.value;
                      if (/^[a-zA-Z0-9\s]*$/.test(value)) {  
                          setIdentificacionCliente(value);
                      } }} />
                  <select name="tipoIdentificacionCliente" value={tipoIdentificacionCliente} className="modal-select" style={{width:"140px", height:"40px"}}
                      onChange={(e) => setTipoIdentificacionCliente(e.target.value)}>
                      <option value="" disabled>Tipo</option>
                      <option value="04" style={{color: "#221f1f"}}>RUC</option>
                      <option value="05" style={{color: "#221f1f"}}>Cédula</option>
                      <option value="06" style={{color: "#221f1f"}}>Pasaporte</option>
                      <option value="08" style={{color: "#221f1f"}}>Ident. Exterior</option>
                  </select>
                </div> 
              </div>

              <div style={{display:"inline-grid", marginTop:"10px"}}>
                <label style={{color: "#221f1f", marginBottom:"5px"}}>Nombre/Razón Social</label>
                <input type="text" placeholder="Ingrese nombre/razón social" value={nombreCliente} maxLength={80} 
                    className="modal-input" onChange={(e) => {setNombreCliente(e.target.value);}} />
              </div>

              <div style={{display:"inline-grid", marginTop:"10px"}}>
                <label style={{color: "#221f1f", marginBottom:"5px"}}>Dirección</label>
                <input type="text" placeholder="Ingrese dirección" value={direccionCliente} maxLength={100} 
                    className="modal-input" onChange={(e) => {setDireccionCliente(e.target.value);}} />
              </div>

              <div style={{display:"inline-grid", marginTop:"10px"}}>
                <label style={{color: "#221f1f", marginBottom:"5px"}}>Correo</label>
                <input type="text" placeholder="Ingrese correo" value={correoCliente} maxLength={200} 
                    className="modal-input" onChange={(e) => {setCorreoCliente(e.target.value);}} title="Si necesita ingresar más correos, separelos por (;)"/>
              </div>

              <div style={{display:"inline-grid", marginTop:"10px"}}>
                <label style={{color: "#221f1f", marginBottom:"5px"}}>Teléfono</label>
                <input type="text" placeholder="Ingrese teléfono" value={telefonoCliente} maxLength={20} 
                    className="modal-input" onChange={(e) => {setTelefonoCliente(e.target.value);}} />
              </div>
              
            </div>              

            <div className="modal-buttons">
              <button className="modal-btn-save btn-size" onClick={crearCliente}>Crear</button>
              <button className="modal-btn-cancel btn-size" onClick={cerrarModalCrear}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal editar --- */}
      {showModalEditar && clienteSeleccionado &&(
        <div className="modal-overlay">
            <div className="modal-content" style={{width:"auto"}}>
                <div className="modal-header">
                    <h3>Editar Cliente</h3>
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
                  <label style={{color: "#221f1f", marginBottom:"5px"}}>Identificación</label>
                  <div style={{display:"inline-flex", justifyContent:"space-between"}}>
                    <input type="text" placeholder="Ingrese identificación" value={identificacionCliente} maxLength={20} 
                      className="modal-input" style={{width:"250px"}} onChange={(e) => { const value = e.target.value;
                        if (/^[a-zA-Z0-9\s]*$/.test(value)) {  
                            setIdentificacionCliente(value);
                        } }} />
                    <select name="tipoIdentificacionCliente" value={tipoIdentificacionCliente} className="modal-select" style={{width:"140px", height:"40px"}}
                        onChange={(e) => setTipoIdentificacionCliente(e.target.value)}>
                        <option value="" disabled>Tipo</option>
                        <option value="04" style={{color: "#221f1f"}}>RUC</option>
                        <option value="05" style={{color: "#221f1f"}}>Cédula</option>
                        <option value="06" style={{color: "#221f1f"}}>Pasaporte</option>
                        <option value="08" style={{color: "#221f1f"}}>Ident. Exterior</option>
                    </select>
                  </div> 
                </div>

                <div style={{display:"inline-grid", marginTop:"10px"}}>
                  <label style={{color: "#221f1f", marginBottom:"5px"}}>Nombre/Razón Social</label>
                  <input type="text" placeholder="Ingrese nombre/razón social" value={nombreCliente} maxLength={80} 
                      className="modal-input" onChange={(e) => {setNombreCliente(e.target.value);}} />
                </div>

                <div style={{display:"inline-grid", marginTop:"10px"}}>
                  <label style={{color: "#221f1f", marginBottom:"5px"}}>Dirección</label>
                  <input type="text" placeholder="Ingrese dirección" value={direccionCliente} maxLength={100} 
                      className="modal-input" onChange={(e) => {setDireccionCliente(e.target.value);}} />
                </div>

                <div style={{display:"inline-grid", marginTop:"10px"}}>
                  <label style={{color: "#221f1f", marginBottom:"5px"}}>Correo</label>
                  <input type="text" placeholder="Ingrese correo" value={correoCliente} maxLength={200} 
                      className="modal-input" onChange={(e) => {setCorreoCliente(e.target.value);}} title="Si necesita ingresar más correos, separelos por (;)"/>
                </div>

                <div style={{display:"inline-grid", marginTop:"10px"}}>
                  <label style={{color: "#221f1f", marginBottom:"5px"}}>Teléfono</label>
                  <input type="text" placeholder="Ingrese teléfono" value={telefonoCliente} maxLength={20} 
                      className="modal-input" onChange={(e) => {setTelefonoCliente(e.target.value);}} />
                </div>
                
              </div>

                <div className="modal-buttons">
                    <button className="modal-btn-save btn-size" onClick={editarCliente}>Editar</button>
                    <button className="modal-btn-cancel btn-size" onClick={cerrarModalEditar}>Cancelar</button>
                </div>
            </div>
        </div>
      )}

      {/* --- Modal cambio estado --- */}
      {showModalCambioEstado && clienteSeleccionado &&(
          <div className="modal-overlay">
              <div className="modal-content">
                  <div className="modal-header">
                      <h3>Actualizar Estado</h3>
                      <button className="modal-close" onClick={cerrarModalCambioEstado}>
                          ×
                      </button>
                  </div>

                  <div className="msj-pregunta">
                      ¿Estás seguro que deseas {clienteSeleccionado?.activo ? "deshabilitar" : "habilitar"} al cliente <b>{clienteSeleccionado?.razonSocial}</b>?
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

export default Clientes;
