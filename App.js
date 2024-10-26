import React from 'react';
import { StyleSheet, Platform, StatusBar, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { UserProvider } from './UserContext';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack'; 
import { Ionicons } from '@expo/vector-icons';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebaseConfig';

// Import screen components
import CreateAccountScreen from './pages/CreateAccount'; 
import LoginScreen from './pages/LoginScreen';
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
import CategoryPage from './pages/ShopPages/CategoryPage';
import CheckoutPage from './pages/ShopPages/CheckoutPage';
import SettingsPage from './pages/ProfilePages/SettingsPage';
import NotificationsPage from './pages/ProfilePages/NotificationsPage';
import UserProfilePage from './pages/UserProfilePage';
import AccountPage from './pages/SettingsPages/AccountPage';
import PaymentMethodsPage from './pages/SettingsPages/PaymentMethodsPage';
import ShippingAddressesPage from './pages/SettingsPages/ShippingAddressesPage';
import ChangePasswordPage from './pages/SettingsPages/ChangePasswordPage';

// Create Bottom Tab Navigator
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Create an Auth stack for login and account creation
function AuthStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="CreateAccountScreen" component={CreateAccountScreen} />
      <Stack.Screen name="HomeTab" component={HomePage} />
    </Stack.Navigator>
  );
}

function MainTabNavigator() {
  return (
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
  );
}

// Settings Stack for the settings-related screens
function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#4CB0E6',
        headerTitleStyle: { color: '#000' },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen name="SettingsPage" component={SettingsPage} options={{ title: 'Settings' }} />
      <Stack.Screen name="AccountPage" component={AccountPage} options={{ title: 'Account' }} />
      <Stack.Screen name="PaymentMethodsPage" component={PaymentMethodsPage} options={{ title: '' }} />
      <Stack.Screen name="ShippingAddressesPage" component={ShippingAddressesPage} options={{ title: '' }} />
      <Stack.Screen name="ChangePasswordPage" component={ChangePasswordPage} options={{ title: '' }} />
    </Stack.Navigator>
  );
}

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
        component={UserProfilePage} 
        options={{ title: 'User Profile' }} 
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
      <Stack.Screen 
        name="CategoryPage" 
        component={CategoryPage} 
        options={{ title: '' }} 
      />
      <Stack.Screen 
        name="CheckoutPage" 
        component={CheckoutPage} 
        options={{ title: '' }} 
      />
      <Stack.Screen name="PaymentMethodsPage" component={PaymentMethodsPage} options={{ title: '' }} />
      <Stack.Screen name="ShippingAddressesPage" component={ShippingAddressesPage} options={{ title: '' }} />
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
      <Stack.Screen
        name="UserProfilePage"
        component={UserProfilePage} 
        options={{ title: 'User Profile' }} 
      />
    </Stack.Navigator>
  );
}

// Profile Stack for ProfilePage, SettingsPage, and NotificationsPage navigation
function ProfileStack() {
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
        component={SettingsStack} 
        options={{ title: 'Settings', headerShown: false }} 
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsPage} 
        options={{ title: 'Notifications' }} 
      />
      <Stack.Screen name="PaymentMethodsPage" component={PaymentMethodsPage} options={{ title: '' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [user, loading] = useAuthState(auth); // Firebase authentication

  // If Firebase auth state is loading, show a loading spinner or splash screen
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CB0E6" />
      </View>
    );
  }

  return (
    <UserProvider>
      <NavigationContainer>
        {user ? (
          <MainTabNavigator />
        ) : (
          <Stack.Navigator initialRouteName="Auth">
            {/* Authentication Flow */}
            <Stack.Screen 
              name="Auth" 
              component={AuthStackNavigator} 
              options={{ headerShown: false }} 
            />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, 
  },
});