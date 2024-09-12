import React from 'react';
import { StyleSheet, Platform, StatusBar, View } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack'; 
import { Ionicons } from '@expo/vector-icons';

// Import screen components
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import SearchPage from './pages/SearchPage';
import SellingPage from './pages/SellingPage';
import ProfilePage from './pages/ProfilePage';
import ItemDetailScreen from './pages/HomePages/ItemDetailScreen'; 

// Create Bottom Tab Navigator
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home Stack for HomePage and ItemDetailScreen navigation
function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' }, 
        headerTintColor: '#58A4B0', 
        headerTitleStyle: { color: '#000' },
        headerTitleAlign: 'center', 
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomePage} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ItemDetail" 
        component={ItemDetailScreen} 
        options={{ 
          title: 'Purchase', 
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <View style={styles.container}>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ color, size, focused }) => {
                let iconName;
                if (route.name === 'Home') {
                  iconName = 'home';
                } else if (route.name === 'Shop') {
                  iconName = 'cart';
                } else if (route.name === 'Search') {
                  iconName = 'search';
                } else if (route.name === 'Selling') {
                  iconName = 'pricetag';
                } else if (route.name === 'My Profile') {
                  iconName = 'person';
                }
                return <Ionicons name={iconName} size={focused ? size + 8 : size} color={color} />;
              },
              tabBarActiveTintColor: '#58A4B0',
              tabBarInactiveTintColor: 'gray',
              tabBarStyle: {
                height: Platform.OS === 'ios' ? 90 : 70, // Adjust height for Android and iOS
                paddingBottom: Platform.OS === 'ios' ? 30 : 15, // Add padding for iOS/Android
                paddingTop: 10, // Padding at the top for both platforms
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 5,
              },
              headerShown: false,
              tabBarAnimationEnabled: true,
            })}
          >
            <Tab.Screen name="Home" component={HomeStack} />
            <Tab.Screen name="Shop" component={ShopPage} />
            <Tab.Screen name="Search" component={SearchPage} />
            <Tab.Screen name="Selling" component={SellingPage} />
            <Tab.Screen name="My Profile" component={ProfilePage} />
          </Tab.Navigator>
        </View>
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, // Ensure the padding is only for Android
  },
});
