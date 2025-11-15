import { useState } from 'react';
import { ArrowLeft, Lock, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { PasswordInput } from './ui/password-input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Header } from './Header';

interface ForgotPasswordPageProps {
  onBackClick: () => void;
  onSuccess: () => void;
}

export function ForgotPasswordPage({ onBackClick, onSuccess }: ForgotPasswordPageProps) {
  const [userType, setUserType] = useState<'student' | 'faculty'>('student');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const validDepartments = ['cse', 'bba', 'eng', 'eco', 'mat', 'eee', 'civ', 'tex'];

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    // Display only - no actual functionality
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md mx-auto">
          <Button
            variant="ghost"
            onClick={onBackClick}
            className="mb-6 hover:bg-white/50 dark:hover:bg-gray-800/50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-gray-900 dark:text-gray-100 mb-2">Reset Password</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Verify your identity to reset password
              </p>
            </div>

            {/* Display-only notice */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="mb-1"><strong>Demo Mode</strong></p>
                  <p>This is a display-only feature. Password reset functionality is not currently active.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="userType">User Type</Label>
                <Select value={userType} onValueChange={(value: 'student' | 'faculty') => setUserType(value)} disabled>
                  <SelectTrigger className="opacity-60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  {userType === 'student' ? 'University ID (11 digits)' : 'Faculty ID'}
                </Label>
                <Input
                  id="email"
                  placeholder={userType === 'student' ? '22234103110' : 'faculty.id'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled
                  className="opacity-60"
                />
              </div>

              {userType === 'student' && (
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={department} onValueChange={setDepartment} disabled>
                    <SelectTrigger className="opacity-60">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {validDepartments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <PasswordInput
                  id="newPassword"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled
                  className="opacity-60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled
                  className="opacity-60"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-60 cursor-not-allowed"
                disabled
              >
                Reset Password
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                For password recovery assistance, please contact the administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
