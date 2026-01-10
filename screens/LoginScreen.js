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
import { seedEmployees } from '../src/utils/SeedEmployees';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation, route }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const redirectTo = route?.params?.redirectTo;
  const redirectParams = route?.params?.redirectParams;
  const findAccountByUsername = async (usernameToFind) => {
    const employeeRef = collection(db, 'employees');
    const employeeQuery = query(employeeRef, where('username', '==', usernameToFind));
    const employeeSnapshot = await getDocs(employeeQuery);

    if (!employeeSnapshot.empty) {
      return { type: 'admin', doc: employeeSnapshot.docs[0] };
    }

    const userRef = collection(db, 'utilisateurs');
    const userQuery = query(userRef, where('username', '==', usernameToFind));
    const userSnapshot = await getDocs(userQuery);

    if (!userSnapshot.empty) {
      return { type: 'utilisateur', doc: userSnapshot.docs[0] };
    }

    return null;
  };

  const handleLogin = async () => {
    const normalizedUsername = username.trim();
    const normalizedPassword = password.trim();

    if (!normalizedUsername || !normalizedPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    try {
      const account = await findAccountByUsername(normalizedUsername);

      if (!account) {
        Alert.alert('Erreur', "Nom d'utilisateur incorrect.");
        setLoading(false);
        return;
      }

      const userDoc = account.doc;
      const userData = userDoc.data();

      const inputHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        normalizedPassword
      );

      if (inputHash !== userData.password) {
        Alert.alert('Erreur', 'Mot de passe incorrect.');
        setLoading(false);
        return;
      }

      await AsyncStorage.removeItem('localUser');

      if (account.type === 'admin') {
        navigation.replace('AdminDashboard');
      } else {
        const session = { id: userDoc.id, username: normalizedUsername, role: 'utilisateur' };
        await AsyncStorage.setItem('localUser', JSON.stringify(session));

        if (redirectTo) {
          navigation.replace(redirectTo, redirectParams ?? {});
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        }
      }
    } catch (error) {
      Alert.alert('Erreur', "Une erreur est survenue lors de la connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleSeedEmployees = async () => {
    setLoading(true);
    await seedEmployees();
    setLoading(false);
    setUsername('admin');
    setPassword('admin');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Connexion sécurisée</Text>
          <Text style={styles.subtitle}>Accédez à votre espace client </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom d'utilisateur</Text>
            <TextInput
              style={styles.input}
              placeholder="admin"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="Votre mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#94A3B8"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.backButtonText}>Retour à l'accueil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>Créer un compte</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.seedButton} onPress={handleSeedEmployees}>
            <Text style={styles.seedButtonText}></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
  },
  form: {
    backgroundColor: '#1E293B',
    padding: 24,
    borderRadius: 24,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 14,
    color: '#F8FAFC',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#F59E0B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 16,
  },
  backButton: {
    alignItems: 'center',
    padding: 8,
  },
  backButtonText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  registerButton: {
    alignItems: 'center',
    paddingTop: 4,
  },
  registerText: {
    color: '#FACC15',
    fontSize: 13,
  },
  seedButton: {
    marginTop: 12,
    padding: 6,
    alignItems: 'center',
  },
  seedButtonText: {
    color: '#475569',
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default LoginScreen;
