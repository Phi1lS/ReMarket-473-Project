import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet, Platform, StatusBar, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Sample data for recent searches and items (replace with real data)
const recentSearches = ['Laptop', 'Headphones', 'Books'];
const allItems = [
  { id: '1', name: 'Laptop', description: 'High-performance laptop', image: require('../assets/item.png') },
  { id: '2', name: 'Headphones', description: 'Noise-cancelling headphones', image: require('../assets/item.png') },
  { id: '3', name: 'Book', description: 'Bestselling novel', image: require('../assets/item.png') },
];

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recent, setRecent] = useState(recentSearches);
  const [results, setResults] = useState([]);
  const navigation = useNavigation();

  // Handle search query and update results
  const handleSearch = () => {
    if (searchQuery.trim()) {
      const filteredItems = allItems.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setResults(filteredItems);
      
      // Update recent searches if it's a new search
      if (!recent.includes(searchQuery)) {
        setRecent([searchQuery, ...recent.slice(0, 4)]); // Limit to 5 recent searches
      }
      
      // Dismiss the keyboard and blur the input
      Keyboard.dismiss();
    }
  };

  // Render recent searches
  const renderRecentSearches = () => (
    <View style={styles.recentSearchesContainer}>
      <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
      {recent.map((search, index) => (
        <TouchableOpacity key={index} onPress={() => setSearchQuery(search)}>
          <Text style={styles.recentSearchText}>{search}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render search results
  const renderResults = () => (
    <FlatList
      data={results}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.resultItem}
          onPress={() => navigation.navigate('ItemPage', { item })}
        >
          <Text style={styles.resultItemName}>{item.name}</Text>
        </TouchableOpacity>
      )}
    />
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search for items"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch} // Trigger search on enter
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Show recent searches if no query, otherwise show search results */}
      {searchQuery.trim() === '' ? renderRecentSearches() : renderResults()}
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
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingLeft: 15,
    backgroundColor: '#f9f9f9',
  },
  searchButton: {
    backgroundColor: '#0070BA', // ReMarket blue for the search button
    borderRadius: 20,
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
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 10,
  },
  resultItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});
