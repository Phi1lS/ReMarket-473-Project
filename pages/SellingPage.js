import React, { useContext } from 'react';
import { View, FlatList, Text, Image, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../UserContext'; // Import UserContext

export default function SellingPage() {
  const navigation = useNavigation();
  const { userProfile } = useContext(UserContext); // Access UserContext

  // Filter to ensure no duplicates and keep unique listings only
  const uniqueListings = Array.from(new Set(userProfile.listings.map(item => item.id)))
    .map(id => userProfile.listings.find(item => item.id === id));

  // Function to render each listing item
  const renderListingItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listingContainer}
      onPress={() => navigation.navigate('ItemPage', { item, previousScreen: 'SellingPage' })}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.listingImage} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image-outline" size={40} color="#888" />
        </View>
      )}
      <View style={styles.listingDetails}>
        <Text style={styles.listingName}>{item.description || 'No Description'}</Text>
        <Text style={styles.listingPrice}>${item.price || '0.00'}</Text>
        <Text style={styles.listingQuantity}>Quantity: {item.quantity || '1'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.headerText}>Your Listings</Text>

      {/* FlatList to display listings */}
      <FlatList
        data={uniqueListings} // Use unique listings
        keyExtractor={(item) => item.id} // Ensure unique key for each item
        renderItem={renderListingItem}
        contentContainerStyle={styles.listingsContainer}
        ListEmptyComponent={<Text style={styles.emptyMessage}>No listings available.</Text>} // Show when no listings
      />

      {/* Floating button to create a new listing */}
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
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 15, // Adjust for iOS top margin
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center', // Centered header
  },
  listingsContainer: {
    paddingBottom: 80, // Add padding to accommodate floating button
  },
  listingContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f4f8', // Updated background color
    borderRadius: 10,
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#0070BA', // Updated border color to match theme
    elevation: 2,
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
    color: '#0070BA', // Updated font color for the listing name
  },
  listingDescription: {
    fontSize: 14,
    color: '#555',
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0070BA', // Updated price color to match theme
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    zIndex: 1,
  },
});
