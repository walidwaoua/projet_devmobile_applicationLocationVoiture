import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { listenToCollection } from '../src/services/firestore';

const AdminDashboard = ({ navigation }) => {
  const menuItems = [
    { id: '1', title: 'Manage Cars', screen: 'ManageCars' },
    { id: '2', title: 'Manage Rentals', screen: 'ManageRentals' },
    { id: '3', title: 'Manage Users', screen: 'ManageUsers' },
    { id: '4', title: 'Reports', screen: 'Reports' },
  ];

  const [metrics, setMetrics] = useState({ cars: 0, rentals: 0, pending: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let completed = 0;

    const stopCars = listenToCollection({
      collectionName: 'cars',
      onData: (data) => {
        setMetrics((prev) => ({ ...prev, cars: data.length }));
        completed += 1;
        setLoading(completed < 3);
      },
      onError: (error) => {
        console.error('Erreur métriques voitures:', error);
        completed += 1;
        setLoading(completed < 3);
      },
    });

    const stopRentals = listenToCollection({
      collectionName: 'rentals',
      onData: (data) => {
        setMetrics((prev) => ({
          ...prev,
          rentals: data.length,
          pending: data.filter((item) => item.status === 'Pending').length,
        }));
        completed += 1;
        setLoading(completed < 3);
      },
      onError: (error) => {
        console.error('Erreur métriques locations:', error);
        completed += 1;
        setLoading(completed < 3);
      },
    });

    const stopUsers = listenToCollection({
      collectionName: 'users',
      onData: (data) => {
        setMetrics((prev) => ({ ...prev, users: data.length }));
        completed += 1;
        setLoading(completed < 3);
      },
      onError: (error) => {
        console.error('Erreur métriques utilisateurs:', error);
        completed += 1;
        setLoading(completed < 3);
      },
    });

    return () => {
      stopCars?.();
      stopRentals?.();
      stopUsers?.();
    };
  }, []);

  const handleLogout = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate(item.screen)}>
      <Text style={styles.menuText}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Véhicules</Text>
          <Text style={styles.metricValue}>{metrics.cars}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Locations</Text>
          <Text style={styles.metricValue}>{metrics.rentals}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>En attente</Text>
          <Text style={styles.metricValue}>{metrics.pending}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Utilisateurs</Text>
          <Text style={styles.metricValue}>{metrics.users}</Text>
        </View>
      </View>

      {loading && <ActivityIndicator size="small" color="#1E3A8A" style={styles.loader} />}

      <FlatList
        data={menuItems}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 12,
  },
  metricCard: {
    flexBasis: '47%',
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  metricValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  menuItem: {
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
  menuText: {
    fontSize: 18,
    textAlign: 'center',
  },
  loader: {
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
});

export default AdminDashboard;
