import { useState } from 'react';
import { ArrowLeft, LogIn } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { PasswordInput } from './ui/password-input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Header } from './Header';
import { ForgotPasswordDialog } from './ForgotPasswordDialog';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface LoginPageProps {
  onLogin: (user: any) => void;
  onBackClick: () => void;
}

export function LoginPage({ onLogin, onBackClick }: LoginPageProps) {
  const [userType, setUserType] = useState<'student' | 'faculty'>('student');
  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Construct email if ID is provided
      let email = emailOrId;
      let needsLookup = false;
      
      // If user didn't include @, handle based on user type
      if (!emailOrId.includes('@')) {
        if (userType === 'student') {
          // For students entering just ID, validate it's 11 digits
          if (!/^\d{11}$/.test(emailOrId)) {
            throw new Error('University ID must be exactly 11 digits');
          }
          // We'll let the backend look up the full email
          email = emailOrId; // Send just the ID
          needsLookup = true;
        } else {
          // For faculty, append @bubt.edu.bd
          email = `${emailOrId}@bubt.edu.bd`;
        }
      } else {
        // Email provided, validate format
        if (userType === 'student') {
          if (!/^\d{11}@[a-z]{3}\.bubt\.edu\.bd$/.test(email)) {
            throw new Error('Email must be a valid BUBT student email (11digits@department.bubt.edu.bd)');
          }
        } else {
          if (!email.endsWith('@bubt.edu.bd')) {
            throw new Error('Email must be a valid BUBT email address (@bubt.edu.bd)');
          }
        }
      }

      // Call login API
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ 
          email, 
          password, 
          userType,
          needsLookup // Tell backend if it needs to look up the email
        }),
      });

      console.log('Login response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Login error response:', errorData);
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      console.log('Login successful, received user data');
      onLogin(data.user);
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-indigo-950 dark:to-purple-950">
      <Header variant="compact" />
      
      <div className="flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">
          <Button
            onClick={onBackClick}
            variant="ghost"
            className="mb-4 gap-2 text-purple-700 hover:text-purple-900 hover:bg-purple-100 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-950"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-purple-100 dark:border-purple-900">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl mb-4 shadow-lg shadow-purple-500/30">
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-gray-900 dark:text-gray-100 mb-2">Welcome Back</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sign in to your UniFind account</p>
            </div>

            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
                <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Login As</Label>
                <Select value={userType} onValueChange={(value) => setUserType(value as 'student' | 'faculty')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailOrId">
                  {userType === 'student' ? 'University ID or Email' : 'Faculty Code or Email'}
                </Label>
                <Input
                  id="emailOrId"
                  type="text"
                  placeholder={userType === 'student' ? '22234103110 or email' : 'FAC001 or email'}
                  value={emailOrId}
                  onChange={(e) => setEmailOrId(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  placeholder="Enter your password"
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
                {loading ? 'Logging in...' : 'Login'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-purple-600 hover:text-purple-700 hover:underline dark:text-purple-400 dark:hover:text-purple-300"
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ForgotPasswordDialog
        open={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        userType={userType}
      />
    </div>
  );
}