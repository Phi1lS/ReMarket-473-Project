import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from 'react-native-paper';

const avatarPlaceholder = require('../assets/avatar.png');

export default function ProfilePage({ navigation }) {
  const [selectedTab, setSelectedTab] = useState('wallet'); // Tabs between 'wallet' and 'purchases'
  const [isPayPalLinked] = useState(true); // Set to true for demo purposes

  // Tabs handler
  const handleTabSwitch = (tab) => {
    setSelectedTab(tab);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        {/* Notification Bell and Settings Cog */}
        <View style={styles.iconContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={28} color="#4CB0E6" style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={28} color="#4CB0E6" />
          </TouchableOpacity>
        </View>

        {/* Avatar and User Info */}
        <Avatar.Image size={90} source={avatarPlaceholder} style={styles.avatar} />
        <Text style={styles.name}>User Name</Text>
        <Text style={styles.username}>@User-Name-7</Text>
      </View>

      {/* Tab Control: Wallet vs Purchases */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => handleTabSwitch('wallet')}
          style={[styles.tabButton, selectedTab === 'wallet' ? styles.activeTab : null]}
        >
          <Text style={[styles.tabText, selectedTab === 'wallet' ? styles.activeTabText : null]}>Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleTabSwitch('purchases')}
          style={[styles.tabButton, selectedTab === 'purchases' ? styles.activeTab : null]}
        >
          <Text style={[styles.tabText, selectedTab === 'purchases' ? styles.activeTabText : null]}>Purchases</Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Content Based on Tab */}
      {selectedTab === 'wallet' ? (
        <View style={styles.walletSection}>
          <Text style={styles.linkedPayPalLabel}>PayPal Status</Text>
          <View style={styles.linkedPayPalContainer}>
            <Ionicons name="logo-paypal" size={24} color="#0070BA" />
            <Text style={styles.linkedPayPalText}>
              {isPayPalLinked ? 'PayPal Connected' : 'No PayPal Connected'}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.transactionSection}>
          <Text style={styles.sectionTitle}>Recent Purchases</Text>
          <Text style={styles.noTransactions}>No purchases to show.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 80 : 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  username: {
    fontSize: 16,
    color: '#666',
  },
  avatar: {
    backgroundColor: '#4CB0E6',
  },
  iconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
  },
  icon: {
    marginRight: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 15,
  },
  tabButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#4CB0E6',
    borderRadius: 15,
  },
  tabText: {
    fontSize: 16,
    color: '#555',
  },
  activeTabText: {
    color: '#fff',
  },
  walletSection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  linkedPayPalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  linkedPayPalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  linkedPayPalText: {
    fontSize: 16,
    marginLeft: 10,
  },
  transactionSection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
  },
  noTransactions: {
    fontSize: 16,
    color: '#999',
  },
});
