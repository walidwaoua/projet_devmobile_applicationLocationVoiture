import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const Navbar = ({ title = 'Accueil', onMenuPress, onCatalogPress, onLoginPress }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
        <Text style={styles.menuText}>≡</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.linkButton} onPress={onCatalogPress}>
          <Text style={styles.linkText}>Catalogue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.linkButton, styles.loginButton]} onPress={onLoginPress}>
          <Text style={[styles.linkText, styles.loginText]}>Connexion</Text>
        </TouchableOpacity>
      </View>
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  linkButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  loginButton: {
    backgroundColor: '#F59E0B',
  },
  linkText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  loginText: {
    color: '#1E293B',
  },
});

export default Navbar;
