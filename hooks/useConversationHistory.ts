// Utility to get chat history (messages) from the most recent or current conversation
export const getChatHistory = async (): Promise<Message[]> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: Conversation[] = JSON.parse(stored);
      if (parsed.length > 0) {
        // Return messages from the most recent conversation
        return parsed[0].messages || [];
      }
    }
    return [];
  } catch (error) {
    console.error('Error getting chat history:', error);
    return [];
  }
};
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = '@devscope_conversations';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  time: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  preview: string;
  time?: string; // For display purposes
}

export const useConversationHistory = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Load conversations from storage
  const loadConversations = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Conversation[] = JSON.parse(stored);
        setConversations(parsed);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, []);

  // Save conversations to storage
  const saveConversations = useCallback(async (newConversations: Conversation[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newConversations));
      setConversations(newConversations);
    } catch (error) {
      console.error('Error saving conversations:', error);
    }
  }, []);

  // Create a new conversation
  const createNewConversation = useCallback((firstMessage: string) => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: firstMessage.length > 50 ? firstMessage.substring(0, 50) + '...' : firstMessage,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preview: firstMessage.length > 100 ? firstMessage.substring(0, 100) + '...' : firstMessage,
    };
    
    setCurrentConversationId(newConversation.id);
    return newConversation;
  }, []);

  // Save current conversation
  const saveCurrentConversation = useCallback(async (messages: Message[]) => {
    if (!currentConversationId || messages.length === 0) return;

    const updatedConversations = [...conversations];
    const existingIndex = updatedConversations.findIndex(c => c.id === currentConversationId);
    
    const conversationData: Conversation = {
      id: currentConversationId,
      title: messages[0]?.text?.length > 50 ? messages[0].text.substring(0, 50) + '...' : messages[0]?.text || 'New Chat',
      messages: messages,
      updatedAt: new Date().toISOString(),
      preview: messages[0]?.text?.length > 100 ? messages[0].text.substring(0, 100) + '...' : messages[0]?.text || 'New Chat',
      createdAt: existingIndex >= 0 ? updatedConversations[existingIndex].createdAt : new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      updatedConversations[existingIndex] = conversationData;
    } else {
      updatedConversations.unshift(conversationData);
    }

    await saveConversations(updatedConversations);
  }, [currentConversationId, conversations, saveConversations]);

  // Delete a specific conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    const updatedConversations = conversations.filter(c => c.id !== conversationId);
    await saveConversations(updatedConversations);
    
    // If we deleted the current conversation, reset current ID
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null);
    }
  }, [conversations, currentConversationId, saveConversations]);

  // Clear all conversations
  const clearAllConversations = useCallback(async () => {
    await saveConversations([]);
    setCurrentConversationId(null);
  }, [saveConversations]);

  // Start new conversation
  const startNewConversation = useCallback(() => {
    setCurrentConversationId(null);
  }, []);

  // Load a specific conversation
  const loadConversation = useCallback((conversationId: string): Message[] => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setCurrentConversationId(conversationId);
      return conversation.messages;
    }
    return [];
  }, [conversations]);

  // Get formatted time for display
  const getFormattedTime = useCallback((isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  }, []);

  // Get conversations with formatted time
  const getConversationsWithTime = useCallback((): Conversation[] => {
    return conversations.map(conv => ({
      ...conv,
      time: getFormattedTime(conv.updatedAt)
    }));
  }, [conversations, getFormattedTime]);

  // Initialize on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations: getConversationsWithTime(),
    currentConversationId,
    createNewConversation,
    saveCurrentConversation,
    deleteConversation,
    clearAllConversations,
    startNewConversation,
    loadConversation,
    loadConversations,
  };
};