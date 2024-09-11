import React from 'react';
import { SafeAreaView, StyleSheet, Platform, StatusBar } from 'react-native'; // Added Platform and StatusBar
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screen components
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import SearchPage from './pages/SearchPage';
import SellingPage from './pages/SellingPage';
import ProfilePage from './pages/ProfilePage';

// Create Bottom Tab Navigator
const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <SafeAreaView style={styles.safeArea}>
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

                return <Ionicons name={iconName} size={focused ? size + 6 : size} color={color} />;
              },
              tabBarActiveTintColor: '#58A4B0',
              tabBarInactiveTintColor: 'gray',
              tabBarStyle: {
                height: 60,
                paddingBottom: 10,
                // Adding shadow to navbar
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 5,
              },
              headerShown: false,
              tabBarAnimationEnabled: true, // Enable smooth tab animations
            })}
          >
            <Tab.Screen name="Home" component={HomePage} />
            <Tab.Screen name="Shop" component={ShopPage} />
            <Tab.Screen name="Search" component={SearchPage} />
            <Tab.Screen name="Selling" component={SellingPage} />
            <Tab.Screen name="My Profile" component={ProfilePage} />
          </Tab.Navigator>
        </SafeAreaView>
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, // Add padding for Android status bar
  },
});
