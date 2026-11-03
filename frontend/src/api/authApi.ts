export interface LoginPayload {
  username: string;
  password?: string;
}

export interface RegisterPayload {
  username: string;
  password?: string;
  fullName: string;
  phone?: string;
  email?: string;
  role?: 'GUEST' | 'HOST' | 'ADMIN';
}

export interface BackendUser {
  id: number;
  username: string;
  fullName: string;
  phone?: string;
  email: string;
  role: 'GUEST' | 'HOST' | 'ADMIN';
  status: 'ACTIVE' | 'LOCKED';
}

export interface AuthData {
  token: string;
  tokenType: string;
  user: BackendUser;
}

const TOKEN_KEY = 'odd_jwt_token';

export const authApi = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  async login(payload: LoginPayload): Promise<{ success: boolean; data?: AuthData }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: payload.username.trim(),
          password: payload.password || '',
        }),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json') || !res.ok) {
        return { success: false };
      }

      const json = await res.json();
      const authData: AuthData = json.data ? json.data : json;
      if (authData.token) {
        authApi.setToken(authData.token);
      }
      return { success: true, data: authData };
    } catch {
      return { success: false };
    }
  },

  async register(payload: RegisterPayload): Promise<{ success: boolean; data?: AuthData }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json') || !res.ok) {
        return { success: false };
      }

      const json = await res.json();
      const authData: AuthData = json.data ? json.data : json;
      if (authData.token) {
        authApi.setToken(authData.token);
      }
      return { success: true, data: authData };
    } catch {
      return { success: false };
    }
  },

  async checkRole(): Promise<{ success: boolean; user?: BackendUser }> {
    const token = authApi.getToken();
    if (!token) return { success: false };
    try {
      const res = await fetch('/api/auth/check-role', {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json') || !res.ok) {
        return { success: false };
      }

      const json = await res.json();
      const user: BackendUser = json.data ? json.data : json;
      return { success: true, user };
    } catch {
      return { success: false };
    }
  },

  async getMe(): Promise<{ success: boolean; user?: BackendUser }> {
    return authApi.checkRole();
  },

  async getUsers(): Promise<{ success: boolean; users?: BackendUser[] }> {
    const token = authApi.getToken();
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = 'Bearer ' + token;
      const res = await fetch('/api/auth/users', { headers });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json') || !res.ok) {
        return { success: false };
      }

      const json = await res.json();
      const users: BackendUser[] = Array.isArray(json) ? json : json.data || [];
      return { success: true, users };
    } catch {
      return { success: false };
    }
  },

  async updateUserRole(id: number, role: string): Promise<{ success: boolean; user?: BackendUser }> {
    const token = authApi.getToken();
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = 'Bearer ' + token;
      const res = await fetch(`/api/auth/users/${id}/role`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ role }),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json') || !res.ok) {
        return { success: false };
      }

      const json = await res.json();
      const user: BackendUser = json.data ? json.data : json;
      return { success: true, user };
    } catch {
      return { success: false };
    }
  },

  async updateUserStatus(id: number, status: string): Promise<{ success: boolean; user?: BackendUser }> {
    const token = authApi.getToken();
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = 'Bearer ' + token;
      const res = await fetch(`/api/auth/users/${id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status }),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json') || !res.ok) {
        return { success: false };
      }

      const json = await res.json();
      const user: BackendUser = json.data ? json.data : json;
      return { success: true, user };
    } catch {
      return { success: false };
    }
  },
};
