import { Feather } from '@expo/vector-icons';
import Entypo from '@expo/vector-icons/Entypo';
import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native';
// Removed document picker import
import * as ImagePicker from 'expo-image-picker';
import * as NavigationBar from 'expo-navigation-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { sendMessageToAI } from '../contexts/api';
import { Message as ChatMessage, useChatContext } from '../contexts/ChatContext';
import { useConversationHistory } from '../hooks/useConversationHistory';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const TypingLine: React.FC = () => {
  const [text, setText] = useState('');
  const full = 'Hello, human...';
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      setText(full.slice(0, i + 1));
      i++;
      if (i >= full.length) clearInterval(id);
    }, 60);
    return () => clearInterval(id);
  }, []);
  return (
    <Text style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center' }}>{text}</Text>
  );
};

const ChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const [inputText, setInputText] = useState('');
  const [inputHeight, setInputHeight] = useState(24);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const textInputRef = useRef<TextInput | null>(null);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const insets = useSafeAreaInsets();
  
  // Chat context for shared state
  const { messages, setMessages, newConversation } = useChatContext();
  
  // Conversation history management
  const {
    // Cast to any[] to bridge differing Message types between ChatContext and useConversationHistory
    saveCurrentConversation,
    startNewConversation,
    currentConversationId,
    createNewConversation
  } = useConversationHistory();


  // Handle keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      if (Platform.OS === 'android') {
        setKeyboardHeight(e.endCoordinates.height);
      }
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    const keyboardWillShowListener = Platform.OS === 'ios' 
      ? Keyboard.addListener('keyboardWillShow', (e) => {
          setKeyboardHeight(e.endCoordinates.height);
        })
      : null;

    const keyboardWillHideListener = Platform.OS === 'ios'
      ? Keyboard.addListener('keyboardWillHide', () => {
          setKeyboardHeight(0);
        })
      : null;

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, []);

  // Handle navigation bar for Android
  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS === 'android') {
        (async () => {
          try {
            await NavigationBar.setButtonStyleAsync('light');
            // Avoid setBackgroundColorAsync when edge-to-edge is enabled (it is unsupported and logs a warning)
            // Instead, rely on translucent StatusBar and edge-to-edge system bars styling
            // await NavigationBar.setBackgroundColorAsync('#000000');
          } catch {}
          try {
            await NavigationBar.setVisibilityAsync('visible');
          } catch {}
        })();
      }

      return () => {
        if (Platform.OS === 'android') {
          (async () => {
            try {
              await NavigationBar.setVisibilityAsync('visible');
              // Avoid setBackgroundColorAsync when edge-to-edge is enabled (it is unsupported and logs a warning)
              // await NavigationBar.setBackgroundColorAsync('#000000');
            } catch {}
          })();
        }
      };
    }, [])
  );

  const handleSend = () => {
    if (!inputText.trim() && !selectedImage) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      createdAt: Date.now(),
      image: selectedImage || undefined, // Include image URI
    };

    if (messages.length === 0 && !currentConversationId) {
      createNewConversation(inputText.trim());
    }

    const updatedMessages: ChatMessage[] = [...messages, newMessage];
    setMessages(updatedMessages);
    setInputText('');
    setInputHeight(24);
    setSelectedImage(null);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    const typeWriterEffect = (fullText: string, callback: (text: string) => void) => {
      let i = 0;
      const interval = setInterval(() => {
        callback(fullText.slice(0, i + 1));
        i++;
        if (i === fullText.length) clearInterval(interval);
      }, 20);
    };

    (async () => {
      const aiText = await sendMessageToAI(updatedMessages);
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: '',
        sender: 'ai',
        createdAt: Date.now(),
      };

      setMessages((prevMessages) => [...prevMessages, aiResponse]);

      typeWriterEffect(aiText, (currentText) => {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === aiResponse.id ? { ...msg, text: currentText } : msg))
        );
      });
    })();
  };

  const handleContentSizeChange = (e: any) => {
    const newHeight = Math.min(Math.max(24, e.nativeEvent.contentSize.height), 120);
    setInputHeight(newHeight);
  };

  const handleUploadPress = () => {
    setShowUploadModal(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    Animated.spring(slideAnim, {
      toValue: 300,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleCameraPress = async () => {
    setShowUploadModal(false);
    // Request camera permissions
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      alert('Permission Denied: Camera access is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      // Set image preview for user to describe
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleGalleryPress = async () => {
    setShowUploadModal(false);
    // Open gallery for image selection
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert('Permission Denied: Gallery access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const renderMessage = (message: ChatMessage) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.sender === 'user' ? styles.userMessageContainer : styles.aiMessageContainer,
      ]}
    >
      {message.sender === 'ai' && (
        <View style={styles.aiHeader}>
          <View style={styles.aiAvatar}>
            <Entypo name="code" size={16} color="#3B82F6" />
          </View>
          <Text style={styles.aiLabel}>Devscope AI</Text>
        </View>
      )}
      <View
        style={[
          styles.messageWrapper,
          message.sender === 'user' ? styles.userMessageWrapper : styles.aiMessageWrapper,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            message.sender === 'user' ? styles.userBubble : styles.aiBubble,
          ]}
        >
          {message.image && (
            <Image
              source={{ uri: message.image }}
              style={{ width: 200, height: 200, borderRadius: 8, marginBottom: 8 }}
            />
          )}
          <Text
            style={[styles.messageText, message.sender === 'user' ? styles.userText : styles.aiText]}
          >
            {message.text}
          </Text>
          <Text
            style={[styles.messageTime, message.sender === 'user' ? styles.userTime : styles.aiTime]}
          >
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/images/bg.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        {/* Header - Fixed at top */}
        <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              style={styles.menuButton}
            >
              <Feather name="menu" size={24} color="#FFF" />
            </Pressable>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Devscope</Text>
            </View>

            <Pressable
              onPress={async () => {
                // Save current conversation to history and start a new one (adds to drawer)
                await newConversation();
                setInputText('');
                setInputHeight(24);
              }}
              style={styles.newChatButton}
            >
              <Entypo name="new-message" size={22} color="#FFF" />
            </Pressable>
          </View>
        </SafeAreaView>

        {/* Chat Area */}
        <View style={styles.chatContainer}>
          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={[
              styles.messagesContent,
              { 
                paddingBottom: Platform.OS === 'android' && keyboardHeight > 0 
                  ? 100 
                  : messages.length > 0 ? 20 : 0 
              }
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 ? (
              <View style={styles.welcomeContainer}>
                <View style={styles.welcomeIconContainer}>
                  <View style={styles.welcomeIcon}>
                    <Image
                      source={require('../assets/images/logo.png')}
                      style={styles.welcomeLogo}
                    />
                  </View>
                  <View style={styles.welcomeGlow} />
                </View>
                <Text style={styles.welcomeTitle}>Welcome to Devscope</Text>
                {/* Typing animation line */}
                <TypingLine />
              </View>
            ) : (
              messages.map(renderMessage)
            )}
          </ScrollView>

          {/* Input Area - Always at bottom */}
          <View style={[
            styles.inputArea,
            Platform.OS === 'ios' && keyboardHeight > 0 && { 
              paddingBottom: keyboardHeight 
            },
            Platform.OS === 'android' && keyboardHeight > 0 && { 
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              paddingBottom: 16
            }
          ]}>
            <View style={styles.inputContainer}>
              {/* Image preview above input */}
              {selectedImage && (
                <View style={{ alignItems: 'flex-start', marginBottom: 8 }}>
                  <Image
                    source={{ uri: selectedImage }}
                    style={{ width: 120, height: 120, borderRadius: 10 }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={{ position: 'absolute', top: 4, right: 4, backgroundColor: '#000', borderRadius: 12, padding: 2 }}
                    onPress={() => setSelectedImage(null)}
                  >
                    <Feather name="x" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
              <View style={[styles.inputWrapper, { minHeight: Math.max(52, inputHeight + 28) }]}> 
                <TextInput
                  ref={textInputRef}
                  style={[styles.textInput, { height: Math.max(24, inputHeight) }]}
                  value={inputText}
                  onChangeText={setInputText}
                  onContentSizeChange={handleContentSizeChange}
                  placeholder={selectedImage ? "Describe your image..." : "Type a message..."}
                  placeholderTextColor="#64748B"
                  multiline
                  textAlignVertical="center"
                />
                
                <View style={styles.inputActions}>
                  <Pressable
                    onPress={handleUploadPress}
                    style={styles.actionButton}
                  >
                    <Feather name="paperclip" size={20} color="#64748B" />
                  </Pressable>
                  
                  <Pressable
                    onPress={handleSend}
                    style={[
                      styles.actionButton,
                      { 
                        opacity: inputText.trim() || selectedImage ? 1 : 0.6,
                      }
                    ]}
                    disabled={!(inputText.trim() || selectedImage)}
                  >
                    <Feather name="send" size={20} color="#ffffff" />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Upload Modal */}
        <Modal
          visible={showUploadModal}
          transparent={true}
          animationType="none"
          onRequestClose={handleCloseUploadModal}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={handleCloseUploadModal}
          >
            <Animated.View
              style={[
                styles.uploadModal,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.modalHandle} />
              
              <Text style={styles.modalTitle}>Upload Options</Text>
              
              <View style={styles.uploadOptions}>
                <TouchableOpacity
                  style={styles.uploadOption}
                  onPress={handleCameraPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.uploadIconContainer}>
                    <Feather name="camera" size={24} color="#3B82F6" />
                  </View>
                  <Text style={styles.uploadOptionText}>Camera</Text>
                  <Text style={styles.uploadOptionSubtext}>Take a photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.uploadOption}
                  onPress={handleGalleryPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.uploadIconContainer}>
                    <Feather name="image" size={24} color="#3B82F6" />
                  </View>
                  <Text style={styles.uploadOptionText}>Gallery</Text>
                  <Text style={styles.uploadOptionSubtext}>Choose image</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      </ImageBackground>
    </View>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  // Header
  headerSafeArea: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  newChatButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },

  // Chat Container
  chatContainer: {
    flex: 1,
  },

  // Messages
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingTop: 20,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginLeft: 8,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
  },
  aiLabel: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '600',
  },
  messageWrapper: {
    maxWidth: '85%',
  },
  userMessageWrapper: {
    alignItems: 'flex-end',
  },
  aiMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  userBubble: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    backgroundColor: '#1F1F1F',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  userText: {
    color: '#FFF',
  },
  aiText: {
    color: '#E5E7EB',
  },
  messageTime: {
    fontSize: 11,
    opacity: 0.7,
    alignSelf: 'flex-end',
  },
  userTime: {
    color: '#BFDBFE',
  },
  aiTime: {
    color: '#9CA3AF',
  },

  // Welcome Screen
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  welcomeIconContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  welcomeIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#3B82F6',
    overflow: 'hidden',
    zIndex: 1,
  },
  welcomeGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#3B82F6',
    opacity: 0.1,
    top: -10,
    left: -10,
  },
  welcomeLogo: {
    width: 130,
    height: 130,
    borderRadius: 40,
    resizeMode: 'contain',
  },
  welcomeTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  welcomeFeatures: {
    alignSelf: 'stretch',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '500',
  },

  // Input Area
  inputArea: {
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: 'transparent',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#1A1A1A',
    borderRadius: 26,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
  },
  textInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    paddingVertical: 0,
    paddingRight: 12,
    textAlignVertical: 'center',
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },

  // Upload Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  uploadModal: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 34,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#4B5563',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  uploadOption: {
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  uploadIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  uploadOptionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  uploadOptionSubtext: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
  },
});
