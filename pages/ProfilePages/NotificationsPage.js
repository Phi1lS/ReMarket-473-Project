import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function NotificationsPage() {
  return (
    <View style={styles.container}>
      <Text>Notifications Page</Text>
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