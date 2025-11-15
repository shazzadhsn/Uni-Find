import { User, Mail, Phone, MessageCircle, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';

interface UserDetailsDialogProps {
  user: {
    id: string;
    name: string;
    email: string;
    userType?: 'student' | 'faculty';
    userId?: string;
    phone?: string;
  } | null;
  loading?: boolean;
  admin?: {
    accessToken: string;
  };
  onClose: () => void;
}

export function UserDetailsDialog({ user, loading, admin, onClose }: UserDetailsDialogProps) {
  const handleMessage = () => {
    if (user) {
      // Open email client with pre-filled email
      window.location.href = `mailto:${user.email}?subject=UniFind - Message from Admin`;
      toast.success('Opening email client...');
    }
  };

  const handleCall = () => {
    // Open phone dialer if phone is available
    if (user?.phone) {
      window.location.href = `tel:${user.phone}`;
      toast.success('Opening phone dialer...');
    }
  };

  const handleWhatsAppCall = () => {
    if (user?.phone) {
      // Format phone number for WhatsApp (remove spaces, dashes, etc.)
      const cleanPhone = user.phone.replace(/[\s\-()]/g, '');
      // Open WhatsApp with the phone number
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
      toast.success('Opening WhatsApp...');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* User Avatar and Basic Info */}
            <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-border">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-gray-100">{user.name}</h3>
                {user.userType && (
                  <Badge variant={user.userType === 'student' ? 'default' : 'secondary'} className="mt-2">
                    {user.userType === 'student' ? 'Student' : 'Faculty'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                  <p 
                    className="text-gray-900 dark:text-gray-100 break-all cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => copyToClipboard(user.email, 'Email')}
                    title="Click to copy"
                  >
                    {user.email}
                  </p>
                </div>
              </div>

              {user.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                    <p 
                      className="text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      onClick={() => copyToClipboard(user.phone!, 'Phone number')}
                      title="Click to copy"
                    >
                      {user.phone}
                    </p>
                  </div>
                </div>
              )}

              {user.userId && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.userType === 'student' ? 'Student ID' : 'Faculty Code'}
                    </p>
                    <p 
                      className="text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      onClick={() => copyToClipboard(user.userId!, user.userType === 'student' ? 'Student ID' : 'Faculty Code')}
                      title="Click to copy"
                    >
                      {user.userId}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4 border-t border-border">
              {user.phone && (
                <Button
                  onClick={handleCall}
                  className="w-full gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                >
                  <Phone className="w-4 h-4" />
                  Call User
                </Button>
              )}

              {user.phone && (
                <Button
                  onClick={handleWhatsAppCall}
                  className="w-full gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Call
                </Button>
              )}

              <Button
                onClick={handleMessage}
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                <MessageCircle className="w-4 h-4" />
                Send Email
              </Button>

              <Button
                onClick={onClose}
                variant="outline"
                className="w-full gap-2"
              >
                <X className="w-4 h-4" />
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500 dark:text-gray-400">User not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}