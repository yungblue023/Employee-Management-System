import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface User {
  username: string;
  email?: string;
  full_name?: string;
  disabled?: boolean;
}

export class AuthService {
  private static readonly TOKEN_KEY = 'access_token';
  private static readonly USER_KEY = 'current_user';

  /**
   * Login with username and password
   */
  static async login(username: string, password: string): Promise<LoginResponse> {
    try {
      // Create form data for OAuth2 password flow
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await axios.post<LoginResponse>(`${API_BASE_URL}/token`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, token_type } = response.data;

      // Store token in localStorage
      localStorage.setItem(this.TOKEN_KEY, access_token);

      // Fetch and store user information
      await this.fetchAndStoreUserInfo();

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid username or password');
      }
      throw new Error('Login failed. Please try again.');
    }
  }

  /**
   * Logout user
   */
  static logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    // Redirect to login page
    window.location.href = '/login';
  }

  /**
   * Get stored access token
   */
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Check if token is expired
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  /**
   * Get current user information
   */
  static getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Fetch user information from API and store it
   */
  private static async fetchAndStoreUserInfo(): Promise<void> {
    try {
      const token = this.getToken();
      if (!token) return;

      const response = await axios.get<User>(`${API_BASE_URL}/users/me/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      localStorage.setItem(this.USER_KEY, JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  }

  /**
   * Get authorization header for API requests
   */
  static getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Setup axios interceptor for automatic token handling
   * Note: This is now handled in the API service
   */
  static setupAxiosInterceptors(): void {
    console.log('AuthService: Axios interceptors are handled in API service');
  }
}
