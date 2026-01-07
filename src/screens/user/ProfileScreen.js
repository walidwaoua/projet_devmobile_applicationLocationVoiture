import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { auth, db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ navigation }) {
  const [profileName, setProfileName] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser;

      if (user) {
        try {
          const ref = doc(db, 'users', user.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            setProfileName(data.name || data.username || user.email || 'Utilisateur');
          } else {
            setProfileName(user.displayName || user.email || 'Utilisateur');
          }
        } catch (e) {
          setProfileName(user.displayName || user.email || 'Utilisateur');
        } finally {
          setLoading(false);
        }
        return;
      }

      // Fallback: local session for 'utilisateur'
      try {
        const raw = await AsyncStorage.getItem('localUser');
        if (raw) {
          const parsed = JSON.parse(raw);
          const ref = doc(db, 'utilisateurs', parsed.id);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            setProfileName(data.username || data.name || parsed.username || 'Utilisateur');
          } else {
            setProfileName(parsed.username || 'Utilisateur');
          }
        } else {
          setProfileName(null);
        }
      } catch (e) {
        setProfileName(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mon Profil</Text>

      <Text style={styles.info}>Nom : {profileName || 'Utilisateur invité'}</Text>

      <View style={styles.buttons}>
        <Button title="Faire une réservation" onPress={() => navigation.navigate('Reservation')} />
        <Button title="Historique des réservations" onPress={() => navigation.navigate('ReservationHistory')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  info: { fontSize: 16, marginBottom: 30 },
  buttons: { gap: 15 },
});
