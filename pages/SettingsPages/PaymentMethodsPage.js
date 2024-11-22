import React, { useContext, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { UserContext } from '../../UserContext';
import { auth, db } from '../../firebaseConfig';
import { doc, collection, addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

export default function PaymentMethodsPage() {
  const { userProfile, setUserProfile } = useContext(UserContext);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState(false);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState(null);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    cardNumber: '',
    expirationDate: '',
    securityCode: '',
    zipCode: '',
  });

  const formatCardNumber = (value) => value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);
  const formatExpirationDate = (value) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, 4);
    return cleanValue.length >= 3 ? `${cleanValue.slice(0, 2)}/${cleanValue.slice(2)}` : cleanValue;
  };

  const handleCardNumberChange = (value) => setNewPaymentMethod((prev) => ({ ...prev, cardNumber: formatCardNumber(value) }));
  const handleExpirationDateChange = (value) => setNewPaymentMethod((prev) => ({ ...prev, expirationDate: formatExpirationDate(value) }));
  const handleSecurityCodeChange = (value) => setNewPaymentMethod((prev) => ({ ...prev, securityCode: value.replace(/\D/g, '').slice(0, 3) }));
  const handleZipCodeChange = (value) => setNewPaymentMethod((prev) => ({ ...prev, zipCode: value.replace(/\D/g, '').slice(0, 5) }));

  // Close modal and reset form
  const closeModal = () => {
    setIsModalVisible(false);
    setNewPaymentMethod({ cardNumber: '', expirationDate: '', securityCode: '', zipCode: '' });
  };

  // Handle saving a new or edited payment method
  const handleSavePaymentMethod = async () => {
    if (!newPaymentMethod.cardNumber || !newPaymentMethod.expirationDate || !newPaymentMethod.securityCode || !newPaymentMethod.zipCode) {
      Alert.alert('Error', 'Please fill out all required fields.');
      return;
    }

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const paymentMethodsRef = collection(userRef, 'paymentMethods');

      if (editingPaymentMethod) {
        // Update the existing payment method
        const paymentMethodRef = doc(paymentMethodsRef, currentPaymentMethod.id);
        await updateDoc(paymentMethodRef, newPaymentMethod);
      } else {
        // Add new payment method
        await addDoc(paymentMethodsRef, newPaymentMethod);
      }

      closeModal();
    } catch (error) {
      console.error('Error saving payment method:', error);
      Alert.alert('Error', 'Failed to save payment method. Please try again.');
    }
  };

  // Handle removing a payment method
  const handleRemovePaymentMethod = async () => {
    Alert.alert('Remove Payment Method', 'Are you sure you want to remove this payment method?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            const paymentMethodRef = doc(collection(userRef, 'paymentMethods'), currentPaymentMethod.id);
            await deleteDoc(paymentMethodRef);

            closeModal();
          } catch (error) {
            console.error('Error removing payment method:', error);
            Alert.alert('Error', 'Failed to remove payment method. Please try again.');
          }
        },
      },
    ]);
  };

  // Open the form for adding a new payment method
  const handleAddPaymentMethod = () => {
    setEditingPaymentMethod(false);
    setNewPaymentMethod({ cardNumber: '', expirationDate: '', securityCode: '', zipCode: '' });
    setIsModalVisible(true);
  };

  // Open the form for editing an existing payment method
  const handleEditPaymentMethod = (paymentMethod) => {
    setEditingPaymentMethod(true);
    setCurrentPaymentMethod(paymentMethod);
    setNewPaymentMethod({ ...paymentMethod });
    setIsModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Methods</Text>

      <FlatList
        data={userProfile.paymentMethods || []}
        renderItem={({ item }) => (
          <View style={styles.paymentMethodContainer}>
            <View style={styles.paymentMethodInfo}>
              <Text style={styles.paymentMethodText}>Card: **** **** **** {item.cardNumber.slice(-4)}</Text>
              <Text style={styles.paymentMethodText}>Expires: {item.expirationDate}</Text>
              <Text style={styles.paymentMethodText}>ZIP: {item.zipCode}</Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditPaymentMethod(item)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.infoText}>No payment methods available.</Text>}
      />

      <TouchableOpacity style={styles.newPaymentMethodButton} onPress={handleAddPaymentMethod}>
        <Text style={styles.newPaymentMethodButtonText}>New Payment Method</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>{editingPaymentMethod ? 'Edit Payment Method' : 'Add Payment Method'}</Text>

            <ScrollView>
              <TextInput
                placeholder="Card Number"
                style={styles.input}
                value={newPaymentMethod.cardNumber}
                onChangeText={handleCardNumberChange}
                keyboardType="numeric"
              />
              <TextInput
                placeholder="Expiration Date (MM/YY)"
                style={styles.input}
                value={newPaymentMethod.expirationDate}
                onChangeText={handleExpirationDateChange}
                keyboardType="numeric"
              />
              <TextInput
                placeholder="Security Code"
                style={styles.input}
                value={newPaymentMethod.securityCode}
                onChangeText={handleSecurityCodeChange}
                keyboardType="numeric"
                maxLength={3}
              />
              <TextInput
                placeholder="ZIP Code"
                style={styles.input}
                value={newPaymentMethod.zipCode}
                onChangeText={handleZipCodeChange}
                keyboardType="numeric"
                maxLength={5}
              />
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSavePaymentMethod}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  paymentMethodContainer: {
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
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodText: {
    fontSize: 16,
    marginBottom: 4,
  },
  editButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  newPaymentMethodButton: {
    marginTop: 20,
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: 'center',
  },
  newPaymentMethodButtonText: {
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
  saveButton: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  removeButton: {
    marginTop: 10,
    backgroundColor: '#FF3B30', // Red for removal
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});