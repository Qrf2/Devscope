import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DrawerContent from '../components/DrawerContent';
import { ChatProvider } from '../contexts/ChatContext';
import '../global.css';

export default function Layout() {
  return (
    <ChatProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Add a view under the status bar for background color */}
        <View style={{ height: 32, backgroundColor: '#0F172A', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} />
        <StatusBar style="light" translucent />
        <Drawer
          drawerContent={(props) => <DrawerContent {...props} />}
          screenOptions={{
            headerShown: false,
            drawerStyle: {
              backgroundColor: 'transparent',
              width: 320,
            },
            drawerType: 'slide',
            overlayColor: 'rgba(0, 0, 0, 0.7)',
            drawerActiveTintColor: '#60A5FA',
            drawerInactiveTintColor: '#9CA3AF',
          }}
        >
          <Drawer.Screen
            name="index"
            options={{
              drawerLabel: 'Chat',
              title: 'Devscope Chat',
            }}
          />
        </Drawer>
      </GestureHandlerRootView>
    </ChatProvider>
  );
}