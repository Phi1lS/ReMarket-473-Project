import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import { UserContext } from '../UserContext'; // Import UserContext
import { getDownloadURL, ref } from 'firebase/storage'; // Import Firebase storage functions
import { storage } from '../firebaseConfig'; // Import Firebase config
import fallbackAvatar from '../assets/avatar.png'; // Ensure you have a fallback avatar imported

export default function ItemPage({ route }) {
  const { item } = route.params;
  const { userProfile, addToCart, cart } = useContext(UserContext);
  const navigation = useNavigation();
  const [sellerAvatarUrl, setSellerAvatarUrl] = useState(null);
  const [itemImageUrl, setItemImageUrl] = useState(item.imageUrl);

  const isSeller = item.sellerId === userProfile.id;
  const cartItem = cart.find(cartItem => cartItem.itemId === item.id);
  const cartItemQuantity = cartItem ? cartItem.quantity : 0;

  const handleAddToCart = () => {
    if (cartItemQuantity < item.quantity) {
      addToCart(item);
      Alert.alert("Success", "Item added to cart.");
    } else {
      Alert.alert("Unavailable", "You've added the maximum available quantity of this item to your cart.");
    }
  };

  useEffect(() => {
    const fetchSellerAvatarUrl = async () => {
      if (item.sellerAvatar) {
        try {
          const avatarRef = ref(storage, item.sellerAvatar);
          const url = await getDownloadURL(avatarRef);
          setSellerAvatarUrl(url);
        } catch (error) {
          //console.error('Error fetching seller avatar URL:', error);
        }
      }
    };

    const fetchItemImageUrl = async () => {
      if (item.imageUrl) {
        try {
          const imageRef = ref(storage, item.imageUrl);
          const url = await getDownloadURL(imageRef);
          setItemImageUrl(url);
        } catch (error) {
          console.error('Error fetching item image URL:', error);
        }
      }
    };

    fetchSellerAvatarUrl();
    fetchItemImageUrl();
  }, [item.sellerAvatar, item.imageUrl]);

  const isOutOfStock = item.quantity <= 0;

  return (
    <ScrollView contentContainerStyle={[
        Platform.OS === 'web' && styles.scrollContainer // Style applied only on web
      ]}
    >
      <View style={styles.container}>
        {/* Item Image */}
        <Image source={{ uri: itemImageUrl }} style={styles.itemImage} />

        {/* Item Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.itemName}>{item.description}</Text>
          <Text style={styles.itemPrice}>${item.price}</Text>
        </View>

        {/* Seller Information */}
        <View style={styles.sellerContainer}>
          <Text style={styles.sellerTitle}>Seller Information</Text>
          <TouchableOpacity
            style={styles.sellerInfo}
            onPress={() => navigation.push('UserProfilePage', { userId: item.sellerId })}
          >
            <Avatar.Image
              size={50}
              source={sellerAvatarUrl ? { uri: sellerAvatarUrl } : fallbackAvatar}
              style={styles.avatar}
            />
            <View style={styles.sellerDetails}>
              <Text style={styles.sellerName}>{item.sellerName || 'Unknown Seller'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Add to Cart Button */}
        {!isSeller && (
          <TouchableOpacity
            style={[
              styles.addToCartButton,
              isOutOfStock && styles.disabledButton,
            ]}
            onPress={handleAddToCart}
            disabled={isOutOfStock}
          >
            <Ionicons name="cart-outline" size={24} color="#fff" />
            <Text style={styles.addToCartText}>
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Item Category */}
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryTitle}>Category</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('CategoryPage', { category: item.category })}
          >
            <Text style={styles.itemCategory}>{item.category}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
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
  disabledButton: {
    backgroundColor: '#ccc', // Gray color for disabled state
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