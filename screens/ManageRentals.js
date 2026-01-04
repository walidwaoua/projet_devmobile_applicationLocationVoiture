import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';

// Mock data for rentals
const initialRentals = [
  { id: '1', customer: 'John Doe', car: 'Toyota Corolla', startDate: '2023-10-01', endDate: '2023-10-05', status: 'Active' },
  { id: '2', customer: 'Jane Smith', car: 'Honda Civic', startDate: '2023-09-15', endDate: '2023-09-20', status: 'Completed' },
  { id: '3', customer: 'Bob Johnson', car: 'Ford Focus', startDate: '2023-10-10', endDate: '2023-10-15', status: 'Pending' },
  { id: '4', customer: 'Alice Brown', car: 'BMW X3', startDate: '2023-10-12', endDate: '2023-10-18', status: 'Pending' },
];

const ManageRentals = () => {
  const [rentals, setRentals] = useState(initialRentals);

  const handleRentalAction = (rental, action) => {
    if (action === 'Approve') {
      setRentals(rentals.map(r =>
        r.id === rental.id ? { ...r, status: 'Active' } : r
      ));
      Alert.alert('Approved', `Rental for ${rental.customer} has been approved.`);
    } else if (action === 'Deny') {
      setRentals(rentals.filter(r => r.id !== rental.id));
      Alert.alert('Denied', `Rental for ${rental.customer} has been denied and removed.`);
    } else if (action === 'Complete') {
      setRentals(rentals.map(r =>
        r.id === rental.id ? { ...r, status: 'Completed' } : r
      ));
      Alert.alert('Completed', `Rental for ${rental.customer} has been marked as completed.`);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.rentalItem}>
      <Text style={styles.rentalText}>Customer: {item.customer}</Text>
      <Text style={styles.rentalText}>Car: {item.car}</Text>
      <Text style={styles.rentalText}>Dates: {item.startDate} to {item.endDate}</Text>
      <Text style={[styles.statusText, item.status === 'Active' ? styles.active : item.status === 'Completed' ? styles.completed : styles.pending]}>
        Status: {item.status}
      </Text>
      {item.status === 'Pending' && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.approveButton]}
            onPress={() => handleRentalAction(item, 'Approve')}
          >
            <Text style={styles.buttonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.denyButton]}
            onPress={() => handleRentalAction(item, 'Deny')}
          >
            <Text style={styles.buttonText}>Deny</Text>
          </TouchableOpacity>
        </View>
      )}
      {item.status === 'Active' && (
        <TouchableOpacity
          style={[styles.button, styles.completeButton]}
          onPress={() => handleRentalAction(item, 'Complete')}
        >
          <Text style={styles.buttonText}>Mark Complete</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Rentals</Text>
      <FlatList
        data={rentals}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  rentalItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rentalText: {
    fontSize: 16,
    marginBottom: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  active: {
    color: '#ff4444',
  },
  completed: {
    color: '#44ff44',
  },
  pending: {
    color: '#ffa500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  approveButton: {
    backgroundColor: '#44ff44',
  },
  denyButton: {
    backgroundColor: '#ff4444',
  },
  completeButton: {
    backgroundColor: '#007bff',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ManageRentals;