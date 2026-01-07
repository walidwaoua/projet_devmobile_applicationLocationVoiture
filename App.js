import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import CatalogScreen from './src/screens/CatalogScreen';
import LoginScreen from './screens/LoginScreen';
import AdminDashboard from './screens/AdminDashboard';
import ManageCars from './screens/ManageCars';
import ManageRentals from './screens/ManageRentals';
import ManageUsers from './screens/ManageUsers';
import Reports from './screens/Reports';
import RegisterScreen from './screens/RegisterScreen';
import ProfileScreen from './src/screens/user/ProfileScreen';
import ReservationScreen from './src/screens/user/ReservationScreen';
import ReservationHistoryScreen from './src/screens/user/ReservationHistoryScreen';


const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1E3A8A',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            contentStyle: { backgroundColor: '#fff' }
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Catalog"
            component={CatalogScreen}
            options={{ title: 'Catalogue' }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'Créer un compte employé' }}
          />

          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: 'Mon profil' }}
          />
          <Stack.Screen
            name="Reservation"
            component={ReservationScreen}
            options={{ title: 'Réservation' }}
          />
          <Stack.Screen
            name="ReservationHistory"
            component={ReservationHistoryScreen}
            options={{ title: 'Historique des réservations' }}
          />

          {/* Admin Routes */}
            <Stack.Screen
              name="AdminDashboard"
              component={AdminDashboard}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="ManageCars"
              component={ManageCars}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="ManageRentals"
              component={ManageRentals}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="ManageUsers"
              component={ManageUsers}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="Reports"
              component={Reports}
              options={{ headerShown: false, gestureEnabled: false }}
            />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
