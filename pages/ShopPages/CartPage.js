import React from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FAB } from 'react-native-paper';  // Floating Action Button for checkout

// Sample cart items
const cartItems = [
  { id: '1', name: 'Item 1', price: 29.99, image: require('../../assets/item.png') },
  { id: '2', name: 'Item 2', price: 49.99, image: require('../../assets/item.png') },
  { id: '3', name: 'Item 3', price: 19.99, image: require('../../assets/item.png') },
];

export default function CartPage() {
  // Calculate total price
  const totalPrice = cartItems.reduce((total, item) => total + item.price, 0);

  // Reusable component for rendering cart items
  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={item.image} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
      </View>
      <TouchableOpacity style={styles.removeButton}>
        <Ionicons name="trash-outline" size={24} color="#FF6347" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Cart Items */}
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.cartList}
        ListFooterComponent={
          <View style={styles.subtotalContainer}>
            <Text style={styles.subtotalText}>Subtotal:</Text>
            <Text style={styles.subtotalAmount}>${totalPrice.toFixed(2)}</Text>
          </View>
        }
      />

      {/* Floating Checkout Button */}
      <FAB
        style={styles.checkoutFAB}
        label="Checkout"
        icon="cart"
        onPress={() => console.log('Proceed to checkout')}
        color="white"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  cartList: {
    paddingBottom: 80, // Leave space for the floating checkout button
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0', // Light background for cart items
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3, // Shadow for Android
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
    marginTop: 5,
  },
  removeButton: {
    padding: 5,
  },
  subtotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderColor: '#ddd',
    marginTop: 20,
  },
  subtotalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  subtotalAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0070BA', // ReMarket blue for the subtotal amount
  },
  checkoutFAB: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#0070BA', // ReMarket blue for the checkout button
  },
});
