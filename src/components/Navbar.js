import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const Navbar = ({ title = 'Accueil', onMenuPress }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
        <Text style={styles.menuText}>≡</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.placeholder} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    fontSize: 24,
    color: '#fff',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
});

export default Navbar;
