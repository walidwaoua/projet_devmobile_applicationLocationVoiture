import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { createDocument, listenToCollection, patchDocument } from '../src/services/firestore';

const ManageCars = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = listenToCollection({
      collectionName: 'cars',
      orderByField: 'model',
      onData: (data) => {
        setCars(data);
        setLoading(false);
      },
      onError: (error) => {
        console.error('Erreur Firestore (cars):', error);
        Alert.alert('Erreur', "Impossible de charger les véhicules. Veuillez réessayer.");
        setLoading(false);
      },
    });

    return unsubscribe;
  }, []);

  const toggleAvailability = async (car) => {
    try {
      await patchDocument('cars', car.id, {
        available: !car.available,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erreur mise à jour véhicule:', error);
      Alert.alert('Erreur', "Impossible de modifier la disponibilité.");
    }
  };

  const addNewCar = async () => {
    if (saving) {
      return;
    }

    setSaving(true);
    try {
      await createDocument('cars', {
        model: 'Nouveau modèle',
        year: new Date().getFullYear(),
        available: true,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erreur ajout véhicule:', error);
      Alert.alert('Erreur', "Impossible d'ajouter un véhicule pour le moment.");
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.carItem}>
      <Text style={styles.carText}>{item.model} ({item.year})</Text>
      <Text style={styles.statusText}>
        {item.available ? 'Available' : 'Rented'}
      </Text>
      <TouchableOpacity
        style={[styles.button, item.available ? styles.rentButton : styles.returnButton]}
        onPress={() => toggleAvailability(item)}
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
        <Text style={styles.addButtonText}>{saving ? 'Saving...' : '+ Add New Car'}</Text>
      </TouchableOpacity>
      {loading ? (
        <ActivityIndicator size="large" color="#1E3A8A" style={styles.loader} />
      ) : (
        <FlatList
          data={cars}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun véhicule enregistré.</Text>}
        />
      )}
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
  loader: {
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 40,
  },
});

export default ManageCars;