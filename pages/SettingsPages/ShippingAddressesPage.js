import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ShippingAddressesPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shipping Addresses</Text>
      <Text style={styles.infoText}>This is where your shipping addresses will appear.</Text>
      <Text style={styles.infoText}>Add, remove, or update your shipping addresses here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});