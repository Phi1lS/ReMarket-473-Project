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
  const { items, viewedByFriends, userRecommendations } = useContext(UserContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [itemImages, setItemImages] = useState({}); 
  const [loadingImages, setLoadingImages] = useState({}); 

  useEffect(() => {
    setFilteredItems(items);
    fetchItemImages(items); 
    fetchItemImages(viewedByFriends);
    fetchItemImages(userRecommendations);
  }, [items, viewedByFriends]);

  const fetchItemImages = async (items) => {
    const imageMap = {};
    const loadingMap = {};
    
    for (const item of items) {
      loadingMap[item.id] = true; 

      if (item.imageUrl) {
        try {
          const imageRef = ref(storage, item.imageUrl); 
          const downloadURL = await getDownloadURL(imageRef);
          imageMap[item.id] = downloadURL; 
        } catch (error) {
          console.error(`Error fetching image for item ${item.id}:`, error);
        } finally {
          loadingMap[item.id] = false; 
        }
      } else {
        loadingMap[item.id] = false; 
      }
    }
    setItemImages(imageMap); 
    setLoadingImages(loadingMap); 
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
      return 0; 
    });
  };

  const renderItemsRow = (title, data) => (
    <View style={styles.itemSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {data.length > 0 ? (
        <FlatList
          horizontal
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.itemContainer}
              onPress={() => navigation.navigate('ItemPage', { item })}
            >
              {loadingImages[item.id] ? (
                <ActivityIndicator size="small" color="#0070BA" />
              ) : itemImages[item.id] ? (
                <Image source={{ uri: itemImages[item.id] }} style={styles.itemImage} />
              ) : (
                <View style={styles.emptyImagePlaceholder} />
              )}
              <Text style={styles.itemName}>{item.description}</Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
        />
      ) : (
        <Text style={styles.noItemsText}>No items available in this category</Text>
      )}
    </View>
  );

  const renderViewAllButton = () => (
    <TouchableOpacity
      style={styles.viewAllButton}
      onPress={() => navigation.navigate('ViewItemsPage')}
    >
      <Text style={styles.viewAllText}>View All</Text>
    </TouchableOpacity>
  );

  const displayedItems = searchQuery ? filteredItems : sortItemsByDate(items).slice(0, 10);

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
            {renderItemsRow('Recently Posted', displayedItems)}
            {renderItemsRow('Viewed by Friends', viewedByFriends.slice(0, 10))} 
            {renderItemsRow('Recommended for You', userRecommendations.slice(0, 10))}
          </>
        )}

        {searchQuery ? null : renderViewAllButton()}

        <Text style={styles.categoryTitle}>Search by Category</Text>
        <View style={styles.categoryContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={styles.categoryButton}
              onPress={() => navigation.navigate('CategoryPage', { category })}
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
    borderWidth: 0, //if border: 1, there is a teal border. Not sure if I want to keep. Off for now.
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
  viewAllButton: {
    backgroundColor: '#0070BA',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  viewAllText: {
    color: '#fff',
    fontSize: 16,
  },
  noItemsText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'left',
    marginVertical: 15,
  },
});