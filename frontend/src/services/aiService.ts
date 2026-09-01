import api from "./api";

export interface ChatSessionMeta {
  id: string;
  title: string;
  datasetId: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface SessionDetail {
  id: string;
  title: string;
  datasetId?: string | null;
  dataset?: {
    id: string;
    originalName: string;
    mimetype: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface SendMessagePayload {
  content: string;
  datasetId?: string;
}

export interface SendMessageResponse {
  status: "SUCCESS" | "PROVIDER_UNAVAILABLE" | "DETERMINISTIC_FALLBACK";
  reply: string;
  sessionId: string;
  userMessageId: string;
  assistantMessageId: string;
  ai?: {
    available: boolean;
    source: string;
    quotaConsumed: boolean;
  };
  analytical?: {
    available: boolean;
    source: string;
  };
  usage?: {
    current: number;
    limit: number | null;
  };
  retryable?: boolean;
}

export const aiService = {
  async getSessions(page = 1, limit = 30): Promise<{ sessions: ChatSessionMeta[]; pagination: any }> {
    const res = await api.get<{ sessions: ChatSessionMeta[]; pagination: any }>(
      `/ai/sessions?page=${page}&limit=${limit}`
    );
    return res.data;
  },

  async getSession(sessionId: string): Promise<{ session: SessionDetail }> {
    const res = await api.get<{ session: SessionDetail }>(`/ai/sessions/${sessionId}`);
    return res.data;
  },

  async getMessages(
    sessionId: string,
    page = 1,
    limit = 50
  ): Promise<{ messages: ChatMessageItem[]; pagination: any }> {
    const res = await api.get<{ messages: ChatMessageItem[]; pagination: any }>(
      `/ai/sessions/${sessionId}/messages?page=${page}&limit=${limit}`
    );
    return res.data;
  },

  async createSession(payload: { datasetId?: string; title?: string }): Promise<{ session: ChatSessionMeta }> {
    const res = await api.post<{ session: ChatSessionMeta }>("/ai/sessions", payload);
    return res.data;
  },

  async sendMessage(sessionId: string, payload: SendMessagePayload): Promise<SendMessageResponse> {
    const res = await api.post<SendMessageResponse>(`/ai/sessions/${sessionId}/messages`, payload);
    return res.data;
  },

  async renameSession(
    sessionId: string,
    title: string
  ): Promise<{ session: { id: string; title: string; updatedAt: string } }> {
    const res = await api.patch<{ session: { id: string; title: string; updatedAt: string } }>(
      `/ai/sessions/${sessionId}`,
      { title }
    );
    return res.data;
  },

  async deleteSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete<{ success: boolean; message: string }>(`/ai/sessions/${sessionId}`);
    return res.data;
  },
};

