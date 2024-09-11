import React from 'react';
import { View, TextInput, Image, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ItemDetailScreen({ route }) {
  const { item } = route.params; // Get the item data passed via navigation

  return (
    <View style={styles.container}>
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

      {/* Heart and Comment Icons */}
      <View style={styles.purchaseActions}>
        <TouchableOpacity>
          <Ionicons name="heart-outline" size={28} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.commentIconWrapper}>
          <Ionicons name="chatbubble-outline" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Comment Box */}
      <View style={styles.commentBoxContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Write a comment"
        />
        <TouchableOpacity style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
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
    marginTop: 10,
  },
  purchaseDescription: {
    fontSize: 14,
    color: '#000',
  },
  itemImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    marginVertical: 20,
  },
  purchaseActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 10,
  },
  commentIconWrapper: {
    marginLeft: 20,
  },
  commentBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
    paddingTop: 10,
    marginTop: 20,
  },
  commentInput: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    paddingLeft: 10,
  },
  sendButton: {
    marginLeft: 10,
  },
  sendButtonText: {
    fontSize: 16,
    color: '#58A4B0',
  },
});
