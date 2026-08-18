import React, { useState } from "react";
import api from "../config/axios";
import { useLoading } from "../context/LoadingContext";
import "../styles/consultar/comprobantes.css";

const mostrarValor = (valor) => {
  if (valor === null || valor === undefined || valor === "") return "—";
  return valor;
};

const formatearTexto = (texto) => {
  if (!texto) return "—";
  return texto
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const CatastroSRI = () => {
  const { setIsLoading } = useLoading();
  const [ruc, setRuc] = useState("");
  const [contribuyente, setContribuyente] = useState(null);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const cerrarMesj = () => {
    setError("");
    setExito("");
  };

  const consultarContribuyente = async () => {
    cerrarMesj();
    setContribuyente(null);

    if (!ruc) {
      setError("🚫 Debes ingresar un RUC");
      return;
    }

    if (ruc.length !== 13) {
      setError("🚫 El RUC debe tener 13 dígitos");
      return;
    }

    try {
      setIsLoading(true);
      const { data } = await api.get(`/sri/contribuyente/${ruc}`);
      setContribuyente(data);
      setExito("✅ Consulta realizada correctamente");
    } catch (err) {
      setError(
        "🚫 " +
          (err.response?.data?.message ||
            err.message ||
            "Error al consultar el catastro del SRI")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") consultarContribuyente();
  };

  const fechas = contribuyente?.informacionFechasContribuyente;

  const camposGenerales = contribuyente
    ? [
        { label: "RUC", value: mostrarValor(contribuyente.numeroRuc) },
        {
          label: "Razón Social",
          value: formatearTexto(contribuyente.razonSocial),
        },
        {
          label: "Estado",
          value: mostrarValor(contribuyente.estadoContribuyenteRuc),
        },
        {
          label: "Actividad Económica Principal",
          value: formatearTexto(contribuyente.actividadEconomicaPrincipal),
        },
        {
          label: "Tipo Contribuyente",
          value: mostrarValor(contribuyente.tipoContribuyente),
        },
        { label: "Régimen", value: mostrarValor(contribuyente.regimen) },
        { label: "Categoría", value: mostrarValor(contribuyente.categoria) },
        {
          label: "Obligado Llevar Contabilidad",
          value: mostrarValor(contribuyente.obligadoLlevarContabilidad),
        },
        {
          label: "Agente de Retención",
          value: mostrarValor(contribuyente.agenteRetencion),
        },
        {
          label: "Contribuyente Especial",
          value: mostrarValor(contribuyente.contribuyenteEspecial),
        },
        {
          label: "Motivo Cancelación/Suspensión",
          value: mostrarValor(contribuyente.motivoCancelacionSuspension),
        },
        {
          label: "Contribuyente Fantasma",
          value: mostrarValor(contribuyente.contribuyenteFantasma),
        },
        {
          label: "Transacciones Inexistentes",
          value: mostrarValor(contribuyente.transaccionesInexistente),
        },
      ]
    : [];

  const camposFechas = fechas
    ? [
        {
          label: "Inicio de Actividades",
          value: mostrarValor(fechas.fechaInicioActividades),
        },
        { label: "Cese", value: mostrarValor(fechas.fechaCese) },
        {
          label: "Reinicio de Actividades",
          value: mostrarValor(fechas.fechaReinicioActividades),
        },
        {
          label: "Última Actualización",
          value: mostrarValor(fechas.fechaActualizacion),
        },
      ]
    : [];

  return (
    <div className="container-ts-v2">
      <h2>Catastro SRI</h2>

      <div
        style={{
          backgroundColor: "#816f09",
          color: "#ffffff",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "10px",
          border: "1px solid #fdf905",
          fontSize: "14px",
        }}
      >
        <strong>⚠️ Advertencia:</strong> La consulta de los datos del RUC depende de
        la disponibilidad del SRI.
      </div>

      <div className="sect-busqueda-v2">
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <label style={{ color: "#221f1f" }}>RUC:</label>
          <input
            type="text"
            placeholder="Ingrese RUC"
            value={ruc}
            maxLength={13}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value)) setRuc(value);
            }}
            onKeyDown={handleKeyDown}
            className="modal-input"
            style={{ width: "140px" }}
          />
          <button className="btn-crear" onClick={consultarContribuyente}>
            Consultar
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "10px" }}>
        {error !== "" && (
          <div className="msj-error-consulta-v2">
            <p>{error}</p>
            <button className="close-msj-v2" onClick={cerrarMesj}>
              ×
            </button>
          </div>
        )}
        {exito !== "" && (
          <div className="msj-exito-consulta-v2">
            <p>{exito}</p>
            <button className="close-msj-v2" onClick={cerrarMesj}>
              ×
            </button>
          </div>
        )}
      </div>

      {contribuyente && (
        <>
          <div
            className="sect-busqueda-v2"
            style={{ marginBottom: "10px" }}
          >
            <h3 style={{ margin: "0 0 12px", color: "#333", fontSize: "15px" }}>
              Información del contribuyente
            </h3>
            <table className="general-comp">
              <tbody>
                {camposGenerales.map((campo) => (
                  <tr key={campo.label}>
                    <th style={{ width: "260px", textAlign: "left" }}>
                      {campo.label}
                    </th>
                    <td style={{ textAlign: "left" }}>{campo.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {camposFechas.length > 0 && (
            <div
              className="sect-busqueda-v2"
              style={{ marginBottom: "10px" }}
            >
              <h3
                style={{ margin: "0 0 12px", color: "#333", fontSize: "15px" }}
              >
                Fechas
              </h3>
              <table className="general-comp">
                <tbody>
                  {camposFechas.map((campo) => (
                    <tr key={campo.label}>
                      <th style={{ width: "260px", textAlign: "left" }}>
                        {campo.label}
                      </th>
                      <td style={{ textAlign: "left" }}>{campo.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="sect-busqueda-v2">
            <h3 style={{ margin: "0 0 12px", color: "#333", fontSize: "15px" }}>
              Representantes legales
            </h3>
            <table className="general-comp">
              <thead>
                <tr>
                  <th>Identificación</th>
                  <th>Nombre</th>
                </tr>
              </thead>
              <tbody>
                {contribuyente.representantesLegales?.length > 0 ? (
                  contribuyente.representantesLegales.map((rep, index) => (
                    <tr key={`${rep.identificacion}-${index}`}>
                      <td>{mostrarValor(rep.identificacion)}</td>
                      <td>{formatearTexto(rep.nombre)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2}>—</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default CatastroSRI;
