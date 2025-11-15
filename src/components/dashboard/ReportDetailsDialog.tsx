import { useState, useEffect } from 'react';
import { Calendar, MapPin, User, Mail, X, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { ChatDialog } from './ChatDialog';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { ChatWithReporterButton } from './ChatWithReporterButton';

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
  deliveryStatus?: 'pending' | 'delivered';
  deliveredAt?: string;
  actionDetails?: ActionDetails; // Add actionDetails to the Report interface
}

interface ActionDetails {
  id: string;
  actionType: 'found' | 'claim';
  actionByUserId: string;
  actionByUserName: string;
  actionByUserEmail: string;
  createdAt: string;
}

interface ReportDetailsDialogProps {
  report: Report;
  user: {
    id: string;
    accessToken: string;
    name: string;
    email?: string; // Make email optional for backwards compatibility
  };
  onClose: () => void;
  onAction?: () => void;
}

export function ReportDetailsDialog({ report, user, onClose, onAction }: ReportDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [hasSubmittedAction, setHasSubmittedAction] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [receivedLoading, setReceivedLoading] = useState(false);
  const [hasFoundAction, setHasFoundAction] = useState(false);
  const [actionDetails, setActionDetails] = useState<ActionDetails | null>(null); // Store who found/claimed
  const [currentReport, setCurrentReport] = useState<Report>(report); // Track current report state

  const isOwnReport = user.id === currentReport.createdBy;

  // Check if user has already submitted an action (for non-owners)
  // OR check if someone submitted a found action (for lost report owners)
  useEffect(() => {
    const checkActionStatus = async () => {
      // If report already has actionDetails from MyReportsTab, use them directly
      if (report.actionDetails) {
        setHasFoundAction(true);
        setActionDetails(report.actionDetails);
        setCheckingStatus(false);
        return;
      }

      if (!isOwnReport) {
        // For non-owners: check if they submitted an action
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/report-action-status/${report.id}`,
            {
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'X-Session-Token': user.accessToken,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            setHasSubmittedAction(data.hasSubmittedAction);
          }
        } catch (error) {
          console.error('Error checking action status:', error);
        }
      } else if (report.type === 'lost') {
        // For lost report owners: check if someone submitted a found action
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/report-action-status/${report.id}`,
            {
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'X-Session-Token': user.accessToken,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            setHasFoundAction(data.hasAnyAction); // Check if ANY action exists
            setActionDetails(data.actionDetails); // Store action details
          }
        } catch (error) {
          console.error('Error checking found action status:', error);
        }
      }
      
      setCheckingStatus(false);
    };

    checkActionStatus();
  }, [report.id, user.accessToken, isOwnReport, report.type, report.actionDetails]);

  const handleAction = async (action: 'found' | 'claim') => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/report-action`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Session-Token': user.accessToken,
          },
          body: JSON.stringify({
            reportId: report.id,
            action,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Action failed');
      }

      setMessage({
        type: 'success',
        text: action === 'found' 
          ? 'Report creator has been notified that you found their item!'
          : 'Claim request sent successfully! Report creator will be notified.',
      });

      if (onAction) {
        setTimeout(() => {
          onAction();
          onClose();
        }, 2000);
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'An error occurred',
      });
      console.error('Report action error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReceived = async () => {
    setReceivedLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/report/${report.id}/mark-received`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Session-Token': user.accessToken,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark as received');
      }

      // Update the current report state to show delivered status
      setCurrentReport(prev => ({
        ...prev,
        deliveryStatus: 'delivered',
        deliveredAt: new Date().toISOString(),
      }));

      setMessage({
        type: 'success',
        text: 'Item marked as received! The finder has been notified. Thank you!',
      });

      // Don't auto-close, keep dialog open to show delivery confirmation
      // Call onAction to refresh parent component if needed
      if (onAction) {
        onAction();
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to mark as received',
      });
      console.error('Mark received error:', error);
    } finally {
      setReceivedLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Report Details</DialogTitle>
            <Badge variant={report.type === 'lost' ? 'destructive' : 'default'}>
              {report.type === 'lost' ? 'Lost Item' : 'Found Item'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {report.photoUrl && (
            <div className="rounded-lg overflow-hidden border border-border">
              <ImageWithFallback
                src={report.photoUrl}
                alt={report.itemName}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {message && (
            <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950' : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'}>
              <AlertDescription className={message.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div>
              <h3 className="text-gray-900 dark:text-gray-100">{report.itemName}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{report.category}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Description</p>
              <p className="text-gray-900 dark:text-gray-100">{report.description}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Date {report.type === 'lost' ? 'Lost' : 'Found'}</p>
                  <p className="text-gray-900 dark:text-gray-100">{new Date(report.date).toLocaleDateString()}</p>
                </div>
              </div>

              {report.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Location</p>
                    <p className="text-gray-900 dark:text-gray-100">{report.location}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Reported By</p>
                  <p className="text-gray-900 dark:text-gray-100">{report.creatorName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Contact</p>
                  <p className="text-gray-900 dark:text-gray-100 text-xs">{report.creatorEmail}</p>
                </div>
              </div>
            </div>
          </div>

          {!isOwnReport && (
            <div className="pt-4 border-t space-y-3">
              {hasSubmittedAction ? (
                <>
                  {/* Show Product Delivered status for finders when item has been delivered */}
                  {report.type === 'lost' && currentReport.deliveryStatus === 'delivered' ? (
                    <>
                      {/* Product Delivered - Show who found and who received */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-green-900 mb-2">✓ Product Delivered</p>
                        <div className="space-y-1 text-sm text-green-800">
                          <p><strong>Found By:</strong> {user.name}</p>
                          <p><strong>Email:</strong> {user.email || 'N/A'}</p>
                          <p><strong>Delivered At:</strong> {currentReport.deliveredAt ? new Date(currentReport.deliveredAt).toLocaleString() : 'Recently'}</p>
                        </div>
                      </div>
                      
                      <Alert className="border-green-200 bg-green-50">
                        <AlertDescription className="text-green-800 text-sm">
                          ✓ You have confirmed product as received
                        </AlertDescription>
                      </Alert>
                      
                      <Button
                        disabled={true}
                        className="w-full gap-2 bg-green-600 opacity-50 cursor-not-allowed"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark as Received
                      </Button>
                    </>
                  ) : (
                    <>
                      <Alert className="border-blue-200 bg-blue-50">
                        <AlertDescription className="text-blue-800">
                          You have already submitted a request for this report. The report creator has been notified.
                        </AlertDescription>
                      </Alert>
                      
                      {/* Show "Mark as Received" button for found reports that have been claimed */}
                      {report.type === 'found' && report.deliveryStatus !== 'delivered' && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            Have you received the item from the finder?
                          </p>
                          <Button
                            onClick={handleMarkReceived}
                            disabled={receivedLoading}
                            className="w-full gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {receivedLoading ? 'Marking as Received...' : 'Mark as Received'}
                          </Button>
                        </div>
                      )}

                      {/* Show delivered status */}
                      {report.type === 'found' && report.deliveryStatus === 'delivered' && (
                        <Alert className="border-green-200 bg-green-50">
                          <AlertDescription className="text-green-800 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Item received! Thank you for confirming.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  {report.type === 'lost' 
                    ? 'Have you found this item? Let the owner know!'
                    : 'Is this your item? Submit a claim request!'}
                </p>
              )}
              <div className="flex gap-3">
                {report.type === 'lost' ? (
                  <Button
                    onClick={() => handleAction('found')}
                    disabled={loading || hasSubmittedAction}
                    className="flex-1 gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {hasSubmittedAction ? 'Submitted' : 'I Found This'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleAction('claim')}
                    disabled={loading || hasSubmittedAction}
                    className="flex-1 gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {hasSubmittedAction ? 'Submitted' : 'I Own This'}
                  </Button>
                )}
                {hasSubmittedAction && (
                  <ChatWithReporterButton reportId={report.id} reportName={report.itemName} user={user} />
                )}
              </div>
            </div>
          )}

          {/* Show delivery status for the report creator (finder) */}
          {isOwnReport && report.type === 'found' && report.deliveryStatus === 'delivered' && (
            <div className="pt-4 border-t">
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Item has been delivered and confirmed as received!
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Show found action status for lost report owners */}
          {isOwnReport && report.type === 'lost' && hasFoundAction && (
            <div className="pt-4 border-t space-y-3">
              {currentReport.deliveryStatus !== 'delivered' ? (
                <>
                  <Alert className="border-green-200 bg-green-50">
                    <AlertDescription className="text-green-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Someone has found your lost item!
                    </AlertDescription>
                  </Alert>
                  
                  {/* Show who found the item */}
                  {actionDetails && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-blue-900 mb-2">Found By:</p>
                      <div className="space-y-1 text-sm text-blue-800">
                        <p><strong>Name:</strong> {actionDetails.actionByUserName}</p>
                        <p><strong>Email:</strong> {actionDetails.actionByUserEmail}</p>
                        <p><strong>Submitted:</strong> {new Date(actionDetails.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Have you received the item from the finder?
                    </p>
                    <Button
                      onClick={handleMarkReceived}
                      disabled={receivedLoading}
                      className="w-full gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {receivedLoading ? 'Marking as Received...' : 'Mark as Received'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Show who found the item - delivered */}
                  {actionDetails && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-green-900 mb-2">✓ Product Delivered</p>
                      <div className="space-y-1 text-sm text-green-800">
                        <p><strong>Found By:</strong> {actionDetails.actionByUserName}</p>
                        <p><strong>Email:</strong> {actionDetails.actionByUserEmail}</p>
                        <p><strong>Delivered At:</strong> {currentReport.deliveredAt ? new Date(currentReport.deliveredAt).toLocaleString() : 'Recently'}</p>
                      </div>
                    </div>
                  )}
                  
                  <Alert className="border-green-200 bg-green-50">
                    <AlertDescription className="text-green-800 text-sm">
                      ✓ You have confirmed product as received
                    </AlertDescription>
                  </Alert>
                  
                  <Button
                    disabled={true}
                    className="w-full gap-2 bg-green-600 opacity-50 cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Received
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}