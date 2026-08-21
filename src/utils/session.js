export const clearSessionStorage = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("menu");
  localStorage.removeItem("username");
  localStorage.removeItem("empresaSeleccionada");
  localStorage.removeItem("rol");
};

export const saveTokenFromHeaders = (headers) => {
  if (!headers) return;

  const authHeader = headers.authorization || headers.Authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    localStorage.setItem("token", authHeader.substring(7));
  }
};
