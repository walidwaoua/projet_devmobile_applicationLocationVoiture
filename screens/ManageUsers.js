import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { listenToCollection, patchDocument, removeDocument } from '../src/services/firestore';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenToCollection({
      collectionName: 'users',
      orderByField: 'name',
      onData: (data) => {
        setUsers(data);
        setLoading(false);
      },
      onError: (error) => {
        console.error('Erreur Firestore (users):', error);
        Alert.alert('Erreur', "Impossible de charger les utilisateurs.");
        setLoading(false);
      },
    });

    return unsubscribe;
  }, []);

  const handleUserAction = async (user, action) => {
    try {
      if (action === 'Edit') {
        const nextStatus = user.status === 'Active' ? 'Suspended' : 'Active';
        await patchDocument('users', user.id, {
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        });
        Alert.alert('Status Updated', `${user.name} est maintenant ${nextStatus}.`);
      } else if (action === 'Delete') {
        await removeDocument('users', user.id);
        Alert.alert('Deleted', `${user.name} a été supprimé.`);
      }
    } catch (error) {
      console.error('Erreur action utilisateur:', error);
      Alert.alert('Erreur', "Impossible d'exécuter l'action demandée.");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.userItem}>
      <Text style={styles.userText}>Name: {item.name}</Text>
      <Text style={styles.userText}>Email: {item.email}</Text>
      <Text style={styles.userText}>Role: {item.role}</Text>
      <Text style={[styles.statusText, item.status === 'Active' ? styles.active : styles.inactive]}>
        Status: {item.status}
      </Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleUserAction(item, 'Edit')}
        >
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => handleUserAction(item, 'Delete')}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Users</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#1E3A8A" style={styles.loader} />
      ) : (
        <FlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun utilisateur enregistré.</Text>}
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
  userItem: {
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
  userText: {
    fontSize: 16,
    marginBottom: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  active: {
    color: '#44ff44',
  },
  inactive: {
    color: '#ff4444',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
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

export default ManageUsers;