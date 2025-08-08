import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'devscope_chat_history';

// Get all conversations
export const getHistory = async () => {
  try {
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error('Error reading history', e);
    return [];
  }
};

// Save a new conversation
export const saveConversation = async (conversation) => {
  try {
    const history = await getHistory();
    const updated = [...history, conversation];
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving conversation', e);
  }
};

// Delete a specific conversation by ID
export const deleteConversation = async (id) => {
  try {
    const history = await getHistory();
    const updated = history.filter(item => item.id !== id);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error deleting conversation', e);
  }
};

// Clear all history
export const clearHistory = async () => {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.error('Error clearing history', e);
  }
};
