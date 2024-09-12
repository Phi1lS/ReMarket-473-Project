import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function ItemPage({ route }) {
  const { item } = route.params;

  return (
    <View style={styles.container}>
      <Image source={item.image} style={styles.itemImage} />
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemDescription}>{item.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  itemImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  itemName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  itemDescription: {
    fontSize: 16,
    color: '#555',
  },
});
