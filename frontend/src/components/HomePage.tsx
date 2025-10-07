import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Database, FileJson, LogOut, Settings, Cable, Cpu } from 'lucide-react';
import { authApi } from '../api';
import { useDispatch, useSelector} from 'react-redux';
import { User } from '../types';
import { UseDispatch } from 'react-redux';
import { resetUser } from '../store/slices/userSlice';

const cards = [
  {
    title: 'LAF File Packages',
    description: 'Group and Model-Based Firmware Package Management',
    icon: <Database className="w-8 h-8" />,
    path: '/dashboard',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'CAN Settings',
    description: 'Visualize and analyze CAN settings data',
    icon: <FileJson className="w-8 h-8" />,
    path: '/jsonparser',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Harness Details',
    description: 'Vehicle harness configuration and management',
    icon: <Cable className="w-8 h-8" />,
    path: '/harness',
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    title: 'NRF Settings',
    description: 'Power state management and configuration',
    icon: <Cpu className="w-8 h-8" />,
    path: '/nrf-settings',
    gradient: 'from-indigo-500 to-purple-500'
  }
];

const cardVariants = {
  initial: { y: 50, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  hover: { 
    scale: 1.05,
    transition: { type: 'spring', stiffness: 300 }
  }
};

export default function HomePage() {
  const navigate = useNavigate();
  const user = useSelector((state: { user: User }) => state.user);
  const dispatch = useDispatch();
  const handleSignOut = async () => {
    await authApi.signOut();
    dispatch(resetUser());
    navigate('/');
  };

  const isAdmin = user.role.toLowerCase() === 'admin';

  return (
    <div className="min-h-screen relative">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80")',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/95 to-gray-100/95" />
      </div>

      <div className="relative z-10">
        <nav className="bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center relative">
              <h1 className="text-xl font-semibold text-white absolute left-1/2 transform -translate-x-1/2">
                Welcome
              </h1>
              <div className="flex items-center gap-6 ml-auto">
                {isAdmin && (
                  <button
                    onClick={() => navigate('/settings')}
                    className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="User Management"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                )}
                <div className="flex items-center gap-3">
                  <img
                    src={user?.avatar || ''}
                    alt="User avatar"
                    className="w-8 h-8 rounded-full border-2 border-white"
                  />
                  <div className="text-white">
                    <p className="text-sm font-medium">{user?.email || ''}</p>
                    <p className="text-xs opacity-75 capitalize">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              Select a Service
            </h2>
            <p className="mt-4 text-gray-600">
              Choose from our available tools and services
            </p>
          </div> */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {cards.map((card, index) => (
              <motion.div
                key={card.path}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                transition={{ delay: index * 0.2 }}
                onClick={() => navigate(card.path)}
                className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden cursor-pointer group`}
              >
                <div className={`h-2 bg-gradient-to-r ${card.gradient}`} />
                <div className="p-8">
                  <div className={`inline-block p-3 rounded-lg bg-gradient-to-r ${card.gradient} text-white mb-4 transform group-hover:rotate-12 transition-transform duration-300`}>
                    {card.icon}
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-gray-600">
                    {card.description}
                  </p>
                </div>
                <div className={`h-1 bg-gradient-to-r ${card.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
              </motion.div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}