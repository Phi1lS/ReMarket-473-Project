import React, { useState } from 'react';
import { View, TextInput, Image, StyleSheet, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Ionicons } from 'react-native-vector-icons'; // Correct import for icons
import { Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

export default function ItemDetailScreen({ route }) {
  const { item } = route.params;
  const navigation = useNavigation();
  const [isCommenting, setIsCommenting] = useState(false); // Track if user is typing a comment
  const [commentText, setCommentText] = useState(''); // Track the comment text

  const comments = [
    {
      id: 1,
      name: 'User1',
      comment: 'This looks awesome! Where did you get it?',
      time: '2 hours ago',
      profilePic: require('../../assets/avatar.png'),
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

  // Handle comment submission
  const handleSubmitComment = () => {
    if (commentText.trim() !== '') {
      console.log('Comment submitted:', commentText); // Handle the actual comment submission logic
      setCommentText(''); // Clear the input field
      setIsCommenting(false); // Hide the comment input box
      Keyboard.dismiss(); // Dismiss the keyboard after submission
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Top Section with Profile Picture, Name, and Description */}
        <View style={styles.purchaseTop}>
          {/* Navigate to UserProfilePage when user presses the avatar or name */}
          <TouchableOpacity onPress={() => navigation.navigate('UserProfilePage', { user: item })}>
            <Avatar.Image size={50} source={item.profilePic} style={styles.purchaseAvatar} />
          </TouchableOpacity>
          <View style={styles.purchaseDetails}>
            <TouchableOpacity onPress={() => navigation.navigate('UserProfilePage', { user: item })}>
              <Text style={styles.purchaseFriend}>{item.friend}</Text>
            </TouchableOpacity>
            <Text style={styles.purchaseText}>purchased {item.item}</Text>
            <Text style={styles.purchaseTime}>{item.time}</Text>
            <View style={styles.descriptionSpacing}>
              <Text style={styles.purchaseDescription}>{item.description}</Text>
            </View>
          </View>
        </View>

        {/* Clickable Item Image */}
        <TouchableOpacity onPress={() => navigation.navigate('ItemPage', { item })}>
          <Image source={item.image} style={styles.itemImage} />
        </TouchableOpacity>

        {/* Heart Icon */}
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
            <TouchableOpacity onPress={() => navigation.navigate('UserProfilePage', { user: comment })}>
              <Avatar.Image size={40} source={comment.profilePic} style={styles.commentAvatar} />
            </TouchableOpacity>
            <View style={styles.commentDetails}>
              <TouchableOpacity onPress={() => navigation.navigate('UserProfilePage', { user: comment })}>
                <Text style={styles.commentName}>{comment.name}</Text>
              </TouchableOpacity>
              <Text style={styles.commentText}>{comment.comment}</Text>
              <Text style={styles.commentTime}>{comment.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Comment Box appears when user is typing */}
      <View style={[styles.commentBoxContainer, isCommenting && styles.commentBoxExpanded]}>
        <TextInput
          style={[styles.commentInput, isCommenting && styles.commentInputExpanded]}
          placeholder="Write a comment"
          placeholderTextColor="#999"
          value={commentText}
          onChangeText={setCommentText}
          onSubmitEditing={handleSubmitComment}
          onFocus={() => setIsCommenting(true)} // Show expanded input when typing
        />
        {isCommenting && (
          <TouchableOpacity style={styles.sendButton} onPress={handleSubmitComment}>
            <Ionicons name="send-outline" size={24} color="#fff" />
          </TouchableOpacity>
        )}
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
    backgroundColor: '#4CB0E6',
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
    backgroundColor: '#4CB0E6',
    marginRight: 10,
  },
  commentDetails: {
    flex: 1,
  },
  commentName: {
    fontSize: 16,
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
    backgroundColor: '#f7f7f7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: '#4CB0E6',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentInputExpanded: {
    backgroundColor: '#f0f0f0',
  },
  commentBoxExpanded: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
});