import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig'; // Adjust based on your actual firebase configuration
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '', // New field for username
    avatar: '',   // New field for avatar (profile picture)
  });

  useEffect(() => {
    let unsubscribeProfileListener; // Listener for user profile

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // Fetch the user's profile from Firestore
        fetchUserProfile(user.uid);

        // Optionally, listen for real-time updates to the user document
        const userRef = doc(db, 'users', user.uid);
        unsubscribeProfileListener = onSnapshot(userRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            setUserProfile({
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              email: userData.email || '',
              username: userData.username || '', // Fetch username from Firestore
              avatar: userData.avatar || '',     // Fetch avatar (profile picture) from Firestore
            });
          }
        });
      } else {
        // Reset user profile if the user logs out
        setUserProfile({
          firstName: '',
          lastName: '',
          email: '',
          username: '',
          avatar: '',
        });

        // Unsubscribe from real-time listener
        if (unsubscribeProfileListener) {
          unsubscribeProfileListener();
        }
      }
    });

    return () => {
      unsubscribeAuth(); // Unsubscribe from Firebase Auth listener
      if (unsubscribeProfileListener) {
        unsubscribeProfileListener(); // Unsubscribe from profile listener
      }
    };
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userRef);
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        setUserProfile({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          username: userData.username || '', // Fetch username
          avatar: userData.avatar || '',     // Fetch avatar (profile picture)
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  return (
    <UserContext.Provider value={{ userProfile, setUserProfile }}>
      {children}
    </UserContext.Provider>
  );
};