import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, ScrollView, StatusBar, Platform, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../../UserContext'; // Import UserContext for dynamic updates
import { auth, db, storage } from '../../firebaseConfig'; // Firebase imports
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const categories = [
  'Electronics', 'Fashion', 'Home', 'Toys', 'Sports', 'Motors', 'Beauty', 'Books', 'Music', 'Collectibles'
];

export default function CreateListingPage() {
  const { userProfile, setUserProfile } = useContext(UserContext); // Access UserContext
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
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

  const uploadImage = async (uri) => {
    setUploading(true);
    const response = await fetch(uri);
    const blob = await response.blob();
    const imageRef = ref(storage, `listings/${auth.currentUser.uid}/${Date.now()}.jpg`);
    const uploadTask = uploadBytesResumable(imageRef, blob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          console.log(`Upload progress: ${snapshot.bytesTransferred}/${snapshot.totalBytes}`);
        },
        (error) => {
          console.error('Error during image upload:', error);
          setUploading(false);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('Image uploaded, download URL:', downloadURL);
          setUploading(false);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleCreateListing = async () => {
    if (!description || !price || !quantity || !selectedCategory || !image) {
      Alert.alert('Error', 'Please fill out all fields and upload an image.');
      return;
    }

    try {
      const imageUrl = await uploadImage(image);

      const listingData = {
        imageUrl,
        description,
        price,
        quantity,
        category: selectedCategory,
        createdAt: new Date(),
      };

      // Add listing to Firestore under the current user's listings collection
      const listingRef = await addDoc(collection(db, 'users', auth.currentUser.uid, 'listings'), listingData);

      // Update listings in UserContext dynamically
      setUserProfile((prevProfile) => ({
        ...prevProfile,
        listings: [...(prevProfile.listings || []), { id: listingRef.id, ...listingData }],
      }));

      Alert.alert('Success', 'Listing created successfully!');
      navigation.navigate('SellingScreen');
    } catch (error) {
      console.error('Error creating listing:', error);
      Alert.alert('Error', `Failed to create listing. ${error.message}`);
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

          <TextInput
            style={styles.input}
            placeholder="Price"
            value={price ? `$${price}` : ''} // Display the $ symbol only if there's a value
            onChangeText={(text) => setPrice(text.replace(/[^0-9.]/g, ''))} // Allow only numbers and decimal points
            keyboardType="numeric"
            placeholderTextColor="#888"
          />

          <TextInput
            style={styles.input}
            placeholder="Quantity"
            value={quantity}
            onChangeText={(text) => setQuantity(text.replace(/[^0-9]/g, ''))} // Allow only numbers
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
  scrollContainer: {
    paddingBottom: 20,
  },
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
