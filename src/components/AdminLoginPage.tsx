import { useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { PasswordInput } from './ui/password-input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Header } from './Header';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface AdminLoginPageProps {
  onLogin: (admin: any) => void;
  onBackClick: () => void;
}

export function AdminLoginPage({ onLogin, onBackClick }: AdminLoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/admin-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Admin login failed');
      }

      const data = await response.json();
      onLogin(data.admin);
    } catch (err: any) {
      setError(err.message || 'An error occurred during admin login');
      console.error('Admin login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 dark:from-gray-950 dark:via-indigo-950 dark:to-purple-950">
      <div className="bg-white/10 dark:bg-gray-900/50 backdrop-blur-sm">
        <Header variant="compact" />
      </div>
      
      <div className="flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">
          <Button
            onClick={onBackClick}
            variant="ghost"
            className="mb-4 gap-2 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-purple-100 dark:border-purple-900">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl mb-4 shadow-lg shadow-purple-500/50">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-gray-900 dark:text-gray-100 mb-2">Admin Login</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Access the admin dashboard</p>
            </div>

            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
                <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@bubt.edu.bd"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login as Admin'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg dark:bg-purple-950/30 dark:border-purple-800">
              <p className="text-xs text-purple-800 dark:text-purple-300">
                <strong>Note:</strong> Admin credentials are set in the system configuration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}