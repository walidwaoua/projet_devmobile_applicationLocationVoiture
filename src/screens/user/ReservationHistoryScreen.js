import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { db, auth } from '../../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ReservationHistoryScreen() {
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem('localUser');
        const local = stored ? JSON.parse(stored) : null;
        const userId = auth.currentUser?.uid || local?.id || null;
        const q = userId
          ? query(collection(db, 'reservations'), where('userId', '==', userId))
          : query(collection(db, 'reservations'));

        const snapshot = await getDocs(q);
        setReservations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error('Erreur chargement historique:', e);
      }
    };

    loadHistory();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historique</Text>

      <FlatList
        data={reservations}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>Véhicule : {item.vehicleModel || '—'}</Text>
            <Text>Nom : {item.firstName} {item.lastName}</Text>
            <Text>Prise : {item.pickupDate} {item.pickupTime}</Text>
            <Text>Jours : {item.days}</Text>
            <Text>Statut : {item.status}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>Aucune réservation</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, marginBottom: 20 },
  card: { padding: 15, borderWidth: 1, borderRadius: 6, marginBottom: 10 },
});
