import apiClient from "./apiClient";

export interface ChatSessionMeta {
  id: string;
  title: string;
  datasetId: string | null;
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

export interface SessionDetail extends ChatSessionMeta {
  dataset?: {
    id: string;
    originalName: string;
    mimetype: string;
  } | null;
}

export interface SessionsListResponse {
  sessions: ChatSessionMeta[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MessagesListResponse {
  messages: ChatMessageItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SendMessageResponse {
  reply: string;
  userMessageId: string;
  assistantMessageId: string;
  sessionId: string;
  usage: {
    current: number;
    limit: number | null;
  };
}

export const aiService = {
  async getSessions(page = 1, limit = 20): Promise<SessionsListResponse> {
    const res = await apiClient.get<SessionsListResponse>("/ai/sessions", {
      params: { page, limit },
    });
    return res.data;
  },

  async getSession(sessionId: string): Promise<{ session: SessionDetail }> {
    const res = await apiClient.get<{ session: SessionDetail }>(`/ai/sessions/${sessionId}`);
    return res.data;
  },

  async createSession(data: { title?: string; datasetId?: string }): Promise<{ session: ChatSessionMeta }> {
    const res = await apiClient.post<{ session: ChatSessionMeta }>("/ai/sessions", data);
    return res.data;
  },

  async renameSession(sessionId: string, title: string): Promise<{ session: { id: string; title: string; updatedAt: string } }> {
    const res = await apiClient.patch<{ session: { id: string; title: string; updatedAt: string } }>(
      `/ai/sessions/${sessionId}`,
      { title }
    );
    return res.data;
  },

  async deleteSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/ai/sessions/${sessionId}`);
    return res.data;
  },

  async getMessages(sessionId: string, page = 1, limit = 50): Promise<MessagesListResponse> {
    const res = await apiClient.get<MessagesListResponse>(`/ai/sessions/${sessionId}/messages`, {
      params: { page, limit },
    });
    return res.data;
  },

  async sendMessage(sessionId: string, data: { content: string; datasetId?: string }): Promise<SendMessageResponse> {
    const res = await apiClient.post<SendMessageResponse>(`/ai/sessions/${sessionId}/messages`, data);
    return res.data;
  },
};

