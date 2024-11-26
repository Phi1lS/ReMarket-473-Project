import React, { useState, useEffect, useContext } from 'react';
import { View, ScrollView, KeyboardAvoidingView, TextInput, TouchableOpacity, Image, Text, StyleSheet, Platform, Keyboard } from 'react-native';
import { Avatar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { db, storage } from '../../firebaseConfig';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
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
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const itemRef = doc(db, 'users', item.friendId, 'purchases', item.id);
    const unsubscribeItem = onSnapshot(itemRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setLikeCount(data.likeCount || 0);
        setIsLiked(data.likedBy?.includes(userProfile.id) || false);
      }
    });

    const commentsRef = collection(db, 'users', item.friendId, 'purchases', item.id, 'comments');
    const unsubscribeComments = onSnapshot(commentsRef, async (querySnapshot) => {
      const loadedComments = await Promise.all(
        querySnapshot.docs.map(async (commentDoc) => {
          const data = commentDoc.data();
          let profilePic = avatarPlaceholder;

          if (data.userId) {
            const userRef = doc(db, 'users', data.userId);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists() && userDoc.data().avatar) {
              try {
                const avatarRef = ref(storage, userDoc.data().avatar);
                profilePic = await getDownloadURL(avatarRef);
              } catch (error) {
                console.warn(`Failed to load profile picture for user ${data.userId}:`, error);
              }
            }
          }

          return {
            id: commentDoc.id,
            name: data.name,
            comment: data.comment,
            userId: data.userId,
            profilePic,
            time: formatTime(data.timestamp?.toDate()),
            timestamp: data.timestamp?.toDate() || new Date(),
          };
        })
      );

      setComments(loadedComments.sort((a, b) => b.timestamp - a.timestamp));
    });

    return () => {
      unsubscribeItem();
      unsubscribeComments();
    };
  }, [item.id, item.friendId, userProfile.id]);

  const handleLikeToggle = async () => {
    const itemRef = doc(db, 'users', item.friendId, 'purchases', item.id);
    try {
      if (isLiked) {
        await updateDoc(itemRef, {
          likedBy: arrayRemove(userProfile.id),
          likeCount: likeCount - 1,
        });
      } else {
        await updateDoc(itemRef, {
          likedBy: arrayUnion(userProfile.id),
          likeCount: likeCount + 1,
        });
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Error updating like status:", error);
    }
  };

  const handleSubmitComment = async () => {
    if (commentText.trim() !== '') {
      try {
        await addDoc(collection(db, 'users', item.friendId, 'purchases', item.id, 'comments'), {
          name: `${userProfile.firstName} ${userProfile.lastName}`,
          comment: commentText,
          userId: userProfile.id,
          timestamp: serverTimestamp(),
        });
        setCommentText('');
        setIsCommenting(false);
        Keyboard.dismiss();
      } catch (error) {
        console.error("Error adding comment:", error);
      }
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);
    const minutes = Math.floor(diffInSeconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.purchaseTop}>
          <TouchableOpacity onPress={() => navigation.navigate('UserProfilePage', { userId: item.friendId })}>
          <Avatar.Image
            size={50}
            source={
              typeof item.friendProfilePic === 'string' && item.friendProfilePic.trim()
                ? { uri: item.friendProfilePic }
                : avatarPlaceholder
            }
            style={styles.purchaseAvatar}
          />
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

        <Image source={item.imageUrl ? { uri: item.imageUrl } : require('../../assets/item.png')} style={styles.itemImage} />

        <View style={styles.purchaseActions}>
          <TouchableOpacity onPress={handleLikeToggle} style={styles.likeButton}>
            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={36} color={isLiked ? "red" : "#333"} />
            <Text style={styles.likeCount}>{likeCount}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {comments.map((comment) => (
          <View key={comment.id} style={styles.commentRow}>
            <TouchableOpacity onPress={() => navigation.navigate('UserProfilePage', { userId: comment.userId })}>
            <Avatar.Image
              size={40}
              source={
                typeof comment.profilePic === 'string' && comment.profilePic.trim()
                  ? { uri: comment.profilePic }
                  : avatarPlaceholder
              }
              style={styles.commentAvatar}
            />
            </TouchableOpacity>
            <View style={styles.commentDetails}>
              <Text style={styles.commentName}>{comment.name}</Text>
              <Text style={styles.commentText}>{comment.comment}</Text>
              <Text style={styles.commentTime}>{comment.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

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