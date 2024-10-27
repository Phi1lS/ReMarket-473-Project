import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, StyleSheet, Text, Image, Keyboard } from 'react-native';
import { Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { db, storage, auth } from '../../firebaseConfig'; // Import Firebase Auth and Firestore
import { collection, query, where, getDocs } from 'firebase/firestore'; // Firestore functions
import { getDownloadURL, ref } from 'firebase/storage';
import fallbackAvatar from '../../assets/avatar.png';

export default function SearchUsersPage() {
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const currentUserId = auth.currentUser?.uid; // Get the current user's ID

  const searchUsers = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    const usersRef = collection(db, 'users');
    let q;

    if (searchTerm.startsWith('@')) {
      const usernameQuery = searchTerm.substring(1).toLowerCase();
      q = query(usersRef, where('username', '>=', `@${usernameQuery}`), where('username', '<=', `@${usernameQuery}\uf8ff`));
    } else {
      const [firstName, lastName] = searchTerm.split(' ');
      if (lastName) {
        q = query(usersRef, where('firstName', '>=', firstName), where('lastName', '>=', lastName));
      } else {
        q = query(usersRef, where('firstName', '>=', firstName), where('firstName', '<=', firstName + '\uf8ff'));
      }
    }

    try {
      const querySnapshot = await getDocs(q);
      const usersData = await Promise.all(querySnapshot.docs.map(async (doc) => {
        const userData = { id: doc.id, ...doc.data() };

        // Skip current user
        if (userData.id === currentUserId) return null;

        // Fetch avatar URL
        if (userData.avatar) {
          try {
            const avatarRef = ref(storage, userData.avatar);
            const avatarUrl = await getDownloadURL(avatarRef);
            userData.avatarUrl = avatarUrl;
          } catch (error) {
            console.warn(`Failed to fetch avatar for user ${userData.id}:`, error);
            userData.avatarUrl = Image.resolveAssetSource(fallbackAvatar).uri;
          }
        } else {
          userData.avatarUrl = Image.resolveAssetSource(fallbackAvatar).uri;
        }

        return userData;
      }));

      // Filter out null values (current user) and update state
      setFilteredUsers(usersData.filter(user => user !== null));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      searchUsers();
    } else {
      setFilteredUsers([]);
    }
  }, [searchTerm]);

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.searchBar, isSearching && styles.searchBarActive]}
        placeholder="Search for users"
        value={searchTerm}
        onChangeText={setSearchTerm}
        onFocus={() => setIsSearching(true)}
        onBlur={() => setIsSearching(false)}
      />

      {/* List of Filtered Users */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.userItem}
            onPress={() => navigation.navigate('UserProfilePage', { userId: item.id })} // Pass the full user object
          >
            <Avatar.Image
              size={50}
              source={{ uri: item.avatarUrl }} // Ensure this is always a string
              style={styles.avatar}
            />
            <View>
              <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
              <Text style={styles.userUsername}>{item.username}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5', // Light background for a cleaner look
  },
  searchBar: {
    height: 45,
    borderColor: '#4CB0E6', // Teal border for consistency
    borderWidth: 1,
    borderRadius: 25,
    paddingLeft: 20,
    backgroundColor: '#fff', // White background for the search bar
    marginBottom: 20,
    fontSize: 16,
  },
  searchBarActive: {
    borderColor: '#4CB0E6', // Blue border when the user is actively searching
    backgroundColor: '#f0f0f0', // Light grey background during search
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff', // White background for each user item
    borderRadius: 10,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  avatar: {
    backgroundColor: '#4CB0E6', // Blue background for avatar
  },
  userName: {
    marginLeft: 15,
    fontSize: 18, // Slightly larger font for better readability
    color: '#333',
    fontWeight: '500',
  },
  userUsername: {
    marginLeft: 15,
    fontSize: 16,
    color: '#666',
  },
});