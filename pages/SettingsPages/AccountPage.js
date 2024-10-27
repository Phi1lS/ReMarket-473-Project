import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TextInput, Image, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { UserContext } from '../../UserContext'; 
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'; // Import Firebase Storage functions
import { db, auth, storage } from '../../firebaseConfig'; // Import your Firebase config

export default function AccountPage() {
  const { userProfile, setUserProfile } = useContext(UserContext);

  const [firstName, setFirstName] = useState(userProfile.firstName);
  const [lastName, setLastName] = useState(userProfile.lastName);
  const [username, setUsername] = useState(userProfile.username);
  const [email, setEmail] = useState(userProfile.email);
  const [avatar, setAvatar] = useState(userProfile.avatar || null); // Store avatar path
  const [avatarUrl, setAvatarUrl] = useState(null); // Full URL for avatar
  const [uploading, setUploading] = useState(false); // Track the upload process

  // Load the avatar URL from Firebase when the component mounts
  useEffect(() => {
    if (avatar) {
      const fetchAvatarUrl = async () => {
        try {
          const avatarRef = ref(storage, avatar);
          const url = await getDownloadURL(avatarRef);
          setAvatarUrl(url); // Store the full download URL
        } catch (error) {
          console.error('Error fetching avatar URL:', error);
        }
      };
      fetchAvatarUrl();
    }
  }, [avatar]);

  // Save button handler to update Firestore and UserContext
  const handleSave = async () => {
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);

      await setDoc(userRef, {
        firstName,
        lastName,
        username,
        email,
        avatar, // Save avatar relative path
      }, { merge: true });

      // Update the context with new data
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

  // Handle picking an image from the media library
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        uploadImage(uri); // Upload the selected image
      } else {
        Alert.alert('Error', 'Unable to pick an image. Please try again.');
      }
    } catch (error) {
      console.error('Error during image picking:', error);
      Alert.alert('Error', 'Failed to pick an image. Please try again.');
    }
  };

  // Upload the selected image to Firebase Storage
  const uploadImage = async (uri) => {
    setUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const avatarPath = `avatars/${auth.currentUser.uid}.jpg`; // Relative path for the avatar
      const avatarRef = ref(storage, avatarPath);

      const uploadTask = uploadBytesResumable(avatarRef, blob);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          console.log(`Upload progress: ${snapshot.bytesTransferred}/${snapshot.totalBytes}`);
        },
        (error) => {
          console.error('Error during Firebase Storage upload:', error);
          Alert.alert('Error', 'Failed to upload image. Please try again.');
        },
        async () => {
          try {
            const url = await getDownloadURL(avatarRef); // Get the full download URL
            setAvatar(avatarPath); // Save the relative path to Firestore
            setAvatarUrl(url); // Update the avatar URL for display
            await setDoc(doc(db, 'users', auth.currentUser.uid), { avatar: avatarPath }, { merge: true });

            Alert.alert('Success', 'Profile picture updated.');
          } catch (error) {
            console.error('Error saving avatar to Firestore:', error);
            Alert.alert('Error', 'Failed to update profile picture. Please try again.');
          }
        }
      );
    } catch (error) {
      console.error('Error during image upload process:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Picture */}
      <View style={styles.profilePictureContainer}>
        {uploading ? (
          <ActivityIndicator size="large" color="#0070BA" />
        ) : (
          <Image
            source={avatarUrl ? { uri: avatarUrl } : require('../../assets/avatar.png')}
            style={styles.profilePicture}
          />
        )}
        {/* Pencil Icon to pick a new profile picture */}
        <TouchableOpacity style={styles.pencilIcon} onPress={pickImage} disabled={uploading}>
          <Ionicons name="pencil" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* First Name Field */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>First Name</Text>
        <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />
      </View>

      {/* Last Name Field */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Last Name</Text>
        <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />
      </View>

      {/* Username Field */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Username</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} />
      </View>

      {/* Email Field */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} />
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
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});