import React from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Avatar, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons'; // For icons
import { useNavigation } from '@react-navigation/native'; // To handle navigation

// Import the local avatar image
const avatarPlaceholder = require('../assets/avatar.png');

export default function HomePage() {
  const navigation = useNavigation(); // Get navigation object

  const friends = [
    { id: 1, name: 'Friend 1', profilePic: avatarPlaceholder },
    { id: 2, name: 'Friend 2', profilePic: avatarPlaceholder },
    { id: 3, name: 'Friend 3', profilePic: avatarPlaceholder },
    { id: 4, name: 'Friend 4', profilePic: avatarPlaceholder },
    { id: 5, name: 'Friend 5', profilePic: avatarPlaceholder },
    { id: 6, name: 'Friend 6', profilePic: avatarPlaceholder },
  ];

  const purchases = [
    {
      id: 1,
      friend: 'Friend 1',
      item: 'Item A',
      time: '10 minutes ago',
      description: 'A cool new gadget.',
      image: require('../assets/item.png'), // Example image for the item
    },
    {
      id: 2,
      friend: 'Friend 2',
      item: 'Item B',
      time: '1 hour ago',
      description: 'A trendy pair of sneakers.',
      image: require('../assets/item.png'), // Example image for the item
    },
    {
      id: 3,
      friend: 'Friend 3',
      item: 'Item C',
      time: 'Yesterday',
      description: 'A delicious box of chocolates.',
      image: require('../assets/item.png'), // Example image for the item
    },
  ];

  return (
    <View style={styles.container}>
      {/* Full-width Top Bar with Search Bubble and Friends */}
      <View style={styles.topBarContainer}>
        <FlatList
          horizontal
          data={[{ id: 'search' }, ...friends]} // Add search as the first element
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            if (item.id === 'search') {
              return (
                <TouchableOpacity style={styles.searchBubble}>
                  <Ionicons name="search" size={24} color="#ffffff" />
                </TouchableOpacity>
              );
            } else {
              return (
                <View style={styles.avatarWrapper}>
                  <Avatar.Image
                    size={50}
                    source={item.profilePic}
                    style={styles.avatar}
                  />
                  <Text style={styles.avatarLabel}>{item.name}</Text>
                </View>
              );
            }
          }}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Purchases Feed */}
      <FlatList
        data={purchases}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('ItemDetail', { item })}>
            <View style={styles.purchaseRow}>
              {/* Top Section with Profile Picture and Name */}
              <View style={styles.purchaseTop}>
                <Avatar.Image size={50} source={item.profilePic} style={styles.purchaseAvatar} />
                <View style={styles.purchaseDetails}>
                  <Text style={styles.purchaseFriend}>{item.friend}</Text>
                  <Text style={styles.purchaseText}>purchased {item.item}</Text>
                  <Text style={styles.purchaseTime}>{item.time}</Text>
                  {/* Space between time and description */}
                  <View style={styles.descriptionSpacing}>
                    <Text style={styles.purchaseDescription}>{item.description}</Text>
                  </View>
                </View>
              </View>

              {/* Bottom Section with Heart and Comment Icons */}
              <View style={styles.purchaseActions}>
                <TouchableOpacity>
                  <Ionicons name="heart-outline" size={28} color="#333" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.commentIconWrapper}>
                  <Ionicons name="chatbubble-outline" size={28} color="#333" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.purchaseFeed}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 0, // Remove padding from left and right
  },
  topBarContainer: {
    width: '100%', // Full width of the screen
    backgroundColor: '#ffffff',
    padding: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3, // Android shadow
  },
  searchBubble: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#58A4B0', // ReMarket Blue
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  avatar: {
    marginBottom: 5,
    backgroundColor: '#4fd1c5', // ReMarket Teal for avatar backgrounds
  },
  purchaseAvatar: {
    backgroundColor: '#4fd1c5', // Set the same background color in purchase avatars
  },
  avatarLabel: {
    fontSize: 12,
    color: '#666',
  },
  purchaseRow: {
    paddingVertical: 25, // Increase the height of each item
    paddingHorizontal: 15,
    backgroundColor: '#ffffff',
    borderRadius: 10,
  },
  purchaseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  purchaseDetails: {
    marginLeft: 15,
    flex: 1,
  },
  purchaseFriend: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  purchaseText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
  purchaseTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  descriptionSpacing: {
    marginTop: 10, // Space between time and description
  },
  purchaseDescription: {
    fontSize: 16, // Larger font size for description
    color: '#000', // Set description to black
  },
  purchaseActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 10,
    marginLeft: 60, // Move icons slightly to the left
  },
  commentIconWrapper: {
    marginLeft: 20, // Add space between heart and comment icon
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 5,
  },
});
