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
    purchases: [],
  });
  const [userLoading, setUserLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    let unsubscribeAuth;
    let unsubscribeAddressListener;
    let unsubscribePaymentMethodsListener;
    let unsubscribeListingsListener;
    let unsubscribeItemsListener;
    let unsubscribeUsersListener;
    let unsubscribePurchasesListener;

    unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserLoading(true);
        fetchUserProfile(user.uid);
        loadCart(user.uid);

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
        resetUserState();
      }
    });

    return () => {
      unsubscribeAuth && unsubscribeAuth();
      unsubscribeAddressListener && unsubscribeAddressListener();
      unsubscribePaymentMethodsListener && unsubscribePaymentMethodsListener();
      unsubscribePurchasesListener && unsubscribePurchasesListener();
      unsubscribeListingsListener && unsubscribeListingsListener();
      unsubscribeItemsListener && unsubscribeItemsListener();
      unsubscribeUsersListener && unsubscribeUsersListener();
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
    } finally {
      setUserLoading(false);
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
    setUserLoading(false);
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

  const toggleLike = async (friendId, purchaseId, isLiked) => {
    try {
      const purchaseRef = doc(db, 'users', friendId, 'purchases', purchaseId);
      const purchaseDoc = await getDoc(purchaseRef);

      if (!purchaseDoc.exists()) {
        console.error(`Purchase document not found for ID: ${purchaseId}`);
        return;
      }

      const purchaseData = purchaseDoc.data();
      const likedBy = Array.isArray(purchaseData.likedBy) ? purchaseData.likedBy : [];
      const likeCount = purchaseData.likeCount || 0;

      const newLikeCount = isLiked ? likeCount - 1 : likeCount + 1;
      const updatedLikedBy = isLiked
        ? likedBy.filter((id) => id !== userProfile.id)
        : [...likedBy, userProfile.id];

      await updateDoc(purchaseRef, {
        likeCount: newLikeCount,
        likedBy: updatedLikedBy,
      });
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const addPurchase = async (purchaseItem) => {
    try {
      const marketplaceRef = doc(db, 'marketplace', purchaseItem.itemId);
      const marketplaceDoc = await getDoc(marketplaceRef);

      if (marketplaceDoc.exists()) {
        const marketplaceData = marketplaceDoc.data();

        const purchaseRef = collection(db, 'users', userProfile.id, 'purchases');
        await addDoc(purchaseRef, {
          itemId: purchaseItem.itemId,
          itemName: purchaseItem.itemName,
          price: purchaseItem.price,
          quantity: purchaseItem.quantity,
          message: purchaseItem.message,
          imageUrl: marketplaceData.imageUrl || '',
          timestamp: serverTimestamp(),
          userName: `${userProfile.firstName} ${userProfile.lastName}`,
        });

        const sellerId = marketplaceData.sellerId;
        const sellerNotificationsRef = collection(db, 'users', sellerId, 'notifications');
        await addDoc(sellerNotificationsRef, {
          type: 'purchase',
          buyerName: `${userProfile.firstName} ${userProfile.lastName}`,
          itemId: purchaseItem.itemId,
          itemName: purchaseItem.itemName,
          quantity: purchaseItem.quantity,
          timestamp: serverTimestamp(),
          message: purchaseItem.message || '',
          status: 'unread',
        });

        console.log("Purchase added with notification to the seller:", purchaseItem);
      } else {
        console.error("Marketplace item not found:", purchaseItem.itemId);
      }
    } catch (error) {
      console.error('Error adding purchase and notification:', error);
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

  const sendFriendRequest = async (receiverId) => {
    try {
      const friendRequestRef = collection(db, 'friendRequests');
      await addDoc(friendRequestRef, {
        senderId: userProfile.id,
        receiverId,
        status: 'pending',
        timestamp: serverTimestamp(),
      });

      const notificationsRef = collection(db, 'users', receiverId, 'notifications');
      await addDoc(notificationsRef, {
        type: 'friendRequest',
        senderId: userProfile.id,
        senderName: `${userProfile.firstName} ${userProfile.lastName}`,
        message: `${userProfile.firstName} ${userProfile.lastName} has sent you a friend request.`,
        timestamp: serverTimestamp(),
        status: 'unread',
      });

      console.log(`Friend request sent to user ${receiverId} with notification.`);
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  return (
    <UserContext.Provider value={{
      userProfile,
      userLoading,
      items,
      cart,
      setUserProfile,
      setCart,
      addToCart,
      removeFromCart,
      addPaymentMethod,
      removePaymentMethod,
      addPurchase,
      toggleLike,
      sendFriendRequest,
    }}>
      {children}
    </UserContext.Provider>
  );
};