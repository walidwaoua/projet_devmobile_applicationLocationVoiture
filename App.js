import React, { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Navbar from './src/components/Navbar';
import HomeScreen from './src/screens/HomeScreen';
import CatalogScreen from './src/screens/CatalogScreen';

export default function App() {
  const [activeScreen, setActiveScreen] = useState('home');

  const handleCatalogPress = () => {
    setActiveScreen('catalog');
  };

  const handleLoginPress = () => {
    Alert.alert('Connexion', 'Espace de connexion en cours de préparation.');
  };

  const handleBackHome = () => {
    setActiveScreen('home');
  };

  const handleMenuPress = () => {
    if (activeScreen !== 'home') {
      setActiveScreen('home');
    } else {
      Alert.alert('Menu', 'Le menu latéral sera disponible prochainement.');
    }
  };

  const handleReserve = (car) => {
    const label = car?.model ? car.model : 'ce véhicule';
    Alert.alert('Réservation', `La réservation pour ${label} sera disponible bientôt.`);
  };

  const showBack = activeScreen !== 'home';

  const navbarTitle = useMemo(() => {
    switch (activeScreen) {
      case 'catalog':
        return 'Catalogue';
      default:
        return 'Accueil';
    }
  }, [activeScreen]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        <Navbar
          title={navbarTitle}
          onMenuPress={handleMenuPress}
          onCatalogPress={handleCatalogPress}
          onLoginPress={handleLoginPress}
          showBack={showBack}
          onBackPress={handleBackHome}
        />
        {activeScreen === 'home' ? (
          <HomeScreen
            onCatalogPress={handleCatalogPress}
            onLoginPress={handleLoginPress}
          />
        ) : (
          <CatalogScreen
            onReserve={handleReserve}
            onLoginPress={handleLoginPress}
          />
        )}
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
