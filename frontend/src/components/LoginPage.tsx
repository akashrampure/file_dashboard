import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { authApi } from '../api';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../store/slices/userSlice';


export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  
  const user = useSelector((state: { user: { isAuthenticated: boolean } }) => state.user);

  useEffect(() => {
    if (user.isAuthenticated) {
      navigate('/home');
      setLoading(false);
    }
  }, [user.isAuthenticated, navigate]);

  useEffect(() => {
    const checkAuthOnLoad = async () => {
      try {
        const refreshToken = document.cookie.includes('refresh_token');
        
        if (refreshToken) {
          setLoading(true);
          
          const newUser = await authApi.signInWithGoogle();
          
          if (newUser) {
            dispatch(setUser(newUser));
          }
        }
      } catch (error) {
        console.error("Auto-login error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthOnLoad();
  }, [dispatch]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await authApi.signInWithGoogle();
    } catch (error) {
      toast.error('Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 relative">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80")',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/95 to-gray-100/95" />
      </div>
      
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden z-10 relative">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Device Configuration</h1>
          <p className="text-purple-100">Sign in to access your dashboard</p>
        </div>
        
        <div className="p-8">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg px-6 py-3 hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn className="w-5 h-5" />
            <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}