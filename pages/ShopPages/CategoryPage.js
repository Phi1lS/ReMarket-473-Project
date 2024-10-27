import React, { useContext, useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { UserContext } from '../../UserContext'; // Import UserContext for items data
import { useNavigation } from '@react-navigation/native';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../../firebaseConfig'; // Import Firebase storage config

export default function CategoryPage({ route }) {
  const { category } = route.params; // Get category from navigation params
  const { items } = useContext(UserContext); // Access items from UserContext
  const navigation = useNavigation();
  const [categoryItems, setCategoryItems] = useState([]); // State to hold items with their image URLs

  // Fetch the image URLs for the items in the selected category
  useEffect(() => {
    const fetchCategoryItemsWithImages = async () => {
      const filteredItems = items.filter((item) => item.category === category);

      const itemsWithImages = await Promise.all(
        filteredItems.map(async (item) => {
          if (item.imageUrl) {
            const imageRef = ref(storage, item.imageUrl); // Reference to the item's image in Firebase Storage
            try {
              const imageUrl = await getDownloadURL(imageRef); // Fetch the full image URL
              return { ...item, imageUrl }; // Return the item with the full image URL
            } catch (error) {
              console.warn(`Failed to fetch image for item ${item.id}:`, error);
              return item; // Return item without updating imageUrl if there's an error
            }
          }
          return item; // Return item as is if no imageUrl is provided
        })
      );
      setCategoryItems(itemsWithImages); // Set the category items with their image URLs
    };

    fetchCategoryItemsWithImages();
  }, [category, items]);

  // Sort the category items by date using createdAt timestamp
  const sortedCategoryItems = sortItemsByDate(categoryItems);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{category} Items</Text>
      <FlatList
        data={sortedCategoryItems}
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
      />
    </View>
  );
}

// Sorting function to sort items by createdAt timestamp
const sortItemsByDate = (items) => {
  return items.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0070BA',
    marginBottom: 15,
    textAlign: 'center',
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  itemName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
});