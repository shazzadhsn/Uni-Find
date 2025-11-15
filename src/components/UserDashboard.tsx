import { useState } from 'react';
import { Home, FileText, Bell, PlusCircle, LogOut, Search, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Header } from './Header';
import { AllReportsTab } from './dashboard/AllReportsTab';
import { MyReportsTab } from './dashboard/MyReportsTab';
import { NotificationsTab } from './dashboard/NotificationsTab';
import { CreateReportTab } from './dashboard/CreateReportTab';
import { ChatsTab } from './dashboard/ChatsTab';
import { ProfileDialog } from './ProfileDialog';

interface UserDashboardProps {
  user: {
    id: string;
    name: string;
    email: string;
    userType: 'student' | 'faculty';
    userId: string;
    phone: string;
    accessToken: string;
  };
  onLogout: () => void;
}

export function UserDashboard({ user, onLogout }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState('home');
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header user={user} onLogout={onLogout} onProfileClick={() => setProfileOpen(true)} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="home" className="gap-2">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </TabsTrigger>
            <TabsTrigger value="my-reports" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">My Reports</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 relative">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="chats" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Chats</span>
            </TabsTrigger>
            <TabsTrigger value="create" className="gap-2">
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Create Report</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home">
            <AllReportsTab user={user} />
          </TabsContent>

          <TabsContent value="my-reports">
            <MyReportsTab user={user} />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsTab user={user} setUnreadCount={setUnreadCount} />
          </TabsContent>

          <TabsContent value="create">
            <CreateReportTab user={user} />
          </TabsContent>

          <TabsContent value="chats">
            <ChatsTab user={user} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Profile Dialog */}
      {profileOpen && (
        <ProfileDialog user={user} onClose={() => setProfileOpen(false)} />
      )}
    </div>
  );
}