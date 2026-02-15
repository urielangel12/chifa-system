export const fechaHoraPE = (iso) =>
  new Date(iso).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    hour12: false
  });

export const soloFechaPE = (iso) =>
  new Date(iso).toLocaleDateString("es-PE", {
    timeZone: "America/Lima"
  });
