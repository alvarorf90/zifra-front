import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import api from "../config/axios";

export default function useSessionManager({ onLogout } = {}) {
  const [config, setConfig] = useState(null);

  const lastActivityRef = useRef(Date.now());
  const inactivityTimerRef = useRef(null);
  const lastValidateRef = useRef(0);
  const lastEventTimeRef = useRef(0);
  const interceptorIdRef = useRef(null);
  const location = useLocation();

  /* ==============================
     LIMPIEZA DE SESIÓN (CRÍTICO)
     ============================== */
  const clearSession = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("menu");
      localStorage.removeItem("empresaSeleccionada"); // 🔥 FIX CLAVE
    } catch (e) {}

    if (typeof onLogout === "function") {
      onLogout();
    } else {
      window.location.href = "/login";
    }
  };

  /* ==============================
     JWT helpers
     ============================== */
  const decodeJwt = (token) => {
    try {
      const parts = token.split(".");
      if (parts.length < 2) return null;
      let payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      while (payload.length % 4) payload += "=";
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  };

  const getTokenRemainingMs = (token) => {
    if (!token) return -1;
    const payload = decodeJwt(token);
    if (!payload?.exp) return Infinity;
    return payload.exp * 1000 - Date.now();
  };

  /* ==============================
     VALIDAR Y REFRESCAR TOKEN
     ============================== */
  const validateAndMaybeRefresh = async (token) => {
    if (!config || !token) return null;

    const now = Date.now();
    if (now - lastValidateRef.current < config.minValidateInterval) {
      return token;
    }

    const remaining = getTokenRemainingMs(token);
    if (remaining > config.refreshThreshold) {
      return token;
    }

    try {
      lastValidateRef.current = now;
      const resp = await axios.get(config.validateUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = resp.data || {};
      const newToken =
        data.accessToken ??
        data.token ??
        (typeof data === "string" ? data : null);

      if (newToken && newToken !== token) {
        localStorage.setItem("token", newToken);
        return newToken;
      }

      return token;
    } catch (err) {
      console.warn(
        "Session validation failed:",
        err?.response?.status || err.message
      );
      clearSession();
      return null;
    }
  };

  /* ==============================
     ACTIVIDAD DEL USUARIO
     ============================== */
  const onActivity = async () => {
    if (!config) return;

    const now = Date.now();
    if (now - lastEventTimeRef.current < 700) return;
    lastEventTimeRef.current = now;

    lastActivityRef.current = now;
    clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      clearSession();
    }, config.inactivityTime);

    const token = localStorage.getItem("token");
    if (token) {
      validateAndMaybeRefresh(token).catch((e) =>
        console.error("Error validating token on activity:", e)
      );
    }
  };

  /* ==============================
     CARGAR CONFIGURACIÓN
     ============================== */
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch("/config/parametros.json");
        const json = await res.json();
        setConfig(json);
      } catch (e) {
        console.error("Error cargando configuración:", e);
      }
    };
    loadConfig();
  }, []);

  /* ==============================
     LISTENERS DE ACTIVIDAD
     ============================== */
  useEffect(() => {
    if (!config) return;

    clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      clearSession();
    }, config.inactivityTime);

    const events = ["click", "mousemove", "keydown", "touchstart", "scroll"];
    const handler = () => onActivity();

    events.forEach((ev) =>
      window.addEventListener(ev, handler, { passive: true })
    );

    onActivity();

    return () => {
      clearTimeout(inactivityTimerRef.current);
      events.forEach((ev) =>
        window.removeEventListener(ev, handler)
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  /* ==============================
     NAVEGACIÓN CUENTA COMO ACTIVIDAD
     ============================== */
  useEffect(() => {
    if (config) onActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, config]);

  /* ==============================
     INTERCEPTOR AXIOS
     ============================== */
  useEffect(() => {
    if (!config) return;

    interceptorIdRef.current = api.interceptors.request.use(
      (cfg) => {
        onActivity();
        return cfg;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      if (interceptorIdRef.current !== null) {
        api.interceptors.request.eject(interceptorIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);
}