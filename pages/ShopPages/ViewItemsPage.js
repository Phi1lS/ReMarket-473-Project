import React, { useContext, useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, Image, Modal, Pressable } from 'react-native';
import { UserContext } from '../../UserContext'; // Import UserContext for items data
import { useNavigation } from '@react-navigation/native';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../../firebaseConfig'; // Import Firebase storage config
import { MaterialIcons } from '@expo/vector-icons'; // Import icons

export default function ViewItemsPage() {
  const { items } = useContext(UserContext); // Access items from UserContext
  const navigation = useNavigation();
  const [itemsWithImages, setItemsWithImages] = useState([]); // State to hold items with their image URLs
  const [sortOption, setSortOption] = useState('Recently Posted'); // State for sorting option
  const [modalVisible, setModalVisible] = useState(false); // State to manage modal visibility
  const [currentPage, setCurrentPage] = useState(1); // Current page for pagination
  const itemsPerPage = 8; // Number of items to show per page

  // Fetch the image URLs for all items
  useEffect(() => {
    const fetchItemsWithImages = async () => {
      const itemsWithImagesPromises = items.map(async (item) => {
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
      });

      const resolvedItems = await Promise.all(itemsWithImagesPromises); // Wait for all promises to resolve
      setItemsWithImages(resolvedItems); // Set the items with their image URLs
    };

    fetchItemsWithImages();
  }, [items]);

  // Sort items based on the selected sort option
  const sortedItems = () => {
    switch (sortOption) {
      case 'Viewed By Friends':
        // Implement logic for sorting by viewed items
        return itemsWithImages; // Placeholder: return original order for now
      case 'Recommended for You':
        // Implement logic for sorting by recommended items
        return itemsWithImages; // Placeholder: return original order for now
      case 'Recently Posted':
      default:
        return sortItemsByDate(itemsWithImages); // Sort by date
    }
  };

  // Get the items to display for the current page
  const displayedItems = sortedItems().slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  // Calculate total number of pages
  const totalPages = Math.ceil(itemsWithImages.length / itemsPerPage);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Items</Text>

      {/* Sort Dropdown Modal */}
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort By: {sortOption}</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(!modalVisible)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Select Sort Option</Text>
            {['Recently Posted', 'Viewed By Friends', 'Recommended for You'].map((option) => (
              <Pressable
                key={option}
                style={styles.modalOption}
                onPress={() => {
                  setSortOption(option);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.modalOptionText}>{option}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <FlatList
        data={displayedItems}
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
        ListFooterComponent={
          // Pagination Controls at the bottom of the list
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={styles.pageButton}
              onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <MaterialIcons name="arrow-back-ios" size={24} color="white" />
            </TouchableOpacity>

            <Text style={styles.pageInfo}>Page {currentPage} of {totalPages}</Text>

            <TouchableOpacity
              style={styles.pageButton}
              onPress={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <MaterialIcons name="arrow-forward-ios" size={24} color="white" />
            </TouchableOpacity>
          </View>
        }
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
  sortContainer: {
    marginBottom: 15,
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: 16,
    color: '#0070BA',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#0070BA',
  },
  modalOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    width: '100%',
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#0070BA',
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // Center the pagination controls
    alignItems: 'center',
    padding: 10,
  },
  pageButton: {
    backgroundColor: '#0070BA',
    borderRadius: 50,
    padding: 10,
    elevation: 5,
    marginHorizontal: 10, // Space between buttons
  },
  pageInfo: {
    fontSize: 16,
    textAlign: 'center',
    color: '#0070BA', // Color to match the theme
  },
});