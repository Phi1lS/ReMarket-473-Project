import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, StyleSheet, Text, Image, Keyboard, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, storage, auth } from '../firebaseConfig'; // Import Firebase storage as well
import { getDownloadURL, ref } from 'firebase/storage'; // Import getDownloadURL
import fallbackAvatar from '../assets/avatar.png';

export default function SearchPage() {
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredResults, setFilteredResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]); // Store recent searches
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    if (auth.currentUser) {
      setCurrentUserId(auth.currentUser.uid);
    } else {
      console.warn("No authenticated user found.");
    }
  }, [auth.currentUser]);

  const searchUsersAndItems = async () => {
    if (!currentUserId || !searchTerm.trim()) return;

    setIsSearching(true);
    const usersRef = collection(db, 'users');
    const itemsRef = collection(db, 'marketplace');
    const searchResults = [];

    const userQuery = query(
      usersRef,
      where('firstName', '>=', searchTerm),
      where('firstName', '<=', searchTerm + '\uf8ff')
    );

    const itemQuery = query(
      itemsRef,
      where('description', '>=', searchTerm),
      where('description', '<=', searchTerm + '\uf8ff')
    );

    try {
      const userSnapshot = await getDocs(userQuery);
      const itemSnapshot = await getDocs(itemQuery);

      // Fetch user data and their avatars
      const userResults = await Promise.all(userSnapshot.docs.map(async (doc) => {
        const userData = { id: doc.id, ...doc.data(), type: 'user' };

        if (userData.id !== currentUserId) {
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
        }
      }));

      // Fetch item data and their images
      const itemResults = await Promise.all(itemSnapshot.docs.map(async (doc) => {
        const itemData = { id: doc.id, ...doc.data(), type: 'item' };

        if (itemData.imageUrl) {
          try {
            const imageRef = ref(storage, itemData.imageUrl);
            itemData.imageUrl = await getDownloadURL(imageRef);
          } catch (error) {
            console.warn(`Failed to fetch image for item ${itemData.id}:`, error);
            itemData.imageUrl = null; // Handle error gracefully
          }
        }
        return itemData;
      }));

      // Combine user and item results
      const results = [...userResults, ...itemResults].filter(Boolean); // Filter out undefined values
      setFilteredResults(results);

      // Update recent searches only when a complete search is submitted
      if (searchTerm && !recentSearches.includes(searchTerm)) {
        setRecentSearches([searchTerm, ...recentSearches.slice(0, 4)]);
      }
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmitSearch = () => {
    Keyboard.dismiss();
    searchUsersAndItems();
  };

  const renderRecentSearches = () => (
    <View style={styles.recentSearchesContainer}>
      <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
      {recentSearches.map((search, index) => (
        <TouchableOpacity key={index} onPress={() => setSearchTerm(search)}>
          <Text style={styles.recentSearchText}>{search}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBarContainer}>
        <TextInput
          style={[styles.searchBar, isSearching && styles.searchBarActive]}
          placeholder="Search for items or users"
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={handleSubmitSearch} // Trigger search on Enter
          onFocus={() => setIsSearching(true)}
          onBlur={() => setIsSearching(false)}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSubmitSearch}>
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {searchTerm.trim() === '' ? (
        renderRecentSearches()
      ) : (
        <FlatList
          data={filteredResults}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() =>
                navigation.navigate(item.type === 'user' ? 'UserProfilePage' : 'ItemPage', {
                  userId: item.id,
                  item,
                })
              }
            >
              {item.type === 'user' ? (
                <Avatar.Image
                  size={50}
                  source={{ uri: item.avatarUrl }} // Ensure this is always a string
                  style={styles.avatar}
                />
              ) : (
                item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }} // Ensure this is always a string
                    style={styles.itemImage}
                  />
                ) : (
                  <Ionicons name="image-outline" size={40} color="#888" />
                )
              )}
              <View style={styles.textContainer}>
                <Text style={styles.userName}>
                  {item.type === 'user' ? `${item.firstName} ${item.lastName}` : item.description}
                </Text>
                {item.type === 'user' && <Text style={styles.userUsername}>{item.username}</Text>}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 80 : StatusBar.currentHeight + 15,
    paddingHorizontal: 20,
  },
  searchBarContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 25,
    paddingLeft: 15,
    backgroundColor: '#f9f9f9',
  },
  searchBarActive: {
    borderColor: '#4CB0E6',
    backgroundColor: '#f0f0f0',
  },
  searchButton: {
    backgroundColor: '#0070BA',
    borderRadius: 25,
    padding: 10,
    marginLeft: 10,
  },
  recentSearchesContainer: {
    marginBottom: 20,
  },
  recentSearchesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  recentSearchText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  avatar: {
    backgroundColor: '#4CB0E6',
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#ddd',
  },
  textContainer: {
    marginLeft: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  userUsername: {
    fontSize: 14,
    color: '#666',
  },
});