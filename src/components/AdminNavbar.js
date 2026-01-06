import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const NAV_ITEMS = [
  { key: 'AdminDashboard', label: 'Dashboard', screen: 'AdminDashboard' },
  { key: 'ManageCars', label: 'Véhicules', screen: 'ManageCars' },
  { key: 'ManageRentals', label: 'Locations', screen: 'ManageRentals' },
  { key: 'ManageUsers', label: 'Utilisateurs', screen: 'ManageUsers' },
  { key: 'Reports', label: 'Rapports', screen: 'Reports' },
];

const AdminNavbar = ({ activeScreen, onNavigate }) => {
  return (
    <View style={styles.container}>
      {NAV_ITEMS.map((item) => {
        const isActive = item.key === activeScreen;
        return (
          <TouchableOpacity
            key={item.key}
            style={[styles.button, isActive && styles.buttonActive]}
            onPress={() => onNavigate?.(item.screen)}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#0F172A',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(15,23,42,0.55)',
  },
  buttonActive: {
    backgroundColor: '#1E3A8A',
    borderColor: 'rgba(59,130,246,0.7)',
  },
  label: {
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '600',
    fontSize: 14,
  },
  labelActive: {
    color: '#F8FAFC',
  },
});

export default AdminNavbar;
