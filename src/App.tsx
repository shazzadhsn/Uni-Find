import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { AdminLoginPage } from './components/AdminLoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from './components/ui/sonner';

type Page = 'landing' | 'login' | 'admin-login' | 'register' | 'forgot-password' | 'reset-password' | 'user-dashboard' | 'admin-dashboard';

interface User {
  id: string;
  name: string;
  email: string;
  userType: 'student' | 'faculty';
  userId: string;
  phone: string;
  accessToken: string;
}

interface Admin {
  id: string;
  email: string;
  accessToken: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('unifind_user');
    const storedAdmin = localStorage.getItem('unifind_admin');
    
    const authVersion = localStorage.getItem('unifind_auth_version');
    if (authVersion !== '2.0') {
      localStorage.removeItem('unifind_user');
      localStorage.removeItem('unifind_admin');
      localStorage.setItem('unifind_auth_version', '2.0');
      console.log('Cleared old authentication data due to system update');
      return;
    }
    
    // Check if URL has reset password token (legacy Supabase flow, not used anymore)
    if (window.location.hash.includes('access_token') && window.location.hash.includes('type=recovery')) {
      setCurrentPage('reset-password');
      return;
    }
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setCurrentPage('user-dashboard');
    } else if (storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
      setCurrentPage('admin-dashboard');
    }
  }, []);

  const handleUserLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('unifind_user', JSON.stringify(userData));
    setCurrentPage('user-dashboard');
  };

  const handleAdminLogin = (adminData: Admin) => {
    setAdmin(adminData);
    localStorage.setItem('unifind_admin', JSON.stringify(adminData));
    setCurrentPage('admin-dashboard');
  };

  const handleUserLogout = () => {
    setUser(null);
    localStorage.removeItem('unifind_user');
    setCurrentPage('landing');
  };

  const handleAdminLogout = () => {
    setAdmin(null);
    localStorage.removeItem('unifind_admin');
    setCurrentPage('landing');
  };

  return (
    <ThemeProvider>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-background">
        {currentPage === 'landing' && (
          <LandingPage
            onLoginClick={() => setCurrentPage('login')}
            onRegisterClick={() => setCurrentPage('register')}
            onAdminLoginClick={() => setCurrentPage('admin-login')}
          />
        )}
        {currentPage === 'login' && (
          <LoginPage
            onLogin={handleUserLogin}
            onBackClick={() => setCurrentPage('landing')}
          />
        )}
        {currentPage === 'admin-login' && (
          <AdminLoginPage
            onLogin={handleAdminLogin}
            onBackClick={() => setCurrentPage('landing')}
          />
        )}
        {currentPage === 'register' && (
          <RegisterPage
            onRegister={handleUserLogin}
            onBackClick={() => setCurrentPage('landing')}
          />
        )}
        {currentPage === 'forgot-password' && (
          <ForgotPasswordPage
            onBackClick={() => setCurrentPage('login')}
            onSuccess={() => setCurrentPage('reset-password')}
          />
        )}
        {currentPage === 'reset-password' && (
          <ResetPasswordPage
            onPasswordReset={() => setCurrentPage('login')}
          />
        )}
        {currentPage === 'user-dashboard' && user && (
          <UserDashboard user={user} onLogout={handleUserLogout} />
        )}
        {currentPage === 'admin-dashboard' && admin && (
          <AdminDashboard admin={admin} onLogout={handleAdminLogout} />
        )}
      </div>
    </ThemeProvider>
  );
}