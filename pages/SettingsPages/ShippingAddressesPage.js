import React, { useContext, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { UserContext } from '../../UserContext';
import { auth, db } from '../../firebaseConfig';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'; // Firestore update functions
import { collection, addDoc } from 'firebase/firestore'; // Firestore collection functions

export default function ShippingAddressesPage({ navigation }) {
  const { userProfile, setUserProfile } = useContext(UserContext);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false); // Track if editing an address
  const [currentAddress, setCurrentAddress] = useState(null); // Track the address being edited
  const [newAddress, setNewAddress] = useState({
    firstName: '',
    lastName: '',
    streetAddress: '',
    apt: '',
    city: '',
    state: '',
    zipCode: '',
  });

  // Close modal and reset address form
  const closeModal = () => {
    setIsModalVisible(false);
  };

  // Handle modal dismiss to reset the form fields
  const handleModalDismiss = () => {
    setNewAddress({
      firstName: '',
      lastName: '',
      streetAddress: '',
      apt: '',
      city: '',
      state: '',
      zipCode: '',
    });
    setCurrentAddress(null); // Reset currentAddress when closing modal
  };

  // Handle saving a new or edited address
  const handleSaveAddress = async () => {
    // Check for required fields
    if (!newAddress.firstName || !newAddress.lastName || !newAddress.streetAddress || !newAddress.city || !newAddress.state || !newAddress.zipCode) {
      Alert.alert('Error', 'Please fill out all required fields.');
      return;
    }

    const updatedAddresses = editingAddress
      ? userProfile.shippingAddresses.map(addr =>
          addr.id === currentAddress.id ? { ...newAddress, id: currentAddress.id } : addr
        )
      : [...(userProfile.shippingAddresses || []), { ...newAddress, id: Date.now().toString() }];

    try {
      // Update Firestore with the new list of addresses
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { shippingAddresses: updatedAddresses });

      // Update context
      setUserProfile({ ...userProfile, shippingAddresses: updatedAddresses });
      closeModal(); // Close modal after saving
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', 'Failed to save address. Please try again.');
    }
  };

  // Handle removing an address
  const handleRemoveAddress = async () => {
    Alert.alert('Remove Address', 'Are you sure you want to remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const updatedAddresses = userProfile.shippingAddresses.filter(addr => addr.id !== currentAddress.id);

          try {
            // Update Firestore by removing the address
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, { shippingAddresses: updatedAddresses });

            // Update context
            setUserProfile({ ...userProfile, shippingAddresses: updatedAddresses });
            setIsModalVisible(false);
          } catch (error) {
            console.error('Error removing address:', error);
            Alert.alert('Error', 'Failed to remove address. Please try again.');
          }
        },
      },
    ]);
  };

  // Open the form for adding a new address
  const handleAddAddress = () => {
    setEditingAddress(false); // Indicate that this is for a new address
    setNewAddress({
      firstName: '',
      lastName: '',
      streetAddress: '',
      apt: '',
      city: '',
      state: '',
      zipCode: '',
    });
    setIsModalVisible(true);
  };

  // Open the form for editing an existing address
  const handleEditAddress = (address) => {
    setEditingAddress(true); // Indicate that we are editing
    setCurrentAddress(address); // Set the current address
    setNewAddress({ ...address }); // Populate the form with the existing address
    setIsModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shipping Addresses</Text>

      {/* List of shipping addresses */}
      <FlatList
        data={userProfile.shippingAddresses || []}
        renderItem={({ item }) => (
          <View style={styles.addressContainer}>
            <View style={styles.addressInfo}>
              <Text style={styles.addressText}>{item.firstName} {item.lastName}</Text>
              <Text style={styles.addressText}>{item.streetAddress}</Text>
              {item.apt && <Text style={styles.addressText}>Apt: {item.apt}</Text>}
              <Text style={styles.addressText}>{item.city}, {item.state} {item.zipCode}</Text>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditAddress(item)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.infoText}>No shipping addresses available.</Text>}
      />

      {/* New Shipping Address Button */}
      <TouchableOpacity 
        style={styles.newAddressButton}
        onPress={handleAddAddress}
      >
        <Text style={styles.newAddressButtonText}>New Shipping Address</Text>
      </TouchableOpacity>

      {/* Modal for Adding or Editing Address */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal} // For Android back button
        onDismiss={handleModalDismiss} // Reset form when modal is dismissed
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>{editingAddress ? 'Edit Address' : 'Add Address'}</Text>

            {/* Form Fields */}
            <TextInput
              placeholder="First Name"
              style={styles.input}
              value={newAddress.firstName}
              onChangeText={(text) => setNewAddress({ ...newAddress, firstName: text })}
            />
            <TextInput
              placeholder="Last Name"
              style={styles.input}
              value={newAddress.lastName}
              onChangeText={(text) => setNewAddress({ ...newAddress, lastName: text })}
            />
            <TextInput
              placeholder="Street Address"
              style={styles.input}
              value={newAddress.streetAddress}
              onChangeText={(text) => setNewAddress({ ...newAddress, streetAddress: text })}
            />
            <TextInput
              placeholder="Apt, Suite, Bldg (optional)"
              style={styles.input}
              value={newAddress.apt}
              onChangeText={(text) => setNewAddress({ ...newAddress, apt: text })}
            />
            <TextInput
              placeholder="City"
              style={styles.input}
              value={newAddress.city}
              onChangeText={(text) => setNewAddress({ ...newAddress, city: text })}
            />
            <View style={styles.stateZipContainer}>
              <TextInput
                placeholder="State"
                style={[styles.input, styles.stateInput]}
                value={newAddress.state}
                onChangeText={(text) => setNewAddress({ ...newAddress, state: text })}
              />
              <TextInput
                placeholder="ZIP Code"
                style={[styles.input, styles.zipInput]}
                value={newAddress.zipCode}
                onChangeText={(text) => setNewAddress({ ...newAddress, zipCode: text })}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveAddress}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>

            {/* Remove Button for Editing */}
            {editingAddress && (
              <TouchableOpacity style={styles.removeButton} onPress={handleRemoveAddress}>
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  addressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  addressInfo: {
    flex: 1,
  },
  addressText: {
    fontSize: 16,
    marginBottom: 4,
  },
  editButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  newAddressButton: {
    marginTop: 20,
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  newAddressButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
    marginBottom: 15,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 20,
    padding: 10,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
    fontSize: 16,
  },
  stateZipContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stateInput: {
    flex: 1,
    marginRight: 10,
  },
  zipInput: {
    flex: 1,
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  removeButton: {
    marginTop: 10,
    backgroundColor: '#FF3B30', // Red color to indicate danger
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});