import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Image, Alert, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { Avatar, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, getDoc, doc, onSnapshot } from 'firebase/firestore';
import { db, storage } from '../firebaseConfig';
import { getDownloadURL, ref } from 'firebase/storage';
import { UserContext } from '../UserContext';

// Use avatar.png as a placeholder
const avatarPlaceholder = require('../assets/avatar.png');

export default function HomePage() {
  const navigation = useNavigation();
  const { userProfile, userLoading, toggleLike } = useContext(UserContext);
  const [friends, setFriends] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;
    if (!userLoading && userProfile?.id) {
      const friendsRef = collection(db, 'users', userProfile.id, 'friends');
      
      unsubscribe = onSnapshot(friendsRef, async (snapshot) => {
        const friendsData = await Promise.all(
          snapshot.docs.map(async (docSnapshot) => {
            const friendData = docSnapshot.data();
            const friendDoc = await getDoc(doc(db, 'users', friendData.friendId));

            if (!friendDoc.exists()) {
              console.warn(`Friend document ${friendData.friendId} does not exist in 'users'.`);
              return null;
            }

            const friendProfile = friendDoc.data();
            let profilePic = avatarPlaceholder;

            if (friendProfile.avatar) {
              try {
                const avatarRef = ref(storage, friendProfile.avatar);
                profilePic = await getDownloadURL(avatarRef);
              } catch (error) {
                console.warn(`Failed to fetch avatar for friend ${friendDoc.id}:`, error);
              }
            }

            const purchasesRef = collection(db, 'users', friendData.friendId, 'purchases');
            
            // Set up real-time listener for each friend's purchases
            onSnapshot(purchasesRef, (snapshot) => {
              const updatedPurchases = snapshot.docs.map((purchaseDoc) => {
                const purchaseData = purchaseDoc.data();
                return {
                  id: purchaseDoc.id,
                  friendId: friendData.friendId,
                  friendName: `${friendProfile.firstName} ${friendProfile.lastName}`,
                  friendProfilePic: profilePic,
                  itemName: purchaseData.itemName,
                  message: purchaseData.message,
                  timestamp: purchaseData.timestamp,
                  imageUrl: purchaseData.imageUrl || require('../assets/item.png'),
                  likeCount: purchaseData.likeCount || 0,
                  isLiked: purchaseData.likedBy?.includes(userProfile.id) || false,
                };
              });

              // Update purchases state with new data
              setPurchases((prevPurchases) => {
                const otherPurchases = prevPurchases.filter((p) => p.friendId !== friendData.friendId);
                return [...otherPurchases, ...updatedPurchases].sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
              });
            });

            return { id: friendDoc.id, name: friendProfile.firstName, profilePic };
          })
        );

        const validFriends = friendsData.filter(friend => friend);
        setFriends(validFriends);
        setFriendsLoading(false);
      });
    }
    return () => unsubscribe && unsubscribe();
  }, [userProfile, userLoading]);

  const handleLike = async (item) => {
    try {
      await toggleLike(item.friendId, item.id, item.isLiked);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const secondsDifference = Math.floor((now - date) / 1000);
    const minutes = Math.floor(secondsDifference / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  return (
    <View style={styles.container}>
      {/* Top Bar with Search Bubble and Friends */}
      <View style={styles.topBarContainer}>
        {friendsLoading ? (
          <ActivityIndicator size="small" color="#4CB0E6" />
        ) : (
          <FlatList
            horizontal
            data={friends}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={() => (
              <TouchableOpacity
                style={styles.searchBubble}
                onPress={() => navigation.navigate('SearchUsers')}
              >
                <Ionicons name="search" size={24} color="#ffffff" />
              </TouchableOpacity>
            )}
            renderItem={({ item }) => {
              const profileImage = typeof item.profilePic === 'string' ? { uri: item.profilePic } : avatarPlaceholder;
              return (
                <View style={styles.avatarWrapper}>
                  <TouchableOpacity onPress={() => navigation.navigate('UserProfilePage', { userId: item.id })}>
                    <Avatar.Image size={50} source={profileImage} style={styles.avatar} />
                  </TouchableOpacity>
                  <Text style={styles.avatarLabel}>{item.name}</Text>
                </View>
              );
            }}
            showsHorizontalScrollIndicator={false}
          />
        )}
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
                  source={item.friendProfilePic ? { uri: item.friendProfilePic } : avatarPlaceholder} 
                  style={styles.purchaseAvatar}
                />
                <View style={styles.purchaseDetails}>
                  <Text style={styles.purchaseFriend}>{item.friendName}</Text>
                  <Text style={styles.purchaseText}>purchased {item.itemName}</Text>
                  <Text style={styles.purchaseTime}>{formatTime(item.timestamp)}</Text>
                  <View style={styles.descriptionSpacing}>
                    <Text style={styles.purchaseDescription}>{item.message}</Text>
                  </View>
                </View>
              </View>

              <Image
                source={item.imageUrl ? { uri: item.imageUrl } : require('../assets/item.png')}
                style={styles.itemImageSquare}
              />

              {/* Action Icons */}
              <View style={styles.purchaseActions}>
                <TouchableOpacity onPress={() => handleLike(item)}>
                  <Ionicons
                    name={item.isLiked ? "heart" : "heart-outline"}
                    size={28}
                    color={item.isLiked ? "red" : "#333"}
                  />
                  <Text style={styles.likeCount}>{item.likeCount}</Text>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  topBarContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    padding: 10,
    marginBottom: 5,
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
  itemImageSquare: {
    width: 100, // Adjust width as needed
    height: 100, // Adjust height as needed
    marginVertical: 10, // Space between the message and icons
    alignSelf: 'left',
    borderRadius: 10, // add rounded corners
    marginLeft: 60, // Line up the image with message text
  },
  likeCount: {
    marginTop: 4,
    marginRight: 2,
    fontSize: 16,  // Slightly larger font size for the count
    color: "#333",
    textAlign: 'center',
  },
});
