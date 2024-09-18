import React from 'react';
import { View, FlatList, Text, Image, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Sample listings data
const listings = [
  { id: '1', name: 'Item 1', description: 'Description of Item 1', price: '100', image: require('../assets/item.png') },
  { id: '2', name: 'Item 2', description: 'Description of Item 2', price: '200', image: require('../assets/item.png') },
  { id: '3', name: 'Item 3', description: 'Description of Item 3', price: '300', image: require('../assets/item.png') },
  { id: '4', name: 'Item 4', description: 'Description of Item 4', price: '400', image: require('../assets/item.png') },
];

export default function SellingPage() {
  const navigation = useNavigation();

  // Function to render each listing item
  const renderListingItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listingContainer}
      onPress={() => navigation.navigate('ItemPage', { item, previousScreen: 'SellingPage' })}
    >
      <Image source={item.image} style={styles.listingImage} />
      <View style={styles.listingDetails}>
        <Text style={styles.listingName}>{item.name}</Text>
        <Text style={styles.listingDescription}>{item.description}</Text>
        <Text style={styles.listingPrice}>${item.price}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.headerText}>Your Listings</Text>

      {/* FlatList to display listings */}
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={renderListingItem}
        contentContainerStyle={styles.listingsContainer}
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
