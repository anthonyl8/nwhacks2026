const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Interface definitions based on backend schemas
export interface SpeakRequest {
  user_text: string;
  history?: Array<{ [key: string]: string }>;
  features: { [key: string]: any };
}

export interface SessionResponse {
  session_id: string;
  created_at: string;
  note?: string;
}

// Intelligence Endpoints
export const intelligenceApi = {
  start: async (authId: string) => {
    const response = await fetch(`${API_BASE_URL}/intelligence/start?auth_id=${authId}`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error(`Failed to start agent: ${response.statusText}`);
    }
    return response.json();
  },

  speak: async (data: SpeakRequest) => {
    const response = await fetch(`${API_BASE_URL}/intelligence/speak`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to speak: ${response.statusText}`);
    }
    
    // Returns a blob for the audio stream
    return response.blob();
  },
};

// Memory Endpoints
export const memoryApi = {
  getLandmarks: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/memory/landmarks`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to get landmarks: ${response.statusText}`);
    }
    return response.json();
  },

  debugSupabase: async (authId: string) => {
    const response = await fetch(`${API_BASE_URL}/memory/debug-supabase?auth_id=${authId}`, {
      method: "GET",
    });
    if (!response.ok) {
      throw new Error(`Failed to debug supabase: ${response.statusText}`);
    }
    return response.json();
  },
};

// Session Endpoints
export const sessionApi = {
  getSessions: async (token: string): Promise<SessionResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/sessions/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to get sessions: ${response.statusText}`);
    }
    return response.json();
  },

  deleteSession: async (sessionId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to delete session: ${response.statusText}`);
    }
    return response.json();
  },

  getWebSocketUrl: (token: string) => {
    const wsProtocol = API_BASE_URL.startsWith("https") ? "wss" : "ws";
    const wsBaseUrl = API_BASE_URL.replace(/^http(s)?:\/\//, "");
    return `${wsProtocol}://${wsBaseUrl}/sessions/ws?token=${token}`;
  },
};
