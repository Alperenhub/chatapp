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

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser?._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
    };

    set({ messages: [...messages, optimisticMessage] });

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );

      set({
        messages: [...messages, res.data],
      });
    } catch (error: any) {
      set({ messages: messages });
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
