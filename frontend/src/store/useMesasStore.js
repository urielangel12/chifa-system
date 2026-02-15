import { create } from "zustand";
import api from "../api/axios";

export const useMesasStore = create((set) => ({
  mesas: [],

  cargarMesas: async () => {
    const res = await api.get("/mesas");
    set({ mesas: res.data });
  },

  actualizarEstadoMesa: (id, estado) =>
    set((state) => ({
      mesas: state.mesas.map((m) =>
        m.id === id ? { ...m, estado } : m
      ),
    })),
}));
