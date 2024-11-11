import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Avatar } from 'react-native-paper';
import { Ionicons } from 'react-native-vector-icons';
import { UserContext } from '../UserContext';
import { getDownloadURL, ref } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import fallbackAvatar from '../assets/avatar.png';
import { doc, getDoc, addDoc, collection, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';

export default function UserProfilePage({ route, navigation }) {
  const { userId } = route.params;
  const { userProfile } = useContext(UserContext);
  const [user, setUser] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);
  
  useEffect(() => {
    // Load friend requests for logged-in user
    if (!userProfile.id) return;

    const unsubscribe = onSnapshot(
      collection(db, 'friendRequests'),
      (snapshot) => {
        const requests = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(doc => doc.receiverId === userProfile.id && doc.status === 'pending');

        setFriendRequests(requests);
      }
    );

    return () => unsubscribe();
  }, [userProfile.id]);

  const renderFriendRequest = (request) => (
    <View key={request.id} style={styles.friendRequestContainer}>
      <Text style={styles.friendRequestText}>
        {request.senderId} wants to be your friend
      </Text>
      <View style={styles.friendRequestButtons}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => confirmFriendRequest(request.id, request.senderId)}
        >
          <Text style={styles.buttonText}>Confirm</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.denyButton}
          onPress={() => denyFriendRequest(request.id)}
        >
          <Text style={styles.buttonText}>Deny</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
      {/* Friend Requests Section */}
      {userProfile.id && friendRequests.length > 0 && (
        <View style={styles.friendRequestsSection}>
          <Text style={styles.friendRequestsHeader}>Friend Requests</Text>
          {friendRequests.map(request => renderFriendRequest(request))}
        </View>
      )}

      {/* Other Profile Elements */}
    </ScrollView>
  );
}


  const confirmFriendRequest = async (requestId, senderId) => {
    try {
      await updateDoc(doc(db, 'friendRequests', requestId), { status: 'accepted' });

      await addDoc(collection(db, 'users', userProfile.id, 'friends'), { friendId: senderId });
      await addDoc(collection(db, 'users', senderId, 'friends'), { friendId: userProfile.id });

      console.log("Friend request accepted");
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const denyFriendRequest = async (requestId) => {
    try {
      await updateDoc(doc(db, 'friendRequests', requestId), { status: 'denied' });
      console.log("Friend request denied");
    } catch (error) {
      console.error("Error denying friend request:", error);
    }
  };

  useEffect(() => {
    if (!userProfile.id) return; // Only fetch if user is logged in
  
    const unsubscribe = onSnapshot(
      collection(db, 'friendRequests'),
      (snapshot) => {
        const requests = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(doc => doc.receiverId === userProfile.id && doc.status === 'pending'); // Filter pending requests for logged-in user
  
        setFriendRequests(requests);
      }
    );
  
    return () => unsubscribe();
  }, [userProfile.id]);
  

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

  const renderFriendRequest = (request) => (
    <View key={request.id} style={styles.friendRequestContainer}>
      <Text style={styles.friendRequestText}>
        {request.senderId} wants to be your friend
      </Text>
      <View style={styles.friendRequestButtons}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => confirmFriendRequest(request.id, request.senderId)}
        >
          <Text style={styles.buttonText}>Confirm</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.denyButton}
          onPress={() => denyFriendRequest(request.id)}
        >
          <Text style={styles.buttonText}>Deny</Text>
        </TouchableOpacity>
      </View>
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

      <View>
        {userProfile.id === userId && friendRequests.map(request => renderFriendRequest(request))}
      </View>
      {userProfile.id && friendRequests.length > 0 && (
      <View style={styles.friendRequestsSection}>
        <Text style={styles.friendRequestsHeader}>Friend Requests</Text>
        {friendRequests.map(request => renderFriendRequest(request))}
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