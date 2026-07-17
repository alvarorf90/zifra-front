export const impuestoRetencion = {
  "1": { // Impuesto a la Renta
    nombre: "Imp. Renta",
    codigos: [
      { codigo: "303", descripcion: "Honorarios profesionales y demás pagos por servicios relacionados con el título profesional", porcentaje: 10 },
      { codigo: "304", descripcion: "Servicios predomina el intelecto no relacionados con el título profesional", porcentaje: 10 },
      { codigo: "307", descripcion: "Servicios predomina la mano de obra", porcentaje: 2 },
      { codigo: "308", descripcion: "Utilización o aprovechamiento de la imagen o renombre (personas naturales, sociedades)", porcentaje: 10 },
      { codigo: "309", descripcion: "Servicios prestados por medios de comunicación y agencias de publicidad", porcentaje: 2.75 },
      { codigo: "310", descripcion: "Servicio de transporte privado de pasajeros o transporte público o privado de carga", porcentaje: 1 },
      { codigo: "311", descripcion: "Pagos a través de liquidación de compra (nivel cultural o rusticidad)", porcentaje: 2 },
      { codigo: "312", descripcion: "Transferencia de bienes muebles de naturaleza corporal", porcentaje: 1.75 },
      { codigo: "319", descripcion: "Cuotas de arrendamiento mercantil, inclusive la de opción de compra", porcentaje: 2 },
      { codigo: "320", descripcion: "Arrendamiento bienes inmuebles", porcentaje: 10 },
      { codigo: "322", descripcion: "Seguros y reaseguros (primas y cesiones)", porcentaje: 1 },
    ],
  },
  "6": { // Impuesto a la salida de divisas
    nombre: "Imp. Salida Divisas",
    codigos: [
      { codigo: "4580", descripcion: "Transferencias al exterior", porcentaje: 5 },
    ],
  },
  "2": { // IVA Retención
    nombre: "IVA Retención",
    codigos: [
      { codigo: "8", descripcion: "0% IVA retenido", porcentaje: 0 },
      { codigo: "7", descripcion: "0% IVA retenido(Resolución NAC-DGERCGC15-00000284)", porcentaje: 0 },      
      { codigo: "9", descripcion: "10% IVA retenido", porcentaje: 10 },
      { codigo: "10", descripcion: "20% IVA retenido", porcentaje: 20 },
      { codigo: "1", descripcion: "30% IVA retenido", porcentaje: 30 },
      { codigo: "11", descripcion: "50% IVA retenido", porcentaje: 50 },
      { codigo: "2", descripcion: "70% IVA retenido", porcentaje: 70 },
      { codigo: "3", descripcion: "100% IVA retenido", porcentaje: 100 },
    ],
  },
};
