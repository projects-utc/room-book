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
  role?: 'GUEST' | 'HOST';
}

export interface BackendUser {
  id: number;
  username: string;
  fullName: string;
  phone: string;
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

  async login(payload: LoginPayload): Promise<{ success: boolean; message?: string; data?: AuthData }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: payload.username.trim(),
          password: payload.password || '',
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        return { success: false, message: json.message || 'Đăng nhập không thành công' };
      }

      const authData: AuthData = json.data ? json.data : json;
      if (authData.token) {
        authApi.setToken(authData.token);
      }
      return { success: true, message: json.message || 'Đăng nhập thành công', data: authData };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Không thể kết nối đến máy chủ backend' };
    }
  },

  async register(payload: RegisterPayload): Promise<{ success: boolean; message?: string; data?: AuthData }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        return { success: false, message: json.message || 'Đăng ký không thành công' };
      }

      const authData: AuthData = json.data ? json.data : json;
      return { success: true, message: json.message || 'Đăng ký thành công', data: authData };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Không thể kết nối đến máy chủ backend' };
    }
  },

  async getMe(): Promise<{ success: boolean; user?: BackendUser }> {
    const token = authApi.getToken();
    if (!token) return { success: false };
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });

      if (!res.ok) return { success: false };
      const json = await res.json();
      const user: BackendUser = json.data ? json.data : json;
      return { success: true, user };
    } catch {
      return { success: false };
    }
  },
};
