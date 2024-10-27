import React, { useContext, useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, TextInput, ScrollView, Text, Image, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getDownloadURL, ref } from 'firebase/storage'; // Import Firebase storage functions
import { db, storage } from '../firebaseConfig';
import { UserContext } from '../UserContext'; // Import UserContext

const categories = [
  'Electronics', 'Fashion', 'Home', 'Toys', 'Sports', 'Motors', 'Beauty', 'Books', 'Music', 'Collectibles'
];


export default function ShopPage() {
  const navigation = useNavigation();
  const { items } = useContext(UserContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [itemImages, setItemImages] = useState({}); // Store image URLs
  const [loadingImages, setLoadingImages] = useState({}); // Track loading states of each image

  useEffect(() => {
    setFilteredItems(items);
    fetchItemImages(items); // Fetch images when items change
  }, [items]);

  // Function to fetch the image URLs for the items
  const fetchItemImages = async (items) => {
    const imageMap = {};
    const loadingMap = {};
    
    for (const item of items) {
      loadingMap[item.id] = true; // Set loading to true for the item

      if (item.imageUrl) {
        try {
          const imageRef = ref(storage, item.imageUrl); // Use relative path
          const downloadURL = await getDownloadURL(imageRef);
          imageMap[item.id] = downloadURL; // Map item id to its image URL
        } catch (error) {
          console.error(`Error fetching image for item ${item.id}:`, error);
        } finally {
          loadingMap[item.id] = false; // Set loading to false after fetching
        }
      } else {
        loadingMap[item.id] = false; // No imageUrl, no loading needed
      }
    }
    setItemImages(imageMap); // Update state with image URLs
    setLoadingImages(loadingMap); // Update loading state
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredItems(items);
    } else {
      const filtered = items.filter((item) =>
        item.description.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  };

  const sortItemsByDate = (itemsArray) => {
    return itemsArray.slice().sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.seconds - a.createdAt.seconds;
      }
      return 0; // Return 0 if the timestamp is not available
    });
  };

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
            {/* Use the fetched image URL from the itemImages state */}
            {loadingImages[item.id] ? (
              <ActivityIndicator size="small" color="#0070BA" /> // Show loader while fetching
            ) : itemImages[item.id] ? (
              <Image source={{ uri: itemImages[item.id] }} style={styles.itemImage} />
            ) : (
              <View style={styles.emptyImagePlaceholder} /> // Empty space if no image is available
            )}
            <Text style={styles.itemName}>{item.description}</Text>
          </TouchableOpacity>
        )}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );

  return (
    <View style={styles.container}>
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
          onPress={() => navigation.navigate('CartPage', { cart: items })}
        >
          <Ionicons name="cart-outline" size={28} color="#0070BA" />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {searchQuery ? (
          renderItemsRow('Search Results', filteredItems)
        ) : (
          <>
            {renderItemsRow('Recently Posted', sortItemsByDate(items))}
            {renderItemsRow('Viewed by Friends', sortItemsByDate(items))}
            {renderItemsRow('Recommended for You', sortItemsByDate(items))}
          </>
        )}

        <Text style={styles.categoryTitle}>Search by Category</Text>
        <View style={styles.categoryContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={styles.categoryButton}
              onPress={() => navigation.navigate('CategoryPage', { category })} // Navigate to CategoryPage
            >
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
  emptyImagePlaceholder: {
    width: 130, // Adjust width and height accordingly
    height: 85,
    backgroundColor: '#f0f0f0', // Optional: add a placeholder background color
    borderRadius: 8,
  },
});