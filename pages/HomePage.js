import React from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Avatar, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Use avatar.png as a placeholder
const avatarPlaceholder = require('../assets/avatar.png');

export default function HomePage() {
  const navigation = useNavigation();

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
      description: 'Super excited for this gadget!',
      image: require('../assets/item.png'),
    },
    {
      id: 2,
      friend: 'Friend 2',
      item: 'Item B',
      time: '1 hour ago',
      description: 'These sneakers will be super comfortable!',
      image: require('../assets/item.png'),
    },
    {
      id: 3,
      friend: 'Friend 3',
      item: 'Item C',
      time: 'Yesterday',
      description: 'The chocolates will be delicious!',
      image: require('../assets/item.png'),
    },
  ];

  return (
    <View style={styles.container}>
      {/* Full-width Top Bar with Search Bubble and Friends */}
      <View style={styles.topBarContainer}>
        <FlatList
          horizontal
          data={[{ id: 'search' }, ...friends]} 
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            if (item.id === 'search') {
              return (
                <TouchableOpacity 
                  style={styles.searchBubble}
                  onPress={() => navigation.navigate('SearchUsersPage')} // Navigate to SearchUsersPage
                >
                  <Ionicons name="search" size={24} color="#ffffff" />
                </TouchableOpacity>
              );
            } else {
              return (
                <View style={styles.avatarWrapper}>
                  <Avatar.Image
                    size={50}
                    source={item.profilePic}
                    style={styles.avatar} // Blue background for friend avatars
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
              <View style={styles.purchaseTop}>
                <Avatar.Image 
                  size={50} 
                  source={item.profilePic} 
                  style={styles.purchaseAvatar} // Blue background for avatars in purchase list
                />
                <View style={styles.purchaseDetails}>
                  <Text style={styles.purchaseFriend}>{item.friend}</Text>
                  <Text style={styles.purchaseText}>purchased {item.item}</Text>
                  <Text style={styles.purchaseTime}>{item.time}</Text>
                  <View style={styles.descriptionSpacing}>
                    <Text style={styles.purchaseDescription}>{item.description}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.purchaseActions}>
                <TouchableOpacity>
                  <Ionicons name="heart-outline" size={28} color="#333" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.commentIconWrapper} 
                  onPress={() => navigation.navigate('ItemDetail', { item })}
                >
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
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 15,
  },
  topBarContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    padding: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  searchBubble: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CB0E6', // Changed to blue
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
    backgroundColor: '#4CB0E6', // Changed to blue
  },
  avatarLabel: {
    fontSize: 12,
    color: '#666',
  },
  purchaseRow: {
    paddingVertical: 25,
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
  purchaseAvatar: {
    backgroundColor: '#4CB0E6', // Changed to blue
  },
  descriptionSpacing: {
    marginTop: 10,
  },
  purchaseDescription: {
    fontSize: 16,
    color: '#000',
  },
  purchaseActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 10,
    marginLeft: 60,
  },
  commentIconWrapper: {
    marginLeft: 20,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 5,
  },
});
