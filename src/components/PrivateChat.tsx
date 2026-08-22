import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  ShieldCheck,
  Send,
  Paperclip,
  Smile,
  CheckCheck,
  Eye,
  EyeOff,
  AlertCircle,
  FileCode,
  MapPin,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { UserProfile, PrivateMessage } from '../types';
import {
  loadPrivateKeyFromIndexedDB,
  getSharedSecretKey,
  encryptMessage,
  decryptMessage,
} from '../lib/crypto';
import { supabaseService } from '../lib/supabase';
import { soundEngine } from '../lib/sound';
import { UserAvatar } from './UserAvatar';
import { KeyVerificationModal } from './KeyVerificationModal';

interface PrivateChatProps {
  currentUser: UserProfile;
  recipient: UserProfile;
  isDarkMode: boolean;
  onBackMobile?: () => void;
}

export const PrivateChat: React.FC<PrivateChatProps> = ({
  currentUser,
  recipient,
  isDarkMode,
  onBackMobile,
}) => {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sharedKey, setSharedKey] = useState<CryptoKey | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [showRawCiphertext, setShowRawCiphertext] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const remoteTypingTimeoutRef = useRef<any>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Establish Shared Session on mount or recipient change
  useEffect(() => {
    let isMounted = true;

    async function initCryptoSession() {
      setLoading(true);
      setKeyError(null);

      try {
        let recipientProfile = recipient;
        if (!recipientProfile.public_key || recipientProfile.public_key.trim().length === 0) {
          const repairedRecipient = await supabaseService.ensureProfileKeyForUser(recipientProfile.id);
          if (repairedRecipient) {
            recipientProfile = repairedRecipient;
          }
        }

        if (!recipientProfile.public_key || recipientProfile.public_key.trim().length === 0) {
          throw new Error(`Recipient @${recipientProfile.username} is not ready for private messaging.`);
        }

        const localPrivateKey = await loadPrivateKeyFromIndexedDB(currentUser.id);
        if (!localPrivateKey) {
          throw new Error('Local security key not found on this device. Please sign in again.');
        }

        const derivedSharedKey = await getSharedSecretKey(
          currentUser.id,
          localPrivateKey,
          recipientProfile.public_key
        );

        if (isMounted) {
          setSharedKey(derivedSharedKey);
        }

        // Fetch existing private messages and decrypt them locally
        const rawMsgs = await supabaseService.getPrivateMessages(currentUser.id, recipient.id);

        const decryptedList = await Promise.all(
          rawMsgs.map(async (msg) => {
            if (msg.decryptedContent) return msg;
            try {
              const plain = await decryptMessage(msg.ciphertext, msg.iv, derivedSharedKey);
              return { ...msg, decryptedContent: plain };
            } catch (err) {
              return { ...msg, decryptedContent: '[🔒 Unable to decrypt: Private key mismatch]', decryptionError: true };
            }
          })
        );

        if (isMounted) {
          setMessages(decryptedList);
          setLoading(false);
        }

        await Promise.all(
          rawMsgs
            .filter((msg) => msg.recipient_id === currentUser.id && !msg.is_read)
            .map((msg) => supabaseService.markMessageRead(msg.id, currentUser.id))
        );
      } catch (err: any) {
        console.error('Crypto session error:', err);
        if (isMounted) {
          setKeyError(err.message || 'Failed to initialize private messaging session.');
          setLoading(false);
        }
      }
    }

    initCryptoSession();

    return () => {
      isMounted = false;
    };
  }, [currentUser.id, recipient.id, recipient.public_key]);

  // 2. Real-time Subscription to incoming encrypted private messages
  useEffect(() => {
    if (!sharedKey) return;

    const unsubscribe = supabaseService.subscribe(`private_${currentUser.id}`, async (newMsg: PrivateMessage) => {
      if (newMsg.sender_id === recipient.id || newMsg.recipient_id === recipient.id) {
        let plain = newMsg.decryptedContent;
        if (!plain) {
          try {
            plain = await decryptMessage(newMsg.ciphertext, newMsg.iv, sharedKey);
          } catch (e) {
            plain = '[🔒 Message protected]';
          }
        }

        const resolved = { ...newMsg, decryptedContent: plain };
        setMessages((prev) => {
          const existingIndex = prev.findIndex((m) => m.id === resolved.id);
          if (existingIndex >= 0) {
            const next = [...prev];
            next[existingIndex] = { ...next[existingIndex], ...resolved };
            return next;
          }
          return [...prev, resolved];
        });

        if (newMsg.sender_id === recipient.id) {
          try {
            await supabaseService.markMessageDelivered(newMsg.id, currentUser.id);
            await supabaseService.markMessageRead(newMsg.id, currentUser.id);
          } catch (statusError) {
            console.warn('Could not acknowledge incoming message:', statusError);
          }
          soundEngine.playReceived();
          setIsRecipientTyping(false);
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser.id, recipient.id, sharedKey]);

  // 3. Real-time Subscription to Recipient Typing status
  useEffect(() => {
    const unsubscribeTyping = supabaseService.subscribeTyping(
      currentUser.id,
      recipient.id,
      ({ isTyping }) => {
        setIsRecipientTyping(isTyping);
        if (remoteTypingTimeoutRef.current) {
          clearTimeout(remoteTypingTimeoutRef.current);
        }
        if (isTyping) {
          // Auto-clear typing indicator if no new event after 3.5s
          remoteTypingTimeoutRef.current = setTimeout(() => {
            setIsRecipientTyping(false);
          }, 3500);
        }
      }
    );

    return () => {
      unsubscribeTyping();
      if (remoteTypingTimeoutRef.current) {
        clearTimeout(remoteTypingTimeoutRef.current);
      }
    };
  }, [currentUser.id, recipient.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, showRawCiphertext, isRecipientTyping]);

  // 4. Typing broadcast handler
  const handleInputChange = (text: string) => {
    setInputText(text);

    // Notify that current user is typing
    if (text.trim().length > 0) {
      supabaseService.sendTypingStatus(currentUser.id, recipient.id, true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        supabaseService.sendTypingStatus(currentUser.id, recipient.id, false);
      }, 2000);
    } else {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      supabaseService.sendTypingStatus(currentUser.id, recipient.id, false);
    }
  };

  // 5. Send Encrypted Message
  const handleSendMessage = async (customPayload?: string) => {
    const textToSend = customPayload || inputText.trim();
    if (!textToSend || !sharedKey) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    supabaseService.sendTypingStatus(currentUser.id, recipient.id, false);

    try {
      soundEngine.playSent();
      if (!customPayload) setInputText('');
      setShowAttachmentMenu(false);
      setShowEmojiPicker(false);

      const { ciphertext, iv } = await encryptMessage(textToSend, sharedKey);

      const savedMsg = await supabaseService.sendPrivateMessage(
        currentUser.id,
        recipient.id,
        ciphertext,
        iv,
        textToSend
      );

      setMessages((prev) => {
        if (prev.some((m) => m.id === savedMsg.id)) return prev;
        return [...prev, savedMsg];
      });
    } catch (err: any) {
      console.error('Send error:', err);
      alert('Could not deliver private message: ' + err.message);
    }
  };

  const emojis = ['👍', '❤️', '🔥', '💧', '🚀', '🌿', '🤝', '🔒', '🛡️', '⚡', '✨', '🌍'];

  return (
    <div
      id="florxup-private-chat"
      className={`flex-1 flex flex-col h-full ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#EFEAE2] text-slate-800'
      } relative`}
    >
      {/* 1. Header */}
      <div
        className={`px-3 py-2.5 sm:px-4 sm:py-3 border-b flex items-center justify-between gap-2 shrink-0 ${
          isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        } z-10`}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {onBackMobile && (
            <button
              onClick={onBackMobile}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Back to chats"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <UserAvatar
            username={recipient.username}
            avatarUrl={recipient.avatar_url}
            size="md"
            isOnline={recipient.is_online}
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-xs sm:text-sm font-bold leading-tight truncate">{recipient.username}</h2>
              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5 shrink-0">
                <Lock className="w-2.5 h-2.5" /> Private
              </span>
            </div>
            {isRecipientTyping ? (
              <p className="text-[10px] sm:text-[11px] text-emerald-400 font-semibold flex items-center gap-1 animate-pulse">
                <span className="inline-flex gap-0.5 items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </span>
                <span>typing...</span>
              </p>
            ) : (
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                {recipient.status_bio || (recipient.is_online ? 'Active now' : 'Offline')}
              </p>
            )}
          </div>
        </div>

        {/* Right Tools: Safety Verification Code & Ciphertext Toggle */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={() => setShowRawCiphertext(!showRawCiphertext)}
            title={showRawCiphertext ? 'Show Decrypted Text' : 'Inspect Protected Message Payload'}
            className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer min-w-[36px] min-h-[36px] ${
              showRawCiphertext
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : isDarkMode
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {showRawCiphertext ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">
              {showRawCiphertext ? 'Normal' : 'Inspect'}
            </span>
          </button>

          <button
            onClick={() => setShowVerificationModal(true)}
            title="Verify Security Number"
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition flex items-center justify-center gap-1 text-xs font-semibold cursor-pointer min-w-[36px] min-h-[36px]"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden md:inline">Safety Code</span>
          </button>
        </div>
      </div>

      {/* 2. Chat Bubble Stream */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
        {/* End-to-End Encryption Notice Banner */}
        <div className="flex justify-center my-2">
          <div className="max-w-md p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-center text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              <strong>End-to-End Private Messaging:</strong> Only you and your recipient can read these messages. No one else, not even Florxup.
            </span>
          </div>
        </div>

        {keyError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{keyError}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-2 text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span>Establishing private chat on your device...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-200">Start a Private Conversation</h4>
            <p className="text-xs max-w-xs text-slate-400">
              Send your first message to @{recipient.username}. Only you and @{recipient.username} can read it.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSentByMe = msg.sender_id === currentUser.id;
            const timeString = new Date(msg.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isSentByMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-md relative text-sm ${
                    isSentByMe
                      ? isDarkMode
                        ? 'bg-emerald-700 text-white rounded-br-xs'
                        : 'bg-[#D9FDD3] text-slate-900 rounded-br-xs'
                      : isDarkMode
                      ? 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/60'
                      : 'bg-white text-slate-900 rounded-bl-xs border border-slate-200'
                  }`}
                >
                  {/* Content View or Raw Ciphertext View */}
                  {showRawCiphertext ? (
                    <div className="space-y-1 font-mono text-xs">
                      <div className="text-[10px] uppercase font-bold text-amber-300 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Protected Payload (Stored on Server)
                      </div>
                      <div className="p-2 rounded bg-black/40 break-all text-[11px] text-amber-200">
                        <strong>Ciphertext:</strong> {msg.ciphertext}
                      </div>
                      <div className="p-1.5 rounded bg-black/40 break-all text-[10px] text-slate-300">
                        <strong>Verification Tag:</strong> {msg.iv}
                      </div>
                    </div>
                  ) : msg.decryptedContent?.startsWith('```') ? (
                    <pre className="p-2.5 rounded-xl bg-slate-950/80 text-emerald-300 font-mono text-xs overflow-x-auto my-1">
                      <code>{msg.decryptedContent.replace(/```/g, '')}</code>
                    </pre>
                  ) : (
                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                      {msg.decryptedContent || '[Private Content]'}
                    </p>
                  )}

                  {/* Bubble Footer: Timestamp & Delivery checks */}
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                      isSentByMe
                        ? isDarkMode
                          ? 'text-emerald-200/80'
                          : 'text-slate-500'
                        : 'text-slate-400'
                    }`}
                  >
                    <span>{timeString}</span>
                    {isSentByMe && (
                      <CheckCheck
                        className={`w-3.5 h-3.5 ${
                          msg.is_read ? 'text-cyan-300' : 'text-emerald-300'
                        }`}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Real-time Typing Bubble indicator from recipient */}
        {isRecipientTyping && (
          <div className="flex justify-start animate-fadeIn">
            <div
              className={`p-3 rounded-2xl rounded-bl-xs flex items-center gap-2 max-w-[220px] shadow-sm border ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-800 text-slate-300'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <UserAvatar
                username={recipient.username}
                avatarUrl={recipient.avatar_url}
                size="sm"
                isOnline={true}
              />
              <div className="flex items-center gap-1.5 py-0.5">
                <span className="text-xs text-slate-400 font-medium">{recipient.username} is typing</span>
                <span className="inline-flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Quick Info & Code Attachment Drawer */}
      {showAttachmentMenu && (
        <div
          className={`p-3 border-t grid grid-cols-3 gap-2 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            onClick={() =>
              handleSendMessage(
                '```json\n{\n  "project": "Clean Water IoT",\n  "status": "Operational",\n  "turbidity": 0.8\n}\n```'
              )
            }
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>Project Telemetry</span>
          </button>
          <button
            onClick={() =>
              handleSendMessage(
                '📍 Relief Coordinates: Lat 34.0522° N, Long 118.2437° W (Medical Hub 4)'
              )
            }
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>Relief GPS Pin</span>
          </button>
          <button
            onClick={() =>
              handleSendMessage(
                '⚡ Community Alert: Solar mesh node is active and ready for field synchronization.'
              )
            }
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Community Alert</span>
          </button>
        </div>
      )}

      {/* Quick Emoji Bar */}
      {showEmojiPicker && (
        <div
          className={`p-2 border-t flex items-center gap-2 overflow-x-auto ${
            isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setInputText((prev) => prev + emoji);
                setShowEmojiPicker(false);
              }}
              className="p-1.5 text-lg hover:scale-125 transition cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* 4. Rich Input Bar */}
      <div
        className={`p-2.5 sm:p-3 border-t flex items-center gap-1.5 sm:gap-2 shrink-0 ${
          isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 transition cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
          title="Insert Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        <button
          onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
          className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 transition cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
          title="Instant & Secure Information Sharing"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Type an end-to-end private message..."
          className={`flex-1 min-w-0 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl border text-xs sm:text-sm focus:outline-none transition ${
            isDarkMode
              ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500 placeholder-slate-500'
              : 'bg-slate-100 border-slate-300 text-slate-900 focus:border-emerald-600 placeholder-slate-400'
          }`}
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || !sharedKey}
          className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 shadow-md shadow-emerald-500/20 transition cursor-pointer disabled:cursor-not-allowed shrink-0 min-w-[38px] min-h-[38px] flex items-center justify-center"
          title="Send Private Message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Safety Number Verification Modal */}
      <KeyVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        currentUser={currentUser}
        recipient={recipient}
      />
    </div>
  );
};
