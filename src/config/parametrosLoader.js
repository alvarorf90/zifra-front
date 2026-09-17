let parametrosPromise = null;

export const loadParametros = () => {
  if (!parametrosPromise) {
    parametrosPromise = fetch("/config/parametros.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`No se pudo cargar parametros.json (${response.status})`);
        }
        return response.json();
      })
      .catch((error) => {
        parametrosPromise = null;
        throw error;
      });
  }

  return parametrosPromise;
};
