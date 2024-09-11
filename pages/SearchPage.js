import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SearchPage() {
  return (
    <View style={styles.container}>
      <Text>Search Page</Text>
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
