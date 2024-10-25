import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { db, auth } from '../../firebaseConfig'; // Import Firebase Auth and Firestore
import { collection, query, where, getDocs } from 'firebase/firestore'; // Firestore functions

export default function SearchUsersPage() {
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false); // Track if the user is searching
  const [currentUserId, setCurrentUserId] = useState(null); // State to store current user ID

  useEffect(() => {
    // Get the current user's ID and set it to state
    if (auth.currentUser) {
      setCurrentUserId(auth.currentUser.uid);
      console.log("User ID:", auth.currentUser.uid); // Log user ID for debugging
    } else {
      console.warn("No authenticated user found.");
    }
  }, [auth.currentUser]);

  // Function to search users by name or username in Firestore
  const searchUsers = async () => {
    if (!currentUserId) return; // Ensure currentUserId is set before proceeding

    setIsSearching(true);
    let q;
    const usersRef = collection(db, 'users'); // Reference to the "users" collection

    if (searchTerm.startsWith('@')) {
      // Search by username
      const usernameQuery = searchTerm.substring(1).toLowerCase(); // Remove "@" and lowercase
      q = query(usersRef, where('username', '>=', `@${usernameQuery}`), where('username', '<=', `@${usernameQuery}\uf8ff`));
    } else {
      // Search by name
      const [firstName, lastName] = searchTerm.split(' ');
      if (lastName) {
        q = query(usersRef, where('firstName', '>=', firstName), where('lastName', '>=', lastName));
      } else {
        q = query(usersRef, where('firstName', '>=', firstName), where('firstName', '<=', firstName + '\uf8ff'));
      }
    }

    try {
      const querySnapshot = await getDocs(q);
      const usersData = [];
      querySnapshot.forEach((doc) => {
        const userData = { id: doc.id, ...doc.data() };
        if (userData.id !== currentUserId) {
          usersData.push(userData);
        }
      });
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // UseEffect to trigger the search when the searchTerm changes
  useEffect(() => {
    if (searchTerm) {
      searchUsers();
    } else {
      setFilteredUsers([]); // Clear the list when no search term
    }
  }, [searchTerm, currentUserId]); // Depend on currentUserId to ensure it’s available

  return (
    <View style={styles.container}>
      {/* Search Bar */}
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
              source={{ uri: item.avatar || 'https://example.com/default-avatar.png' }}
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
    borderColor: '#58A4B0', // Teal border for consistency
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