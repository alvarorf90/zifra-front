export const API_BASE_URL = process.env.REACT_APP_API_URL || "";

export const IFRAME_BASE_URL = (process.env.REACT_APP_IFRAME_BASE_URL || "").replace(/\/$/, "");

export const getValidateUrl = () => `${API_BASE_URL}/api/auth/validate`;

export const buildIframeUrl = (path, params = {}) => {
  if (!IFRAME_BASE_URL) return null;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== "") {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return `${IFRAME_BASE_URL}${normalizedPath}${query ? `?${query}` : ""}`;
};
