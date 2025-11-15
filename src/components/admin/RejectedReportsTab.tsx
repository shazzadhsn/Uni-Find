import { useState, useEffect } from 'react';
import { Badge } from '../ui/badge';
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

interface RejectedReportsTabProps {
  admin: {
    accessToken: string;
  };
}

export function RejectedReportsTab({ admin }: RejectedReportsTabProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string; userType?: 'student' | 'faculty'; userId?: string; phone?: string } | null>(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);

  useEffect(() => {
    fetchRejectedReports();
  }, []);

  const fetchRejectedReports = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/admin/reports?status=rejected`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Admin-Token': admin.accessToken,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching rejected reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    setUserDetailsLoading(true);
    setSelectedUser(null);
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

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-border">
        <h2 className="text-gray-900 dark:text-gray-100 mb-2">Rejected Reports</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Reports that were rejected by admin</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading rejected reports...</div>
      ) : (
        reports.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-border">
            <p className="text-gray-500 dark:text-gray-400">No rejected reports</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map(report => (
              <div key={report.id} className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-gray-900">{report.itemName}</h3>
                        <Badge variant={report.type === 'lost' ? 'destructive' : 'default'}>
                          {report.type === 'lost' ? 'Lost' : 'Found'}
                        </Badge>
                        <Badge variant="outline">{report.category}</Badge>
                        <Badge variant="destructive">
                          Rejected
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
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
                        <p>Date {report.type === 'lost' ? 'Lost' : 'Found'}: <span className="text-gray-900">{new Date(report.date).toLocaleDateString()}</span></p>
                        {report.location && <p>Location: <span className="text-gray-900">{report.location}</span></p>}
                        <p className="mt-2 text-gray-700">{report.description}</p>
                      </div>
                    </div>
                    {report.photoUrl && (
                      <div className="ml-4 flex-shrink-0">
                        <ImageWithFallback
                          src={report.photoUrl}
                          alt={report.itemName}
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
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