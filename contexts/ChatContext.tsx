import React, { createContext, ReactNode, useEffect, useState } from 'react';
import uuid from 'react-native-uuid';
import { sendMessageToAI } from './api';
import { getHistory, saveConversation } from './storage';

// Types for message and conversation
export interface Message {
  id: string;
  text: string;
  sender?: string;
  createdAt?: number;
  image?: string; // Add image URI field
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

interface ChatContextType {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  history: Conversation[];
  newConversation: () => Promise<void>;
  openConversation: (id: string) => void;
  reloadHistory: () => Promise<void>;
  resetChat: () => void;
  sendMessage: (text: string, image?: string) => Promise<void>; // Update signature
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<Conversation[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const h = await getHistory();
    setHistory(h || []);
  };

  const newConversation = async () => {
    // Always create a new conversation in history, even if there are no messages
    const conversation = {
      id: uuid.v4() as string,
      title: messages[0]?.text || 'Untitled Chat',
      messages: messages.length > 0 ? messages : [],
      createdAt: Date.now(),
    };
    await saveConversation(conversation);
    await loadHistory();
    setMessages([]);
  };

  const openConversation = (id: string) => {
    const conv = history.find((c) => c.id === id);
    if (conv) {
      setMessages(conv.messages);
    }
  };

  const resetChat = () => {
    setMessages([]);
  };

  // Function to send user message
  const sendMessage = async (text: string, image?: string) => {
    const userMsg: Message = {
      id: uuid.v4() as string,
      text,
      sender: 'user',
      createdAt: Date.now(),
      image, // Include image URI if provided
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    // Call AI
    const aiReply = await sendMessageToAI(newMessages);
    const aiMsg: Message = {
      id: uuid.v4() as string,
      text: aiReply,
      sender: 'assistant',
      createdAt: Date.now(),
    };
    setMessages([...newMessages, aiMsg]);
  };

  return (
    <ChatContext.Provider value={{
      messages,
      setMessages,
      history,
      newConversation,
      openConversation,
      reloadHistory: loadHistory,
      resetChat,
      sendMessage
    }}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook for using chat context
export const useChatContext = (): ChatContextType => {
  const context = React.useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};