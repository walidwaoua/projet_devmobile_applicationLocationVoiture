import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Navbar = ({
  title = 'Accueil',
  onMenuPress,
  onCatalogPress,
  onLoginPress,
  onLogoutPress,
  isAuthenticated = false,
  showBack = false,
  onBackPress,
  navigation,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={showBack ? onBackPress : onMenuPress}
        style={styles.menuButton}
        activeOpacity={0.7}
      >
        {showBack ? (
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        ) : (
          <MaterialCommunityIcons name="menu" size={26} color="#fff" />
        )}
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={navigation?.navigate ? () => navigation.navigate('Catalog') : onCatalogPress}
        >
          <Text style={styles.linkText}>Catalogue</Text>
        </TouchableOpacity>
        {isAuthenticated ? (
          <TouchableOpacity
            style={[styles.linkButton, styles.logoutButton]}
            onPress={onLogoutPress}
          >
            <Text style={[styles.linkText, styles.logoutText]}>Déconnexion</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.linkButton, styles.loginButton]} onPress={onLoginPress}>
            <Text style={[styles.linkText, styles.loginText]}>Connexion</Text>
          </TouchableOpacity>
        )}
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
  logoutButton: {
    backgroundColor: 'rgba(248,250,252,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248,250,252,0.32)',
  },
  linkText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  loginText: {
    color: '#1E293B',
  },
  logoutText: {
    color: '#F8FAFC',
  },
});

export default Navbar;
