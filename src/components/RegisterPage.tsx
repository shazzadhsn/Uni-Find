import { useState } from 'react';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { PasswordInput } from './ui/password-input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Header } from './Header';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface RegisterPageProps {
  onRegister: (user: any) => void;
  onBackClick: () => void;
}

export function RegisterPage({ onRegister, onBackClick }: RegisterPageProps) {
  const [userType, setUserType] = useState<'student' | 'faculty'>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState(''); // University ID or Faculty Code
  const [department, setDepartment] = useState(''); // Department for students
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validDepartments = ['cse', 'bba', 'eng', 'eco', 'mat', 'eee', 'civ', 'tex'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Validate University ID for students (must be 11 digits)
    if (userType === 'student') {
      if (!/^\d{11}$/.test(userId)) {
        setError('University ID must be exactly 11 digits');
        return;
      }

      if (!department) {
        setError('Please select your department');
        return;
      }
    }

    // Validate email pattern
    const emailRegex = userType === 'student' 
      ? /^\d{11}@[a-z]{3}\.bubt\.edu\.bd$/
      : /^[a-zA-Z0-9]+@bubt\.edu\.bd$/;
    
    if (!emailRegex.test(email)) {
      setError(
        userType === 'student' 
          ? 'Invalid format. Student email should be 11digitID@department.bubt.edu.bd'
          : 'Invalid format. Faculty email should be facultycode@bubt.edu.bd'
      );
      return;
    }

    // Validate email matches userId and department
    const expectedEmail = userType === 'student' 
      ? `${userId}@${department}.bubt.edu.bd`
      : `${userId}@bubt.edu.bd`;
    
    if (email !== expectedEmail) {
      setError(`Email must be ${expectedEmail} for your ${userType === 'student' ? 'University ID and Department' : 'Faculty Code'}`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          name,
          email,
          userId,
          department: userType === 'student' ? department : undefined,
          phone,
          password,
          userType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const data = await response.json();
      onRegister(data.user);
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
      console.error('Registration error:', err);
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
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-gray-900 dark:text-gray-100 mb-2">Create Account</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Register for UniFind</p>
            </div>

            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
                <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label>Register As</Label>
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
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userId">
                  {userType === 'student' ? 'University ID (11 digits)' : 'Faculty Code'}
                </Label>
                <Input
                  id="userId"
                  type="text"
                  placeholder={userType === 'student' ? '22234103110' : 'FAC001'}
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                />
              </div>

              {userType === 'student' && (
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={department} onValueChange={(value) => setDepartment(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {validDepartments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={
                    userType === 'student'
                      ? userId && department 
                        ? `${userId}@${department}.bubt.edu.bd`
                        : '22234103110@cse.bubt.edu.bd'
                      : userId
                        ? `${userId}@bubt.edu.bd`
                        : 'FAC001@bubt.edu.bd'
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">
                  {userType === 'student' 
                    ? userId && department
                      ? `Must be: ${userId}@${department}.bubt.edu.bd`
                      : 'Format: 11digitID@department.bubt.edu.bd'
                    : userId
                      ? `Must be: ${userId}@bubt.edu.bd`
                      : 'Format: facultycode@bubt.edu.bd'
                  }
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+8801712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Register'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}