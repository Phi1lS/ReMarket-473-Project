import React, { useContext, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../../UserContext';
import { useNavigation } from '@react-navigation/native';
import { db, auth } from '../../firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export default function CheckoutPage() {
    const { cart, items, userProfile, setCart } = useContext(UserContext);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [message, setMessage] = useState('');
    const navigation = useNavigation();

    // Retrieve item details for each cart item
    const cartItemsWithDetails = cart.map((cartItem) => {
        const itemDetails = items.find((item) => item.id === cartItem.itemId);
        if (itemDetails && itemDetails.sellerId) {
        return { ...itemDetails, quantity: cartItem.quantity };
        } else {
        console.warn("Missing sellerId or item details for cart item:", cartItem);
        return null;
        }
    }).filter(Boolean); // Filter out any null items due to missing data

    // Calculate total price
    const totalPrice = cartItemsWithDetails.reduce((total, item) => total + item.price * item.quantity, 0);

    const handleCheckout = async () => {
        if (!selectedAddress || !selectedPaymentMethod) {
          Alert.alert('Incomplete', 'Please select a shipping address and payment method.');
          return;
        }
      
        if (!auth.currentUser || !userProfile.id) {
          Alert.alert('Error', 'User is not authenticated. Please log in again.');
          return;
        }
      
        try {
          // Track items to remove from cart
          const purchasedItemIds = cartItemsWithDetails.map(item => item.id);
      
          // Reduce quantity of each item in the cart
          await Promise.all(cartItemsWithDetails.map(async (cartItem) => {
            // Fetch current quantity in the marketplace
            const marketplaceRef = doc(db, 'marketplace', cartItem.id);
            const marketplaceDoc = await getDoc(marketplaceRef);
            const marketplaceQuantity = marketplaceDoc.exists() ? marketplaceDoc.data().quantity : 0;
      
            // Fetch current quantity in the seller's listing
            const sellerListingRef = doc(db, 'users', cartItem.sellerId, 'listings', cartItem.id);
            const sellerListingDoc = await getDoc(sellerListingRef);
            const sellerQuantity = sellerListingDoc.exists() ? sellerListingDoc.data().quantity : 0;
      
            // Calculate new quantities
            const newMarketplaceQuantity = marketplaceQuantity > 0 ? marketplaceQuantity - 1 : 0;
            const newSellerQuantity = sellerQuantity > 0 ? sellerQuantity - 1 : 0;
      
            // Update quantities in both collections if they aren't zero
            if (newMarketplaceQuantity >= 0) {
              await updateDoc(marketplaceRef, { quantity: newMarketplaceQuantity });
            }
            if (newSellerQuantity >= 0) {
              await updateDoc(sellerListingRef, { quantity: newSellerQuantity });
            }
          }));
      
          // Filter out purchased items from the cart
          const updatedCart = cart.filter(cartItem => !purchasedItemIds.includes(cartItem.itemId));
          setCart(updatedCart); // Update local state
      
          // Save updated cart to Firestore
          const userRef = doc(db, 'users', userProfile.id);
          await updateDoc(userRef, { cart: updatedCart });
      
          Alert.alert('Checkout Successful', 'Your order has been placed.');
          navigation.navigate('ShopScreen'); // Navigate to ShopPage after checkout
      
        } catch (error) {
          console.error('Error during checkout:', error);
          Alert.alert('Error', 'Failed to complete the checkout. Please try again.');
        }
      };

    // Render each cart item for the checkout summary
    const renderCartItem = ({ item }) => (
        <View style={styles.cartItem}>
        <Text style={styles.itemName}>{item.description}</Text>
        <Text style={styles.itemPrice}>${item.price.toFixed(2)} x {item.quantity}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
        {/* Cart Items Summary */}
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

        {/* Shipping Address Selection */}
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

        {/* Payment Method Selection */}
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

        {/* Message for Activity Feed */}
        <Text style={styles.sectionTitle}>Order Message</Text>
        <TextInput
            style={styles.messageInput}
            placeholder="Enter a message for your activity feed (optional)"
            value={message}
            onChangeText={setMessage}
        />

        {/* Checkout Button */}
        <TouchableOpacity
            style={[
            styles.checkoutButton,
            (!selectedAddress || !selectedPaymentMethod) && styles.disabledButton,
            ]}
            onPress={handleCheckout}
            disabled={!selectedAddress || !selectedPaymentMethod}
        >
            <Text style={styles.checkoutButtonText}>Checkout</Text>
        </TouchableOpacity>
        </View>
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