// useAuthStore.ts
import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import type { AuthUser } from "../types/auth";
import { io, Socket } from "socket.io-client";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:3000"
    : "/";

interface AuthState {
  authUser: AuthUser | null;
  isCheckingAuth: boolean;
  isSigningUp: boolean;
  isLoggingIn: boolean;

  socket: Socket | null;
  onlineUsers: any[];

  checkAuth: () => Promise<void>;
  signup: (data: any) => Promise<void>;
  login: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => void;

  connectSocket: () => void;
  disconnectSocket: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,

  socket: null,
  onlineUsers: [],

  // ✔ Refresh sonrası otomatik socket bağlanır
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });

      // Kullanıcı girişliyse socket bağla
      get().connectSocket();
    } catch (error) {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Başarıyla hesap oluşturuldu.");

      get().connectSocket();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Hata!");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Başarıyla giriş yapıldı.");

      get().connectSocket();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Hata!");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Çıkış yapıldı.");
      get().disconnectSocket();
    } catch (error) {
      toast.error("Hata! Çıkış yapılamadı.");
      console.log("Logout error:", error);
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profiliniz yenilendi.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message);
    }
  },

  // ✔ Socket her durumda güvenli şekilde bağlanır
  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser) return;

    // Zaten bağlıysa tekrar bağlama
    if (socket) return;

    const newSocket = io(BASE_URL, {
      withCredentials: true,
    });

    set({ socket: newSocket });

    newSocket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
