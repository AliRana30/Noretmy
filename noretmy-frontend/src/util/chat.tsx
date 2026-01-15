import axios from "axios";

interface StartOrFetchConversationParams {
  buyerId: string;
  sellerId: string;
}

export const startOrFetchConversation = async ({ buyerId, sellerId }: StartOrFetchConversationParams) => {
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  if (!BACKEND_URL) {
    console.error("BACKEND_URL is not defined in your environment variables.");
    return null;
  }

  try {
    const response = await axios.get(`${BACKEND_URL}/conversations/user/single/${sellerId}/${buyerId}`, {
      withCredentials: true,
    });

    if (response.status === 200) {
      const { conversationId } = response.data;
      return `/message/${conversationId}&sellerId=${sellerId}&buyerId=${buyerId}`;
    } else if (response.status === 204) {
      const createResponse = await axios.post(`${BACKEND_URL}/conversations`, {
        sellerId,
        buyerId,
      }, { withCredentials: true });

      if (createResponse.status === 201) {
        const { conversationId } = createResponse.data;
        return `/message/${conversationId}&sellerId=${sellerId}&buyerId=${buyerId}`;
      }
    }
  } catch (error) {
    console.error("Error while fetching/creating conversation:", error);
    return null;
  }
};
