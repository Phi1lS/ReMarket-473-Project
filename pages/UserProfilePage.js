import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Avatar } from 'react-native-paper';
import { Ionicons } from 'react-native-vector-icons';
import { UserContext } from '../UserContext';
import { getDownloadURL, ref } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import fallbackAvatar from '../assets/avatar.png';
import { doc, getDoc, addDoc, collection, onSnapshot, serverTimestamp, updateDoc, query, where, getDocs } from 'firebase/firestore';

export default function UserProfilePage({ route, navigation }) {
  const { userId } = route.params;
  const { userProfile, sendFriendRequest } = useContext(UserContext);
  const [user, setUser] = useState(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState(null);
  const [selectedTab, setSelectedTab] = useState('activity');
  const [purchases, setPurchases] = useState([]);
  const [purchasesWithImages, setPurchasesWithImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [isFriend, setIsFriend] = useState(false); // New state to track friendship status

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser(userData);
          if (userData.avatar) {
            const avatarRef = ref(storage, userData.avatar);
            const avatarUrl = await getDownloadURL(avatarRef);
            setUserAvatarUrl(avatarUrl);
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
  
    const checkFriendStatus = async () => {
      if (!userProfile.id || !userId) return;
    
      try {
        // Reference the friends subcollection for the current user
        const friendsRef = collection(db, 'users', userProfile.id, 'friends');
        const q = query(friendsRef, where("friendId", "==", userId));
    
        // Execute the query
        const querySnapshot = await getDocs(q);
    
        if (!querySnapshot.empty) {
          console.log("Users are already friends.");
          setIsFriend(true); // Set isFriend to true if the friendId is found
        } else {
          console.log("Users are not friends.");
          setIsFriend(false); // Set isFriend to false if no matching friendId is found
        }
      } catch (error) {
        console.error('Error checking friend status:', error);
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
    checkFriendStatus(); // Check if the current user is friends with this profile
    const unsubscribePurchases = fetchUserPurchases();
  
    return () => unsubscribePurchases();
  }, [userId, userProfile.id]);

  useEffect(() => {
    const fetchPurchaseImages = async () => {
      const purchasesWithImagesList = await Promise.all(
        purchases.map(async (purchase) => {
          if (purchase.imageUrl) {
            try {
              const imageRef = ref(storage, purchase.imageUrl);
              const fullImageUrl = await getDownloadURL(imageRef);
              return { ...purchase, imageUrl: fullImageUrl };
            } catch (error) {
              console.warn(`Failed to fetch image for purchase ${purchase.id}:`, error);
              return purchase;
            }
          }
          return purchase;
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

  const handleAddFriend = () => {
    if (userProfile.id) {
      sendFriendRequest(userId);
      setIsPending(true);
    }
  };

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
        <TouchableOpacity 
          style={styles.addFriendButton} 
          onPress={handleAddFriend} 
          disabled={isPending || isFriend}
        >
           <Ionicons 
            name={isFriend ? "checkmark-circle" : "person-add-outline"} 
            size={24} 
            color="#fff" 
          />
          <Text style={styles.addFriendText}>
            {isFriend ? 'Friends' : isPending ? 'Pending Request' : 'Add Friend'}
          </Text>
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

// Define all your styles here, including those for the new components
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
    justifyContent: 'space-around',
    marginHorizontal: 20,
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
    marginHorizontal: 20,
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
    marginHorizontal: 20,
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