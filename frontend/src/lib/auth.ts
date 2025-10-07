export interface User {
  email: string;
  role: 'admin' | 'user';
  avatar: string;
}

export const dummyAuth = {
  isAuthenticated: false,
  user: {
    email: 'dmt@intellicar.in',
    role: 'admin' as const,
    avatar: 'https://cdn-icons-png.flaticon.com/512/5987/5987424.png?fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  async signIn(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isAuthenticated = true;
        localStorage.setItem('isAuthenticated', 'true');
        resolve();
      }, 1000);
    });
  },
  async signOut(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isAuthenticated = false;
        localStorage.removeItem('isAuthenticated');
        resolve();
      }, 500);
    });
  },
  checkAuth(): boolean {
    const auth = localStorage.getItem('isAuthenticated');
    this.isAuthenticated = auth === 'true';
    return this.isAuthenticated;
  },
  getUser(): User {
    return this.user;
  }
};