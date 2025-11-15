import { User, Mail, Phone, MessageCircle, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface ContactDetailsDialogProps {
  user: {
    id: string;
    name: string;
    email: string;
    userType?: 'student' | 'faculty';
    userId?: string;
    phone?: string;
  } | null;
  loading?: boolean;
  onClose: () => void;
}

export function ContactDetailsDialog({ user, loading, onClose }: ContactDetailsDialogProps) {
  const handleMessage = () => {
    if (user) {
      // Open email client with pre-filled email
      window.location.href = `mailto:${user.email}?subject=UniFind - Contact from User`;
    }
  };

  const handleCall = () => {
    // Open phone dialer if phone is available
    if (user?.phone) {
      window.location.href = `tel:${user.phone}`;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Contact Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* User Avatar and Name */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-gray-900">{user.name}</h3>
                {user.userType && (
                  <Badge variant={user.userType === 'student' ? 'default' : 'secondary'} className="mt-1">
                    {user.userType === 'student' ? 'Student' : 'Faculty'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              {/* Email */}
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{user.email}</p>
                </div>
              </div>

              {/* Phone */}
              {user.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="text-sm text-gray-900">{user.phone}</p>
                  </div>
                </div>
              )}

              {/* Student ID or Faculty Code */}
              {user.userId && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">
                      {user.userType === 'student' ? 'Student ID' : 'Faculty Code'}
                    </p>
                    <p className="text-sm text-gray-900">{user.userId}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleMessage}
                className="flex-1 gap-2"
                variant="outline"
              >
                <MessageCircle className="w-4 h-4" />
                Send Message
              </Button>
              {user.phone && (
                <Button
                  onClick={handleCall}
                  className="flex-1 gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Call User
                </Button>
              )}
            </div>

            {/* Close Button */}
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full"
            >
              Close
            </Button>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            User details not available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
