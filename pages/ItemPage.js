import React, { useContext } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from 'react-native-paper';
import { UserContext } from '../UserContext'; // Import UserContext

export default function ItemPage({ route }) {
  const { item } = route.params;
  const { userProfile } = useContext(UserContext); // Use userProfile.id

  // Check if the current user is the seller of this item
  const isSeller = item.sellerId === userProfile.id; // Compare the listing seller with the current user

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Item Image */}
        <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />

        {/* Item Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>${item.price}</Text>
          <Text style={styles.itemDescription}>{item.description}</Text>
        </View>

        {/* Seller Information */}
        <View style={styles.sellerContainer}>
          <Text style={styles.sellerTitle}>Seller Information</Text>
          <View style={styles.sellerInfo}>
            <Avatar.Image size={50} source={{ uri: userProfile.avatar }} style={styles.avatar} />
            <View style={styles.sellerDetails}>
              <Text style={styles.sellerName}>{`${userProfile.firstName} ${userProfile.lastName}`}</Text>
            </View>
          </View>
        </View>

        {/* Add to Cart Button */}
        {!isSeller && (
          <TouchableOpacity style={styles.addToCartButton}>
            <Ionicons name="cart-outline" size={24} color="#fff" />
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        )}

        {/* Item Category */}
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryTitle}>Category</Text>
          <Text style={styles.itemCategory}>{item.category}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {

  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  itemImage: {
    width: '100%',
    height: 400,
    resizeMode: 'contain',
    marginBottom: 20,
    borderRadius: 10,
  },
  detailsContainer: {
    marginBottom: 20,
  },
  itemName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  itemPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CB0E6', // Updated to the new blue shade
    marginTop: -20,
    marginBottom: 15,
  },
  itemDescription: {
    fontSize: 16,
    color: '#555',
  },
  sellerContainer: {
    marginTop: 10,
  },
  sellerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  avatar: {
    backgroundColor: '#4CB0E6', // Updated to the blue theme
  },
  sellerDetails: {
    marginLeft: 10,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CB0E6', // Updated to blue shade
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 10,
  },
  categoryContainer: {
    marginTop: 30,
    alignItems: 'flex-start',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  itemCategory: {
    fontSize: 16,
    color: '#4CB0E6', // Updated to blue theme
  },
});