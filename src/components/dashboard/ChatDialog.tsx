import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Send, Loader2, User, Package } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  message: string;
  reportId?: string | null;
  reportName?: string | null;
  createdAt: string;
}

interface Chat {
  id: string;
  user1Id: string;
  user2Id: string;
  user1Name: string;
  user2Name: string;
  createdAt: string;
  lastMessageAt: string;
}

interface ChatDialogProps {
  chatId: string;
  reportId?: string;
  reportName?: string;
  user: {
    id: string;
    accessToken: string;
    name: string;
  };
  onClose: () => void;
}

export function ChatDialog({ chatId, reportId, reportName, user, onClose }: ChatDialogProps) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch chat and messages on mount
  useEffect(() => {
    fetchMessages();
  }, []);

  // Poll for new messages every 2 seconds for better real-time experience
  useEffect(() => {
    if (!chat) return;
    
    const interval = setInterval(() => {
      fetchMessages();
    }, 2000);

    return () => clearInterval(interval);
  }, [chat, chatId]);

  const fetchMessages = async () => {
    try {
      if (!loading) {
        // Only show loading state on initial load
      } else {
        setLoading(true);
      }
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/chat/${encodeURIComponent(chatId)}/messages`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Session-Token': user.accessToken,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        if (data.chat) {
          setChat(data.chat);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !chat || sending) return;

    setSending(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/chat/${encodeURIComponent(chat.id)}/message`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Session-Token': user.accessToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            message: newMessage,
            reportId: reportId || null,
            reportName: reportName || null,
          }),
        }
      );

      if (response.ok) {
        setNewMessage('');
        fetchMessages(); // Refresh messages
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const otherUserName = chat 
    ? (user.id === chat.user1Id ? chat.user2Name : chat.user1Name)
    : 'User';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-gray-900 dark:text-gray-100">{otherUserName}</div>
              <div className="text-sm font-normal text-gray-500 dark:text-gray-400">
                Conversation
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        ) : (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwnMessage = message.senderId === user.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
                        >
                          {message.reportName && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1 px-2">
                              <Package className="w-3 h-3" />
                              <span>Re: {message.reportName}</span>
                            </div>
                          )}
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              isOwnMessage
                                ? 'bg-blue-600 dark:bg-blue-700 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                            }`}
                          >
                            {!isOwnMessage && (
                              <div className={`text-xs mb-1 ${
                                isOwnMessage ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {message.senderName}
                              </div>
                            )}
                            <p className="break-words">{message.message}</p>
                            <div
                              className={`text-xs mt-1 ${
                                isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {new Date(message.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-border flex-shrink-0">
              {reportName && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2 px-2">
                  <Package className="w-4 h-4" />
                  <span>Context: {reportName}</span>
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={sending}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
