export interface ChatUser {
  _id: string;
  username: string;
  profilePicture: string;
  isSeller: boolean;
}

export interface Conversation {
  _id: string;
  id: string;
  sellerId: string;
  buyerId: string;
  seller: ChatUser;
  buyer: ChatUser;
  lastMessage: string;
  readBySeller: boolean;
  readByBuyer: boolean;
  updatedAt: string;
}

export interface ChatTranslations {
  header: {
    title: string;
    searchPlaceholder: string;
  };
  loading: {
    message: string;
  };
  errors: {
    fetchFailed: string;
    markReadFailed: string;
    noUserData: string;
  };
  empty: {
    noConversations: string;
  };
  conversation: {
    noMessages: string;
    aria: {
      settings: string;
      searchInput: string;
      searchButton: string;
      userAvatar: string;
    };
  };
} 