import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import Dashboard from './components/Dashboard';
import JsonParser from './components/JsonParser';
import HarnessDetails from './components/HarnessDetails';
import UserManagement from './components/UserManagement';
import UnauthorizedPage from './components/UnauthorizedPage';
import NrfSettings from './components/NrfSettings';
import { useSelector } from 'react-redux';
import { User } from './types';

function PrivateRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const user = useSelector((state: { user: User }) => state.user);
  
  if (user.isAuthenticated === false) {
    return <Navigate to="/" />;
  }

  if (user.isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  if (requireAdmin && user.role.toLowerCase() !== 'admin') {
    return <Navigate to="/unauthorized" />;
  }

  return user.isAuthenticated ? <>{children}</> : <Navigate to="/" />;
}

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route
            path="/home"
            element={
              <PrivateRoute>
                <HomePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/jsonparser"
            element={
              <PrivateRoute>
                <JsonParser />
              </PrivateRoute>
            }
          />
          <Route
            path="/harness"
            element={
              <PrivateRoute>
                <HarnessDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/nrf-settings"
            element={
              <PrivateRoute>
                <NrfSettings />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute requireAdmin={true}>
                <UserManagement />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </>
  );
}

export default App;