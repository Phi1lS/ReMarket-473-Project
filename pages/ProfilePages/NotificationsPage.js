import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { UserContext } from '../../UserContext'; // Ensure your Firebase config is correctly imported

export default function NotificationsPage() {
  const { userProfile } = useContext(UserContext); // Get the current user's profile
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications for the logged-in seller
  useEffect(() => {
    if (!userProfile.id) return;

    const notificationsRef = collection(db, 'users', userProfile.id, 'notifications'); // Access the seller's notifications
    const unsubscribe = onSnapshot(notificationsRef, (querySnapshot) => {
      const notificationsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort notifications from most recent to oldest using timestamp
      const sortedNotifications = notificationsData.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);

      setNotifications(sortedNotifications);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [userProfile.id]);

  // Render each notification
  const renderNotification = ({ item }) => {
    return (
      <View style={styles.notificationItem}>
        <Text style={styles.notificationText}>
          {item.buyerName} bought {item.quantity} of {item.itemName}
        </Text>
        <Text style={styles.notificationDate}>
          {new Date(item.timestamp?.seconds * 1000).toLocaleDateString()}
        </Text>
        {item.message && <Text style={styles.notificationMessage}>Message: {item.message}</Text>}
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
});