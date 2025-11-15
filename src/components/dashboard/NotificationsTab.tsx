import { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, AlertCircle, Clock, MessageCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ContactDetailsDialog } from './ContactDetailsDialog';
import { ChatDialog } from './ChatDialog';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface Notification {
  id: string;
  userId: string;
  type: 'approval' | 'rejection' | 'found' | 'claim' | 'completed';
  message: string;
  reportId: string;
  actionUserId?: string; // ID of the user who performed the found/claim action
  actionId?: string; // ID of the action (for opening chat)
  read: boolean;
  createdAt: string;
}

interface NotificationsTabProps {
  user: {
    id: string;
    accessToken: string;
    name: string;
  };
  setUnreadCount: (count: number) => void;
}

export function NotificationsTab({ user, setUnreadCount }: NotificationsTabProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string; userType?: 'student' | 'faculty'; userId?: string; phone?: string } | null>(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedReportInfo, setSelectedReportInfo] = useState<{ reportId: string; reportName?: string } | null>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/notifications`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Session-Token': user.accessToken,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        const unread = (data.notifications || []).filter((n: Notification) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/notifications/${notificationId}/read`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Session-Token': user.accessToken,
          },
        }
      );
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejection':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'found':
      case 'claim':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'approval':
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'rejection':
        return 'bg-red-50 border-red-200';
      case 'found':
      case 'claim':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const fetchUserDetails = async (userId: string) => {
    setUserDetailsLoading(true);
    setSelectedUser(null);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/user/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Session-Token': user.accessToken,
          },
        }
      );

      if (response.ok) {
        const userData = await response.json();
        setSelectedUser(userData);
      } else {
        console.error('Failed to fetch user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setUserDetailsLoading(false);
    }
  };

  const createTestNotification = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/test-notification`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Session-Token': user.accessToken,
          },
        }
      );

      if (response.ok) {
        alert('Test notification created! Refresh to see it with the "View Contact Details" button.');
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error creating test notification:', error);
    }
  };

  const handleOpenChat = async (reportId: string, actionId: string, reportName?: string) => {
    setChatLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/chat/create`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Session-Token': user.accessToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reportId, actionId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to open chat');
        return;
      }

      setChatId(data.chat.id);
      setSelectedReportInfo({ reportId, reportName });
      setChatOpen(true);
    } catch (error) {
      console.error('Error opening chat:', error);
      toast.error('Failed to open chat. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-border">
        <h2 className="text-gray-900 dark:text-gray-100 mb-2">Notifications</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Stay updated on your reports and actions
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-border">
          <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            You'll be notified when someone interacts with your reports
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`rounded-lg p-4 border transition-all ${
                getNotificationBgColor(notification.type)
              } ${!notification.read ? 'shadow-sm' : 'opacity-75'}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notification.read ? 'font-medium' : ''} text-gray-900`}>
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(notification.createdAt).toLocaleString()}</span>
                  </div>
                  {/* Show action buttons for found/claim notifications */}
                  {(notification.type === 'found' || notification.type === 'claim') && notification.actionUserId && notification.actionId && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => fetchUserDetails(notification.actionUserId!)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        View Contact Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenChat(notification.reportId, notification.actionId!)}
                        disabled={chatLoading}
                        className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        {chatLoading ? 'Loading...' : 'Chat'}
                      </Button>
                    </div>
                  )}
                  {/* Debug info - will remove this later */}
                  {(notification.type === 'found' || notification.type === 'claim') && !notification.actionUserId && (
                    <div className="mt-2 text-xs text-gray-400 italic">
                      (This is an old notification created before the contact feature was added. New found/claim notifications will show a "View Contact Details" button.)
                    </div>
                  )}
                </div>
                {!notification.read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markAsRead(notification.id)}
                    className="flex-shrink-0"
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedUser && (
        <ContactDetailsDialog
          user={selectedUser}
          loading={userDetailsLoading}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {userDetailsLoading && !selectedUser && (
        <ContactDetailsDialog
          user={null}
          loading={true}
          onClose={() => {
            setUserDetailsLoading(false);
            setSelectedUser(null);
          }}
        />
      )}

      {chatOpen && chatId && (
        <ChatDialog
          chatId={chatId}
          reportId={selectedReportInfo?.reportId}
          reportName={selectedReportInfo?.reportName}
          user={user}
          onClose={() => {
            setChatOpen(false);
            setChatId(null);
            setSelectedReportInfo(null);
          }}
        />
      )}
    </div>
  );
}