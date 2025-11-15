import { useState } from 'react';
import { ShieldCheck, ClipboardList, CheckSquare, Users, XSquare, Search, AlertCircle, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Header } from './Header';
import { PendingReportsTab } from './admin/PendingReportsTab';
import { ApprovedReportsTab } from './admin/ApprovedReportsTab';
import { UserManagementTab } from './admin/UserManagementTab';
import { CompletedReportsTab } from './admin/CompletedReportsTab';
import { RejectedReportsTab } from './admin/RejectedReportsTab';
import { FoundClaimedReportsTab } from './admin/FoundClaimedReportsTab';

interface AdminDashboardProps {
  admin: {
    id: string;
    email: string;
    accessToken: string;
  };
  onLogout: () => void;
}

export function AdminDashboard({ admin, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('pending');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header admin={admin} onLogout={onLogout} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm border border-border overflow-x-auto">
            <TabsList className="inline-flex w-full lg:w-auto">
              <TabsTrigger value="pending" className="gap-2 whitespace-nowrap">
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">Pending</span>
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-2 whitespace-nowrap">
                <CheckSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Approved</span>
              </TabsTrigger>
              <TabsTrigger value="found-claimed" className="gap-2 whitespace-nowrap">
                <AlertCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Found/Claimed</span>
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2 whitespace-nowrap">
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Completed</span>
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-2 whitespace-nowrap">
                <XSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Rejected</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2 whitespace-nowrap">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pending">
            <PendingReportsTab admin={admin} />
          </TabsContent>

          <TabsContent value="approved">
            <ApprovedReportsTab admin={admin} />
          </TabsContent>

          <TabsContent value="found-claimed">
            <FoundClaimedReportsTab admin={admin} />
          </TabsContent>

          <TabsContent value="completed">
            <CompletedReportsTab admin={admin} />
          </TabsContent>

          <TabsContent value="rejected">
            <RejectedReportsTab admin={admin} />
          </TabsContent>

          <TabsContent value="users">
            <UserManagementTab admin={admin} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}