import React, { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Navbar from './src/components/Navbar';
import HomeScreen from './src/screens/HomeScreen';
import CatalogScreen from './src/screens/CatalogScreen';
import AdminDashboard from './screens/AdminDashboard';
import ManageCars from './screens/ManageCars';
import ManageRentals from './screens/ManageRentals';
import ManageUsers from './screens/ManageUsers';
import Reports from './screens/Reports';

const ADMIN_SCREENS = {
  dashboard: 'admin-dashboard',
  ManageCars: 'admin-manage-cars',
  ManageRentals: 'admin-manage-rentals',
  ManageUsers: 'admin-manage-users',
  Reports: 'admin-reports',
};

export default function App() {
  const [activeScreen, setActiveScreen] = useState('home');

  const handleCatalogPress = () => {
    setActiveScreen('catalog');
  };

  const handleLoginPress = () => {
    Alert.alert('Connexion', 'Espace de connexion en cours de préparation.');
  };

  const handleBackHome = () => {
    if (activeScreen === ADMIN_SCREENS.dashboard) {
      setActiveScreen('home');
      return;
    }
    if (typeof activeScreen === 'string' && activeScreen.startsWith('admin-')) {
      setActiveScreen(ADMIN_SCREENS.dashboard);
      return;
    }
    setActiveScreen('home');
  };

  const handleAdminPress = () => {
    setActiveScreen(ADMIN_SCREENS.dashboard);
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
      case ADMIN_SCREENS.dashboard:
        return 'Dashboard';
      case ADMIN_SCREENS.ManageCars:
        return 'Gestion des véhicules';
      case ADMIN_SCREENS.ManageRentals:
        return 'Gestion des locations';
      case ADMIN_SCREENS.ManageUsers:
        return 'Gestion des utilisateurs';
      case ADMIN_SCREENS.Reports:
        return 'Rapports';
      default:
        return 'Accueil';
    }
  }, [activeScreen]);

  const adminNavigation = useMemo(
    () => ({
      navigate: (screen) => {
        const target = ADMIN_SCREENS[screen];
        if (target) {
          setActiveScreen(target);
        } else {
          Alert.alert('Navigation admin', `Vue ${screen} non prise en charge.`);
        }
      },
    }),
    []
  );

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
        {activeScreen === 'home' && (
          <HomeScreen
            onCatalogPress={handleCatalogPress}
            onLoginPress={handleLoginPress}
            onAdminPress={handleAdminPress}
          />
        )}
        {activeScreen === 'catalog' && (
          <CatalogScreen onReserve={handleReserve} onLoginPress={handleLoginPress} />
        )}
        {activeScreen === ADMIN_SCREENS.dashboard && (
          <AdminDashboard navigation={adminNavigation} />
        )}
        {activeScreen === ADMIN_SCREENS.ManageCars && <ManageCars />}
        {activeScreen === ADMIN_SCREENS.ManageRentals && <ManageRentals />}
        {activeScreen === ADMIN_SCREENS.ManageUsers && <ManageUsers />}
        {activeScreen === ADMIN_SCREENS.Reports && <Reports />}
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
