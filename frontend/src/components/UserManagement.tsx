import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, LogOut, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserManagement } from '../types';
import { authApi } from '../api';
import toast from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { resetUser } from '../store/slices/userSlice';

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector((state: { user: UserManagement }) => state.user);

  const fetchUsers = async () => {
    try {
      const fetchedUsers = await authApi.getAllUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
    toast.success('User list refreshed');
  };

  const handleSignOut = async () => {
    await authApi.signOut();
    dispatch(resetUser());
    navigate('/');
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await authApi.updateUserRole(userId, newRole);
      setEditingUser(null);
      await fetchUsers();
      toast.success('User role updated successfully');
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const canEditUser = (user: UserManagement) => {
    const isCurrentUserAdmin = currentUser.role.toLowerCase() === 'admin';
    const isTargetUserAdmin = user.role.toLowerCase() === 'admin';
    const isEditingSelf = user.id === currentUser.id;

    return isCurrentUserAdmin && !isTargetUserAdmin && !isEditingSelf;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors duration-200 bg-white/10 rounded-lg px-3 py-2"
            >
              <Home className="w-5 h-5" />
              Homepage
            </button>
            <h1 className="text-xl font-semibold text-white absolute left-1/2 transform -translate-x-1/2">
              User Management
            </h1>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser?.avatar || ''}
                  alt="User avatar"
                  className="w-8 h-8 rounded-full border-2 border-white"
                />
                <div className="text-white">
                  <p className="text-sm font-medium">{currentUser?.email || ''}</p>
                  <p className="text-xs opacity-75 capitalize">{currentUser.role}</p>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-xl overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Users</h2>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-500 hover:text-purple-600 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
                title="Refresh users"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  {currentUser.role.toLowerCase() === 'admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={currentUser.role.toLowerCase() === 'admin' ? 4 : 3} className="px-6 py-4 text-center text-gray-600">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={currentUser.role.toLowerCase() === 'admin' ? 4 : 3} className="px-6 py-4 text-center text-gray-600">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={`user-${user.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                        {user.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {editingUser === user.id && canEditUser(user) ? (
                          <select
                            className="border border-gray-300 rounded-md shadow-sm px-3 py-1 text-gray-700 bg-white"
                            defaultValue={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            onBlur={() => setEditingUser(null)}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role.toLowerCase() === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        )}
                      </td>
                      {currentUser.role.toLowerCase() === 'admin' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {canEditUser(user) && (
                            <button
                              onClick={() => setEditingUser(user.id)}
                              className="text-purple-600 hover:text-purple-900 font-medium"
                            >
                              Edit Role
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  );
}