export const API_BASE_URL = process.env.REACT_APP_API_URL || "";

export const IFRAME_BASE_URL = (process.env.REACT_APP_IFRAME_BASE_URL || "").replace(/\/$/, "");

export const getValidateUrl = () => `${API_BASE_URL}/api/auth/validate`;

/** Prioridad: parametros.json (runtime) → REACT_APP_IFRAME_BASE_URL (build). */
export const resolveIframeBaseUrl = (parametros) => {
  const fromFile = (parametros?.iframeBaseUrl || "").trim().replace(/\/$/, "");
  if (fromFile) return fromFile;
  return IFRAME_BASE_URL;
};

export const buildIframeUrl = (path, params = {}, iframeBaseUrl) => {
  const base = (iframeBaseUrl ?? IFRAME_BASE_URL).replace(/\/$/, "");
  if (!base) return null;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== "") {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return `${base}${normalizedPath}${query ? `?${query}` : ""}`;
};
