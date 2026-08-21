import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import api from "../config/axios";
import { getValidateUrl } from "../config/apiConfig";
import { clearSessionStorage } from "../utils/session";

const ACTIVITY_EVENTS = ["click", "keydown", "touchstart"];
const ACTIVITY_THROTTLE_MS = 700;

export default function useSessionManager({ onLogout } = {}) {
  const [config, setConfig] = useState(null);

  const lastActivityRef = useRef(Date.now());
  const inactivityTimerRef = useRef(null);
  const heartbeatTimerRef = useRef(null);
  const lastEventTimeRef = useRef(0);
  const interceptorIdRef = useRef(null);
  const location = useLocation();

  const clearSession = useCallback(() => {
    clearSessionStorage();

    if (typeof onLogout === "function") {
      onLogout();
    } else {
      window.location.href = "/login";
    }
  }, [onLogout]);

  const resetInactivityTimer = useCallback(() => {
    if (!config) return;

    clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      clearSession();
    }, config.inactivityTime);
  }, [config, clearSession]);

  const validateWithRetry = useCallback(
    async (token) => {
      if (!config || !token) return null;

      const maxRetries = config.maxValidateRetries ?? 3;
      const validateUrl = getValidateUrl();

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const resp = await axios.get(validateUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const data = resp.data || {};
          const newToken =
            data.accessToken ??
            data.token ??
            (typeof data === "string" ? data : null);

          if (newToken) {
            localStorage.setItem("token", newToken);
            return newToken;
          }

          return token;
        } catch (err) {
          const status = err?.response?.status;

          if (status === 401 || status === 403) {
            clearSession();
            return null;
          }

          if (attempt < maxRetries - 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * (attempt + 1))
            );
            continue;
          }

          console.warn(
            "Validación de sesión fallida tras reintentos:",
            err?.message
          );
        }
      }

      return token;
    },
    [config, clearSession]
  );

  const onActivity = useCallback(() => {
    if (!config) return;

    const now = Date.now();
    if (now - lastEventTimeRef.current < ACTIVITY_THROTTLE_MS) return;
    lastEventTimeRef.current = now;

    lastActivityRef.current = now;
    resetInactivityTimer();
  }, [config, resetInactivityTimer]);

  const runHeartbeat = useCallback(async () => {
    if (!config) return;

    const inactiveMs = Date.now() - lastActivityRef.current;
    if (inactiveMs >= config.inactivityTime) return;

    const token = localStorage.getItem("token");
    if (token) {
      await validateWithRetry(token);
    }
  }, [config, validateWithRetry]);

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

  useEffect(() => {
    if (!config) return;

    resetInactivityTimer();

    const handler = () => onActivity();
    ACTIVITY_EVENTS.forEach((ev) =>
      window.addEventListener(ev, handler, { passive: true })
    );

    onActivity();

    return () => {
      clearTimeout(inactivityTimerRef.current);
      ACTIVITY_EVENTS.forEach((ev) =>
        window.removeEventListener(ev, handler)
      );
    };
  }, [config, onActivity, resetInactivityTimer]);

  useEffect(() => {
    if (!config) return;

    const intervalMs = config.minValidateInterval ?? 600000;
    heartbeatTimerRef.current = setInterval(runHeartbeat, intervalMs);

    return () => clearInterval(heartbeatTimerRef.current);
  }, [config, runHeartbeat]);

  useEffect(() => {
    if (config) onActivity();
  }, [location.pathname, config, onActivity]);

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
  }, [config, onActivity]);
}
