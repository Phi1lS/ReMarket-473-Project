import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, TextInput, ScrollView, Text, Image, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const categories = [
  'Electronics', 'Fashion', 'Home', 'Toys', 'Sports', 'Motors', 'Beauty', 'Books', 'Music', 'Collectibles'
];

export default function ShopPage() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const itemsRef = collection(db, 'marketplace');
        const snapshot = await getDocs(itemsRef);
        const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllItems(itemsData);
        setFilteredItems(itemsData); // Initialize filteredItems with all items
      } catch (error) {
        console.error('Error fetching items from marketplace:', error);
      }
    };

    fetchItems();
  }, []);

  // Function to handle search input
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredItems(allItems); // Reset to all items if search is empty
    } else {
      const filtered = allItems.filter((item) =>
        item.description.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  };

  // Reusable component for rendering rows of items
  const renderItemsRow = (title, data) => (
    <View style={styles.itemSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => navigation.navigate('ItemPage', { item })}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
            <Text style={styles.itemName}>{item.description}</Text> 
          </TouchableOpacity>
        )}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Add Logo at the top */}
      <Image 
        source={require('../assets/ReMarketlogo.png')} 
        style={styles.logo} 
        resizeMode="contain"
      />

      <View style={styles.topBar}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search for items"
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#888"
        />
        <TouchableOpacity
          style={styles.cartIcon}
          onPress={() => navigation.navigate('CartPage', { cart: allItems })}
        >
          <Ionicons name="cart-outline" size={28} color="#0070BA" />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Display filtered search results if a search query is present */}
        {searchQuery ? (
          renderItemsRow('Search Results', filteredItems)
        ) : (
          <>
            {renderItemsRow('Recently Posted', allItems)}
            {renderItemsRow('Viewed by Friends', allItems)}
            {renderItemsRow('Recommended for You', allItems)}
          </>
        )}

        <Text style={styles.categoryTitle}>Search by Category</Text>
        <View style={styles.categoryContainer}>
          {categories.map((category) => (
            <TouchableOpacity key={category} style={styles.categoryButton}>
              <Text style={styles.categoryText}>{category}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 45 : StatusBar.currentHeight + 15,
    paddingHorizontal: 10,
  },
  logo: {
    width: '100%',
    height: 60,
    marginBottom: 0,
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  searchBar: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#0070BA',
    borderRadius: 20,
    paddingLeft: 15,
    backgroundColor: '#f9f9f9',
  },
  cartIcon: {
    marginLeft: 10,
    padding: 5,
  },
  itemSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0070BA',
  },
  itemContainer: {
    width: 130,
    backgroundColor: '#f0f0f0',
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#0070BA',
  },
  itemImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 5,
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 20,
    color: '#0070BA',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryButton: {
    width: '30%',
    backgroundColor: '#0070BA',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});