import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig';
import { doc, getDoc, onSnapshot, collection, query } from 'firebase/firestore';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '', // Field for username
    avatar: '',   // Field for avatar (profile picture)
    shippingAddresses: [], // Field for shipping addresses
  });

  useEffect(() => {
    let unsubscribeProfileListener; // Listener for user profile
    let unsubscribeAddressListener; // Listener for shipping addresses

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // Fetch the user's profile from Firestore
        fetchUserProfile(user.uid);

        // Listen to the shippingAddresses sub-collection under the user's document
        const addressesRef = collection(db, 'users', user.uid, 'shippingAddresses');
        const q = query(addressesRef);
        unsubscribeAddressListener = onSnapshot(q, (querySnapshot) => {
          const addresses = [];
          querySnapshot.forEach((doc) => {
            addresses.push({ id: doc.id, ...doc.data() });
          });
          setUserProfile((prevProfile) => ({ ...prevProfile, shippingAddresses: addresses }));
        });
      } else {
        // Reset user profile and shipping addresses if the user logs out
        setUserProfile({
          firstName: '',
          lastName: '',
          email: '',
          username: '',
          avatar: '',
          shippingAddresses: [],
        });

        if (unsubscribeAddressListener) {
          unsubscribeAddressListener();
        }
      }
    });

    return () => {
      unsubscribeAuth(); // Unsubscribe from Firebase Auth listener
      if (unsubscribeAddressListener) {
        unsubscribeAddressListener(); // Unsubscribe from shipping addresses listener
      }
    };
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userRef);
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        setUserProfile((prevProfile) => ({
          ...prevProfile,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          username: userData.username || '',
          avatar: userData.avatar || '',
        }));
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