import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, UserProfile } from '../types';
import { tts } from '../lib/tts';
import { generateCravingCoachReply } from '../lib/gemini';

interface CravingCrusherModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  chatHistory: ChatMessage[];
  onSaveChat: (messages: ChatMessage[]) => void;
  onAddWater: (amountMl: number) => void;
}

const CRISIS_PROMPTS = [
  'I really want to order pizza & soda right now!',
  'Bhai bohot tez craving ho rahi hai sweet khane ki...',
  'Can I just have one small cheat snack?',
  "I've been sitting for 3 hours and feel unmotivated to workout",
];

export const CravingCrusherModal: React.FC<CravingCrusherModalProps> = ({
  isOpen,
  onClose,
  profile,
  chatHistory,
  onSaveChat,
  onAddWater,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(chatHistory);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome coach message if history is empty
  useEffect(() => {
    if (messages.length === 0) {
      const kgDelta = Math.max(0, Number((profile.currentWeightKg - profile.targetWeightKg).toFixed(1)));
      const initial: ChatMessage = {
        id: 'msg_welcome',
        role: 'model',
        content: `Listen to me carefully: You are currently at ${profile.currentWeightKg} kg, and your target is ${profile.targetWeightKg} kg${kgDelta > 0 ? ` (${kgDelta} kg of pure discipline to go)` : ' (target reached, now we maintain)'}! 

Whenever you feel like cheating on your diet or feeling unmotivated, talk to me right here. Hindi, English, Hinglish—batao kya chal raha hai dimag mein? We will crush every single craving together!`,
        timestamp: new Date().toISOString(),
      };
      setMessages([initial]);
      onSaveChat([initial]);
    } else {
      setMessages(chatHistory);
    }
  }, [chatHistory, profile.currentWeightKg, profile.targetWeightKg]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const sendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: userText.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const historyPayload = updatedMessages
        .slice(-6)
        .map((m) => ({ role: m.role, text: m.content }));

      const replyText = await generateCravingCoachReply(
        userText.trim(),
        historyPayload,
        profile.currentWeightKg,
        profile.targetWeightKg
      );

      const modelMsg: ChatMessage = {
        id: `msg_m_${Date.now()}`,
        role: 'model',
        content: replyText,
        timestamp: new Date().toISOString(),
      };

      const finalHistory = [...updatedMessages, modelMsg];
      setMessages(finalHistory);
      onSaveChat(finalHistory);

      // Speak key phrase via Web Speech API
      tts.speak(replyText.slice(0, 180));
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `msg_m_${Date.now()}`,
        role: 'model',
        content: `Bhai suno! 96 kg yaad hai na? Do not trade a week of hard calorie deficit for 5 minutes of junk food regret! Go drink 500ml cold water right now and do 20 bodyweight squats. Discipline beats motivation!`,
        timestamp: new Date().toISOString(),
      };
      const finalHistory = [...updatedMessages, fallbackMsg];
      setMessages(finalHistory);
      onSaveChat(finalHistory);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeakLastReply = (content: string) => {
    if (isSpeaking) {
      tts.setEnabled(false);
      setIsSpeaking(false);
      setTimeout(() => tts.setEnabled(true), 100);
    } else {
      setIsSpeaking(true);
      tts.speak(content);
      setTimeout(() => setIsSpeaking(false), 8000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
      <div className="w-full sm:max-w-xl h-[92vh] sm:h-[82vh] max-h-[760px] bg-[#FCFBF9] dark:bg-[#141312] sm:rounded-3xl rounded-t-3xl border border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-white dark:bg-stone-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Craving Crusher & Motivation Coach
                </h2>
                <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                  Target 96kg
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Aggressive positive reinforcement · English / Hindi / Hinglish
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition text-sm"
          >
            ✕
          </button>
        </div>

        {/* Immediate Physical Task Quick Banner */}
        <div className="bg-rose-50/80 dark:bg-rose-950/30 px-4 py-2 border-b border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between text-xs text-rose-900 dark:text-rose-200 shrink-0">
          <span className="font-semibold text-[11px]">Emergency Diversion:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onAddWater(500);
                tts.speak('500ml water logged. Great discipline!');
              }}
              className="px-2 py-0.5 rounded-md bg-white dark:bg-rose-900/60 border border-rose-300 dark:border-rose-800 text-[11px] font-semibold hover:bg-rose-100 transition"
            >
              Drink 500ml Cold Water (+Logged)
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-br-xs'
                      : 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-stone-800 rounded-bl-xs shadow-xs'
                  }`}
                >
                  <div className="whitespace-pre-line">{m.content}</div>
                </div>

                {!isUser && (
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <button
                      onClick={() => handleSpeakLastReply(m.content)}
                      className="text-[10px] text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 flex items-center gap-1"
                    >
                      <span>🔊 Listen to Coach</span>
                    </button>
                    <span className="text-[10px] text-stone-400">·</span>
                    <span className="text-[10px] text-stone-400">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-stone-400 bg-white dark:bg-stone-900 px-4 py-2.5 rounded-2xl border border-stone-200/60 dark:border-stone-800 self-start w-fit">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Coach is analyzing your cravings & formulating response...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Crisis Prompt Chips */}
        <div className="p-3 bg-white/70 dark:bg-stone-900/70 border-t border-stone-200/60 dark:border-stone-800 overflow-x-auto scrollbar-none flex items-center gap-2 shrink-0">
          {CRISIS_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-[11px] font-medium text-stone-700 dark:text-stone-300 hover:border-rose-400 hover:text-rose-600 transition whitespace-nowrap shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="p-3 sm:p-4 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type craving in English, Hindi or Hinglish..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold hover:opacity-90 transition disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
