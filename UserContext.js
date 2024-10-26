import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig';
import { doc, getDoc, onSnapshot, collection, updateDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

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
    paymentMethods: [],
    listings: [],
    users: [],
    purchases: [], // Field for purchases
  });
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    let unsubscribeProfileListener;
    let unsubscribeAddressListener;
    let unsubscribePaymentMethodsListener;
    let unsubscribeListingsListener;
    let unsubscribeItemsListener;
    let unsubscribeUsersListener;
    let unsubscribePurchasesListener;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUserProfile(user.uid);
        loadCart(user.uid);

        // Subcollection listeners
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

        const purchasesRef = collection(db, 'users', user.uid, 'purchases');
        unsubscribePurchasesListener = onSnapshot(purchasesRef, (querySnapshot) => {
          const purchases = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setUserProfile((prevProfile) => ({ ...prevProfile, purchases }));
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
        resetUserState();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeAddressListener) unsubscribeAddressListener();
      if (unsubscribePaymentMethodsListener) unsubscribePaymentMethodsListener();
      if (unsubscribePurchasesListener) unsubscribePurchasesListener();
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
          ...userData,
        }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const resetUserState = () => {
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
      purchases: [],
    });
    setItems([]);
    setCart([]);
  };

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

  const addPurchase = async (purchaseItem) => {
    try {
      // Ensure you get the item details from the marketplace, including the image URL
      const marketplaceRef = doc(db, 'marketplace', purchaseItem.itemId);
      const marketplaceDoc = await getDoc(marketplaceRef);
  
      if (marketplaceDoc.exists()) {
        const marketplaceData = marketplaceDoc.data();
  
        // Add the purchase to the user's 'purchases' subcollection, including the image URL from the marketplace
        const purchaseRef = collection(db, 'users', userProfile.id, 'purchases');
        await addDoc(purchaseRef, {
          itemId: purchaseItem.itemId,
          itemName: purchaseItem.itemName,
          price: purchaseItem.price,
          quantity: purchaseItem.quantity,
          message: purchaseItem.message, // Ensure the message gets saved
          imageUrl: marketplaceData.imageUrl || '', // Add the imageUrl from the marketplace document
          timestamp: serverTimestamp(), // Use the timestamp directly
        });
  
        console.log("Purchase added with image:", purchaseItem);
      } else {
        console.error("Marketplace item not found:", purchaseItem.itemId);
      }
    } catch (error) {
      console.error('Error adding purchase with image:', error);
    }
  };

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

      const userRef = doc(db, 'users', userProfile.id);
      await updateDoc(userRef, { cart: updatedCart });
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const updatedCart = cart.filter((cartItem) => cartItem.itemId !== itemId);
      setCart(updatedCart);

      const userRef = doc(db, 'users', userProfile.id);
      await updateDoc(userRef, { cart: updatedCart });
    } catch (error) {
      console.error('Error removing item from cart:', error);
    }
  };

  const addPaymentMethod = async (paymentMethod) => {
    try {
      const paymentMethodsRef = collection(db, 'users', userProfile.id, 'paymentMethods');
      await addDoc(paymentMethodsRef, paymentMethod);
    } catch (error) {
      console.error('Error adding payment method:', error);
    }
  };

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
      setCart,
      addToCart,
      removeFromCart,
      addPaymentMethod,
      removePaymentMethod,
      addPurchase, // New function to add a purchase
    }}>
      {children}
    </UserContext.Provider>
  );
};