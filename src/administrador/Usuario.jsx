import React, { useEffect, useState, useCallback } from "react";
import api from "../config/axios";
import ModalExito from "../components/ModalExito";
import { useLoading } from "../context/LoadingContext";

const Usuario = () => {
  const { setIsLoading } = useLoading();
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usuariosPorPagina = 5;

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState("");  
  const [infoMessage, setInfoMessage] = useState("");
  const [nuevaClave, setNuevaClave] = useState("");
  const [nuevoUsuario, setNuevoUsuario] = useState("");

  // --- Datos Modal ---
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [showModalCambioEstado, setShowModalCambioEstado] = useState(false);  
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showModalResetearClave, setShowModalResetearClave] = useState(false);
  const [showModalCrear, setShowModalCrear] = useState(false);
  const [modalError, setModalError] = useState("");
  
  
  // --- Clave Random ---
  const generarClaveRandom = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let pass = "";
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  // --- Cargar usuarios ---
  const fetchUsuarios = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get("/usuarios");
      setUsuarios(data);
      setFilteredUsuarios(data);
      setError(null);
    } catch (err) {
      setError("🚫 "+ (err.response?.data?.message || err.message || "Error al cargar usuarios"));
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading]);

  // --- BUSQUEDA DE USUARIO ---
  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);
  
  useEffect(() => {
    const resultado = usuarios.filter((u) =>
      u.username.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredUsuarios(resultado);
    setCurrentPage(1);
  }, [search, usuarios]);

  const indexOfLast = currentPage * usuariosPorPagina;
  const indexOfFirst = indexOfLast - usuariosPorPagina;
  const usuariosPaginados = filteredUsuarios.slice(indexOfFirst, indexOfLast);
  const totalPaginas = Math.ceil(filteredUsuarios.length / usuariosPorPagina);

  // --- EDITAR NOMBRE USUARIO ---
  const mostrarModalEditar = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setNuevoNombre(usuario.username);
    setModalError("");
    setShowModalEditar(true);
  };

  const cerrarModalEditar = () => {
    setShowModalEditar(false);
    setUsuarioSeleccionado(null);
    setModalError("");
  };

  const actualizarNombreUsuario = async () => {
    if (!nuevoNombre || nuevoNombre.trim() === "") {
      setModalError("🚫 El nombre de usuario no puede estar vacío");
      return;
    }
    try {
      setIsLoading(true);
      await api.put(`/usuarios/${usuarioSeleccionado.id}/username`, { username: nuevoNombre });
      fetchUsuarios();
      cerrarModalEditar();
      setInfoMessage("Nombre de usuario actualizado correctamente");
      setShowInfoModal(true);
    } catch (err) {
      setModalError("🚫 "+ (err.response?.data?.message || "Error al actualizar usuario"));
    }finally {
      setIsLoading(false);
    }
  };

  // --- CAMBIAR ESTADO ---
  const mostarModalCambioEstado = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setShowModalCambioEstado(true);
  };

  const cerrarModalCambioEstado = () => {
    setShowModalCambioEstado(false);
    setUsuarioSeleccionado(null);
  };

  const actualizarEstadoUsuario = async () => {
    try {
      setIsLoading(true);
      await api.put(`/usuarios/${usuarioSeleccionado.id}/estado`, { activo: !usuarioSeleccionado.activo });
      fetchUsuarios();
      cerrarModalCambioEstado();
      setInfoMessage("Estado actualizado correctamente");
      setShowInfoModal(true);
    } catch (err) {
      setModalError("🚫"+ (err.response?.data?.message || "Error al actualizar estado"));
    }finally {
      setIsLoading(false); 
    }
  };

  // --- RESETEAR CLAVE ---
  const mostrarModalResetearClave = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setNuevaClave("");
    setShowModalResetearClave(true);
  };

  const cerrarModalResetearClave = () => {
    setShowModalResetearClave(false);
    setUsuarioSeleccionado(null);
    setNuevaClave("");
  };

  const resetearClaveUsuario = async () => {
    if (!nuevaClave || nuevaClave.trim() === "") {
      setModalError("🚫 La clave no puede estar vacía");
      return;
    }
    if (nuevaClave.length > 8) {
      setModalError("🚫 La clave no puede tener más de 8 caracteres");
      return;
    }

    try {
      setIsLoading(true);
      await api.put(`/usuarios/${usuarioSeleccionado.id}/clave`, { clave: nuevaClave });
      fetchUsuarios();
      cerrarModalResetearClave();
      setInfoMessage("Clave reseteada correctamente");
      setShowInfoModal(true);
    } catch (err) {
      setModalError("🚫 " + (err.response?.data?.message || "Error al actualizar clave"));
    }finally {
      setIsLoading(false); 
    }
  };

  // --- CREAR NUEVO USUARIO ---
  const mostrarModalCrear = () => {
    setNuevoUsuario("");
    setModalError("");
    setShowModalCrear(true);
  };

  const cerrarModalCrear = () => {
    setShowModalCrear(false);
    setNuevoUsuario("");
  };

  const crearUsuario = async () => {
    if (!nuevoUsuario || nuevoUsuario.trim() === "") {
      setModalError("🚫 El nombre de usuario no puede estar vacío");
      return;
    }
    try {
      setIsLoading(true);
      await api.post("/usuarios/crear", { username: nuevoUsuario });
      fetchUsuarios();
      cerrarModalCrear();
      setInfoMessage("Usuario creado correctamente");
      setShowInfoModal(true);
    } catch (err) {
      console.error(err);
      setModalError("🚫 " + (err.response?.data?.message || "Error al crear usuario"));
    }finally {
      setIsLoading(false); 
    }
  };

  // --- CERRAR MODAL INFO ---
  const cerrarModalInfo = () => setShowInfoModal(false);

  return (
    <div className="container-ts">
      <h2>Gestión de Usuarios</h2>
      <div className="sect-busq-new">
        <input type="text" placeholder="🔎 Buscar por usuario..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="general-search" />
        <button className="btn-crear" onClick={mostrarModalCrear}>
          + Nuevo Usuario
        </button>
      </div>

      {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}

      <table className="general-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Fecha Registro</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuariosPaginados.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>
                {u.fechaRegistro ? u.fechaRegistro.split("-").reverse().join("/") : "—"}
              </td>
              <td>{u.activo ? "✅" : "❌"}</td>
              <td>
                <button
                  className="btn-accion btn-editar"
                  onClick={() => mostrarModalEditar(u)}
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  className="btn-accion btn-toggle"
                  onClick={() => mostarModalCambioEstado(u)}
                  title={u.activo ? "Deshabilitar" : "Habilitar"}
                >
                  🔄
                </button>
                <button
                  className="btn-accion btn-clave"
                  onClick={() => mostrarModalResetearClave(u)}
                  title="Restablecer clave"
                >
                  🔑
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

      {/* --- Modal editar --- */}
      {showModalEditar && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Editar Usuario</h3>
              <button className="modal-close" onClick={cerrarModalEditar}>
                ×
              </button>
            </div>

            <input type="text" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} className="modal-input" maxLength={20}/>

            {modalError && 
              <div className="msj-error">
                <p>{modalError}</p>
              </div>
            }

            <div className="modal-buttons">
              <button className="modal-btn-save" onClick={actualizarNombreUsuario}>Editar</button>
              <button className="modal-btn-cancel" onClick={cerrarModalEditar}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal informativo de exito --- */}
      <ModalExito
        visible={showInfoModal}
        msjExito={infoMessage}
        onClose={cerrarModalInfo}
      />

      {/* --- Modal cambio estado --- */}
      {showModalCambioEstado && usuarioSeleccionado &&(
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Actualizar Estado</h3>
              <button className="modal-close" onClick={cerrarModalCambioEstado}>
                ×
              </button>
            </div>

            <div className="msj-pregunta">
              ¿Estás seguro que deseas {usuarioSeleccionado?.activo ? "deshabilitar" : "habilitar"} al usuario <b>{usuarioSeleccionado?.username}</b>?
            </div>

            <div className="modal-buttons">
              <button className="modal-btn-save" onClick={actualizarEstadoUsuario}>Aceptar</button>
              <button className="modal-btn-cancel" onClick={cerrarModalCambioEstado}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal resetear clave --- */}
      {showModalResetearClave && usuarioSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Restablecer Clave</h3>
              <button className="modal-close" onClick={cerrarModalResetearClave}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <label style={{color:"#333"}}>Ingresa nueva clave para: <b>{usuarioSeleccionado.username}</b></label>
              <div style={{ display: "flex", gap: "5px", marginTop: "10px" }}>
                <input type="text" value={nuevaClave} maxLength={8} placeholder="Ingrese clave"
                  onChange={(e) => setNuevaClave(e.target.value)} className="modal-input"  style={{ width:"300px" }}/>
                <button className="btn-accion" title="Generar clave"
                  onClick={() => setNuevaClave(generarClaveRandom())}
                >
                  🔐
                </button>
              </div>
              {modalError && <div className="msj-error"><p>{modalError}</p></div>}
            </div>

            <div className="modal-buttons">
              <button className="modal-btn-save" onClick={resetearClaveUsuario}>Confirmar</button>
              <button className="modal-btn-cancel" onClick={cerrarModalResetearClave}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal Crear Usuario --- */}
      {showModalCrear && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Crear Nuevo Usuario</h3>
              <button className="modal-close" onClick={cerrarModalCrear}>×</button>
            </div>

            <input type="text" placeholder="Ingrese nombre de usuario" value={nuevoUsuario} maxLength={20} 
              onChange={(e) => setNuevoUsuario(e.target.value)} className="modal-input" />

            {modalError && (
              <div className="msj-error">
                <p>{modalError}</p>
              </div>
            )}

            <div className="modal-buttons">
              <button className="modal-btn-save" onClick={crearUsuario}>Crear</button>
              <button className="modal-btn-cancel" onClick={cerrarModalCrear}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Usuario;
