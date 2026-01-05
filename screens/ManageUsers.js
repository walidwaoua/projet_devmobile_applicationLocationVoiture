import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { listenToCollection, patchDocument, removeDocument, createDocument } from '../src/services/firestore';
import * as Crypto from 'expo-crypto';

const ManageUsers = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('staff'); // 'admin' or 'staff'
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const unsubscribe = listenToCollection({
      collectionName: 'employees',
      orderByField: 'username',
      onData: (data) => {
        setEmployees(data);
        setLoading(false);
      },
      onError: (error) => {
        console.error('Erreur Firestore (employees):', error);
        Alert.alert('Erreur', "Impossible de charger les employés.");
        setLoading(false);
      },
    });

    return unsubscribe;
  }, []);

  const handleAddEmployee = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir le nom d\'utilisateur et le mot de passe.');
      return;
    }

    setAdding(true);
    try {
      // Hash password
      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        newPassword.trim()
      );

      await createDocument('employees', {
        username: newUsername.trim(),
        password: hashedPassword,
        role: newRole,
        createdAt: new Date().toISOString(),
        status: 'Active'
      });

      Alert.alert('Succès', 'Employé ajouté avec succès.');
      setModalVisible(false);
      setNewUsername('');
      setNewPassword('');
      setNewRole('staff');
    } catch (error) {
      console.error('Erreur ajout employé:', error);
      Alert.alert('Erreur', "Impossible d'ajouter l'employé.");
    } finally {
      setAdding(false);
    }
  };

  const handleUserAction = async (employee, action) => {
    try {
      if (action === 'Delete') {
        if (employee.username === 'admin') {
          Alert.alert('Action refusée', 'Impossible de supprimer le compte admin principal.');
          return;
        }
        await removeDocument('employees', employee.id);
        Alert.alert('Supprimé', `L'employé ${employee.username} a été supprimé.`);
      }
    } catch (error) {
      console.error('Erreur action employé:', error);
      Alert.alert('Erreur', "Impossible d'exécuter l'action demandée.");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <Text style={styles.userText}><Text style={styles.label}>User:</Text> {item.username}</Text>
        <Text style={styles.userText}><Text style={styles.label}>Role:</Text> {item.role}</Text>
      </View>

      <View style={styles.buttonContainer}>
        {item.username !== 'admin' && (
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={() => handleUserAction(item, 'Delete')}
          >
            <Text style={styles.buttonText}>Supprimer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Gestion des Employés</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1E3A8A" style={styles.loader} />
      ) : (
        <FlatList
          data={employees}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun employé enregistré.</Text>}
        />
      )}

      {/* Add Employee Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouvel Employé</Text>

            <TextInput
              style={styles.input}
              placeholder="Nom d'utilisateur"
              value={newUsername}
              onChangeText={setNewUsername}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>Rôle:</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[styles.roleSelect, newRole === 'staff' && styles.roleActive]}
                  onPress={() => setNewRole('staff')}
                >
                  <Text style={[styles.roleText, newRole === 'staff' && styles.roleTextActive]}>Staff</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleSelect, newRole === 'admin' && styles.roleActive]}
                  onPress={() => setNewRole('admin')}
                >
                  <Text style={[styles.roleText, newRole === 'admin' && styles.roleTextActive]}>Admin</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleAddEmployee}
                disabled={adding}
              >
                {adding ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Ajouter</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userText: {
    fontSize: 16,
    color: '#334155',
    marginBottom: 4,
  },
  label: {
    fontWeight: '700',
    color: '#64748B',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  loader: {
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 40,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F8FAFC',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  roleSelect: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    alignItems: 'center',
  },
  roleActive: {
    backgroundColor: '#eff6ff', // blue-50
    borderColor: '#3B82F6',
  },
  roleText: {
    color: '#64748B',
    fontWeight: '600',
  },
  roleTextActive: {
    color: '#3B82F6',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    color: '#64748B',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ManageUsers;