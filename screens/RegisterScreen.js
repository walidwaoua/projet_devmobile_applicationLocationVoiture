import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import * as Crypto from 'expo-crypto';
import { createDocument } from '../src/services/firestore';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const u = username.trim();
    const p = password.trim();
    const pc = passwordConfirm.trim();

    if (!u || !p || !pc) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    if (p.length < 4) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 4 caractères.');
      return;
    }

    if (p !== pc) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    try {
      const employeesRef = collection(db, 'employees');
      const q = query(employeesRef, where('username', '==', u));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        Alert.alert('Erreur', "Ce nom d'utilisateur est déjà utilisé.");
        setLoading(false);
        return;
      }

      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        p
      );

      await createDocument('employees', {
        username: u,
        password: hashedPassword,
        role: 'staff',
        status: 'Active',
        createdAt: new Date().toISOString(),
      });

      Alert.alert(
        'Succès',
        'Compte créé avec succès.',
        [{ text: 'OK', onPress: () => navigation.replace('Login') }]
      );
    } catch (error) {
      Alert.alert('Erreur', "Une erreur s'est produite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Créer un compte employé</Text>
          <Text style={styles.subtitle}>
            Accès à l’espace d’administration.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom d'utilisateur</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholder="ex: employe1"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Mot de passe"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmer le mot de passe</Text>
            <TextInput
              style={styles.input}
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              secureTextEntry
              placeholder="Confirmer"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Créer le compte</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>
              Déjà inscrit ? Se connecter
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { marginBottom: 32, alignItems: 'center' },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F9FAFB',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
  form: {
    backgroundColor: '#020617',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1F2937',
    gap: 16,
  },
  inputGroup: { gap: 6 },
  label: { color: '#E5E7EB', fontSize: 14, fontWeight: '600' },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
    padding: 12,
    color: '#F9FAFB',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#22C55E',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#022C22', fontWeight: '700', fontSize: 16 },
  backButton: { alignItems: 'center', paddingVertical: 8 },
  backButtonText: { color: '#9CA3AF', fontSize: 14 },
});

export default RegisterScreen;
