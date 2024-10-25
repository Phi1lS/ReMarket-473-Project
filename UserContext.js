import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig';
import { doc, getDoc, onSnapshot, collection, query } from 'firebase/firestore';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    avatar: '',
    shippingAddresses: [],
    listings: [], // Field for listings
  });

  useEffect(() => {
    let unsubscribeProfileListener;
    let unsubscribeAddressListener;
    let unsubscribeListingsListener;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // Fetch the user's profile from Firestore
        fetchUserProfile(user.uid);

        // Listen to the shippingAddresses sub-collection under the user's document
        const addressesRef = collection(db, 'users', user.uid, 'shippingAddresses');
        const qAddresses = query(addressesRef);
        unsubscribeAddressListener = onSnapshot(qAddresses, (querySnapshot) => {
          const addresses = [];
          querySnapshot.forEach((doc) => {
            addresses.push({ id: doc.id, ...doc.data() });
          });
          setUserProfile((prevProfile) => ({ ...prevProfile, shippingAddresses: addresses }));
        });

        // Listen to the listings sub-collection under the user's document
        const listingsRef = collection(db, 'users', user.uid, 'listings');
        const qListings = query(listingsRef);
        unsubscribeListingsListener = onSnapshot(qListings, (querySnapshot) => {
          const listings = [];
          querySnapshot.forEach((doc) => {
            listings.push({ id: doc.id, ...doc.data() });
          });
          setUserProfile((prevProfile) => ({ ...prevProfile, listings }));
        });
      } else {
        // Reset user profile if the user logs out
        setUserProfile({
          firstName: '',
          lastName: '',
          email: '',
          username: '',
          avatar: '',
          shippingAddresses: [],
          listings: [], // Reset listings as well
        });

        if (unsubscribeAddressListener) unsubscribeAddressListener();
        if (unsubscribeListingsListener) unsubscribeListingsListener();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeAddressListener) unsubscribeAddressListener();
      if (unsubscribeListingsListener) unsubscribeListingsListener();
    };
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userRef);
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        //console.log('Fetched User Profile:', userData);
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