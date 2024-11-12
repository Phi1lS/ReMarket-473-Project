import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { collection, onSnapshot, updateDoc, doc, addDoc, getDoc, query, where, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { UserContext } from '../../UserContext'; // Ensure your Firebase config is correctly imported

export default function NotificationsPage() {
  const { userProfile } = useContext(UserContext);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!userProfile.id) return;

    const notificationsRef = collection(db, 'users', userProfile.id, 'notifications');
    const unsubscribe = onSnapshot(notificationsRef, (querySnapshot) => {
      const notificationsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const sortedNotifications = notificationsData.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
      setNotifications(sortedNotifications);
    });

    return () => unsubscribe();
  }, [userProfile.id]);

  const acceptFriendRequest = async (notification) => {
    try {
      const friendRequestsRef = collection(db, 'friendRequests');
  
      // Query for the specific friend request by sender and receiver IDs
      const q = query(
        friendRequestsRef,
        where('receiverId', '==', userProfile.id),
        where('senderId', '==', notification.senderId),
        where('status', '==', 'pending')
      );
  
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        console.log("No pending friend request document found for this sender and receiver.");
        return;
      }
  
      // Assuming only one document matches this query
      const friendRequestDoc = querySnapshot.docs[0];
  
      // Update the friend request document to mark it as accepted
      await updateDoc(friendRequestDoc.ref, { status: 'accepted' });
  
      // Add each user as a friend to the other
      await addDoc(collection(db, 'users', userProfile.id, 'friends'), { friendId: notification.senderId });
      await addDoc(collection(db, 'users', notification.senderId, 'friends'), { friendId: userProfile.id });
  
      // Delete the original notification about the friend request
      const notificationRef = doc(db, 'users', userProfile.id, 'notifications', notification.id);
      await deleteDoc(notificationRef);
  
      // Add "friendAccepted" notifications for both users
      const userNotificationRef = collection(db, 'users', userProfile.id, 'notifications');
      const senderNotificationRef = collection(db, 'users', notification.senderId, 'notifications');
  
      await addDoc(userNotificationRef, {
        type: 'friendAccepted',
        friendName: notification.senderName,
        timestamp: serverTimestamp(),
        status: 'unread',
      });
  
      await addDoc(senderNotificationRef, {
        type: 'friendAccepted',
        friendName: `${userProfile.firstName} ${userProfile.lastName}`,
        timestamp: serverTimestamp(),
        status: 'unread',
      });
  
      console.log("Friend request accepted, notifications sent, and friend request status updated.");
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const denyFriendRequest = async (notification) => {
    try {
      const friendRequestsRef = collection(db, 'friendRequests');
  
      // Query for the specific friend request by sender and receiver IDs
      const q = query(
        friendRequestsRef,
        where('receiverId', '==', userProfile.id),
        where('senderId', '==', notification.senderId),
        where('status', '==', 'pending')
      );
  
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        console.log("No pending friend request document found for this sender and receiver.");
        return;
      }
  
      // Assuming only one document matches this query
      const friendRequestDoc = querySnapshot.docs[0];
  
      // Delete the friend request document
      await deleteDoc(friendRequestDoc.ref);
      console.log("Friend request deleted.");
  
      // Delete the notification document from the receiver's notifications subcollection
      const notificationRef = doc(db, 'users', userProfile.id, 'notifications', notification.id);
      await deleteDoc(notificationRef);
      console.log("Notification deleted.");
  
      console.log("Friend request denied and corresponding notification removed.");
    } catch (error) {
      console.error("Error denying friend request:", error);
    }
  };

  const renderNotification = ({ item }) => {
    let notificationText = '';
  
    // Set the notification message based on type
    if (item.type === 'friendRequest') {
      notificationText = `${item.senderName} has sent you a friend request.`;
    } else if (item.type === 'purchase') {
      notificationText = `${item.buyerName} bought ${item.quantity} of ${item.itemName}`;
    } else if (item.type === 'friendAccepted') {
      notificationText = `You are now friends with ${item.friendName}.`;
    }
  
    // Handle cases where timestamp might be null or missing
    let displayDate = 'No date available';
    if (item.timestamp && item.timestamp.seconds) {
      displayDate = new Date(item.timestamp.seconds * 1000).toLocaleDateString();
    }
  
    return (
      <View style={styles.notificationItem}>
        <Text style={styles.notificationText}>{notificationText}</Text>
        <Text style={styles.notificationDate}>{displayDate}</Text>
        
        {/* Render Accept/Deny buttons for friend requests */}
        {item.type === 'friendRequest' && (
          <View style={styles.friendRequestButtons}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => acceptFriendRequest(item)}
            >
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.denyButton}
              onPress={() => denyFriendRequest(item)}
            >
              <Text style={styles.buttonText}>Deny</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
        />
      ) : (
        <Text style={styles.noNotifications}>No notifications yet.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  notificationItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  notificationText: {
    fontSize: 16,
    color: '#333',
  },
  notificationDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  noNotifications: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#999',
  },
  friendRequestButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    marginRight: 5,
    borderRadius: 5,
    alignItems: 'center',
  },
  denyButton: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 8,
    marginLeft: 5,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});