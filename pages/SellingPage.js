import React, { useContext, useState, useEffect } from 'react';
import { View, FlatList, Text, Image, StyleSheet, TouchableOpacity, Alert, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../UserContext';
import { db, storage } from '../firebaseConfig';
import { collection, onSnapshot, query, where, getDocs, getDoc, doc, deleteDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage'; // Import storage functions

export default function SellingPage() {
  const navigation = useNavigation();
  const { userProfile } = useContext(UserContext);
  const [listings, setListings] = useState([]); // State for listings
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    if (!userProfile?.id) return;

    const fetchListings = async () => {
      const listingsRef = collection(db, 'users', userProfile.id, 'listings');

      const unsubscribe = onSnapshot(listingsRef, async (snapshot) => {
        const fetchedListings = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const listingData = doc.data();
            const imageUrl = await getDownloadURL(ref(storage, listingData.imageUrl)); // Fetch the image URL
            return {
              id: doc.id,
              ...listingData,
              imageUrl,
            };
          })
        );

        // Sort listings by createdAt in descending order
        const sortedListings = fetchedListings.sort((a, b) => b.createdAt - a.createdAt);
        setListings(sortedListings); // Set the listings with updated quantities
        setLoading(false); // Stop loading when listings are fetched
      });

      return () => unsubscribe(); // Cleanup listener on unmount
    };

    fetchListings();
  }, [userProfile?.id]);

  const handleDeleteListing = async (itemId) => {
    try {
      await deleteDoc(doc(db, 'users', userProfile.id, 'listings', itemId));
      await deleteDoc(doc(db, 'marketplace', itemId));

      // Update local listings state after deletion
      setListings((prevListings) => prevListings.filter((listing) => listing.id !== itemId));

      Alert.alert('Success', 'Listing deleted successfully.');
    } catch (error) {
      console.error('Error deleting listing:', error);
      Alert.alert('Error', 'Failed to delete the listing. Please try again.');
    }
  };

  const confirmDeleteListing = (itemId) => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteListing(itemId) },
      ],
      { cancelable: true }
    );
  };

  const renderListingItem = ({ item }) => (
    <View style={styles.listingContainer}>
      <TouchableOpacity onPress={() => navigation.navigate('ItemPage', { item })}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.listingImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={40} color="#888" />
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.listingDetails}>
        <Text style={styles.listingName}>{item.description || 'No Description'}</Text>
        <Text style={styles.listingPrice}>${item.price || '0.00'}</Text>
        <Text style={styles.listingQuantity}>Quantity: {item.quantity || '1'}</Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => confirmDeleteListing(item.id)}
      >
        <Ionicons name="trash-outline" size={24} color="red" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading listings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Your Listings</Text>
      {listings.length === 0 ? (
        <Text style={styles.emptyMessage}>No listings available.</Text>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderListingItem}
          contentContainerStyle={listings.length === 0 ? styles.emptyListContainer : styles.listingsContainer}
        />
      )}
      <TouchableOpacity style={styles.floatingButton} onPress={() => navigation.navigate('CreateListingPage')}>
        <Ionicons name="add-circle-outline" size={60} color="#0070BA" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 15,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  listingsContainer: {
    paddingBottom: 80,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f4f8',
    borderRadius: 10,
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#0070BA',
    elevation: 2,
    position: 'relative',
  },
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
  },
  listingDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  listingName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0070BA',
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0070BA',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    zIndex: 1,
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  emptyMessage: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
  },
});