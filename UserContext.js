import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig';
import { doc, getDoc, onSnapshot, collection, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';

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
    paymentMethods: [], // New field for payment methods
    listings: [],
    users: [],
  });
  const [items, setItems] = useState([]); // All items in the marketplace
  const [cart, setCart] = useState([]); // Cart state

  useEffect(() => {
    let unsubscribeProfileListener;
    let unsubscribeAddressListener;
    let unsubscribePaymentMethodsListener; // Listener for payment methods
    let unsubscribeListingsListener;
    let unsubscribeItemsListener;
    let unsubscribeUsersListener;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUserProfile(user.uid);
        loadCart(user.uid); // Load the user's cart

        const addressesRef = collection(db, 'users', user.uid, 'shippingAddresses');
        unsubscribeAddressListener = onSnapshot(addressesRef, (querySnapshot) => {
          const addresses = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setUserProfile((prevProfile) => ({ ...prevProfile, shippingAddresses: addresses }));
        });

        const paymentMethodsRef = collection(db, 'users', user.uid, 'paymentMethods');
        unsubscribePaymentMethodsListener = onSnapshot(paymentMethodsRef, (querySnapshot) => {
          const paymentMethods = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setUserProfile((prevProfile) => ({ ...prevProfile, paymentMethods }));
        });

        const listingsRef = collection(db, 'users', user.uid, 'listings');
        unsubscribeListingsListener = onSnapshot(listingsRef, (querySnapshot) => {
          const listings = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setUserProfile((prevProfile) => ({ ...prevProfile, listings }));
        });

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
          paymentMethods: [],
          listings: [],
          users: [],
        });
        setItems([]);
        setCart([]); // Reset cart

        if (unsubscribeAddressListener) unsubscribeAddressListener();
        if (unsubscribePaymentMethodsListener) unsubscribePaymentMethodsListener();
        if (unsubscribeListingsListener) unsubscribeListingsListener();
        if (unsubscribeItemsListener) unsubscribeItemsListener();
        if (unsubscribeUsersListener) unsubscribeUsersListener();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeAddressListener) unsubscribeAddressListener();
      if (unsubscribePaymentMethodsListener) unsubscribePaymentMethodsListener();
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

  // Load cart items from Firestore
  const loadCart = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userRef);
      if (userSnapshot.exists()) {
        const userCart = userSnapshot.data().cart || [];
        setCart(userCart);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  // Function to add an item to the cart
  const addToCart = async (item) => {
    try {
      const existingItem = cart.find(cartItem => cartItem.itemId === item.id);
      let updatedCart;

      if (existingItem) {
        updatedCart = cart.map(cartItem =>
          cartItem.itemId === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        updatedCart = [...cart, { itemId: item.id, quantity: 1 }];
      }

      setCart(updatedCart);

      // Save updated cart as a whole to Firestore
      const userRef = doc(db, 'users', userProfile.id);
      await updateDoc(userRef, { cart: updatedCart });
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  // Function to remove item from cart
  const removeFromCart = async (itemId) => {
    try {
      const updatedCart = cart.filter((cartItem) => cartItem.itemId !== itemId);
      setCart(updatedCart);

      // Update Firestore with the modified cart
      const userRef = doc(db, 'users', userProfile.id);
      await updateDoc(userRef, { cart: updatedCart });
    } catch (error) {
      console.error('Error removing item from cart:', error);
    }
  };

  // Function to add a payment method
  const addPaymentMethod = async (paymentMethod) => {
    try {
      const paymentMethodsRef = collection(db, 'users', userProfile.id, 'paymentMethods');
      await addDoc(paymentMethodsRef, paymentMethod);
    } catch (error) {
      console.error('Error adding payment method:', error);
    }
  };

  // Function to remove a payment method
  const removePaymentMethod = async (paymentMethodId) => {
    try {
      const paymentMethodRef = doc(db, 'users', userProfile.id, 'paymentMethods', paymentMethodId);
      await deleteDoc(paymentMethodRef);
    } catch (error) {
      console.error('Error removing payment method:', error);
    }
  };

  return (
    <UserContext.Provider value={{
      userProfile,
      items,
      cart,
      setUserProfile,
      addToCart,
      removeFromCart,
      addPaymentMethod,
      removePaymentMethod, // Provide removePaymentMethod function in context
    }}>
      {children}
    </UserContext.Provider>
  );
};