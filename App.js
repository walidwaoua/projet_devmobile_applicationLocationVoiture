import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

import AdminDashboard from './screens/AdminDashboard';
import ManageCars from './screens/ManageCars';
import ManageRentals from './screens/ManageRentals';
import ManageUsers from './screens/ManageUsers';
import Reports from './screens/Reports';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="AdminDashboard">
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={{ title: 'Admin Dashboard' }} />
        <Stack.Screen name="ManageCars" component={ManageCars} options={{ title: 'Manage Cars' }} />
        <Stack.Screen name="ManageRentals" component={ManageRentals} options={{ title: 'Manage Rentals' }} />
        <Stack.Screen name="ManageUsers" component={ManageUsers} options={{ title: 'Manage Users' }} />
        <Stack.Screen name="Reports" component={Reports} options={{ title: 'Reports' }} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
