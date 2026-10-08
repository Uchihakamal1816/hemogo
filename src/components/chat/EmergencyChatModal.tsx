import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Phone, 
  ShieldCheck, 
  Lock, 
  MapPin,
  CheckCheck
} from 'lucide-react';
import type { ChatMessage, UserProfile } from '../../types/database';
import { getStoredChatMessages, sendChatMessage } from '../../services/chatService';

interface EmergencyChatModalProps {
  isOpen: boolean;
  requestId: string;
  matchId: string;
  patientName: string;
  hospitalName: string;
  otherPartyName: string;
  otherPartyPhone: string;
  currentUser: UserProfile | null;
  onClose: () => void;
}

const QUICK_CHIPS = [
  '🚗 On my way to the hospital blood bank',
  '🏥 Reached reception. Which ward?',
  '🩸 Form submitted to blood bank officer',
  '📞 Please call me if urgent'
];

export const EmergencyChatModal: React.FC<EmergencyChatModalProps> = ({
  isOpen,
  requestId,
  matchId,
  hospitalName,
  otherPartyName,
  otherPartyPhone,
  currentUser,
  onClose
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      const interval = setInterval(loadMessages, 2500);
      return () => clearInterval(interval);
    }
  }, [isOpen, requestId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = () => {
    if (!requestId) return;
    const list = getStoredChatMessages(requestId);
    setMessages([...list]);
  };

  if (!isOpen || !currentUser) return null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    sendChatMessage({
      requestId,
      matchId,
      sender: currentUser,
      text: inputText.trim()
    });

    setInputText('');
    loadMessages();
  };

  const handleQuickChip = (text: string) => {
    sendChatMessage({
      requestId,
      matchId,
      sender: currentUser,
      text
    });
    loadMessages();
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel-elevated w-full max-w-xl p-0 relative bg-slate-900/95 border border-slate-700 shadow-2xl text-slate-100 flex flex-col h-[600px] max-h-[90vh] overflow-hidden rounded-2xl">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-bold shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white">{otherPartyName}</span>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase">
                  Verified Contact
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-400" />
                <span>{hospitalName} • Request #{requestId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${otherPartyPhone}`}
              className="btn-emerald !py-1.5 !px-3 text-xs font-bold flex items-center gap-1 shadow-sm"
              title="Call directly"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Call</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/40">
          
          <div className="text-center py-1">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>End-to-End Encrypted Emergency Session</span>
            </span>
          </div>

          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser.userId;
            const isSystem = msg.senderRole === 'system';

            if (isSystem) {
              return (
                <div key={msg.messageId} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center text-xs text-slate-300">
                  <span className="text-emerald-400 font-bold">System: </span>
                  <span>{msg.text}</span>
                </div>
              );
            }

            return (
              <div
                key={msg.messageId}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-slate-400 px-1 mb-0.5">
                  {msg.senderName}
                </span>

                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs font-medium ${
                    isMe
                      ? 'bg-red-600 text-white rounded-br-xs shadow-md shadow-red-950'
                      : 'bg-slate-800 text-slate-200 rounded-bl-xs border border-slate-700'
                  }`}
                >
                  <p className="leading-relaxed">{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-75">
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && <CheckCheck className="w-3 h-3" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Coordination Chips */}
        <div className="px-3 py-2 bg-slate-950 border-t border-slate-800 flex gap-2 overflow-x-auto no-scrollbar">
          {QUICK_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickChip(chip)}
              className="text-[11px] font-medium whitespace-nowrap px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition-all flex-shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type a message to coordinate..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="btn-primary !py-2.5 !px-4 text-xs font-bold"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
