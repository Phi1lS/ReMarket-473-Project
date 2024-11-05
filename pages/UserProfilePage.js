import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Avatar } from 'react-native-paper';
import { Ionicons } from 'react-native-vector-icons';
import { UserContext } from '../UserContext';
import { getDownloadURL, ref } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import fallbackAvatar from '../assets/avatar.png';
import { doc, getDoc, addDoc, collection, onSnapshot } from 'firebase/firestore';

export default function UserProfilePage({ route, navigation }) {
  const { userId } = route.params;
  const { currentUser } = useContext(UserContext); // Retrieve currentUser from UserContext
  const [user, setUser] = useState(null);
  const [selectedTab, setSelectedTab] = useState('activity');
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [userAvatarUrl, setUserAvatarUrl] = useState(null);
  const [purchasesWithImages, setPurchasesWithImages] = useState([]);
  const [isPending, setIsPending] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]); // Store incoming friend requests

  const handleAddFriend = async () => {
    setIsPending(true);
    try {
      // Create friend request document in Firestore
      await db.collection('friendRequests').add({
        senderId: currentUser.id,
        receiverId: userId,
        status: 'pending',
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error sending friend request:", error);
      setIsPending(false); // Reset if an error occurs
    }
  };

  // Listen for incoming friend requests
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = db
      .collection('friendRequests')
      .where('receiverId', '==', currentUser.id)
      .where('status', '==', 'pending')
      .onSnapshot((snapshot) => {
        const requests = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setFriendRequests(requests);
      });
    return () => unsubscribe();
  }, [currentUser]);

  // Handle accepting or denying a friend request
  const handleRequestResponse = async (requestId, status) => {
    try {
      await db.collection('friendRequests').doc(requestId).update({ status });
    } catch (error) {
      console.error("Error updating friend request:", error);
    }
  };

  // Track changes to the sender’s friend request status
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = db
      .collection('friendRequests')
      .where('senderId', '==', currentUser.id)
      .onSnapshot((snapshot) => {
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.status !== 'pending') {
            alert(`Your friend request was ${data.status}`);
            setIsPending(false); // Reset pending status
          }
        });
      });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        console.error('Error: userId is undefined or null');
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser(userData);
          if (userData.avatar) {
            const avatarRef = ref(storage, userData.avatar);
            const avatarUrl = await getDownloadURL(avatarRef);
            setUserAvatarUrl(avatarUrl);
          } else {
            setUserAvatarUrl(null);
          }
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

  useEffect(() => {
    const fetchPurchaseImages = async () => {
      const purchasesWithImagesList = await Promise.all(
        purchases.map(async (purchase) => {
          if (purchase.imageUrl) {
            try {
              const imageRef = ref(storage, purchase.imageUrl);
              const fullImageUrl = await getDownloadURL(imageRef);
              return { ...purchase, imageUrl: fullImageUrl }; // Add full image URL to the purchase
            } catch (error) {
              console.warn(`Failed to fetch image for purchase ${purchase.id}:`, error);
              return purchase; // Return purchase without updating imageUrl on error
            }
          }
          return purchase; // Return purchase if no imageUrl is provided
        })
      );
      setPurchasesWithImages(purchasesWithImagesList);
    };

    if (purchases.length > 0) {
      fetchPurchaseImages();
    }
  }, [purchases]);

  const sortPurchasesByDate = (purchases) => {
    return purchases.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
  };

  const handleTabSwitch = (tab) => setSelectedTab(tab);

  const renderPurchaseItem = (item) => (
    <View key={item.id} style={styles.purchaseItemContainer}>
      <View style={styles.purchaseItem}>
        <Image source={{ uri: item.imageUrl }} style={styles.purchaseImage} />
        <View style={styles.purchaseDetails}>
          <Text style={styles.purchaseTitle}>{item.itemName}</Text>
          <Text style={styles.purchaseText}>{item.message || 'No message'}</Text>
          <Text style={styles.purchaseText}>{new Date(item.timestamp?.seconds * 1000).toLocaleDateString()}</Text>
        </View>
      </View>
      <View style={styles.separator} />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0070BA" />
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
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.header}>
        <Avatar.Image
          size={90}
          source={userAvatarUrl ? { uri: userAvatarUrl } : fallbackAvatar}
          style={styles.avatar}
        />
        <Text style={styles.name}>
          {user.firstName ? user.firstName : 'First Name'}{' '}
          {user.lastName ? user.lastName : 'Last Name'}
        </Text>
        <Text style={styles.username}>
          {user.username ? user.username : 'No username available'}
        </Text>
        <TouchableOpacity style={styles.addFriendButton} onPress={handleAddFriend} disabled={isPending}>
          <Ionicons name="person-add-outline" size={24} color="#fff" />
          <Text style={styles.addFriendText}>{isPending ? 'Pending Request' : 'Add Friend'}</Text>
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
          {purchasesWithImages.length > 0 ? (
            sortPurchasesByDate(purchasesWithImages).map((item) => renderPurchaseItem(item))
          ) : (
            <Text style={styles.noTransactions}>No purchases to show.</Text>
          )}
        </View>
      ) : (
        <View style={styles.friendsSection}>
          <Text style={styles.noTransactions}>No friends yet.</Text>
        </View>
      )}
    </ScrollView>
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
    marginTop: 20,
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
  purchaseItemContainer: {
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
  },
  purchaseItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignSelf: 'center',
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
  },
  noTransactions: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});