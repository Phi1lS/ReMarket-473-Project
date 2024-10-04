import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Avatar } from 'react-native-paper';
import { Ionicons } from 'react-native-vector-icons';

const avatarPlaceholder = require('../assets/avatar.png');

// Sample data for user's friends and feed
const userFriends = [
  { id: 1, name: 'Friend 1', profilePic: avatarPlaceholder },
  { id: 2, name: 'Friend 2', profilePic: avatarPlaceholder },
  { id: 3, name: 'Friend 3', profilePic: avatarPlaceholder },
];

const userFeed = [
  { id: 1, item: 'Item A', description: 'Excited for this!', time: '10 minutes ago' },
  { id: 2, item: 'Item B', description: 'Looking forward to this.', time: '2 hours ago' },
];

export default function UserProfilePage({ route, navigation }) {
  const { user } = route.params; // Pass user data via route params
  const [selectedTab, setSelectedTab] = useState('activity'); // Selector between 'activity' and 'friends'

  const handleTabSwitch = (tab) => {
    setSelectedTab(tab);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Avatar.Image size={90} source={user.profilePic || avatarPlaceholder} style={styles.avatar} />
        <Text style={styles.name}>{user.name}</Text>
        <TouchableOpacity style={styles.addFriendButton}>
          <Ionicons name="person-add-outline" size={24} color="#fff" />
          <Text style={styles.addFriendText}>Add Friend</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => handleTabSwitch('activity')}
          style={[styles.tabButton, selectedTab === 'activity' ? styles.activeTab : null]}
        >
          <Text style={[styles.tabText, selectedTab === 'activity' ? styles.activeTabText : null]}>Activity</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleTabSwitch('friends')}
          style={[styles.tabButton, selectedTab === 'friends' ? styles.activeTab : null]}
        >
          <Text style={[styles.tabText, selectedTab === 'friends' ? styles.activeTabText : null]}>Friends</Text>
        </TouchableOpacity>
      </View>

      {/* Conditional rendering based on selected tab */}
      {selectedTab === 'activity' ? (
        <View style={styles.activitySection}>
          {/* Activity Section */}
          <FlatList
            data={userFeed}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => navigation.navigate('ItemDetail', { item })}>
                <View>
                  <View style={styles.activityItem}>
                    <Text style={styles.activityText}>{item.item}: {item.description}</Text>
                    <Text style={styles.activityTime}>{item.time}</Text>
                  </View>
                  <View style={styles.divider} />
                </View>
              </TouchableOpacity>
            )}
            scrollEnabled={false} // Disable FlatList scrolling to avoid conflict with ScrollView
          />
        </View>
      ) : (
        <View style={styles.friendsSection}>
          {/* Friends Section */}
          <FlatList
            data={userFriends}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => navigation.push('UserProfilePage', { user: item })}>
                <View>
                  <View style={styles.friendItem}>
                    <Avatar.Image size={50} source={item.profilePic} style={styles.friendAvatar} />
                    <Text style={styles.friendName}>{item.name}</Text>
                  </View>
                  <View style={styles.divider} />
                </View>
              </TouchableOpacity>
            )}
            scrollEnabled={false} // Disable FlatList scrolling to avoid conflict with ScrollView
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Set the overall background color to gray
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#f5f5f5', // Restored gray background for profile header
    padding: 20,
    elevation: 3,
  },
  avatar: {
    backgroundColor: '#4CB0E6',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  addFriendButton: {
    flexDirection: 'row',
    backgroundColor: '#4CB0E6',
    padding: 12,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 15,
  },
  addFriendText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
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
    backgroundColor: '#4CB0E6', // Blue background for active tab
    borderRadius: 15,
  },
  tabText: {
    fontSize: 16,
    color: '#555',
  },
  activeTabText: {
    color: '#fff',
  },
  activitySection: {
    backgroundColor: '#fff', // White background for the activity section
    borderRadius: 15,
    padding: 20,
  },
  activityItem: {
    paddingVertical: 15,
  },
  activityText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
  },
  friendsSection: {
    backgroundColor: '#fff', // White background for the friends section
    borderRadius: 15,
    padding: 20,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  friendAvatar: {
    backgroundColor: '#4CB0E6',
    marginRight: 15,
  },
  friendName: {
    fontSize: 16,
    color: '#555',
  },
});