import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Image, useColorScheme } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Ensure correct path to firebaseConfig
import logoText from '../assets/ReMarket-TypeLogo.png'

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const scheme = useColorScheme(); // Detect dark mode
  const isDarkMode = scheme === 'dark'; // Check if it's dark mode

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        // Successfully logged in
        navigation.reset({
          index: 0,
          routes: [{ name: 'HomeTab' }], // Use 'HomeTab' here to match the route name in BottomTabs
        });
      })
      .catch((error) => {
        // Error logging in
        Alert.alert('Error', error.message);
      });
  };

  return (
    <View style={isDarkMode ? styles.darkContainer : styles.container}>
      <Image source={logoText} style={styles.logo} resizeMode="contain" /> 
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor={isDarkMode ? '#AAAAAA' : '#888'}
        style={isDarkMode ? styles.darkInput : styles.input}
      />
  
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Password"
        placeholderTextColor={isDarkMode ? '#AAAAAA' : '#888'}
        style={isDarkMode ? styles.darkInput : styles.input}
      />
  
      <TouchableOpacity style={isDarkMode ? styles.darkButton : styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
  
      <Text style={isDarkMode ? styles.darkText : styles.text}>Don't have an account?</Text>
      <TouchableOpacity onPress={() => navigation.navigate('CreateAccountScreen')}>
        <Text style={isDarkMode ? styles.darkLinkText : styles.linkText}>Create Account</Text>
      </TouchableOpacity>
  
      {/* Spacer View */}
      <View style={{ flex: 0.10 }} />
  
    </View>
  );
}

const styles = StyleSheet.create({
  // Light mode styles
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#F5F5F5',
  },
  logo: {
    width: 450, // Increase the width
    height: 250, // Increase the height
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: -50,
  },
  input: {
    height: 50,
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
    borderColor: '#4CB0E6',
    borderWidth: 1,
  },
  button: {
    backgroundColor: '#4CB0E6',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  text: {
    textAlign: 'center',
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
  },
  linkText: {
    textAlign: 'center',
    color: '#4CB0E6',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Dark mode styles
  darkContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#121212',
  },
  darkInput: {
    height: 50,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
    borderColor: '#4CAF50',
    borderWidth: 1,
    color: '#FFFFFF',
  },
  darkButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  darkText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 10,
  },
  darkLinkText: {
    textAlign: 'center',
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
