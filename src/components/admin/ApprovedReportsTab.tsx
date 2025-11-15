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

interface ApprovedReportsTabProps {
  admin: {
    accessToken: string;
  };
}

export function ApprovedReportsTab({ admin }: ApprovedReportsTabProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string; userType?: 'student' | 'faculty'; userId?: string; phone?: string } | null>(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);

  useEffect(() => {
    fetchApprovedReports();
  }, []);

  const fetchApprovedReports = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/admin/reports?status=approved`,
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
      console.error('Error fetching approved reports:', error);
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
        <h2 className="text-gray-900 dark:text-gray-100 mb-2">Approved Reports</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">All approved and published reports</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading approved reports...</div>
      ) : (
        reports.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-border">
            <p className="text-gray-500 dark:text-gray-400">No approved reports yet</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {reports.map(report => (
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