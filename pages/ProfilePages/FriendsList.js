import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Avatar } from 'react-native-paper';
import { db, storage } from '../../firebaseConfig';
import { collection, doc, onSnapshot, getDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { UserContext } from '../../UserContext';
import { useNavigation } from '@react-navigation/native';

export default function FriendsList() {
    const { userProfile } = useContext(UserContext);
    const [friendsList, setFriendsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();
  
    useEffect(() => {
      if (!userProfile.id) return;
  
      const friendsRef = collection(db, 'users', userProfile.id, 'friends');
      const unsubscribe = onSnapshot(friendsRef, async (snapshot) => {
        const friendsData = await Promise.all(
          snapshot.docs.map(async (docSnapshot) => {
            const friendId = docSnapshot.data().friendId;
            const friendDoc = await getDoc(doc(db, 'users', friendId));
  
            if (friendDoc.exists()) {
              const friendData = friendDoc.data();
              let avatarUrl = null;
  
              if (friendData.avatar) {
                try {
                  const avatarRef = ref(storage, friendData.avatar);
                  avatarUrl = await getDownloadURL(avatarRef);
                } catch (error) {
                  console.error(`Failed to fetch avatar for friend ${friendId}:`, error);
                }
              }
  
              return { id: friendId, ...friendData, avatarUrl };
            }
            return null;
          })
        );
  
        // Sort friends alphabetically by first name
        const sortedFriends = friendsData
          .filter(friend => friend) // Remove null values
          .sort((a, b) => a.firstName.localeCompare(b.firstName));
  
        setFriendsList(sortedFriends);
        setLoading(false);
      });
  
      return () => unsubscribe();
    }, [userProfile.id]);
  
    const renderFriendItem = (friend) => (
      <TouchableOpacity
        key={friend.id}
        style={styles.friendItem}
        onPress={() => navigation.navigate('UserProfilePage', { userId: friend.id })}
      >
        <Avatar.Image
          size={50}
          source={friend.avatarUrl ? { uri: friend.avatarUrl } : require('../../assets/avatar.png')}
          style={styles.friendAvatar}
        />
        <Text style={styles.friendName}>{`${friend.firstName} ${friend.lastName}`}</Text>
      </TouchableOpacity>
    );
  
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CB0E6" />
        </View>
      );
    }
  
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Friends List</Text>
        {friendsList.length > 0 ? (
          friendsList.map((friend) => renderFriendItem(friend))
        ) : (
          <Text style={styles.noFriendsText}>You have no friends to display.</Text>
        )}
      </ScrollView>
    );
  }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CB0E6',
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  friendAvatar: {
    backgroundColor: '#4CB0E6',
    marginRight: 12,
  },
  friendName: {
    fontSize: 18,
    color: '#333',
  },
  noFriendsText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});