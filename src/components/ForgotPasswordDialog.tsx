import { useState } from 'react';
import { X, Mail, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface ForgotPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  userType: 'student' | 'faculty';
}

export function ForgotPasswordDialog({ open, onClose, userType }: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState('');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Display only - no actual functionality
  };

  const handleClose = () => {
    setEmail('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-gray-900 dark:text-gray-100 mb-2">Forgot Password?</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter your BUBT email address and we'll send you a reset token.
          </p>
        </div>

        {/* Display-only notice */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="mb-1"><strong>Demo Mode</strong></p>
              <p>This is a display-only feature. Password reset functionality is not currently active.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@bubt.edu.bd"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled
              className="opacity-60"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Use your registered BUBT email address
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-60 cursor-not-allowed"
            >
              Send Reset Token
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            For password recovery assistance, please contact the administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
