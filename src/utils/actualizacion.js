const VERSION_LOCAL = process.env.REACT_APP_BUILD_ID || "";
const INTERVALO_MS = 60000;

function estaEscribiendo() {
  const activo = document.activeElement;
  if (!activo) return false;
  const etiqueta = activo.tagName;
  return etiqueta === "INPUT" || etiqueta === "TEXTAREA" || etiqueta === "SELECT" || activo.isContentEditable;
}

function cargarVersion(version) {
  const url = new URL(window.location.href);
  url.searchParams.set("_v", version);
  window.location.replace(url.toString());
}

function limpiarMarca() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("_v")) return;
  url.searchParams.delete("_v");
  const consulta = url.searchParams.toString();
  window.history.replaceState(null, "", `${url.pathname}${consulta ? `?${consulta}` : ""}${url.hash}`);
}

async function revisarVersion() {
  if (!VERSION_LOCAL || estaEscribiendo()) return;

  try {
    const respuesta = await fetch("/version.json", { cache: "no-store" });
    if (!respuesta.ok) return;
    const data = await respuesta.json();
    const version = data && data.version;
    if (!version || version === VERSION_LOCAL) {
      limpiarMarca();
      return;
    }

    const marca = new URL(window.location.href).searchParams.get("_v");
    if (marca === version) return;
    cargarVersion(version);
  } catch {
    return;
  }
}

export function iniciarActualizacion() {
  if (!VERSION_LOCAL) return;

  revisarVersion();
  window.setInterval(revisarVersion, INTERVALO_MS);
  window.addEventListener("pageshow", revisarVersion);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") revisarVersion();
  });
}
