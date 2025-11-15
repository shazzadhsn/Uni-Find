import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { ChatDialog } from './ChatDialog';
import { Alert, AlertDescription } from '../ui/alert';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface ChatWithReporterButtonProps {
  reportId: string;
  reportName: string;
  user: {
    id: string;
    accessToken: string;
    name: string;
  };
}

export function ChatWithReporterButton({ reportId, reportName, user }: ChatWithReporterButtonProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChat = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/chat/create-by-report`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Session-Token': user.accessToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reportId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || 'Failed to open chat');
        return;
      }

      setChatId(data.chat.id);
      setChatOpen(true);
    } catch (err) {
      console.error('Error opening chat:', err);
      setError('Failed to open chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleOpenChat}
        disabled={loading}
        className="gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
      >
        <MessageCircle className="w-4 h-4" />
        Chat with Reporter
      </Button>

      {error && (
        <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 mt-2">
          <AlertDescription className="text-red-800 dark:text-red-300 text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {chatOpen && chatId && (
        <ChatDialog
          chatId={chatId}
          reportId={reportId}
          reportName={reportName}
          user={user}
          onClose={() => setChatOpen(false)}
        />
      )}
    </>
  );
}
