import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ChatContext } from '../contexts/ChatContext';
import { clearHistory, deleteConversation } from '../contexts/storage';

const { height } = Dimensions.get('window');

export default function DrawerContent() {
  const { history, openConversation, newConversation, reloadHistory } = React.useContext(ChatContext);

  // Delete a conversation
  const handleDelete = async (id) => {
    await deleteConversation(id);
    await reloadHistory();
  };

  // Clear all conversations
  const handleClearAll = async () => {
    await clearHistory();
    await reloadHistory();
  };

  return (
    <LinearGradient
      colors={['#0F0F23', '#1A1A2E', '#16213E']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Header Section */}
      <View style={{ 
        paddingTop: 60, 
        paddingHorizontal: 24, 
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)'
      }}>
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 12
            }}
          >
            <View style={{
              width: 50,
              height: 50,
              borderRadius: 18,
              overflow: 'hidden',
              backgroundColor: 'white',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Image
                source={require('../assets/images/logo.png')}
                style={{ width: 70, height: 70, borderRadius: 18, resizeMode: 'contain' }}
              />
            </View>
          </LinearGradient>
          <Text style={{ 
            fontSize: 22, 
            fontWeight: '700', 
            color: 'white',
            letterSpacing: 0.5
          }}>
            Devscope
          </Text>
          <Text style={{ 
            fontSize: 12, 
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: '400',
            marginTop: 2
          }}>
            AI Coding Assistant
          </Text>
        </View>

        {/* New Chat Button */}
        <TouchableOpacity onPress={newConversation}>
          <LinearGradient
            colors={['#242f66', '#0b34d9']}
            style={{
              paddingVertical: 16,
              paddingHorizontal: 20,
              borderRadius: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#667eea',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8
            }}
          >
            <MaterialIcons name="add-circle-outline" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={{ 
              color: 'white', 
              fontSize: 16, 
              fontWeight: '600',
              letterSpacing: 0.3
            }}>
              New Conversation
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Chat History Section */}
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 20 }}>
        <Text style={{ 
          fontSize: 16, 
          fontWeight: '600', 
          color: 'rgba(255, 255, 255, 0.9)', 
          marginBottom: 16,
          letterSpacing: 0.2
        }}>
          Recent Conversations
        </Text>

        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {history.length === 0 ? (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              marginTop: height * 0.15,
              paddingHorizontal: 20
            }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20
              }}>
                <MaterialIcons name="chat-bubble-outline" size={36} color="rgba(255, 255, 255, 0.3)" />
              </View>
              <Text style={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontSize: 18,
                fontWeight: '500',
                textAlign: 'center',
                marginBottom: 8
              }}>
                No conversations yet
              </Text>
              <Text style={{ 
                color: 'rgba(255, 255, 255, 0.4)', 
                fontSize: 14,
                textAlign: 'center',
                lineHeight: 20
              }}>
                Start your first conversation to see your chat history here
              </Text>
            </View>
          ) : (
            history.map((item, index) => (
              <View key={item.id} style={{ marginBottom: 12 }}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.04)']}
                  style={{
                    borderRadius: 16,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <TouchableOpacity 
                    onPress={() => openConversation(item.id)} 
                    style={{ flex: 1, paddingRight: 16 }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <View style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#667eea',
                        marginRight: 12
                      }} />
                      <Text style={{ 
                        color: 'white', 
                        fontSize: 16,
                        fontWeight: '600',
                        flex: 1,
                        letterSpacing: 0.2
                      }} numberOfLines={1}>
                        {item.title || `Conversation ${index + 1}`}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 20 }}>
                      <MaterialIcons name="message" size={14} color="rgba(255, 255, 255, 0.5)" />
                      <Text style={{ 
                        color: 'rgba(255, 255, 255, 0.5)', 
                        fontSize: 13,
                        marginLeft: 6,
                        fontWeight: '400'
                      }}>
                        {item.messages.length} messages
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => handleDelete(item.id)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: 'rgba(239, 68, 68, 0.2)'
                    }}
                  >
                    <MaterialIcons name="delete-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Footer Section */}
      {history.length > 0 && (
        <View style={{ 
          paddingHorizontal: 24, 
          paddingBottom: 40,
          paddingTop: 20,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)'
        }}>
          <TouchableOpacity onPress={handleClearAll}>
            <LinearGradient
              colors={['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.05)']}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(239, 68, 68, 0.2)'
              }}
            >
              <MaterialIcons name="clear-all" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={{ 
                color: '#EF4444', 
                fontSize: 15,
                fontWeight: '600',
                letterSpacing: 0.2
              }}>
                Clear All Conversations
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
}