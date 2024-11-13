import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Platform } from 'react-native';
import { Ionicons } from 'react-native-vector-icons';
import { Avatar } from 'react-native-paper';
import { UserContext } from '../UserContext';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage, db } from '../firebaseConfig';
import { useFocusEffect } from '@react-navigation/native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const avatarPlaceholder = require('../assets/avatar.png');

export default function ProfilePage({ navigation }) {
  const { userProfile } = useContext(UserContext);
  const [selectedTab, setSelectedTab] = useState('wallet');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [purchasesWithImages, setPurchasesWithImages] = useState([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const fetchAvatarUrl = async () => {
        if (userProfile.avatar) {
          try {
            const avatarRef = ref(storage, userProfile.avatar);
            const url = await getDownloadURL(avatarRef);
            setAvatarUrl(url);
          } catch (error) {
            console.error('Error fetching avatar URL:', error);
            setAvatarUrl(null);
          }
        } else {
          setAvatarUrl(null);
        }
      };

      const checkUnreadNotifications = () => {
        if (!userProfile.id) return;

        const notificationsRef = collection(db, 'users', userProfile.id, 'notifications');
        const unreadQuery = query(notificationsRef, where('status', '==', 'unread'));
        
        const unsubscribe = onSnapshot(unreadQuery, (snapshot) => {
          setHasUnreadNotifications(!snapshot.empty);
        });

        return unsubscribe;
      };

      fetchAvatarUrl();
      const unsubscribeNotifications = checkUnreadNotifications();

      return () => {
        if (unsubscribeNotifications) unsubscribeNotifications();
      };
    }, [userProfile.avatar, userProfile.id])
  );

  useEffect(() => {
    const fetchAvatarUrl = async () => {
      if (userProfile.avatar) {
        try {
          const avatarRef = ref(storage, userProfile.avatar);
          const url = await getDownloadURL(avatarRef);
          setAvatarUrl(url);
        } catch (error) {
          console.error('Error fetching avatar URL:', error);
          setAvatarUrl(null);
        }
      } else {
        setAvatarUrl(null);
      }
    };

    fetchAvatarUrl();
  }, []);

  useEffect(() => {
    const fetchPurchaseImages = async () => {
      const purchases = await Promise.all(
        userProfile.purchases.map(async (purchase) => {
          if (purchase.imageUrl) {
            try {
              const imageRef = ref(storage, purchase.imageUrl);
              const imageUrl = await getDownloadURL(imageRef);
              return { ...purchase, imageUrl };
            } catch (error) {
              console.warn(`Failed to fetch image for purchase ${purchase.id}:`, error);
              return purchase;
            }
          }
          return purchase;
        })
      );

      // Sort purchases by date, from most recent to oldest, and update state
      setPurchasesWithImages(sortPurchasesByDate(purchases));
    };

    fetchPurchaseImages();
  }, [userProfile.purchases]);

  const handleTabSwitch = (tab) => {
    setSelectedTab(tab);
  };

  const sortPurchasesByDate = (purchases) => {
    return purchases.sort((a, b) => {
      const aTimestamp = a.timestamp?.seconds || 0;
      const bTimestamp = b.timestamp?.seconds || 0;
      return bTimestamp - aTimestamp;
    });
  };

  const renderPurchaseItem = (item) => (
    <View key={item.id} style={styles.purchaseItemContainer}>
      <View style={styles.purchaseItem}>
        <Image source={{ uri: item.imageUrl }} style={styles.purchaseImage} />
        <View style={styles.purchaseDetails}>
          <Text style={styles.purchaseTitle}>{item.itemName}</Text>
          <Text style={styles.purchaseText}>Price: ${item.price.toFixed(2)}</Text>
          <Text style={styles.purchaseText}>Quantity: {item.quantity}</Text>
          <Text style={styles.purchaseText}>Message: {item.message || 'No message'}</Text>
          <Text style={styles.purchaseText}>
            Date: {new Date(item.timestamp?.seconds * 1000).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.separator} />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.notificationIcon}>
            <Ionicons name="notifications-outline" size={28} color="#4CB0E6" />
            {hasUnreadNotifications && <View style={styles.unreadDot} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={28} color="#4CB0E6" />
          </TouchableOpacity>
        </View>

        <Avatar.Image
          size={90}
          source={avatarUrl ? { uri: avatarUrl } : avatarPlaceholder}
          style={styles.avatar}
        />
        <Text style={styles.name}>{`${userProfile.firstName} ${userProfile.lastName}`}</Text>
        <Text style={styles.username}>{`${userProfile.username}`}</Text>

        {/* Friends List Link */}
        <TouchableOpacity onPress={() => navigation.navigate('FriendsList')}>
          <Text style={styles.friendsListLink}>Friends List</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Control */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => handleTabSwitch('wallet')}
          style={[styles.tabButton, selectedTab === 'wallet' ? styles.activeTab : null]}
        >
          <Text style={[styles.tabText, selectedTab === 'wallet' ? styles.activeTabText : null]}>Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleTabSwitch('purchases')}
          style={[styles.tabButton, selectedTab === 'purchases' ? styles.activeTab : null]}
        >
          <Text style={[styles.tabText, selectedTab === 'purchases' ? styles.activeTabText : null]}>Purchases</Text>
        </TouchableOpacity>
      </View>

      {/* Content Section */}
      {selectedTab === 'wallet' ? (
        <View style={styles.walletSection}>
          {userProfile.paymentMethods.length > 0 ? (
            <View style={styles.linkedPaymentContainer}>
              <Ionicons name="card-outline" size={24} color="#4CB0E6" />
              <Text style={styles.linkedPaymentText}>Payment Method Connected</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addPaymentButton}
              onPress={() => navigation.navigate('PaymentMethodsPage')}
            >
              <Ionicons name="add-circle-outline" size={24} color="#0070BA" />
              <Text style={styles.addPaymentText}>Add Payment Method</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.purchasesSection}>
          {purchasesWithImages.length > 0 ? (
            purchasesWithImages.map((item) => renderPurchaseItem(item))
          ) : (
            <Text style={styles.noTransactions}>No purchases to show.</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
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
  avatar: {
    backgroundColor: '#4CB0E6',
  },
  iconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
  },
  notificationIcon: {
    position: 'relative',
    marginRight: 15,
  },
  unreadDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
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
  walletSection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
  },
  linkedPaymentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  linkedPaymentText: {
    fontSize: 16,
    marginLeft: 10,
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  addPaymentText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#0070BA',
  },
  purchasesSection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 20,
  },
  purchaseItemContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  purchaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  purchaseImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  purchaseDetails: {
    flex: 1,
  },
  purchaseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  purchaseText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#ddd',
    marginTop: 10,
  },
  noTransactions: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  friendsListLink: {
    fontSize: 16,
    color: '#4CB0E6',
    marginTop: 8,
  },
});