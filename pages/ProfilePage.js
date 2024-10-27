import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Platform } from 'react-native';
import { Ionicons } from 'react-native-vector-icons';
import { Avatar } from 'react-native-paper';
import { UserContext } from '../UserContext';
import { getDownloadURL, ref } from 'firebase/storage'; // Import Firebase storage functions
import { storage } from '../firebaseConfig'; // Import Firebase config

const avatarPlaceholder = require('../assets/avatar.png');

export default function ProfilePage({ navigation }) {
  const { userProfile } = useContext(UserContext);
  const [selectedTab, setSelectedTab] = useState('wallet');
  const [avatarUrl, setAvatarUrl] = useState(null); // State to store full avatar URL
  const [purchasesWithImages, setPurchasesWithImages] = useState([]); // Store purchases with images

  // Fetch the avatar URL from Firebase Storage if userProfile.avatar is a relative path
  useEffect(() => {
    const fetchAvatarUrl = async () => {
      if (userProfile.avatar) {
        try {
          const avatarRef = ref(storage, userProfile.avatar);
          const url = await getDownloadURL(avatarRef);
          setAvatarUrl(url); // Store the full download URL
        } catch (error) {
          console.error('Error fetching avatar URL:', error);
        }
      }
    };

    fetchAvatarUrl();
  }, [userProfile.avatar]);

  // Fetch image URLs for each purchase
  useEffect(() => {
    const fetchPurchaseImages = async () => {
      const purchases = await Promise.all(
        userProfile.purchases.map(async (purchase) => {
          if (purchase.imageUrl) {
            try {
              const imageRef = ref(storage, purchase.imageUrl);
              const imageUrl = await getDownloadURL(imageRef);
              return { ...purchase, imageUrl }; // Attach the full image URL to the purchase
            } catch (error) {
              console.warn(`Failed to fetch image for purchase ${purchase.id}:`, error);
              return purchase; // Return the purchase without updating the imageUrl in case of error
            }
          }
          return purchase; // Return purchase if no imageUrl is provided
        })
      );
      setPurchasesWithImages(purchases);
    };

    fetchPurchaseImages();
  }, [userProfile.purchases]);

  const handleTabSwitch = (tab) => {
    setSelectedTab(tab);
  };

  // Function to sort purchases by timestamp (from most recent to oldest)
  const sortPurchasesByDate = (purchases) => {
    return purchases.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
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
      {/* Profile Header */}
      <View style={styles.header}>
        {/* Notification Bell and Settings Cog */}
        <View style={styles.iconContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={28} color="#4CB0E6" style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={28} color="#4CB0E6" />
          </TouchableOpacity>
        </View>

        {/* Avatar and User Info */}
        <Avatar.Image
          size={90}
          source={avatarUrl ? { uri: avatarUrl } : avatarPlaceholder} // Use avatarUrl if available
          style={styles.avatar}
        />
        <Text style={styles.name}>{`${userProfile.firstName} ${userProfile.lastName}`}</Text>
        <Text style={styles.username}>{`${userProfile.username}`}</Text>
      </View>

      {/* Tab Control: Wallet vs Purchases */}
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
            sortPurchasesByDate(purchasesWithImages).map((item) => renderPurchaseItem(item))
          ) : (
            <Text style={styles.noTransactions}>No purchases to show.</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

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
  icon: {
    marginRight: 15,
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
});