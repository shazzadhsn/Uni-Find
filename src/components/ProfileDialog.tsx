import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { User, Mail, Phone, IdCard, Calendar, UserCircle } from 'lucide-react';
import { Badge } from './ui/badge';

interface ProfileDialogProps {
  user: {
    id: string;
    name: string;
    email: string;
    userType: 'student' | 'faculty';
    userId: string;
    phone: string;
  };
  onClose: () => void;
}

export function ProfileDialog({ user, onClose }: ProfileDialogProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center pb-4 border-b border-border">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-3">
              <UserCircle className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-gray-900 dark:text-gray-100 mb-1">{user.name}</h3>
            <Badge variant={user.userType === 'student' ? 'default' : 'secondary'}>
              {user.userType === 'student' ? 'Student' : 'Faculty'}
            </Badge>
          </div>

          {/* Profile Details */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                <p className="text-gray-900 dark:text-gray-100 break-words">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400">Phone Number</p>
                <p className="text-gray-900 dark:text-gray-100">{user.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <IdCard className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user.userType === 'student' ? 'Student ID' : 'Faculty Code'}
                </p>
                <p className="text-gray-900 dark:text-gray-100">{user.userId}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400">User ID</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">{user.id}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
