import { useEffect, useState } from "react";
import { loadParametros } from "../config/parametrosLoader";

export default function useParametros() {
  const [parametros, setParametros] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    loadParametros()
      .then((data) => {
        if (active) setParametros(data);
      })
      .catch((err) => {
        if (active) setError(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { parametros, loading, error };
}
