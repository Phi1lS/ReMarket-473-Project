import React, { useState, useEffect, useContext } from 'react';
import { View, ScrollView, KeyboardAvoidingView, TextInput, TouchableOpacity, Image, Text, StyleSheet, Platform } from 'react-native';
import { Avatar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { db } from '../../firebaseConfig';
import { doc, getDoc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { UserContext } from '../../UserContext';

const avatarPlaceholder = require('../../assets/avatar.png');

export default function ItemDetailScreen({ route }) {
  const { item } = route.params;
  const navigation = useNavigation();
  const { userProfile } = useContext(UserContext);
  
  const [likeCount, setLikeCount] = useState(item.likeCount || 0);
  const [isLiked, setIsLiked] = useState(item.isLiked || false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Sample comments data
  const comments = [
    { id: 1, name: 'User1', comment: 'This looks awesome! Where did you get it?', time: '2 hours ago', profilePic: avatarPlaceholder },
    { id: 2, name: 'User2', comment: 'I bought something similar last week!', time: '4 hours ago', profilePic: avatarPlaceholder },
    { id: 3, name: 'User3', comment: 'Can’t wait to get mine!', time: '1 day ago', profilePic: avatarPlaceholder },
  ];

  useEffect(() => {
    // Real-time listener for the like count and liked status on the current item
    const itemRef = doc(db, 'users', item.friendId, 'purchases', item.id);
    const unsubscribe = onSnapshot(itemRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setLikeCount(data.likeCount || 0);
        setIsLiked(data.likedBy?.includes(userProfile.id) || false);
      }
    });

    return () => unsubscribe();
  }, [item.id, item.friendId, userProfile.id]);

  const handleLikeToggle = async () => {
    const itemRef = doc(db, 'users', item.friendId, 'purchases', item.id);
    try {
      if (isLiked) {
        // Remove user from likedBy array and decrease like count
        await updateDoc(itemRef, {
          likedBy: arrayRemove(userProfile.id),
          likeCount: likeCount - 1,
        });
      } else {
        // Add user to likedBy array and increase like count
        await updateDoc(itemRef, {
          likedBy: arrayUnion(userProfile.id),
          likeCount: likeCount + 1,
        });
      }
    } catch (error) {
      console.error("Error updating like status:", error);
    }
  };

  const handleSubmitComment = () => {
    if (commentText.trim() !== '') {
      console.log('Comment submitted:', commentText);
      setCommentText('');
      setIsCommenting(false);
      Keyboard.dismiss();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Item and Seller Details */}
        <View style={styles.purchaseTop}>
          <TouchableOpacity onPress={() => navigation.navigate('UserProfilePage', { userId: item.friendId })}>
            <Avatar.Image size={50} source={item.friendProfilePic ? { uri: item.friendProfilePic } : avatarPlaceholder} style={styles.purchaseAvatar} />
          </TouchableOpacity>
          <View style={styles.purchaseDetails}>
            <TouchableOpacity onPress={() => navigation.navigate('UserProfilePage', { userId: item.friendId })}>
              <Text style={styles.purchaseFriend}>{item.friendName}</Text>
            </TouchableOpacity>
            <Text style={styles.purchaseText}>purchased {item.itemName}</Text>
            <Text style={styles.purchaseTime}>{item.time}</Text>
            <View style={styles.descriptionSpacing}>
              <Text style={styles.purchaseDescription}>{item.message}</Text>
            </View>
          </View>
        </View>

        {/* Item Image */}
        <Image source={item.imageUrl ? { uri: item.imageUrl } : require('../../assets/item.png')} style={styles.itemImage} />

        {/* Like (Heart) Icon */}
        <View style={styles.purchaseActions}>
          <TouchableOpacity onPress={handleLikeToggle} style={styles.likeButton}>
            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={36} color={isLiked ? "red" : "#333"} />
            <Text style={styles.likeCount}>{likeCount}</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Comments Section */}
        {comments.map((comment) => (
          <View key={comment.id} style={styles.commentRow}>
            <TouchableOpacity onPress={() => navigation.navigate('UserProfilePage', { userId: comment.id })}>
              <Avatar.Image size={40} source={comment.profilePic} style={styles.commentAvatar} />
            </TouchableOpacity>
            <View style={styles.commentDetails}>
              <TouchableOpacity onPress={() => navigation.navigate('UserProfilePage', { userId: comment.id })}>
                <Text style={styles.commentName}>{comment.name}</Text>
              </TouchableOpacity>
              <Text style={styles.commentText}>{comment.comment}</Text>
              <Text style={styles.commentTime}>{comment.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Comment Box */}
      <View style={[styles.commentBoxContainer, isCommenting && styles.commentBoxExpanded]}>
        <TextInput
          style={[styles.commentInput, isCommenting && styles.commentInputExpanded]}
          placeholder="Write a comment"
          placeholderTextColor="#999"
          value={commentText}
          onChangeText={setCommentText}
          onSubmitEditing={handleSubmitComment}
          onFocus={() => setIsCommenting(true)}
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
  likeCount: {
    marginTop: 4,
    marginRight: 2,
    fontSize: 16,  // Slightly larger font size for the count
    color: "#333",
    textAlign: 'center',
  },
});