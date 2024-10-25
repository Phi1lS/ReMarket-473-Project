import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig';
import { doc, getDoc, onSnapshot, collection } from 'firebase/firestore';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    avatar: '',
    shippingAddresses: [],
    listings: [],
    users: [],
  });
  const [items, setItems] = useState([]); // State for all items in the marketplace

  useEffect(() => {
    let unsubscribeProfileListener;
    let unsubscribeAddressListener;
    let unsubscribeListingsListener;
    let unsubscribeItemsListener;
    let unsubscribeUsersListener;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUserProfile(user.uid);

        const addressesRef = collection(db, 'users', user.uid, 'shippingAddresses');
        unsubscribeAddressListener = onSnapshot(addressesRef, (querySnapshot) => {
          const addresses = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setUserProfile((prevProfile) => ({ ...prevProfile, shippingAddresses: addresses }));
        });

        const listingsRef = collection(db, 'users', user.uid, 'listings');
        unsubscribeListingsListener = onSnapshot(listingsRef, (querySnapshot) => {
          const listings = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setUserProfile((prevProfile) => ({ ...prevProfile, listings }));
        });

        // Updated: Access top-level `marketplace` collection instead of `allItems`
        const itemsRef = collection(db, 'marketplace');
        unsubscribeItemsListener = onSnapshot(itemsRef, (querySnapshot) => {
          const itemsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setItems(itemsData);
        });

        const usersRef = collection(db, 'users');
        unsubscribeUsersListener = onSnapshot(usersRef, (querySnapshot) => {
          const users = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setUserProfile((prevProfile) => ({ ...prevProfile, users }));
        });
      } else {
        // Reset state if user logs out
        setUserProfile({
          id: '',
          firstName: '',
          lastName: '',
          email: '',
          username: '',
          avatar: '',
          shippingAddresses: [],
          listings: [],
          users: [],
        });
        setItems([]);

        if (unsubscribeAddressListener) unsubscribeAddressListener();
        if (unsubscribeListingsListener) unsubscribeListingsListener();
        if (unsubscribeItemsListener) unsubscribeItemsListener();
        if (unsubscribeUsersListener) unsubscribeUsersListener();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeAddressListener) unsubscribeAddressListener();
      if (unsubscribeListingsListener) unsubscribeListingsListener();
      if (unsubscribeItemsListener) unsubscribeItemsListener();
      if (unsubscribeUsersListener) unsubscribeUsersListener();
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
          id: userId,
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
    <UserContext.Provider value={{ userProfile, items, setUserProfile }}>
      {children}
    </UserContext.Provider>
  );
};