import React, { useState } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Avatar } from 'react-native-paper';

// Mock data for users
const users = [
  { id: 1, name: 'User 1', profilePic: require('../../assets/avatar.png') },
  { id: 2, name: 'User 2', profilePic: require('../../assets/avatar.png') },
  { id: 3, name: 'User 3', profilePic: require('../../assets/avatar.png') },
  { id: 4, name: 'User 4', profilePic: require('../../assets/avatar.png') },
];

export default function SearchUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false); // Track if the user is searching

  // Filter users based on the search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <TextInput
        style={[styles.searchBar, isSearching && styles.searchBarActive]} // Apply active style when searching
        placeholder="Search for users"
        value={searchTerm}
        onChangeText={setSearchTerm}
        onFocus={() => setIsSearching(true)}  // Focus event to show the expanded search bar
        onBlur={() => setIsSearching(false)}  // Blur event to collapse the search bar
      />

      {/* List of Filtered Users */}
      <FlatList
        data={filteredUsers}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.userItem}>
            <Avatar.Image size={50} source={item.profilePic} style={styles.avatar} />
            <Text style={styles.userName}>{item.name}</Text>
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
});
