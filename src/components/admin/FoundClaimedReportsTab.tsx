import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { UserDetailsDialog } from './UserDetailsDialog';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface Action {
  id: string;
  reportId: string;
  actionType: 'found' | 'claim';
  actionByUserId: string;
  actionByUserName: string;
  actionByUserEmail: string;
  status: 'pending' | 'completed';
  createdAt: string;
  report: {
    id: string;
    type: 'lost' | 'found';
    itemName: string;
    category: string;
    description: string;
    date: string;
    location?: string;
    photoUrl?: string;
    createdBy: string;
    creatorName: string;
    creatorEmail: string;
    deliveryStatus?: 'pending' | 'delivered';
  };
}

interface FoundClaimedReportsTabProps {
  admin: {
    accessToken: string;
  };
}

export function FoundClaimedReportsTab({ admin }: FoundClaimedReportsTabProps) {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string; userType?: 'student' | 'faculty'; userId?: string; phone?: string } | null>(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

  // Auto-refresh every 8 seconds
  useEffect(() => {
    fetchFoundClaimedReports();
    
    const interval = setInterval(() => {
      fetchFoundClaimedReports(true); // Silent refresh (no loading state)
    }, 5000); // 5 seconds for faster updates
    
    return () => clearInterval(interval);
  }, []);

  const fetchFoundClaimedReports = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/admin/found-claimed`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Admin-Token': admin.accessToken,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setActions(data.actions || []);
        setLastRefreshTime(new Date());
      }
    } catch (error) {
      console.error('Error fetching found/claimed reports:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchFoundClaimedReports();
    setIsRefreshing(false);
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

  const handleComplete = async (actionId: string, reportId: string) => {
    setActionLoading(actionId);
    setMessage(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/admin/complete-action`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Admin-Token': admin.accessToken,
          },
          body: JSON.stringify({ actionId, reportId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete action');
      }

      setMessage({
        type: 'success',
        text: 'Action marked as completed successfully. Report moved to Completed section.',
      });
      
      // Wait a moment before refreshing to show the success message
      setTimeout(() => {
        fetchFoundClaimedReports();
        setMessage(null);
      }, 1500);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'An error occurred',
      });
      console.error('Complete action error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-border">
        <h2 className="text-gray-900 dark:text-gray-100 mb-2">Found/Claimed Items</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Reports with submitted found/claim requests
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading reports...</div>
      ) : (
        actions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-border">
            <p className="text-gray-500 dark:text-gray-400">No found/claim requests yet</p>
          </div>
        ) : (
          <>
            {/* Delivered Items Section */}
            {actions.some(a => a.report.deliveryStatus === 'delivered') && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-900">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h3 className="text-green-900 dark:text-green-100">Ready to Complete</h3>
                    <Badge className="bg-green-600 dark:bg-green-700">
                      {actions.filter(a => a.report.deliveryStatus === 'delivered').length}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Items successfully delivered and confirmed by recipients</p>
                </div>
                
                {actions
                  .filter(action => action.report.deliveryStatus === 'delivered')
                  .map(action => (
                    <ActionCard
                      key={action.id}
                      action={action}
                      isDelivered={true}
                      onComplete={handleComplete}
                      onViewUser={fetchUserDetails}
                      actionLoading={actionLoading}
                    />
                  ))}
              </div>
            )}

            {/* Pending Delivery Section */}
            {actions.some(a => a.report.deliveryStatus !== 'delivered') && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-900">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <h3 className="text-yellow-900 dark:text-yellow-100">Pending Delivery</h3>
                    <Badge className="bg-yellow-600 dark:bg-yellow-700">
                      {actions.filter(a => a.report.deliveryStatus !== 'delivered').length}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Awaiting delivery confirmation or physical return</p>
                </div>
                
                {actions
                  .filter(action => action.report.deliveryStatus !== 'delivered')
                  .map(action => (
                    <ActionCard
                      key={action.id}
                      action={action}
                      isDelivered={false}
                      onComplete={handleComplete}
                      onViewUser={fetchUserDetails}
                      actionLoading={actionLoading}
                    />
                  ))}
              </div>
            )}
          </>
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

interface ActionCardProps {
  action: Action;
  isDelivered: boolean;
  onComplete: (actionId: string, reportId: string) => void;
  onViewUser: (userId: string) => void;
  actionLoading: string | null;
}

function ActionCard({ action, isDelivered, onComplete, onViewUser, actionLoading }: ActionCardProps) {
  return (
    <div 
      key={action.id} 
      className={`bg-white dark:bg-gray-800 rounded-lg border border-border shadow-sm overflow-hidden ${
        isDelivered ? 'border-green-300 dark:border-green-700 ring-2 ring-green-100 dark:ring-green-900' : ''
      }`}
    >
      {/* Delivery Status Header - Prominent Green Background for Delivered */}
      {/* Show for both FOUND reports (claim actions) and LOST reports (found actions) */}
      <div className={`px-6 py-3 border-b ${
        isDelivered 
          ? 'bg-green-100 dark:bg-green-950 border-green-200 dark:border-green-900' 
          : 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-900'
      }`}>
        <div className="flex items-center gap-2">
          {isDelivered ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-700 dark:text-green-400" />
              <span className="text-green-900 dark:text-green-100">
                <strong>Status: Delivered</strong> - Item has been successfully received by the owner
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-yellow-700 dark:text-yellow-400" />
              <span className="text-yellow-900 dark:text-yellow-100">
                <strong>Status: Pending Delivery</strong> - Awaiting confirmation from owner
              </span>
            </>
          )}
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <h3 className="text-gray-900 dark:text-gray-100">{action.report.itemName}</h3>
              <Badge variant={action.report.type === 'lost' ? 'destructive' : 'default'}>
                {action.report.type === 'lost' ? 'Lost' : 'Found'}
              </Badge>
              <Badge variant={action.actionType === 'found' ? 'default' : 'secondary'}>
                {action.actionType === 'found' ? 'Found Request' : 'Claim Request'}
              </Badge>
              
              {/* Delivery Status Badge */}
              <Badge 
                variant="outline"
                className={isDelivered 
                  ? 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700' 
                  : 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700'
                }
              >
                {isDelivered ? '✓ Delivered' : 'Pending Delivery'}
              </Badge>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
              <p className="text-gray-900 dark:text-gray-100">Original Report:</p>
              <p>
                Reported by:{' '}
                <button
                  onClick={() => onViewUser(action.report.createdBy)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer"
                >
                  {action.report.creatorName}
                </button>
                {' '}({action.report.creatorEmail})
              </p>
              <p className="text-gray-700 dark:text-gray-300">{action.report.description}</p>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 pt-3 border-t border-border">
              <p className="text-gray-900 dark:text-gray-100">Action Submitted by:</p>
              <p>
                <button
                  onClick={() => onViewUser(action.actionByUserId)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer"
                >
                  {action.actionByUserName}
                </button>
                {' '}({action.actionByUserEmail})
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(action.createdAt).toLocaleString()}</p>
            </div>
          </div>
          {action.report.photoUrl && (
            <div className="ml-4 flex-shrink-0">
              <ImageWithFallback
                src={action.report.photoUrl}
                alt={action.report.itemName}
                className="w-32 h-32 object-cover rounded-lg border border-border"
              />
            </div>
          )}
        </div>

        {action.status === 'pending' && (
          <div className="pt-4 border-t border-border">
            {/* Show delivery confirmation for delivered items (both found and lost reports) */}
            {action.report.deliveryStatus === 'delivered' ? (
              <div className="space-y-3">
                <Alert className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950">
                  <AlertDescription className="text-green-800 dark:text-green-200 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {action.report.type === 'found' 
                      ? 'Item has been received by the claimer! Ready to mark as complete.'
                      : 'Lost item owner has confirmed receiving the item! Ready to mark as complete.'}
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={() => onComplete(action.id, action.reportId)}
                  disabled={actionLoading === action.id}
                  className="gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Completed
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {action.report.type === 'found' 
                    ? 'Waiting for claimer to confirm item receipt. You can mark as completed after the item has been physically returned.'
                    : 'Waiting for lost item owner to confirm receipt. You can mark as completed after the item has been physically returned.'}
                </p>
                <Button
                  onClick={() => onComplete(action.id, action.reportId)}
                  disabled={actionLoading === action.id}
                  className="gap-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Completed
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}