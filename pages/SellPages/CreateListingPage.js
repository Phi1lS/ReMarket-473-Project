import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, ScrollView, StatusBar, Platform, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../../UserContext'; // Import UserContext for dynamic updates
import { auth, db, storage } from '../../firebaseConfig'; // Firebase imports
import { collection, doc, addDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const categories = [
  'Electronics', 'Fashion', 'Home', 'Toys', 'Sports', 'Motors', 'Beauty', 'Books', 'Music', 'Collectibles'
];

export default function CreateListingPage() {
  const { userProfile, setUserProfile } = useContext(UserContext); // Access user profile from UserContext
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(''); // Add quantity field
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigation = useNavigation();

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access camera roll is required!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Upload image and return the relative path
  const uploadImage = async (uri, sellerId, marketplaceId) => {
    if (!uri) {
      throw new Error('Image URI is undefined');
    }
  
    setUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const imageRef = ref(storage, `listings/${sellerId}/${marketplaceId}.jpg`); // Set the relative path
  
      const uploadTask = uploadBytesResumable(imageRef, blob);
  
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            console.log(`Upload progress: ${snapshot.bytesTransferred}/${snapshot.totalBytes}`);
          },
          (error) => {
            console.error('Upload failed:', error);
            setUploading(false);
            reject(error);
          },
          async () => {
            // Save only the relative path
            setUploading(false);
            resolve(`listings/${sellerId}/${marketplaceId}.jpg`);
          }
        );
      });
    } catch (error) {
      console.error('Error during image upload:', error);
      setUploading(false);
      throw error;
    }
  };

  const handleCreateListing = async () => {
    if (!userProfile?.id || !description || !price || !selectedCategory || !image || !quantity) {
      Alert.alert('Error', 'Please fill out all fields, select a category, and upload an image.');
      return;
    }
  
    try {
      // Create the listing without the imageUrl
      const listingData = {
        description,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        category: selectedCategory,
        sellerId: userProfile.id,
        sellerName: `${userProfile.firstName || 'Unknown'} ${userProfile.lastName || ''}`,
        sellerAvatar: userProfile.avatar || '',
        createdAt: new Date(),
      };
  
      // Add listing to Firestore and get the new listing ID
      const userListingRef = await addDoc(collection(db, 'users', userProfile.id, 'listings'), listingData);
      const listingId = userListingRef.id;
  
      // Upload the image and get the relative path
      const imageUrl = await uploadImage(image, userProfile.id, listingId);
  
      // Update the listing with the imageUrl (relative path)
      const listingWithImageUrl = {
        ...listingData,
        id: listingId,
        imageUrl,
      };
  
      // Save the updated listing to both the user's listings and the marketplace
      await setDoc(doc(db, 'users', userProfile.id, 'listings', listingId), listingWithImageUrl, { merge: true });
      await setDoc(doc(db, 'marketplace', listingId), listingWithImageUrl, { merge: true });
  
      // Update the user profile context with the new listing
      setUserProfile((prevProfile) => ({
        ...prevProfile,
        listings: [...(prevProfile.listings || []), listingWithImageUrl],
      }));
  
      Alert.alert('Success', 'Listing created successfully!');
      navigation.navigate('SellingScreen');
    } catch (error) {
      console.error('Error creating listing:', error);
      Alert.alert('Error', 'Failed to create listing. Please try again.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.header}>Create New Listing</Text>

          <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
            {image ? (
              <Image source={{ uri: image }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholderContainer}>
                <Ionicons name="camera-outline" size={32} color="#888" />
                <Text style={styles.imagePlaceholder}>Upload Image</Text>
              </View>
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Item Description"
            value={description}
            onChangeText={setDescription}
            placeholderTextColor="#888"
          />

          {/* Item Price */}
          <TextInput
            style={styles.input}
            placeholder="Price"
            value={price ? `$${price}` : ''}  // Display the $ symbol only if there's a value
            onChangeText={(text) => setPrice(text.replace(/[^0-9.]/g, ''))}  // Allow only numbers and decimal points
            keyboardType="numeric"
            placeholderTextColor="#888"
          />

          {/* Quantity Input */}
          <TextInput
            style={styles.input}
            placeholder="Quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholderTextColor="#888"
          />

          <Text style={styles.categoryHeader}>Select a Category</Text>
          <View style={styles.categoryContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonSelected,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={styles.categoryText}>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.createButton, uploading && { backgroundColor: '#ccc' }]}
            onPress={handleCreateListing}
            disabled={uploading}
          >
            <Text style={styles.createButtonText}>{uploading ? 'Uploading...' : 'Create Listing'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 15,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    color: '#333',
  },
  imagePicker: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    height: 200,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  imagePlaceholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    color: '#888',
    fontSize: 18,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
  },
  categoryHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryButton: {
    width: '48%',
    backgroundColor: '#0070BA',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryButtonSelected: {
    backgroundColor: '#005c99',
  },
  categoryText: {
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#0070BA',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
