import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { Avatar } from 'react-native-paper';
import { Ionicons } from 'react-native-vector-icons';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import fallbackAvatar from '../assets/avatar.png'; // Import the fallback avatar

export default function UserProfilePage({ route, navigation }) {
  const { userId } = route.params;
  const [user, setUser] = useState(null);
  const [selectedTab, setSelectedTab] = useState('activity');
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        console.error('Error: userId is undefined or null');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', userId));

        if (userDoc.exists()) {
          setUser(userDoc.data());
        } else {
          console.error('No such user exists in Firestore.');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserPurchases = () => {
      const purchasesRef = collection(db, 'users', userId, 'purchases');
      const unsubscribe = onSnapshot(purchasesRef, (querySnapshot) => {
        const purchasesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPurchases(purchasesList);
      });
      return unsubscribe;
    };

    fetchUserData();
    const unsubscribePurchases = fetchUserPurchases();

    return () => {
      unsubscribePurchases();
    };
  }, [userId]);

  const handleTabSwitch = (tab) => setSelectedTab(tab);

  const renderPurchaseItem = ({ item }) => (
    <View style={styles.purchaseItem}>
      <Image source={{ uri: item.imageUrl }} style={styles.purchaseImage} />
      <View style={styles.purchaseDetails}>
        <Text style={styles.purchaseTitle}>{item.itemName}</Text>
        <Text style={styles.purchaseText}>{item.message || 'No message'}</Text>
        <Text style={styles.purchaseText}>{new Date(item.timestamp?.seconds * 1000).toLocaleDateString()}</Text>
      </View>
    </View>
  );

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
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar.Image 
          size={90} 
          source={user.avatar ? { uri: user.avatar } : fallbackAvatar} 
          style={styles.avatar} 
        />
        <Text style={styles.name}>
          {user.firstName ? user.firstName : 'First Name'}{' '}
          {user.lastName ? user.lastName : 'Last Name'}
        </Text>
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
          {purchases.length > 0 ? (
            <FlatList
              data={purchases}
              renderItem={renderPurchaseItem}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={styles.purchaseListContainer}
            />
          ) : (
            <Text style={styles.noTransactions}>No purchases to show.</Text>
          )}
        </View>
      ) : (
        <View style={styles.friendsSection}>
          <Text>No friends yet.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#f5f5f5',
    elevation: 3,
  },
  avatar: {
    backgroundColor: '#4CB0E6',
    marginTop:20,
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
    justifyContent: 'space-around', // Adjust spacing
    marginHorizontal: 20, // Add horizontal margin
    marginBottom: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 15,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
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
  activitySection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20, // Add margins to ensure it's not full width
  },
  purchaseItem: {
    flexDirection: 'row',
    marginBottom: 10,
    maxWidth: '90%', // Restrict the width of each purchase item
    alignSelf: 'center', // Center-align the purchase items
  },
  purchaseImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  purchaseDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  purchaseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingBottom: 10,
  },
  purchaseText: {
    fontSize: 14,
    color: '#555',
  },
  separator: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
  },
  friendsSection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20, // Ensure same margins for friends section
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  purchaseListContainer: {
    paddingHorizontal: 10,
  },
  noTransactions: {
    fontSize: 16,
    color: '#999',
  },
});