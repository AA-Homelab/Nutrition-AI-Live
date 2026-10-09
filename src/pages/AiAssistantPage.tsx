/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { AiClientService } from '../services/aiClientService';
import { calculateRemaining } from '../services/nutritionCalculator';
import { AiChatMessage, FoodLogEntry } from '../types';
import {
  Sparkles,
  Send,
  User,
  ShieldCheck,
  AlertCircle,
  Flame,
  ChefHat,
  Trash2,
  RefreshCw,
  CheckCircle2,
  MessageSquareOff,
} from 'lucide-react';

export const AiAssistantPage: React.FC = () => {
  const { currentUser, userAccount, userProfile, nutritionTargets } = useAuth();
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [todayLogs, setTodayLogs] = useState<FoodLogEntry[]>([]);
  const [clearedNotice, setClearedNotice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const uid = currentUser?.uid || userAccount?.uid || 'user-active';
    DataService.getChatHistory(uid).then((hist) => {
      setMessages(hist);
    });

    if (currentUser?.uid) {
      const unsub = DataService.subscribeFoodLogs(currentUser.uid, todayStr, (logs) => {
        setTodayLogs(logs);
      });
      return () => unsub();
    }
  }, [currentUser?.uid, userAccount?.uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const defaultTargets = nutritionTargets || {
    dailyCalories: 2000,
    proteinGrams: 140,
    carbohydrateGrams: 220,
    fatGrams: 65,
    fiberGrams: 28,
    bmr: 1600,
    tdee: 2200,
    proteinPercent: 28,
    carbsPercent: 44,
    fatPercent: 28,
    updatedAt: '',
  };

  const { consumed, remaining } = calculateRemaining(defaultTargets, todayLogs);

  const promptSuggestions = [
    `I have ${remaining.calories} kcal left. What should I eat?`,
    'Give me a high-protein Filipino meal under 600 calories.',
    'I need 35g of protein with minimal carbs for dinner.',
    'Suggest a healthy breakfast with eggs and Asian greens.',
    'How can I reach my protein target today without exceeding fat?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    const uid = currentUser?.uid || userAccount?.uid || 'user-active';
    if (!text.trim() || sending) return;

    const userMsg: AiChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setSending(true);

    try {
      const { content } = await AiClientService.chatWithAi(newMessages, {
        dailyTarget: defaultTargets.dailyCalories,
        consumed,
        remaining,
        goal: userProfile?.goal,
        dietaryPreferences: userProfile?.dietaryPreferences,
        allergies: userProfile?.allergies,
        loggedMeals: todayLogs,
      });

      const assistantMsg: AiChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);
      DataService.saveChatHistory(uid, finalMessages).catch((e) => {
        console.warn('Notice saving chat history:', e);
      });
    } catch (err: any) {
      console.error('Chat error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleClearChat = async () => {
    const uid = currentUser?.uid || userAccount?.uid || 'user-active';
    setMessages([]);
    setInputMessage('');
    try {
      localStorage.setItem(`nutritrack_chats_${uid}`, JSON.stringify([]));
      if (currentUser?.uid) {
        localStorage.setItem(`nutritrack_chats_${currentUser.uid}`, JSON.stringify([]));
      }
      localStorage.setItem('nutritrack_chats_user-active', JSON.stringify([]));
      await DataService.saveChatHistory(uid, []);
    } catch (err) {
      console.warn('Notice clearing chat history:', err);
    }
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {/* Top Banner & Context Ticker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white">AI Nutrition Assistant</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Live Context Aware
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Personalized meal planning, portion advice, and macro optimization based on your remaining budget.
          </p>
        </div>

        <button
          type="button"
          onClick={handleClearChat}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border self-start sm:self-auto transition-all ${
            clearedNotice
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-slate-900 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 border-slate-800'
          }`}
          title="Clear all chat messages"
        >
          {clearedNotice ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Chat Cleared</span>
            </>
          ) : (
            <>
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Chat</span>
            </>
          )}
        </button>
      </div>

      {/* Live Context Card */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-300">Remaining Today:</span>
          <span className="font-mono font-bold text-emerald-400">{remaining.calories} kcal</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400 font-mono">
          <span>P: <strong className="text-blue-400">{remaining.protein}g</strong></span>
          <span>C: <strong className="text-amber-400">{remaining.carbohydrates}g</strong></span>
          <span>F: <strong className="text-rose-400">{remaining.fat}g</strong></span>
        </div>
      </div>

      {/* Medical Safety Disclaimer Pill */}
      <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
        <span>
          NutriTrack AI provides educational nutrition guidance. It does not provide medical diagnoses or replace consultations with licensed healthcare professionals.
        </span>
      </div>

      {/* Chat Messages Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl h-[480px] flex flex-col justify-between">
        <div className="overflow-y-auto space-y-4 pr-2 flex-1 flex flex-col">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                <MessageSquareOff className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Chat History Cleared</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Your conversation has been cleared. Tap any suggestion below or ask a question to start fresh.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 flex-shrink-0 shadow-md">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                {msg.content}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>NutriTrack AI is analyzing your nutrition targets...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Pills */}
        <div className="pt-3 border-t border-slate-800 mt-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {promptSuggestions.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 font-medium transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 mt-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask anything about your calories, meals, or macro targets..."
              className="flex-1 px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 shadow-inner"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || sending}
              className="p-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
