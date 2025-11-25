// useChatStore.ts
import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

interface ChatStore {
  allContacts: any[];
  chats: any[];
  messages: any[];
  activeTab: string;
  selectedUser: any | null;
  isUsersLoading: boolean;
  isMessagesLoading: boolean;

  isSoundEnabled: boolean;

  toggleSound: () => void;
  setActiveTab: (tab: string) => void;
  setSelectedUser: (user: any | null) => void;

  getAllContact: () => Promise<void>;
  getMyChartPartners: () => Promise<void>;
  getMessagesByUserId: (userId: any) => Promise<void>;
  sendMessage: (messageData: any) => Promise<void>;

  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  isSoundEnabled: localStorage.getItem("isSoundEnabled") === "true",

  toggleSound: () => {
    const newValue = !get().isSoundEnabled;
    localStorage.setItem("isSoundEnabled", String(newValue));
    set({ isSoundEnabled: newValue });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (user) => set({ selectedUser: user }),

  getAllContact: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Error");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyChartPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (error: any) {
      toast.error(error?.response?.data?.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Bir şeyler ters gitti");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

 // değiştir: useChatStore içindeki sendMessage fonksiyonunu aşağıdaki ile değiştir
sendMessage: async (messageData) => {
  const { selectedUser } = get();
  const { authUser, socket } = useAuthStore.getState();

  if (!selectedUser) {
    toast.error("Alıcı seçili değil.");
    return;
  }

  const tempId = `temp-${Date.now()}`;

  const optimisticMessage = {
    _id: tempId,
    senderId: authUser?._id,
    receiverId: selectedUser._id,
    text: messageData.text,
    image: messageData.image, // eğer file ise FormData kullan
    createdAt: new Date().toISOString(),
    pending: true, // UI için istersen
  };

  // 1) Optimistic ekle (state'in o anki halini alıyoruz)
  set((state) => ({ messages: [...state.messages, optimisticMessage] }));

  try {
    // Eğer messageData içinde file (image) varsa server'ın beklediği biçime göre gönder
    // Örneğin file varsa:
    // const form = new FormData();
    // form.append("text", messageData.text || "");
    // if (messageData.imageFile) form.append("image", messageData.imageFile);
    // const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, form, { headers: { "Content-Type": "multipart/form-data" } });

    // JSON ise doğrudan gönder
    const res = await axiosInstance.post(
      `/messages/send/${selectedUser._id}`,
      messageData
    );

    const savedMessage = res.data;

    // 2) Optimistic mesajı server cevabı ile değiştir (tempId ile bulup replace)
    set((state) => {
      const replaced = state.messages.map((m) =>
        m._id === tempId ? savedMessage : m
      );
      return { messages: replaced };
    });

    // 3) realtime: socket üzerinden server'a bildir (server senin emit'ini bekliyorsa)
    // Not: server otomatik broadcast yapıyorsa bu adım gerekli olmayabilir.
    const currentSocket = useAuthStore.getState().socket;
    if (currentSocket && currentSocket.emit) {
      // event adı backend'ine göre değişir; yaygın isim: "sendMessage" / "newMessage"
      try {
        currentSocket.emit("sendMessage", savedMessage);
      } catch (e) {
        // emit başarısızsa silent fail
        console.warn("Socket emit başarısız:", e);
      }
    }
  } catch (error: any) {
    // 4) Hata -> optimistic mesajı kaldır veya pending flag'i kaldır
    set((state) => ({
      messages: state.messages.filter((m) => m._id !== tempId),
    }));

    // Hata detayını console'a bas (buna bak backend'teki 500'ün nedenini gör)
    console.error("sendMessage error:", error?.response?.data || error?.message || error);

    toast.error(error?.response?.data?.message || "Bir şeyler ters gitti.");
  }
},


  subscribeToMessages: () => {
    const { selectedUser, isSoundEnabled } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    // ❗ Null crash engellendi
    if (!socket) {
      console.warn("Socket hazır değil, subscribe çalışmadı");
      return;
    }

    socket.on("newMessage", (newMessage: any) => {
      const isFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isFromSelectedUser) return;

      const current = get().messages;
      set({ messages: [...current, newMessage] });

      if (isSoundEnabled) {
        const sound = new Audio("/sounds/notification.mp3");
        sound.play().catch(() => {});
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
  },
}));
