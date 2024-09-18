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
import ItemPage from './pages/ItemPage'; 
import CreateListingPage from './pages/SellPages/CreateListingPage';
import SearchUsersPage from './pages/HomePages/SearchUsersPage';
import CartPage from './pages/ShopPages/CartPage';

// Create Bottom Tab Navigator
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home Stack for HomePage and ItemDetailScreen navigation
function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#4CB0E6',  // Changed from teal to blue
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
        options={{ title: 'Purchase' }} 
      />
      <Stack.Screen 
        name="ItemPage" 
        component={ItemPage} 
        options={{ title: 'Item Details' }} 
      />
      <Stack.Screen 
        name="SearchUsersPage" 
        component={SearchUsersPage} 
        options={{ title: 'Search Users' }} 
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
        headerTintColor: '#4CB0E6',  // Changed from teal to blue
        headerTitleStyle: { color: '#000' },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen name="Shop" component={ShopPage} options={{ headerShown: false }} />
      <Stack.Screen name="ItemPage" component={ItemPage} options={{ title: 'Item Details' }} />
      <Stack.Screen name="CartPage" component={CartPage} options={{title: 'Your Cart' }} />
    </Stack.Navigator>
  );
}

// Selling Stack for SellingPage and CreateListingPage navigation
function SellingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#4CB0E6',  // Changed from teal to blue
        headerTitleStyle: { color: '#000' },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen name="Selling" component={SellingPage} options={{ headerShown: false }} />
      <Stack.Screen name="CreateListingPage" component={CreateListingPage} options={{ title: 'Create Listing' }} />
      <Stack.Screen name="ItemPage" component={ItemPage} options={{ title: 'Item Details' }} />
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
              tabBarActiveTintColor: '#4CB0E6',  // Changed from teal to blue
              tabBarInactiveTintColor: 'gray',
              tabBarStyle: {
                height: Platform.OS === 'ios' ? 90 : 70,
                paddingBottom: Platform.OS === 'ios' ? 30 : 15,
                paddingTop: 10,
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
            <Tab.Screen name="Shop" component={ShopStack} />
            <Tab.Screen name="Search" component={SearchPage} />
            <Tab.Screen name="Selling" component={SellingStack} />
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, // Ensure padding is only for Android
  },
});
