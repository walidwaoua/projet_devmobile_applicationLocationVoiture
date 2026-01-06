import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { listenToCollection, removeDocument, createDocument } from '../src/services/firestore';
import * as Crypto from 'expo-crypto';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const ManageUsers = ({ navigation }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('staff'); // 'admin' or 'staff'
  const [adding, setAdding] = useState(false);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef({}).current;
  const metricsAnim = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  const adminCount = useMemo(() => employees.filter((emp) => emp.role === 'admin').length, [employees]);
  const staffCount = useMemo(() => employees.filter((emp) => emp.role !== 'admin').length, [employees]);
  const activeCount = useMemo(() => employees.filter((emp) => emp.status !== 'Inactive').length, [employees]);

  const metrics = useMemo(
    () => [
      {
        label: 'Total équipe',
        value: employees.length,
        icon: 'account-group',
        accent: '#FACC15',
      },
      {
        label: 'Managers',
        value: adminCount,
        icon: 'shield-account',
        accent: '#38BDF8',
      },
      {
        label: 'Actifs',
        value: activeCount,
        icon: 'pulse',
        accent: '#34D399',
      },
    ],
    [employees.length, adminCount, activeCount],
  );

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

  useEffect(() => {
    heroAnim.setValue(0);
    Animated.timing(heroAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [heroAnim]);

  useEffect(() => {
    metricsAnim.forEach((anim, index) => {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 520,
        delay: index * 90,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [metricsAnim, metrics]);

  useEffect(() => {
    Object.keys(cardAnimations).forEach((key) => delete cardAnimations[key]);
    listAnim.setValue(0);
    Animated.timing(listAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [employees, cardAnimations, listAnim]);

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
      if (action === 'delete') {
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

  const getCardAnimation = (id, index) => {
    if (!cardAnimations[id]) {
      const value = new Animated.Value(0);
      cardAnimations[id] = value;
      Animated.timing(value, {
        toValue: 1,
        duration: 420,
        delay: index * 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
    return cardAnimations[id];
  };

  const formatCreatedAt = (value) => {
    if (!value) return 'Profil récent';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Profil récent';
    }
    return `Depuis le ${date.toLocaleDateString('fr-FR')}`;
  };

  const initialsFrom = (name = '') => {
    if (!name) return '??';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase?.() || '')
      .join('')
      .padEnd(2, '•');
  };

  const roleVisuals = {
    admin: {
      label: 'Administrateur',
      background: 'rgba(56,189,248,0.18)',
      color: '#0EA5E9',
      icon: 'shield-account',
    },
    staff: {
      label: 'Conseiller',
      background: 'rgba(250,204,21,0.18)',
      color: '#B45309',
      icon: 'account-badge',
    },
  };

  const renderItem = ({ item, index }) => {
    const anim = getCardAnimation(item.id || index, index);
    const visuals = roleVisuals[item.role] || roleVisuals.staff;

    return (
      <Animated.View
        style={[
          styles.userItem,
          {
            opacity: anim,
            transform: [
              { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
              { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
            ],
          },
        ]}
      >
        <View style={styles.userHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialsFrom(item.username)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.userMeta}>{formatCreatedAt(item.createdAt)}</Text>
          </View>
          <View style={[styles.rolePill, { backgroundColor: visuals.background }]}> 
            <MaterialCommunityIcons name={visuals.icon} size={16} color={visuals.color} />
            <Text style={[styles.rolePillText, { color: visuals.color }]}>{visuals.label}</Text>
          </View>
        </View>

        <View style={styles.userFooter}>
          <View style={styles.userBadgeRow}>
            <View style={styles.badge}>
              <MaterialCommunityIcons name="email-lock" size={16} color="#1E3A8A" />
              <Text style={styles.badgeText}>Accès sécurisé</Text>
            </View>
            <View style={styles.badge}>
              <MaterialCommunityIcons name="account-check" size={16} color="#1E3A8A" />
              <Text style={styles.badgeText}>{item.status || 'Active'}</Text>
            </View>
          </View>

          {item.username !== 'admin' ? (
            <AnimatedTouchable
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleUserAction(item, 'delete')}
            >
              <MaterialCommunityIcons name="trash-can" size={18} color="#DC2626" />
              <Text style={styles.deleteText}>Supprimer</Text>
            </AnimatedTouchable>
          ) : (
            <View style={styles.protectedBadge}>
              <MaterialCommunityIcons name="lock" size={16} color="#1E3A8A" />
              <Text style={styles.protectedText}>Compte protégé</Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const handleNavigate = (screen) => {
    navigation?.navigate?.(screen);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <AdminNavbar activeScreen="ManageUsers" onNavigate={handleNavigate} />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 32,
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