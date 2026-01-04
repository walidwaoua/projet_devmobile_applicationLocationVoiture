import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Navbar from './src/components/Navbar';
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  const handleCatalogPress = () => {
    Alert.alert('Catalogue', 'Connexion au catalogue prochainement disponible.');
  };

  const handleLoginPress = () => {
    Alert.alert('Connexion', 'Espace de connexion en cours de préparation.');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        <Navbar
          title="Accueil"
          onCatalogPress={handleCatalogPress}
          onLoginPress={handleLoginPress}
        />
        <HomeScreen onCatalogPress={handleCatalogPress} onLoginPress={handleLoginPress} />
        <StatusBar style="light" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
