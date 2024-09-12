import React from 'react';
import { View, TextInput, Image, StyleSheet, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from 'react-native-paper';

export default function ItemDetailScreen({ route }) {
  const { item } = route.params; // Get the item data passed via navigation

  // Sample comments
  const comments = [
    {
      id: 1,
      name: 'User1',
      comment: 'This looks awesome! Where did you get it?',
      time: '2 hours ago',
      profilePic: require('../../assets/avatar.png'), // Example avatar
    },
    {
      id: 2,
      name: 'User2',
      comment: 'I bought something similar last week!',
      time: '4 hours ago',
      profilePic: require('../../assets/avatar.png'),
    },
    {
      id: 3,
      name: 'User3',
      comment: 'Can’t wait to get mine!',
      time: '1 day ago',
      profilePic: require('../../assets/avatar.png'),
    },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Top Section with Profile Picture, Name, and Description */}
        <View style={styles.purchaseTop}>
          <Avatar.Image size={50} source={item.profilePic} style={styles.purchaseAvatar} />
          <View style={styles.purchaseDetails}>
            <Text style={styles.purchaseFriend}>{item.friend}</Text>
            <Text style={styles.purchaseText}>purchased {item.item}</Text>
            <Text style={styles.purchaseTime}>{item.time}</Text>
            <View style={styles.descriptionSpacing}>
              <Text style={styles.purchaseDescription}>{item.description}</Text>
            </View>
          </View>
        </View>

        {/* Item Image */}
        <Image source={item.image} style={styles.itemImage} />

        {/* Heart Icon Only */}
        <View style={styles.purchaseActions}>
          <TouchableOpacity>
            <Ionicons name="heart-outline" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Divider between purchase details and comments */}
        <View style={styles.divider} />

        {/* Comments Section */}
        {comments.map((comment) => (
          <View key={comment.id} style={styles.commentRow}>
            <Avatar.Image size={40} source={comment.profilePic} style={styles.commentAvatar} />
            <View style={styles.commentDetails}>
              <Text style={styles.commentName}>{comment.name}</Text>
              <Text style={styles.commentText}>{comment.comment}</Text>
              <Text style={styles.commentTime}>{comment.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Comment Box pinned to the bottom */}
      <View style={styles.commentBoxContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Write a comment"
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.sendButton}>
          <Ionicons name="send-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 20,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  purchaseText: {
    fontSize: 16, 
    fontWeight: '500',
    color: '#555',
  },
  purchaseTime: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  purchaseAvatar: {
    backgroundColor: '#58A4B0', // Teal background for avatars
  },
  descriptionSpacing: {
    marginTop: 10,
  },
  purchaseDescription: {
    fontSize: 16,
    color: '#000',
  },
  itemImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    marginVertical: 20,
    borderRadius: 10,
  },
  purchaseActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  commentAvatar: {
    backgroundColor: '#58A4B0', // Teal background for comments avatars
    marginRight: 10,
  },
  commentDetails: {
    flex: 1,
  },
  commentName: {
    fontSize: 16, // Larger font size for consistency
    fontWeight: 'bold',
    color: '#333',
  },
  commentText: {
    fontSize: 14,
    color: '#555',
    marginVertical: 2,
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  commentBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f7f7f7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Shadow for Android
  },
  commentInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingLeft: 15,
    paddingRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#58A4B0', // Teal send button color
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
