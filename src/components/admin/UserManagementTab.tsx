import { useState, useEffect } from 'react';
import { Ban, CheckCircle, Phone, User, Search, Filter } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { UserDetailsDialog } from './UserDetailsDialog';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface UserData {
  id: string;
  name: string;
  email: string;
  userType: 'student' | 'faculty';
  userId: string;
  phone: string;
  banned: boolean;
  createdAt: string;
}

interface UserManagementTabProps {
  admin: {
    accessToken: string;
  };
}

export function UserManagementTab({ admin }: UserManagementTabProps) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'student' | 'faculty'>('all');
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string; userType?: 'student' | 'faculty'; userId?: string; phone?: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users with token:', admin.accessToken);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/admin/users`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Admin-Token': admin.accessToken,
          },
        }
      );

      console.log('Users response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Users data:', data);
        setUsers(data.users || []);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanToggle = async (userId: string, currentBanStatus: boolean) => {
    setActionLoading(userId);
    setMessage(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/admin/user/${userId}/${currentBanStatus ? 'unban' : 'ban'}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Admin-Token': admin.accessToken,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user status');
      }

      setMessage({
        type: 'success',
        text: `User ${currentBanStatus ? 'unbanned' : 'banned'} successfully`,
      });
      fetchUsers();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'An error occurred',
      });
      console.error('Ban toggle error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userId.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(user => {
    if (filterType === 'all') return true;
    return user.userType === filterType;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div>
          <h2 className="text-gray-900 mb-2">User Management</h2>
          <p className="text-sm text-gray-600">View and manage all registered users</p>
        </div>
      </div>

      {message && (
        <Alert className={`${
          message.type === 'success' 
            ? 'border-green-200 bg-green-50' 
            : 'border-red-200 bg-red-50'
        }`}>
          <AlertDescription className={
            message.type === 'success' ? 'text-green-800' : 'text-red-800'
          }>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center border">
          <p className="text-gray-500">No users registered</p>
        </div>
      ) : (
        <>
          {/* Search and Filter Bar */}
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search users by email, name, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="w-full md:w-48">
                <Select onValueChange={setFilterType} value={filterType}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      <SelectValue placeholder="Filter by type">
                        {filterType === 'all' && 'All Users'}
                        {filterType === 'student' && 'Students'}
                        {filterType === 'faculty' && 'Faculty'}
                      </SelectValue>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(searchTerm || filterType !== 'all') && (
              <p className="text-sm text-gray-600 mt-3">
                Showing {filteredUsers.length} of {users.length} user{filteredUsers.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Users Table */}
          {filteredUsers.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center border">
              <p className="text-gray-500">No users found matching your search</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                        ID/Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className={user.banned ? 'bg-red-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <button
                                onClick={() => setSelectedUser({
                                  id: user.id,
                                  name: user.name,
                                  email: user.email,
                                  userType: user.userType,
                                  userId: user.userId,
                                  phone: user.phone,
                                })}
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                              >
                                {user.name}
                              </button>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={user.userType === 'student' ? 'default' : 'secondary'}>
                            {user.userType === 'student' ? 'Student' : 'Faculty'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.userId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="w-3 h-3" />
                              <span>{user.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.banned ? (
                            <Badge variant="destructive">Banned</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Active
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button
                            onClick={() => handleBanToggle(user.id, user.banned)}
                            disabled={actionLoading === user.id}
                            variant={user.banned ? 'outline' : 'destructive'}
                            size="sm"
                            className="gap-2"
                          >
                            {user.banned ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Unban
                              </>
                            ) : (
                              <>
                                <Ban className="w-3 h-3" />
                                Ban
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {selectedUser && (
        <UserDetailsDialog
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}