
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { ChatContext } from '../contexts/ChatContext';


export default function ChatInput() {
  const { sendMessage } = useContext(ChatContext);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null); // Track selected image

  const handleSend = () => {
    if (!inputText.trim() && !selectedImage) return;
    sendMessage(inputText.trim(), selectedImage); // Pass image URI
    setInputText('');
    setSelectedImage(null);
  };

  const handleAttach = () => {
    Alert.alert(
      'Attach File',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (permissionResult.granted === false) {
              Alert.alert('Permission Denied', 'Camera access is required.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 1,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              setSelectedImage(result.assets[0].uri); // Store image URI
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
              Alert.alert('Permission Denied', 'Gallery access is required.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 1,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              setSelectedImage(result.assets[0].uri); // Store image URI
            }
          },
        },
        {
          text: 'Document',
          onPress: async () => {
            const result = await DocumentPicker.getDocumentAsync({
              type: '*/*',
              copyToCacheDirectory: true,
            });
            if (result.type === 'success') {
              sendMessage('Document sent: ' + result.uri);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="px-4 pb-4">
      <View className="rounded-2xl p-4">
        <View className="flex-row items-end">
          {/* Text Input Container */}
          <View className="flex-1 rounded-xl px-4 py-3 mr-3">
            <TextInput
              className="text-white text-base min-h-[20px] max-h-[100px]"
              placeholder="Ask me anything about coding..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              multiline
              textAlignVertical="top"
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            {/* Display selected image preview */}
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={{ width: 100, height: 100, borderRadius: 8, marginTop: 8 }}
              />
            )}
          </View>

          {/* Attach Button */}
          <TouchableOpacity
            onPress={handleAttach}
            className="p-3 rounded-xl mr-2"
            activeOpacity={0.7}
            style={{
              shadowColor: '#60A5FA',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Feather name="paperclip" size={20} color="#60A5FA" />
          </TouchableOpacity>

          {/* Send Button */}
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() && !selectedImage}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={inputText.trim() || selectedImage ? ['#3B82F6', '#1D4ED8'] : ['#374151', '#4B5563']}
              className="p-3 rounded-xl"
              style={{
                shadowColor: inputText.trim() || selectedImage ? '#3B82F6' : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <MaterialIcons name="send" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
