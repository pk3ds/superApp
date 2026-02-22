export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'user';
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
}
