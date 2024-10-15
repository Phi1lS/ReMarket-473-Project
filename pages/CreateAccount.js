import React, { useState } from 'react'; // The core library for using interfaces 
import { View, TextInput, Text, StyleSheet, Alert, TouchableOpacity, useColorScheme } from 'react-native'; // UI components from React Native
import { createUserWithEmailAndPassword } from 'firebase/auth'; // This is a function to create a new user with an email and a password 
import { auth, db } from '../firebaseConfig'; // Imports the Firebase authentication and firestore instances from the "firebaseConfig" file
import { doc, setDoc } from 'firebase/firestore'; // Functions that are used to interact with Firebase documents


// Defines a react native component named "CreateAccountScreen";   'navigation' recieves the naviagtion prop from React Navigation to naviagte between screens
export default function CreateAccountScreen({ navigation }) { 
    // (email, password, confirmPassword, firstName, lastName) are all variables that can store user input. 
    // (setEmail, setPassword, etc.) are all functions that are used to update the corresponding fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    const scheme = useColorScheme(); // Detects the current color scheme (light or dark) of the device
    const isDarkMode = scheme === 'dark'; // true if teh device is in dark mode

    // Define a funciton that handles account creation:
    // The 'async' keyword means that the fucntion will return a promise. 
    // A 'promise' in JS is an object that represents the eventual completion (or failure) of an async operation and its reulting value. It has 3 states: (Pending, Fulfilled, and Rejected).
    // An async function returns a promise wether it is scecified or not. The value that is returned inside the funciton is automatically wrapped in a promise
    const handleAccountCreation = async () => { 
         if(password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
         }

    try {
        // Create a user with Firebase Authentication:
        const userCredential = await createUserWithEmailAndPassword(auth, email, password); // Creates a new user with the provided email and password. This method is provided by firebvase.
        const user = userCredential.user;  // 'userCredential' contains user info upon succesfull creation above

        // The 'await' keyword can only be used in an async function. it pasuses the execution of a function untik the promise it is waiting for is resolved. Once resolved; it returns the promised value.
        // 'setDoc' creates or overwrites a document in Firestore. This creates the user collection (if it doesnt exist) and adds a document with teh specified fields: (firstName, lastName, and email)
        // 'doc(...)' specifies the document location
        await setDoc(doc(db, 'users', user.uid), { 
            firstName: firstName,
            lastName: lastName,
            email: email,
        });

        Alert.alert('Success', 'Account has been craeted successfully'); // Success message
        navigation.navigate('MainApp'); // Naviagtes the user back to the home tab    
    } catch (error) {
        Alert.alert('Error', error.message);
    }
};

return (
    <View style={isDarkMode ? styles.darkContainer : styles.container}>
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
      <TouchableOpacity style={isDarkMode ? styles.darkButton : styles.button} onPress={handleAccountCreation}>
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>

      {/* Back to Login Button */}
      <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
        <Text style={isDarkMode ? styles.darkBackButtonText : styles.backButtonText}>Back to Login</Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#00796B',
  },
  input: {
    height: 50,
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
    borderColor: '#00796B',
    borderWidth: 1,
  },
  button: {
    backgroundColor: '#00796B',
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
    color: '#00796B',
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