import React, { useContext } from 'react';
import { View, FlatList, Text, Image, StyleSheet, TouchableOpacity, Alert, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../UserContext';
import { db } from '../firebaseConfig';
import { getDoc, doc, deleteDoc } from 'firebase/firestore';

export default function SellingPage() {
  const navigation = useNavigation();
  const { userProfile, setUserProfile } = useContext(UserContext);

  const uniqueListings = Array.from(new Set(userProfile.listings.map(item => item.id)))
    .map(id => userProfile.listings.find(item => item.id === id));

  const handleDeleteListing = async (itemId) => {
    try {
      await deleteDoc(doc(db, 'users', userProfile.id, 'listings', itemId));
      const marketplaceDocRef = doc(db, 'marketplace', itemId);
      const marketplaceDocSnapshot = await getDoc(marketplaceDocRef);

      if (marketplaceDocSnapshot.exists()) {
        await deleteDoc(marketplaceDocRef);
        console.log(`Listing with ID ${itemId} successfully deleted from both listings and marketplace.`);
      } else {
        console.warn(`Listing with ID ${itemId} not found in the marketplace collection.`);
      }

      setUserProfile((prevProfile) => ({
        ...prevProfile,
        listings: prevProfile.listings.filter((listing) => listing.id !== itemId),
      }));

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
      <TouchableOpacity onPress={() => navigation.navigate('ItemPage', { item, previousScreen: 'SellingPage' })}>
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

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Your Listings</Text>
      <FlatList
        data={uniqueListings}
        keyExtractor={(item) => item.id}
        renderItem={renderListingItem}
        contentContainerStyle={uniqueListings.length === 0 ? styles.emptyListContainer : styles.listingsContainer}
        ListEmptyComponent={<Text style={styles.emptyMessage}>No listings available.</Text>}
      />
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