import React from 'react';
import { StyleSheet, Platform, StatusBar, View, TouchableOpacity } from 'react-native';
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
import ItemPage from './pages/ItemPage'; 
import CreateListingPage from './pages/SellPages/CreateListingPage';
import SearchUsersPage from './pages/HomePages/SearchUsersPage';
import CartPage from './pages/ShopPages/CartPage';
import SettingsPage from './pages/ProfilePages/SettingsPage'
import NotificationsPage from './pages/ProfilePages/NotificationsPage';
import UserProfilePage from './pages/UserProfilePage'

// Create Bottom Tab Navigator
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home Stack for HomePage and ItemDetailScreen navigation
function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#4CB0E6',
        headerTitleStyle: { color: '#000' },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen 
        name="HomeScreen" 
        component={HomePage} 
        options={{ title: 'Home', headerShown: false }} 
      />
      <Stack.Screen 
        name="ItemDetail" 
        component={ItemDetailScreen} 
        options={{ title: 'Purchase' }} 
      />
      <Stack.Screen 
        name="ItemPage" 
        component={ItemPage} 
        options={{ title: 'Item Details' }} 
      />
      <Stack.Screen 
        name="SearchUsers" 
        component={SearchUsersPage} 
        options={{ title: 'Search Users' }} 
      />
      <Stack.Screen
        name="UserProfilePage"
        component={UserProfilePage} // Use the correct component name
        options={{ title: 'User Profile' }} // Title for user profile page
      />
    </Stack.Navigator>
  );
}

// Shop Stack for ShopPage and ItemPage navigation
function ShopStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#4CB0E6',
        headerTitleStyle: { color: '#000' },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen 
        name="ShopScreen" 
        component={ShopPage} 
        options={{ title: 'Shop', headerShown: false }} 
      />
      <Stack.Screen 
        name="ItemPage" 
        component={ItemPage} 
        options={{ title: 'Item Details' }} 
      />
      <Stack.Screen 
        name="CartPage" 
        component={CartPage} 
        options={{ title: 'Your Cart' }} 
      />
    </Stack.Navigator>
  );
}

// Selling Stack for SellingPage and CreateListingPage navigation
function SellingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#4CB0E6',
        headerTitleStyle: { color: '#000' },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen 
        name="SellingScreen" 
        component={SellingPage} 
        options={{ title: 'Selling', headerShown: false }} 
      />
      <Stack.Screen 
        name="CreateListingPage" 
        component={CreateListingPage} 
        options={{ title: 'Create Listing' }} 
      />
      <Stack.Screen 
        name="ItemPage" 
        component={ItemPage} 
        options={{ title: 'Item Details' }} 
      />
    </Stack.Navigator>
  );
}

// Create a separate Search Stack
function SearchStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#4CB0E6',
        headerTitleStyle: { color: '#000' },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen 
        name="SearchScreen" 
        component={SearchPage} 
        options={{ title: 'Search', headerShown: false }} 
      />
      <Stack.Screen 
        name="ItemPage" 
        component={ItemPage} 
        options={{ title: 'Item Details' }} 
      />
    </Stack.Navigator>
  );
}

// Profile Stack for ProfilePage, SettingsPage, and NotificationsPage navigation
function ProfileStack({ navigation }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#4CB0E6',
        headerTitleStyle: { color: '#000' },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen 
        name="ProfileScreen" 
        component={ProfilePage} 
        options={{ title: 'My Profile', headerShown: false }} 
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsPage} 
        options={{ title: 'Settings' }} 
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsPage} 
        options={{ title: 'Notifications' }} 
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
                if (route.name === 'HomeTab') {
                  iconName = 'home';
                } else if (route.name === 'ShopTab') {
                  iconName = 'cart';
                } else if (route.name === 'SearchTab') {
                  iconName = 'search';
                } else if (route.name === 'SellingTab') {
                  iconName = 'pricetag';
                } else if (route.name === 'ProfileTab') {
                  iconName = 'person';
                }
                return <Ionicons name={iconName} size={focused ? size + 8 : size} color={color} />;
              },
              tabBarActiveTintColor: '#4CB0E6',  
              tabBarInactiveTintColor: 'gray',
              tabBarStyle: {
                height: Platform.OS === 'ios' ? 90 : 70,
                paddingBottom: Platform.OS === 'ios' ? 30 : 15,
                paddingTop: 10,
              },
              headerShown: false,
              tabBarAnimationEnabled: true,
            })}
          >
            <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: 'Home' }} />
            <Tab.Screen name="ShopTab" component={ShopStack} options={{ title: 'Shop' }} />
            <Tab.Screen name="SearchTab" component={SearchStack} options={{ title: 'Search' }} />
            <Tab.Screen name="SellingTab" component={SellingStack} options={{ title: 'Selling' }} />
            <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'My Profile' }} />
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, 
  },
});