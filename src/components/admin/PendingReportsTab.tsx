import { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { UserDetailsDialog } from './UserDetailsDialog';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface Report {
  id: string;
  type: 'lost' | 'found';
  itemName: string;
  category: string;
  description: string;
  date: string;
  location?: string;
  photoUrl?: string;
  status: string;
  createdBy: string;
  creatorName: string;
  creatorEmail: string;
  createdAt: string;
}

interface PendingReportsTabProps {
  admin: {
    accessToken: string;
  };
}

export function PendingReportsTab({ admin }: PendingReportsTabProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string; userType?: 'student' | 'faculty'; userId?: string; phone?: string } | null>(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPendingReports();
  }, []);

  const fetchPendingReports = async () => {
    try {
      console.log('Fetching pending reports with token:', admin.accessToken);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/admin/reports?status=pending`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Admin-Token': admin.accessToken,
          },
        }
      );

      console.log('Pending reports response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Pending reports data:', data);
        setReports(data.reports || []);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error fetching pending reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (reportId: string, action: 'approve' | 'reject') => {
    setActionLoading(reportId);
    setMessage(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/admin/report/${reportId}/${action}`,
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
        throw new Error(error.error || `Failed to ${action} report`);
      }

      setMessage({
        type: 'success',
        text: `Report ${action}d successfully`,
      });
      fetchPendingReports();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'An error occurred',
      });
      console.error(`Admin ${action} error:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    setUserDetailsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/admin/user/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Admin-Token': admin.accessToken,
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

  const filteredReports = reports.filter(report =>
    report.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.creatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.creatorEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-border">
        <h2 className="text-gray-900 dark:text-gray-100 mb-2">Pending Reports</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Review and approve/reject submitted reports</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading pending reports...</div>
      ) : (
        filteredReports.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-border">
            <p className="text-gray-500 dark:text-gray-400">No pending reports to review</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredReports.map(report => (
              <div key={report.id} className="bg-white dark:bg-gray-800 rounded-lg border border-border shadow-sm overflow-hidden">
                {report.photoUrl && (
                  <ImageWithFallback src={report.photoUrl} alt={report.itemName} className="w-full h-48 object-cover" />
                )}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-gray-900 dark:text-gray-100">{report.itemName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{report.category}</p>
                    </div>
                    <Badge variant={report.type === 'lost' ? 'destructive' : 'default'}>
                      {report.type === 'lost' ? 'Lost' : 'Found'}
                    </Badge>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>
                      Reported by:{' '}
                      <button
                        onClick={() => fetchUserDetails(report.createdBy)}
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {report.creatorName}
                      </button>
                      {' '}({report.creatorEmail})
                    </p>
                    <p>Date {report.type === 'lost' ? 'Lost' : 'Found'}: <span className="text-gray-900 dark:text-gray-100">{new Date(report.date).toLocaleDateString()}</span></p>
                    {report.location && <p>Location: <span className="text-gray-900 dark:text-gray-100">{report.location}</span></p>}
                    <p className="mt-2 text-gray-700 dark:text-gray-300">{report.description}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleAction(report.id, 'approve')}
                    disabled={actionLoading === report.id}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleAction(report.id, 'reject')}
                    disabled={actionLoading === report.id}
                    variant="destructive"
                    className="gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {selectedUser && (
        <UserDetailsDialog
          user={selectedUser}
          loading={userDetailsLoading}
          admin={admin}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {userDetailsLoading && !selectedUser && (
        <UserDetailsDialog
          user={null}
          loading={true}
          admin={admin}
          onClose={() => {
            setUserDetailsLoading(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}