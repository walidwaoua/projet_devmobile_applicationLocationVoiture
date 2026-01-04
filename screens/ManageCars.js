import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';

// Mock data for cars
const initialCars = [
  { id: '1', model: 'Toyota Corolla', year: 2020, available: true },
  { id: '2', model: 'Honda Civic', year: 2019, available: false },
  { id: '3', model: 'Ford Focus', year: 2021, available: true },
];

const ManageCars = () => {
  const [cars, setCars] = useState(initialCars);

  const toggleAvailability = (id) => {
    setCars(cars.map(car =>
      car.id === id ? { ...car, available: !car.available } : car
    ));
  };

  const addNewCar = () => {
    Alert.alert('Add New Car', 'Functionality to add a new car will be implemented once database is set up.');
  };

  const renderItem = ({ item }) => (
    <View style={styles.carItem}>
      <Text style={styles.carText}>{item.model} ({item.year})</Text>
      <Text style={styles.statusText}>
        {item.available ? 'Available' : 'Rented'}
      </Text>
      <TouchableOpacity
        style={[styles.button, item.available ? styles.rentButton : styles.returnButton]}
        onPress={() => toggleAvailability(item.id)}
      >
        <Text style={styles.buttonText}>
          {item.available ? 'Mark as Rented' : 'Mark as Available'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Cars</Text>
      <TouchableOpacity style={styles.addButton} onPress={addNewCar}>
        <Text style={styles.addButtonText}>+ Add New Car</Text>
      </TouchableOpacity>
      <FlatList
        data={cars}
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
  addButton: {
    backgroundColor: '#28a745',
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  carItem: {
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
  carText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 5,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  rentButton: {
    backgroundColor: '#ff4444',
  },
  returnButton: {
    backgroundColor: '#44ff44',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ManageCars;