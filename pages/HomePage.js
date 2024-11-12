import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { Avatar, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { db, storage } from '../firebaseConfig';
import { getDownloadURL, ref } from 'firebase/storage';
import { UserContext } from '../UserContext';

// Use avatar.png as a placeholder
const avatarPlaceholder = require('../assets/avatar.png');

export default function HomePage() {
  const navigation = useNavigation();
  const { userProfile, userLoading } = useContext(UserContext);
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);

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

  useEffect(() => {
    const fetchFriends = async () => {
      if (!userProfile || !userProfile.id) {
        console.error("No user profile or user ID found.");
        return;
      }

      try {
        const friendsRef = collection(db, 'users', userProfile.id, 'friends');
        const friendsSnapshot = await getDocs(friendsRef);

        if (friendsSnapshot.empty) {
          Alert.alert("No friends found", "It seems like you don't have any friends in the list.");
          setFriends([]);
          return;
        }

        const friendsData = await Promise.all(
          friendsSnapshot.docs.map(async (docSnapshot) => {
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

            return { id: friendDoc.id, name: friendProfile.firstName, profilePic };
          })
        );

        setFriends(friendsData.filter(friend => friend));
      } catch (error) {
        console.error("Error fetching friends:", error);
        Alert.alert("Error", "Failed to load friends. Please try again later.");
      } finally {
        setFriendsLoading(false);
      }
    };

    if (!userLoading) {
      fetchFriends();
    }
  }, [userProfile, userLoading]);

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
                    <Avatar.Image
                      size={50}
                      source={profileImage}
                      style={styles.avatar}
                    />
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
                  source={item.image} 
                  style={styles.purchaseAvatar}
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
});
