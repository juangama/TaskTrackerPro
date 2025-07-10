import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

export interface AuthResponse {
  user: User;
}

export const authApi = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await apiRequest("POST", "/api/auth/login", { username, password });
    return response.json();
  },

  logout: async (): Promise<void> => {
    await apiRequest("POST", "/api/auth/logout");
  },

  getCurrentUser: async (): Promise<AuthResponse> => {
    const response = await apiRequest("GET", "/api/auth/me");
    return response.json();
  },
};
