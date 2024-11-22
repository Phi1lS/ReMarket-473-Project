import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { collection, onSnapshot, updateDoc, doc, addDoc, getDoc, query, where, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Swipeable } from 'react-native-gesture-handler';
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

      const sortedNotifications = notificationsData.sort((a, b) => {
        const timestampA = a.timestamp?.seconds || 0;
        const timestampB = b.timestamp?.seconds || 0;
        return timestampB - timestampA;
      });

      setNotifications(sortedNotifications);
    });

    return () => unsubscribe();
  }, [userProfile.id]);

  useEffect(() => {
    const markNotificationsAsRead = async () => {
      const unreadNotifications = notifications.filter(notification => notification.status === 'unread');
      const updatePromises = unreadNotifications.map((notification) =>
        updateDoc(doc(db, 'users', userProfile.id, 'notifications', notification.id), { status: 'read' })
      );
      await Promise.all(updatePromises);
    };

    if (notifications.length > 0) {
      markNotificationsAsRead();
    }
  }, [notifications, userProfile.id]);

  const acceptFriendRequest = async (notification) => {
    try {
      const friendRequestsRef = collection(db, 'friendRequests');
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

      const friendRequestDoc = querySnapshot.docs[0];
      await updateDoc(friendRequestDoc.ref, { status: 'accepted' });

      await addDoc(collection(db, 'users', userProfile.id, 'friends'), { friendId: notification.senderId });
      await addDoc(collection(db, 'users', notification.senderId, 'friends'), { friendId: userProfile.id });

      await deleteDoc(doc(db, 'users', userProfile.id, 'notifications', notification.id));

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

      const friendRequestDoc = querySnapshot.docs[0];
      await deleteDoc(friendRequestDoc.ref);
      console.log("Friend request deleted.");

      const notificationRef = doc(db, 'users', userProfile.id, 'notifications', notification.id);
      await deleteDoc(notificationRef);
      console.log("Notification deleted.");

      console.log("Friend request denied and corresponding notification removed.");
    } catch (error) {
      console.error("Error denying friend request:", error);
    }
  };

  const renderNotification = ({ item }) => {
    const handleDelete = async () => {
      try {
        await deleteDoc(doc(db, 'users', userProfile.id, 'notifications', item.id));
        setNotifications((prev) => prev.filter((notification) => notification.id !== item.id));
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    };
  
    const renderRightActions = () => (
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    );
  
    return (
      <Swipeable renderRightActions={renderRightActions}>
        <View style={styles.notificationItem}>
          {/* Main Notification Content Based on Type */}
          {item.type === 'purchase' && (
            <>
              <Text style={styles.notificationText}>
                {item.buyerName} bought {item.quantity} of {item.itemName}
              </Text>
              {item.message && (
                <Text style={styles.notificationMessage}>Message: {item.message}</Text>
              )}
            </>
          )}
          
          {item.type === 'friendRequest' && (
            <>
              <Text style={styles.notificationText}>
                {item.senderName} has sent you a friend request.
              </Text>
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
            </>
          )}
  
          {item.type === 'friendAccepted' && (
            <Text style={styles.notificationText}>
              You are now friends with {item.friendName}.
            </Text>
          )}
  
          <Text style={styles.notificationDate}>
            {item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleDateString() : 'Unknown Date'}
          </Text>
        </View>
      </Swipeable>
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
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    backgroundColor: 'red',
    borderRadius: 10,
    marginBottom: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});