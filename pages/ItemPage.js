import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from 'react-native-paper';

export default function ItemPage({ route }) {
  const { item } = route.params; // Assume 'category' is part of item data

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Item Image */}
        <Image source={item.image} style={styles.itemImage} />

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
            <Avatar.Image size={50} source={require('../assets/avatar.png')} style={styles.avatar} />
            <View style={styles.sellerDetails}>
              <Text style={styles.sellerName}>John Doe</Text>
            </View>
          </View>
        </View>

        {/* Add to Cart Button */}
        <TouchableOpacity style={styles.addToCartButton}>
          <Ionicons name="cart-outline" size={24} color="#fff" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>

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
    paddingBottom: 20,
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
    color: '#58A4B0',
    marginBottom: 15,
  },
  itemDescription: {
    fontSize: 16,
    color: '#555',
  },
  sellerContainer: {
    marginTop: 30,
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
    backgroundColor: '#58A4B0', // Teal background for avatar
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
    backgroundColor: '#58A4B0',
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
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
    color: '#58A4B0',
  },
});
