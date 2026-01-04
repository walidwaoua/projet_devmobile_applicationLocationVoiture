import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { listenToCollection, patchDocument, removeDocument } from '../src/services/firestore';

const ManageRentals = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenToCollection({
      collectionName: 'rentals',
      orderByField: 'startDate',
      orderDirection: 'desc',
      onData: (data) => {
        setRentals(data);
        setLoading(false);
      },
      onError: (error) => {
        console.error('Erreur Firestore (rentals):', error);
        Alert.alert('Erreur', "Impossible de charger les réservations.");
        setLoading(false);
      },
    });

    return unsubscribe;
  }, []);

  const handleRentalAction = async (rental, action) => {
    try {
      if (action === 'Approve') {
        await patchDocument('rentals', rental.id, {
          status: 'Active',
          approvedAt: new Date().toISOString(),
        });
        Alert.alert('Approved', `Rental for ${rental.customer} has been approved.`);
      } else if (action === 'Deny') {
        await removeDocument('rentals', rental.id);
        Alert.alert('Denied', `Rental for ${rental.customer} has been denied and removed.`);
      } else if (action === 'Complete') {
        await patchDocument('rentals', rental.id, {
          status: 'Completed',
          completedAt: new Date().toISOString(),
        });
        Alert.alert('Completed', `Rental for ${rental.customer} has been marked as completed.`);
      }
    } catch (error) {
      console.error('Erreur traitement location:', error);
      Alert.alert('Erreur', "L'action demandée a échoué. Réessayez plus tard.");
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
      {loading ? (
        <ActivityIndicator size="large" color="#1E3A8A" style={styles.loader} />
      ) : (
        <FlatList
          data={rentals}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucune réservation trouvée.</Text>}
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
  loader: {
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 40,
  },
});

export default ManageRentals;