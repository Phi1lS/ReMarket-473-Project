import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Avatar } from 'react-native-paper';
import { Ionicons } from 'react-native-vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function UserProfilePage({ route, navigation }) {
  const { userId } = route.params; // Get userId from route params
  const [user, setUser] = useState(null);
  const [selectedTab, setSelectedTab] = useState('activity');
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        console.error('Error: userId is undefined or null');
        return;
      }

      try {
        console.log('Fetching data for userId:', userId);
        const userDoc = await getDoc(doc(db, 'users', userId));

        if (userDoc.exists()) {
          console.log('User data:', userDoc.data()); // Log user data for debugging
          setUser(userDoc.data());
        } else {
          console.error('No such user exists in Firestore.');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false); // Hide loading indicator once data is fetched
      }
    };

    fetchUserData();
  }, [userId]);

  const handleTabSwitch = (tab) => setSelectedTab(tab);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading user data...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text>User not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      <View style={styles.header}>
        {/* Ensure user.avatar exists and is a valid URL */}
        <Avatar.Image 
          size={90} 
          source={user.avatar ? { uri: user.avatar } : null} 
          style={styles.avatar} 
        />
        {/* Safeguard against undefined or null values for firstName and lastName */}
        <Text style={styles.name}>
          {user.firstName ? user.firstName : 'First Name'}{' '}
          {user.lastName ? user.lastName : 'Last Name'}
        </Text>
        {/* Display username */}
        <Text style={styles.username}>
          {user.username ? user.username : 'No username available'}
        </Text>
        <TouchableOpacity style={styles.addFriendButton}>
          <Ionicons name="person-add-outline" size={24} color="#fff" />
          <Text style={styles.addFriendText}>Add Friend</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => handleTabSwitch('activity')}
          style={[styles.tabButton, selectedTab === 'activity' ? styles.activeTab : null]}
        >
          <Text style={[styles.tabText, selectedTab === 'activity' ? styles.activeTabText : null]}>
            Activity
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleTabSwitch('friends')}
          style={[styles.tabButton, selectedTab === 'friends' ? styles.activeTab : null]}
        >
          <Text style={[styles.tabText, selectedTab === 'friends' ? styles.activeTabText : null]}>
            Friends
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'activity' ? (
        <View style={styles.activitySection}>
          {/* Render activity feed */}
          <Text>No activity yet.</Text>
        </View>
      ) : (
        <View style={styles.friendsSection}>
          {/* Render friends list */}
          <Text>No friends yet.</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5', // You can customize the background color as needed
  },
});