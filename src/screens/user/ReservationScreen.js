import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { db, auth } from '../../../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export default function ReservationScreen({ navigation }) {
  const user = auth.currentUser;
  const [localSession, setLocalSession] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [days, setDays] = useState('1');
  const [loading, setLoading] = useState(false);

  const makeReservation = async () => {
    if (!firstName || !lastName || !phone || !vehicleModel || !pickupDate || !pickupTime || !days) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    try {
      setLoading(true);

      const sessionUserId = user?.uid || localSession?.id || 'guest';
      const sessionUserEmail = user?.email || localSession?.username || null;

      const payload = {
        userId: sessionUserId,
        userEmail: sessionUserEmail,
        firstName,
        lastName,
        phone,
        vehicleModel,
        pickupDate,
        pickupTime,
        days: Number(days),
        status: 'en attente',
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'reservations'), payload);

      Alert.alert('Succès', 'Réservation sauvegardée.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la réservation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem('localUser');
        if (raw) setLocalSession(JSON.parse(raw));
      } catch (e) {
        // ignore
      }
    };

    load();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Réserver un véhicule</Text>

      <TextInput style={styles.input} placeholder="Prénom" value={firstName} onChangeText={setFirstName} />
      <TextInput style={styles.input} placeholder="Nom" value={lastName} onChangeText={setLastName} />
      <TextInput style={styles.input} placeholder="Téléphone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      <TextInput style={styles.input} placeholder="Modèle du véhicule" value={vehicleModel} onChangeText={setVehicleModel} />
      <TextInput style={styles.input} placeholder="Date de prise (YYYY-MM-DD)" value={pickupDate} onChangeText={setPickupDate} />
      <TextInput style={styles.input} placeholder="Heure de prise (HH:MM)" value={pickupTime} onChangeText={setPickupTime} />
      <TextInput style={styles.input} placeholder="Nombre de jours" keyboardType="numeric" value={days} onChangeText={setDays} />

      <Button title={loading ? 'Chargement...' : 'Confirmer la réservation'} onPress={makeReservation} disabled={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20 },
  title: { fontSize: 20, marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
});
