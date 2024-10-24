import React, { useContext, useState } from 'react';
import { View, Text, TextInput, Image, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { UserContext } from '../../UserContext'; 
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Import Firebase Storage functions
import { db, auth, storage } from '../../firebaseConfig'; // Import your Firebase config

export default function AccountPage() {
  // Access the user profile from the UserContext
  const { userProfile, setUserProfile } = useContext(UserContext);

  // Local state for the fields to allow editing
  const [firstName, setFirstName] = useState(userProfile.firstName);
  const [lastName, setLastName] = useState(userProfile.lastName);
  const [username, setUsername] = useState(userProfile.username);
  const [email, setEmail] = useState(userProfile.email);
  const [avatar, setAvatar] = useState(userProfile.avatar || null); // Local state for avatar
  const [uploading, setUploading] = useState(false); // To track the upload process

  // Save button handler to update Firestore and UserContext
  const handleSave = async () => {
    try {
      // Reference to the user's document in Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);

      // Update Firestore document with new profile data
      await setDoc(userRef, {
        firstName,
        lastName,
        username,
        email,
        avatar, // Save avatar URL if provided
      }, { merge: true });

      // Update UserContext
      setUserProfile({
        ...userProfile,
        firstName,
        lastName,
        username,
        email,
        avatar,
      });

      Alert.alert('Success', 'Your profile has been updated.');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  // Handle picking an image
  const pickImage = async () => {
    let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'Permission to access camera roll is required!');
      return;
    }
  
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
  
    console.log('Image Picker Result:', result); // Log the result to ensure we get a valid image URI
  
    if (!result.canceled) {
      const uri = result.assets[0].uri; // Access the image URI correctly from assets array
      if (uri) {
        uploadImage(uri); // Pass the image URI to the upload function
      } else {
        Alert.alert('Error', 'Unable to pick an image. Please try again.');
      }
    }
  };

  // Upload the selected image to Firebase Storage
  const uploadImage = async (uri) => {
    setUploading(true);
    try {
      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          resolve(xhr.response);
        };
        xhr.onerror = function (e) {
          console.log(e);
          reject(new TypeError('Network request failed'));
        };
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send(null);
      });
  
      // Create a reference to the file in Firebase Storage
      const storageRef = ref(storage, `avatars/${auth.currentUser.uid}.jpg`);
  
      // Upload the file to Firebase Storage
      await uploadBytes(storageRef, blob);
  
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
  
      // Update the avatar URL in local state and Firestore
      setAvatar(downloadURL);
  
      await setDoc(doc(db, 'users', auth.currentUser.uid), { avatar: downloadURL }, { merge: true });
  
      Alert.alert('Success', 'Profile picture updated.');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Picture */}
      <View style={styles.profilePictureContainer}>
        <Image
          source={
            avatar
              ? { uri: avatar } // Use the avatar URL if available
              : require('../../assets/avatar.png') // Fallback to local avatar.png
          }
          style={styles.profilePicture}
        />
        {/* Pencil Icon to pick a new profile picture */}
        <TouchableOpacity style={styles.pencilIcon} onPress={pickImage} disabled={uploading}>
          <Ionicons name="pencil" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* First Name Field */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
        />
      </View>

      {/* Last Name Field */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
        />
      </View>

      {/* Username Field */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
        />
      </View>

      {/* Email Field */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={uploading}>
        <Text style={styles.saveButtonText}>{uploading ? 'Uploading...' : 'Save'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  profilePicture: {
    width: 150,
    height: 150,
    borderRadius: 75, // Make it round
    marginBottom: 20,
    borderColor: '#4CAF50',
    borderWidth: 2,
    backgroundColor: '#4CAF50',
  },
  pencilIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    padding: 5,
  },
  fieldContainer: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  saveButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});