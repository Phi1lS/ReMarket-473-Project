import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Alert, TouchableOpacity, useColorScheme, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebaseConfig'; // Import auth and db (Firestore)
import { doc, setDoc } from 'firebase/firestore'; // Firestore functions

export default function CreateAccountScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState(''); // New field for username

  //const scheme = useColorScheme();  // Detect dark mode
  //const isDarkMode = scheme === 'dark';  // Determine if dark mode is active
  isDarkMode = false;

  // Ensure username starts with "@"
  const handleUsernameChange = (text) => {
    if (text === '' || text === '@') {
      setUsername(''); // Remove the "@" if field is empty
    } else if (!text.startsWith('@')) {
      setUsername('@' + text); // Automatically add "@" if not already there
    } else {
      setUsername(text); // Keep the username with "@"
    }
  };

  // Function to handle account creation
  const handleCreateAccount = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      // Create user with email and password using Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store user's first name, last name, username, and email in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        firstName: firstName,
        lastName: lastName,
        username: username, // Save the username
        email: email,
      });

      Alert.alert('Success', 'Account created successfully');
      navigation.navigate('HomeTab'); // Navigate to home or main screen
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={isDarkMode ? styles.darkContainer : styles.container}>
        <Text style={isDarkMode ? styles.darkTitle : styles.title}>Create Your Account</Text>

        {/* First Name Input */}
        <TextInput
          style={isDarkMode ? styles.darkInput : styles.input}
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
          placeholderTextColor={isDarkMode ? '#AAAAAA' : '#888'}
        />

        {/* Last Name Input */}
        <TextInput
          style={isDarkMode ? styles.darkInput : styles.input}
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
          placeholderTextColor={isDarkMode ? '#AAAAAA' : '#888'}
        />

        {/* Username Input */}
        <TextInput
          style={isDarkMode ? styles.darkInput : styles.input}
          placeholder="Username"
          value={username}
          onChangeText={handleUsernameChange}
          placeholderTextColor={isDarkMode ? '#AAAAAA' : '#888'}
          autoCapitalize="none"
        />

        {/* Email Input */}
        <TextInput
          style={isDarkMode ? styles.darkInput : styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={isDarkMode ? '#AAAAAA' : '#888'}
        />

        {/* Password Input */}
        <TextInput
          style={isDarkMode ? styles.darkInput : styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={isDarkMode ? '#AAAAAA' : '#888'}
        />

        {/* Confirm Password Input */}
        <TextInput
          style={isDarkMode ? styles.darkInput : styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholderTextColor={isDarkMode ? '#AAAAAA' : '#888'}
        />

        {/* Create Account Button */}
        <TouchableOpacity style={isDarkMode ? styles.darkButton : styles.button} onPress={handleCreateAccount}>
          <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>

        {/* Back to Login Button */}
        <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
          <Text style={isDarkMode ? styles.darkBackButtonText : styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#4CB0E6',
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
  backButtonText: {
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
  darkTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#4CAF50',
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
  darkBackButtonText: {
    textAlign: 'center',
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
});