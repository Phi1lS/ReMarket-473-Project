import React, { useContext, useState } from 'react';
import { View, KeyboardAvoidingView, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Alert, Platform, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../../UserContext';
import { useNavigation } from '@react-navigation/native';
import { db, auth } from '../../firebaseConfig';
import { doc, updateDoc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';

export default function CheckoutPage() {
  const { cart, items, userProfile, setCart, addPurchase } = useContext(UserContext);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false); // State to track checkout processing
  const navigation = useNavigation();

  const cartItemsWithDetails = cart.map((cartItem) => {
    const itemDetails = items.find((item) => item.id === cartItem.itemId);
    if (itemDetails && itemDetails.sellerId) {
      return { ...itemDetails, quantity: cartItem.quantity };
    } else {
      console.warn("Missing sellerId or item details for cart item:", cartItem);
      return null;
    }
  }).filter(Boolean);

  const totalPrice = cartItemsWithDetails.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (isProcessing) return; // Prevent multiple submissions
    if (!selectedAddress || !selectedPaymentMethod) {
      Alert.alert('Incomplete', 'Please select a shipping address and payment method.');
      return;
    }

    if (!auth.currentUser || !userProfile.id) {
      Alert.alert('Error', 'User is not authenticated. Please log in again.');
      return;
    }

    setIsProcessing(true); // Set processing to true

    try {
      const purchasedItemIds = cartItemsWithDetails.map(item => item.id);
      const purchases = []; // Array to store purchase data for adding to Firestore

      await Promise.all(cartItemsWithDetails.map(async (cartItem) => {
        // Fetch current quantity from marketplace and seller listing
        const marketplaceRef = doc(db, 'marketplace', cartItem.id);
        const marketplaceDoc = await getDoc(marketplaceRef);
        const marketplaceQuantity = marketplaceDoc.exists() ? marketplaceDoc.data().quantity : 0;

        const sellerListingRef = doc(db, 'users', cartItem.sellerId, 'listings', cartItem.id);
        const sellerListingDoc = await getDoc(sellerListingRef);
        const sellerQuantity = sellerListingDoc.exists() ? sellerListingDoc.data().quantity : 0;

        // Calculate new quantities
        const newMarketplaceQuantity = Math.max(marketplaceQuantity - cartItem.quantity, 0);
        const newSellerQuantity = Math.max(sellerQuantity - cartItem.quantity, 0);

        // Update quantities in Firestore
        await updateDoc(marketplaceRef, { quantity: newMarketplaceQuantity });
        await updateDoc(sellerListingRef, { quantity: newSellerQuantity });

        // Add item details, including image URL, and purchase metadata to the purchases array
        purchases.push({
          itemId: cartItem.id,
          itemName: cartItem.description,
          price: cartItem.price,
          quantity: cartItem.quantity,
          imageUrl: cartItem.imageUrl || '',
          timestamp: serverTimestamp(),
          message: message || '',
        });
      }));

      // Add each purchase to the purchases subcollection in Firestore
      await Promise.all(purchases.map(async (purchase) => {
        await addPurchase(purchase);
      }));

      // Remove purchased items from cart and update Firestore
      const updatedCart = cart.filter(cartItem => !purchasedItemIds.includes(cartItem.itemId));
      setCart(updatedCart);
      const userRef = doc(db, 'users', userProfile.id);
      await updateDoc(userRef, { cart: updatedCart });

      Alert.alert('Checkout Successful', 'Your order has been placed.');
      navigation.navigate('ShopScreen');
    } catch (error) {
      console.error('Error during checkout:', error);
      Alert.alert('Error', 'Failed to complete the checkout. Please try again.');
    } finally {
      setIsProcessing(false); // Reset processing state
    }
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Text style={styles.itemName}>{item.description}</Text>
      <Text style={styles.itemPrice}>${item.price.toFixed(2)} x {item.quantity}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Text style={styles.sectionTitle}>Items for Checkout</Text>
      <FlatList
        data={cartItemsWithDetails}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.cartList}
        ListFooterComponent={
          <View style={styles.subtotalContainer}>
            <Text style={styles.subtotalText}>Total:</Text>
            <Text style={styles.subtotalAmount}>${totalPrice.toFixed(2)}</Text>
          </View>
        }
      />

      <Text style={styles.sectionTitle}>Shipping Address</Text>
      {userProfile.shippingAddresses && userProfile.shippingAddresses.length > 0 ? (
        <FlatList
          data={userProfile.shippingAddresses}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.addressContainer,
                selectedAddress === item.id && styles.selectedContainer,
              ]}
              onPress={() => setSelectedAddress(item.id)}
            >
              <Text>{`${item.firstName} ${item.lastName}`}</Text>
              <Text>{item.streetAddress}</Text>
              <Text>{`${item.city}, ${item.state} ${item.zipCode}`}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          horizontal
        />
      ) : (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('ShippingAddressesPage')}
        >
          <Ionicons name="add-circle-outline" size={20} color="#0070BA" />
          <Text style={styles.addButtonText}>Add Shipping Address</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>Payment Method</Text>
      {userProfile.paymentMethods && userProfile.paymentMethods.length > 0 ? (
        <FlatList
          data={userProfile.paymentMethods}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.paymentMethodContainer,
                selectedPaymentMethod === item.id && styles.selectedContainer,
              ]}
              onPress={() => setSelectedPaymentMethod(item.id)}
            >
              <Text>Card: **** **** **** {item.cardNumber.slice(-4)}</Text>
              <Text>Expires: {item.expirationDate}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          horizontal
        />
      ) : (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('PaymentMethodsPage')}
        >
          <Ionicons name="add-circle-outline" size={20} color="#0070BA" />
          <Text style={styles.addButtonText}>Add Payment Method</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>Order Message</Text>
      <TextInput
        style={styles.messageInput}
        placeholder="Enter a message for your activity feed (optional)"
        value={message}
        onChangeText={setMessage}
      />

      <TouchableOpacity
        style={[
          styles.checkoutButton,
          (!selectedAddress || !selectedPaymentMethod || isProcessing) && styles.disabledButton,
        ]}
        onPress={() => {
          Keyboard.dismiss(); // Dismiss the keyboard
          handleCheckout();
        }}
        disabled={!selectedAddress || !selectedPaymentMethod || isProcessing}
      >
        <Text style={styles.checkoutButtonText}>
          {isProcessing ? 'Processing...' : 'Checkout'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#0070BA',
  },
  cartList: {
    paddingBottom: 20,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 16,
    color: '#555',
  },
  subtotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  subtotalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  subtotalAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0070BA',
  },
  addressContainer: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#0070BA',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  paymentMethodContainer: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#0070BA',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  selectedContainer: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0f0f0',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  addButtonText: {
    fontSize: 16,
    color: '#0070BA',
    marginLeft: 5,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
  },
  checkoutButton: {
    backgroundColor: '#0070BA',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});