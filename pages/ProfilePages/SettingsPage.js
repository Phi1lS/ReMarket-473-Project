import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth'; // Import signOut function from Firebase
import { auth } from '../../firebaseConfig'; // Ensure you have the correct Firebase config path

export default function SettingsPage({ navigation }) {
  const settingsOptions = [
    { key: 'Account', icon: 'person-outline', screen: 'AccountPage' },
    { key: 'Payment Methods', icon: 'card-outline', screen: 'PaymentMethodsPage' },
    { key: 'Shipping Addresses', icon: 'location-outline', screen: 'ShippingAddressesPage' },
    { key: 'Change Password', icon: 'lock-closed-outline', screen: 'ChangePasswordPage' },
  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.item} onPress={() => navigation.navigate(item.screen)}>
      <View style={styles.itemContent}>
        <Ionicons name={item.icon} size={24} color="black" style={styles.icon} />
        <Text style={styles.itemText}>{item.key}</Text>
      </View>
    </TouchableOpacity>
  );

  // Show a confirmation prompt before logout
  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      const isConfirmed = window.confirm('Are you sure you want to log out?');
      if (isConfirmed) {
        handleLogout();
      }
    } else {
      Alert.alert(
        'Confirm Logout',
        'Are you sure you want to log out?',
        [
          {
            text: 'Cancel',
            style: 'cancel', // Default style
          },
          {
            text: 'Log Out', // Log out button
            onPress: () => handleLogout(), // Call handleLogout on confirmation
          },
        ],
        { cancelable: true }
      );
    }
  };

  // Perform the logout operation
  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign out the user from Firebase
      Alert.alert('Logged out', 'You have been logged out successfully.');
    } catch (error) {
      Alert.alert('Error', error.message); // Handle error during sign-out
    }
  };

  const renderLogoutItem = () => (
    <TouchableOpacity style={styles.item} onPress={confirmLogout}>
      <View style={styles.itemContent}>
        <Ionicons name="log-out-outline" size={24} color="black" style={styles.icon} />
        <Text style={[styles.itemText, styles.logoutText]}>Log Out of ReMarket</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={settingsOptions}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        ListFooterComponent={renderLogoutItem} // Add the log out option at the end
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  item: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 16,
  },
  itemText: {
    fontSize: 18,
  },
  logoutText: {
    color: 'red', // Red color for the logout option to highlight it
  },
});