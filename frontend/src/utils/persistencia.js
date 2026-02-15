export const guardarPedidoLocal = (mesaId, pedido) => {
  localStorage.setItem(
    `pedido_mesa_${mesaId}`,
    JSON.stringify(pedido)
  );
};

export const recuperarPedidoLocal = (mesaId) => {
  const data = localStorage.getItem(`pedido_mesa_${mesaId}`);
  return data ? JSON.parse(data) : [];
};

export const limpiarPedidoLocal = (mesaId) => {
  localStorage.removeItem(`pedido_mesa_${mesaId}`);
};
