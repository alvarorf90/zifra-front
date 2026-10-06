// Plazo mensual del SRI (IVA, retenciones e impuestos con el mismo calendario).
// El día base sale del noveno dígito del RUC. Si cae en fin de semana o feriado
// nacional, pasa al siguiente día hábil; si ese traslado cambia de mes, queda
// el último día hábil del mes de vencimiento. El contribuyente especial declara
// el día 11, sin usar el noveno dígito.

const DIA_POR_DIGITO = {
  1: 10,
  2: 12,
  3: 14,
  4: 16,
  5: 18,
  6: 20,
  7: 22,
  8: 24,
  9: 26,
  0: 28,
};

const DIA_CONTRIBUYENTE_ESPECIAL = 11;

const NO_ES_ESPECIAL = new Set(["", "NO", "N/A", "NA", "0", "-", "NULL", "FALSE"]);

// Cierres por decreto que no salen del calendario fijo de feriados.
const FERIADOS_DECRETO = {
  2026: ["2026-01-02"],
};

const cacheFeriados = new Map();

function inicioDeDia(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function sumarDias(fecha, dias) {
  const copia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  copia.setDate(copia.getDate() + dias);
  return copia;
}

function claveFecha(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function domingoPascua(anio) {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(anio, mes - 1, dia);
}

function fechaObservada(fecha, trasladar) {
  if (!trasladar) return fecha;
  const diaSemana = fecha.getDay();
  if (diaSemana === 6) return sumarDias(fecha, -1);
  if (diaSemana === 0) return sumarDias(fecha, 1);
  if (diaSemana === 2) return sumarDias(fecha, -1);
  if (diaSemana === 3) return sumarDias(fecha, 2);
  if (diaSemana === 4) return sumarDias(fecha, 1);
  return fecha;
}

function feriadosDelAnio(anio) {
  const pascua = domingoPascua(anio);
  const nominales = [
    { fecha: new Date(anio, 0, 1), trasladar: false },
    { fecha: sumarDias(pascua, -48), trasladar: true },
    { fecha: sumarDias(pascua, -47), trasladar: false },
    { fecha: sumarDias(pascua, -2), trasladar: true },
    { fecha: new Date(anio, 4, 1), trasladar: true },
    { fecha: new Date(anio, 4, 24), trasladar: true },
    { fecha: new Date(anio, 7, 10), trasladar: true },
    { fecha: new Date(anio, 9, 9), trasladar: true },
    { fecha: new Date(anio, 10, 2), trasladar: true },
    { fecha: new Date(anio, 10, 3), trasladar: true },
    { fecha: new Date(anio, 11, 25), trasladar: false },
  ];

  const feriados = new Set(FERIADOS_DECRETO[anio] || []);
  nominales.forEach(({ fecha, trasladar }) => {
    const observada = fechaObservada(fecha, trasladar);
    const clave = claveFecha(observada);
    if (feriados.has(clave)) {
      feriados.add(claveFecha(fecha));
      return;
    }
    feriados.add(clave);
  });
  return feriados;
}

function esFeriado(fecha) {
  const anio = fecha.getFullYear();
  if (!cacheFeriados.has(anio)) {
    cacheFeriados.set(anio, feriadosDelAnio(anio));
  }
  return cacheFeriados.get(anio).has(claveFecha(fecha));
}

function esFinDeSemana(fecha) {
  const dia = fecha.getDay();
  return dia === 0 || dia === 6;
}

function diaHabil(fecha, paso) {
  let actual = inicioDeDia(fecha);
  let guard = 0;
  while ((esFinDeSemana(actual) || esFeriado(actual)) && guard < 14) {
    actual = sumarDias(actual, paso);
    guard += 1;
  }
  return actual;
}

function fechaVencimientoMes(anio, mes, diaBase) {
  let habil = diaHabil(new Date(anio, mes, diaBase), 1);
  if (habil.getFullYear() !== anio || habil.getMonth() !== mes) {
    habil = diaHabil(new Date(anio, mes + 1, 0), -1);
  }
  return habil;
}

export function esContribuyenteEspecial(valor) {
  if (valor == null) return false;
  const texto = String(valor).trim().toUpperCase();
  return !NO_ES_ESPECIAL.has(texto);
}

export function novenoDigitoRuc(ruc) {
  const digitos = String(ruc ?? "").replace(/\D/g, "");
  if (digitos.length < 9) return null;
  const digito = digitos[8];
  return Object.prototype.hasOwnProperty.call(DIA_POR_DIGITO, digito) ? digito : null;
}

export function proximaFechaDeclaracion(ruc, opciones = {}) {
  const hoy = inicioDeDia(opciones.hoy || new Date());
  const especial = esContribuyenteEspecial(opciones.contribuyenteEspecial);
  const digito = novenoDigitoRuc(ruc);
  const diaBase = especial ? DIA_CONTRIBUYENTE_ESPECIAL : digito != null ? DIA_POR_DIGITO[digito] : null;
  if (diaBase == null) return null;

  let fecha = fechaVencimientoMes(hoy.getFullYear(), hoy.getMonth(), diaBase);
  if (fecha.getTime() < hoy.getTime()) {
    const mesSiguiente = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
    fecha = fechaVencimientoMes(mesSiguiente.getFullYear(), mesSiguiente.getMonth(), diaBase);
  }

  return {
    fecha,
    diaBase,
    digito: especial ? null : digito,
    especial,
    ajustada: fecha.getDate() !== diaBase,
    periodo: new Date(fecha.getFullYear(), fecha.getMonth() - 1, 1),
  };
}
