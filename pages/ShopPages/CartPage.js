import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FAB } from 'react-native-paper';
import { UserContext } from '../../UserContext';
import { useNavigation } from '@react-navigation/native';
import { getDownloadURL, ref } from 'firebase/storage'; // Import Firebase storage functions
import { storage } from '../../firebaseConfig'; // Import Firebase config

export default function CartPage() {
  const { cart, items, removeFromCart } = useContext(UserContext);
  const [cartItemsWithImages, setCartItemsWithImages] = useState([]);
  const navigation = useNavigation();

  // Retrieve item details and images for each cart item
  useEffect(() => {
    const fetchCartItemsWithImages = async () => {
      const cartItems = cart.map((cartItem) => {
        const itemDetails = items.find((item) => item.id === cartItem.itemId);
        return itemDetails ? { ...itemDetails, quantity: cartItem.quantity } : null;
      }).filter(Boolean);

      const itemsWithImages = await Promise.all(
        cartItems.map(async (item) => {
          if (item.imageUrl) {
            const imageRef = ref(storage, item.imageUrl); // Reference to the item's image in Firebase Storage
            try {
              const imageUrl = await getDownloadURL(imageRef); // Fetch the full image URL
              return { ...item, imageUrl }; // Add the full image URL to the item
            } catch (error) {
              console.warn(`Failed to fetch image for item ${item.id}:`, error);
              return item; // Return item without updating imageUrl if there's an error
            }
          }
          return item; // Return item if no image URL is provided
        })
      );

      setCartItemsWithImages(itemsWithImages);
    };

    fetchCartItemsWithImages();
  }, [cart, items]);

  // Calculate total price
  const totalPrice = cartItemsWithImages.reduce((total, item) => total + item.price * item.quantity, 0);

  // Handle checkout navigation
  const handleCheckout = () => {
    if (cartItemsWithImages.length > 0) {
      navigation.navigate('CheckoutPage');
    } else {
      Alert.alert('Your cart is empty', 'Please add items to your cart before proceeding to checkout.');
    }
  };

  // Render each cart item with remove button
  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.description}</Text>
        <Text style={styles.itemPrice}>${item.price.toFixed(2)} x {item.quantity}</Text>
      </View>
      <TouchableOpacity style={styles.removeButton} onPress={() => removeFromCart(item.id)}>
        <Ionicons name="trash-outline" size={24} color="#FF6347" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Cart Items */}
      <FlatList
        data={cartItemsWithImages}
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
        style={[
          styles.checkoutFAB,
          cartItemsWithImages.length === 0 && styles.disabledFAB
        ]}
        label="Checkout"
        icon="cart"
        onPress={handleCheckout}
        color="white"
        disabled={cartItemsWithImages.length === 0}
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
  disabledFAB: {
    backgroundColor: '#aaa', // Gray background when the cart is empty
  },
});