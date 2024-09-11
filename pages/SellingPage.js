import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SellingPage() {
  return (
    <View style={styles.container}>
      <Text>Selling Page</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
