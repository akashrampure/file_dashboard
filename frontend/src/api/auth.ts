import { api } from './config';
import { User, UserManagement } from '../types';
import Cookies from 'universal-cookie';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { persistor } from '../store/store';
import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL
const STAGE = import.meta.env.VITE_STAGE

const cookies = new Cookies();

export const authApi = {
  async signInWithGoogle(): Promise<User | undefined> {
    try {
      const refreshToken = cookies.get('refresh_token')
      if (refreshToken) {
        await this.getNewAccessToken(refreshToken);
        const accessToken = cookies.get('access_token');
        if (accessToken) {
          const decodedToken = jwtDecode<{email: string, picture: string, role: string}>(accessToken);
          const user = {
            email: decodedToken.email,
            role: decodedToken.role,
            avatar: decodedToken.picture,
            isAuthenticated: true
          }
          return user;
        } else {
          throw new Error('Access token not found after refresh');
        }
      } else {
          window.location.href = API_BASE_URL + '/auth/google';
      
        return new Promise<never>(() => {
        });
      }
    } catch(error) {
      console.error('Error signing in with Google', error);
      throw error;
    }
  },

  async signOut(): Promise<void> {
    try {
      var domain = "localhost"
      var path ="/"

      if(STAGE=="production"){
          domain="products.intellicar.in"
      }

      cookies.remove('access_token', { domain: domain, path: path });
      cookies.remove('refresh_token', { domain: domain, path: path });

      try {
        await persistor.purge();
      } catch (purgeError) {
        console.error('Error during persistor purge:', purgeError);
      }

    } catch (error) {
      console.error('Error signing out', error);
      throw error;
    }
  },

  async getNewAccessToken(refreshToken: string) {
    if (refreshToken) {
      const isValid = jwtDecode<JwtPayload>(refreshToken);
      if (isValid.exp && isValid.exp > Date.now() / 1000) {
        await axios.post(API_BASE_URL + '/auth/refresh', {}, {
          withCredentials: true
        });
      }
    }
  },

  async getAllUsers(): Promise<UserManagement[]> {
    const response = await api.get('/users');
    return response.data;
  },

  async updateUserRole(userId: string, role: string): Promise<void> {
    await api.post(`/user/${userId}`, { role });
  }
};