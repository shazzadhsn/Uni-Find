import { useState, useEffect } from 'react';
import { MessageCircle, User } from 'lucide-react';
import { ChatDialog } from './ChatDialog';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface Chat {
  id: string;
  user1Id: string;
  user2Id: string;
  user1Name: string;
  user2Name: string;
  otherUserName: string;
  otherUserId: string;
  messageCount: number;
  lastMessage?: string;
  lastReportName?: string;
  lastMessageAt: string;
  createdAt: string;
}

interface ChatsTabProps {
  user: {
    id: string;
    accessToken: string;
    name: string;
  };
}

export function ChatsTab({ user }: ChatsTabProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  useEffect(() => {
    fetchChats();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchChats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchChats = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/chats`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Session-Token': user.accessToken,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-border">
        <h2 className="text-gray-900 dark:text-gray-100 mb-2">My Chats</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          All your conversations with other users
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading chats...</div>
      ) : chats.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-border">
          <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No chats yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Chats will appear here when you interact with reports
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-border divide-y divide-border">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              onClick={() => {
                setSelectedChatId(chat.id);
              }}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-gray-900 dark:text-gray-100 truncate">
                      {chat.otherUserName}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                      {formatTime(chat.lastMessageAt)}
                    </span>
                  </div>
                  {chat.lastReportName && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      About: <span className="font-medium">{chat.lastReportName}</span>
                    </p>
                  )}
                  {chat.lastMessage && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {chat.lastMessage}
                    </p>
                  )}
                  {chat.messageCount > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <MessageCircle className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        {chat.messageCount} {chat.messageCount === 1 ? 'message' : 'messages'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedChatId && (
        <ChatDialog
          chatId={selectedChatId}
          user={user}
          onClose={() => {
            setSelectedChatId(null);
            fetchChats(); // Refresh chats list after closing
          }}
        />
      )}
    </div>
  );
}
