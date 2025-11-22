import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

// sadece gerekli tipler
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
  getMessagesByUserId: (userId:any) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  // ✔ TS doğru okur
  isSoundEnabled: localStorage.getItem("isSoundEnabled") === "true",

  toggleSound: () => {
    const newValue = !get().isSoundEnabled;

    // ✔ string olarak kaydet
    localStorage.setItem("isSoundEnabled", String(newValue));

    // ✔ set tip hatası yaşamaz
    set({ isSoundEnabled: newValue });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),

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
    set({isUsersLoading: true});

    try {
        const res = await axiosInstance.get("/messages/chats");
        set({ chats: res.data});
    } catch (error:any) {
        toast.error(error?.response?.data?.message);
    }finally{
        set({isUsersLoading:false})
    }
  },

  getMessagesByUserId: async (userId:any) =>{
        set({isMessagesLoading: true});

        try {
          const res = await axiosInstance.get(`/messages/${userId}`);
          set({messages: res.data})
        } catch (error:any) {
          toast.error(error?.response?.data?.message || "Bir şeyler ters gitti")
        } finally{
            set({ isMessagesLoading:false})
        }
  }

}));
