import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Avatar } from 'react-native-paper';
import { Ionicons } from 'react-native-vector-icons';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../UserContext';
import { getDownloadURL, ref } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import fallbackAvatar from '../assets/avatar.png';
import { doc, getDoc, addDoc, collection, onSnapshot, serverTimestamp, updateDoc, query, where, getDocs, deleteDoc, } from 'firebase/firestore';

export default function UserProfilePage({ route }) {
  const navigation = useNavigation();
  const { userId } = route.params;
  const { userProfile, sendFriendRequest } = useContext(UserContext);
  const [user, setUser] = useState(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState(null);
  const [selectedTab, setSelectedTab] = useState('activity');
  const [purchasesWithImages, setPurchasesWithImages] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [isPendingRequest, setIsPendingRequest] = useState(false);

  useEffect(() => {
    const initializePage = async () => {
      if (!userId) return;
      try {
        // Fetch user details
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser(userData);
          if (userData.avatar) {
            const avatarRef = ref(storage, userData.avatar);
            const avatarUrl = await getDownloadURL(avatarRef);
            setUserAvatarUrl(avatarUrl);
          }
        }

        // Fetch friends list
        await fetchFriendsList();

        // Set up real-time friend status and pending request listeners
        setupFriendStatusListener();
        setupPendingRequestListener();
      } catch (error) {
        console.error('Error initializing user profile:', error);
      } finally {
        setLoading(false); // Set loading to false after all data is fetched
      }
    };

    const fetchFriendsList = async () => {
      try {
        const friendsRef = collection(db, 'users', userId, 'friends');
        const friendsSnapshot = await getDocs(friendsRef);
        const friendsData = await Promise.all(
          friendsSnapshot.docs.map(async (docSnapshot) => {
            const friendData = docSnapshot.data();
            const friendDoc = await getDoc(doc(db, 'users', friendData.friendId));
            if (friendDoc.exists()) {
              const friendProfile = friendDoc.data();
              if (friendProfile.avatar) {
                try {
                  const avatarRef = ref(storage, friendProfile.avatar);
                  friendProfile.avatar = await getDownloadURL(avatarRef);
                } catch (error) {
                  console.warn(`Failed to fetch avatar for friend ${friendDoc.id}:`, error);
                }
              }
              return { id: friendDoc.id, ...friendProfile };
            }
            return null;
          })
        );

        const sortedFriends = friendsData
          .filter(friend => friend)
          .sort((a, b) => a.firstName.localeCompare(b.firstName));
        setFriendsList(sortedFriends);
      } catch (error) {
        console.error("Error fetching friends list:", error);
      }
    };

    const setupFriendStatusListener = () => {
      const friendsRef = collection(db, 'users', userProfile.id, 'friends');
      const unsubscribe = onSnapshot(friendsRef, (querySnapshot) => {
        const friendExists = querySnapshot.docs.some((doc) => doc.data().friendId === userId);
        setIsFriend(friendExists);
      });
      return unsubscribe;
    };

    const setupPendingRequestListener = () => {
      const friendRequestsRef = collection(db, 'friendRequests');
      const pendingRequestQuery = query(
        friendRequestsRef,
        where("senderId", "==", userId),
        where("receiverId", "==", userProfile.id),
        where("status", "==", "pending")
      );
      const unsubscribe = onSnapshot(pendingRequestQuery, (querySnapshot) => {
        setIsPendingRequest(!querySnapshot.empty);
      });
      return unsubscribe;
    };

    const unsubscribeFriendsListener = setupFriendStatusListener();
    const unsubscribePendingRequestListener = setupPendingRequestListener();

    initializePage();

    return () => {
      unsubscribeFriendsListener();
      unsubscribePendingRequestListener();
    };
  }, [userId, userProfile.id]);

  const acceptFriendRequest = async () => {
    try {
      const friendRequestsRef = collection(db, 'friendRequests');
      const q = query(
        friendRequestsRef,
        where("receiverId", "==", userProfile.id),
        where("senderId", "==", userId),
        where("status", "==", "pending")
      );
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        console.log("No pending friend request found.");
        return;
      }
  
      const friendRequestDoc = querySnapshot.docs[0];
      await updateDoc(friendRequestDoc.ref, { status: "accepted" });
  
      // Add each user as a friend
      await addDoc(collection(db, 'users', userProfile.id, 'friends'), { friendId: userId });
      await addDoc(collection(db, 'users', userId, 'friends'), { friendId: userProfile.id });
  
      // Create notifications for both users
      const userNotificationRef = collection(db, 'users', userProfile.id, 'notifications');
      const senderNotificationRef = collection(db, 'users', userId, 'notifications');
  
      await addDoc(userNotificationRef, {
        type: "friendAccepted",
        friendName: `${user.firstName} ${user.lastName}`,
        timestamp: serverTimestamp(),
        status: "unread",
      });
  
      await addDoc(senderNotificationRef, {
        type: "friendAccepted",
        friendName: `${userProfile.firstName} ${userProfile.lastName}`,
        timestamp: serverTimestamp(),
        status: "unread",
      });
  
      // Delete the original friend request notification
      const notificationQuery = query(
        collection(db, 'users', userProfile.id, 'notifications'),
        where("type", "==", "friendRequest"),
        where("senderId", "==", userId)
      );
      const notificationSnapshot = await getDocs(notificationQuery);
  
      notificationSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
  
      setIsFriend(true);
      setIsPendingRequest(false);
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };
  
  const denyFriendRequest = async () => {
    try {
      const friendRequestsRef = collection(db, 'friendRequests');
      const q = query(
        friendRequestsRef,
        where("receiverId", "==", userProfile.id),
        where("senderId", "==", userId),
        where("status", "==", "pending")
      );
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        console.log("No pending friend request found.");
        return;
      }
  
      const friendRequestDoc = querySnapshot.docs[0];
      await deleteDoc(friendRequestDoc.ref);
  
      // Delete the original friend request notification
      const notificationQuery = query(
        collection(db, 'users', userProfile.id, 'notifications'),
        where("type", "==", "friendRequest"),
        where("senderId", "==", userId)
      );
      const notificationSnapshot = await getDocs(notificationQuery);
  
      notificationSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
  
      setIsPendingRequest(false);
    } catch (error) {
      console.error("Error denying friend request:", error);
    }
  };

  const handleAddFriend = () => {
    if (userProfile.id) {
      sendFriendRequest(userId);
      setIsPending(true);
    }
  };

  const handleTabSwitch = (tab) => setSelectedTab(tab);

  useEffect(() => {
    // Fetch purchases in real-time when Activity tab is selected
    if (selectedTab === 'activity') {
      const purchasesRef = collection(db, 'users', userId, 'purchases');
      const unsubscribePurchases = onSnapshot(purchasesRef, (querySnapshot) => {
        const purchasesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        fetchPurchaseImages(purchasesList);
      });
      return () => unsubscribePurchases();
    }
  }, [selectedTab, userId]);

  const fetchPurchaseImages = async (purchases) => {
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

  useEffect(() => {
    // Fetch friends list in real-time when Friends tab is selected
    if (selectedTab === 'friends') {
      const friendsRef = collection(db, 'users', userId, 'friends');
      const unsubscribeFriends = onSnapshot(friendsRef, async (querySnapshot) => {
        const friendsData = await Promise.all(
          querySnapshot.docs.map(async (docSnapshot) => {
            const friendData = docSnapshot.data();
            const friendDoc = await getDoc(doc(db, 'users', friendData.friendId));
            if (friendDoc.exists()) {
              const friendProfile = friendDoc.data();
              if (friendProfile.avatar) {
                try {
                  const avatarRef = ref(storage, friendProfile.avatar);
                  friendProfile.avatar = await getDownloadURL(avatarRef);
                } catch (error) {
                  console.warn(`Failed to fetch avatar for friend ${friendDoc.id}:`, error);
                }
              }
              return { id: friendDoc.id, ...friendProfile };
            }
            return null;
          })
        );
        const sortedFriends = friendsData
          .filter(friend => friend)
          .sort((a, b) => a.firstName.localeCompare(b.firstName));
        setFriendsList(sortedFriends);
      });
      return () => unsubscribeFriends();
    }
  }, [selectedTab, userId]);

  const handleRemoveFriend = async () => {
    try {
      // Remove friend from current user's friends subcollection
      const currentUserFriendRef = collection(db, 'users', userProfile.id, 'friends');
      const currentUserFriendQuery = query(currentUserFriendRef, where("friendId", "==", userId));
      const currentUserFriendSnapshot = await getDocs(currentUserFriendQuery);
      currentUserFriendSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
  
      // Remove current user from the other user's friends subcollection
      const otherUserFriendRef = collection(db, 'users', userId, 'friends');
      const otherUserFriendQuery = query(otherUserFriendRef, where("friendId", "==", userProfile.id));
      const otherUserFriendSnapshot = await getDocs(otherUserFriendQuery);
      otherUserFriendSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
  
      // Delete any friend request between the users in the global friendRequests collection
      const friendRequestsRef = collection(db, 'friendRequests');
      const friendRequestQuery = query(
        friendRequestsRef,
        where("receiverId", "in", [userProfile.id, userId]),
        where("senderId", "in", [userProfile.id, userId])
      );
      const friendRequestSnapshot = await getDocs(friendRequestQuery);
      friendRequestSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
  
      setIsFriend(false);
      Alert.alert("Friend Removed", `You are no longer friends with ${user.firstName}.`);
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  const renderFriendRequestButtons = () => {
    if (isPendingRequest) {
      return (
        <>
          <TouchableOpacity style={styles.acceptButton} onPress={acceptFriendRequest}>
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.denyButton} onPress={denyFriendRequest}>
            <Text style={styles.buttonText}>Deny</Text>
          </TouchableOpacity>
        </>
      );
    }

    return (
      <TouchableOpacity
        style={styles.addFriendButton}
        onPress={() => {
          if (isFriend) {
            Alert.alert(
              "Remove Friend",
              `Are you sure you want to remove ${user.firstName} as a friend?`,
              [
                { text: "Cancel", style: "cancel" },
                { text: "Yes", onPress: handleRemoveFriend }
              ]
            );
          } else {
            handleAddFriend();
          }
        }}
        disabled={isPending}
      >
        <Ionicons name={isFriend ? "checkmark-circle" : "person-add-outline"} size={24} color="#fff" />
        <Text style={styles.addFriendText}>
          {isFriend ? 'Friends' : isPending ? 'Pending Request' : 'Add Friend'}
        </Text>
      </TouchableOpacity>
    );
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


  const renderFriendItem = (friend) => (
    <TouchableOpacity 
      key={friend.id} 
      style={styles.friendItem} 
      onPress={() => navigation.push('UserProfilePage', { userId: friend.id })}
    >
      <Avatar.Image 
        size={50} 
        style={styles.friendPhoto} 
        source={friend.avatar ? { uri: friend.avatar } : fallbackAvatar} 
      />
      <Text style={styles.friendName}>{friend.firstName} {friend.lastName}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0070BA" />
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
          {user?.firstName || 'First Name'} {user?.lastName || 'Last Name'}
        </Text>
        <Text style={styles.username}>
          {user?.username || 'No username available'}
        </Text>
        {userProfile.id !== userId && (
          <View style={styles.friendRequestButtons}>
            {renderFriendRequestButtons()}
          </View>
        )}
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
            purchasesWithImages.map((item) => renderPurchaseItem(item))
          ) : (
            <Text style={styles.noTransactions}>No purchases to show.</Text>
          )}
        </View>
      ) : (
        <View style={styles.friendsSection}>
          {friendsList.length > 0 ? (
            friendsList.map((friend) => renderFriendItem(friend))
          ) : (
            <Text style={styles.noTransactions}>No friends to show.</Text>
          )}
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
  friendsSection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
  },
  friendItem: {
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15, // Adds consistent space between avatar and text
  },
  friendAvatar: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  friendNameContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  friendDetailsText: {
    fontSize: 14,
    color: '#555',
  },
  friendPhoto: {
    backgroundColor: '#4CB0E6',
  },
  friendRequestButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  acceptButton: {
    backgroundColor: '#4CAF50', // Green color for accept
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 5,
  },
  denyButton: {
    backgroundColor: '#F44336', // Red color for deny
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});