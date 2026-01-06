import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';

import { createDocument, listenToCollection, removeDocument } from '../src/services/firestore';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const ManageUsers = ({ navigation }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('staff');
  const [adding, setAdding] = useState(false);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef({}).current;

  useEffect(() => {
    const unsubscribe = listenToCollection({
      collectionName: 'employees',
      orderByField: 'createdAt',
      orderDirection: 'desc',
      onData: (docs) => {
        setEmployees(docs);
        setLoading(false);
      },
      onError: (error) => {
        console.error('Erreur récupération employés:', error);
        Alert.alert('Erreur', "Impossible de charger les collaborateurs.");
        setLoading(false);
      },
    });

    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    Animated.timing(heroAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [heroAnim]);

  const metrics = useMemo(() => {
    const total = employees.length;
    const admins = employees.filter((employee) => employee.role === 'admin').length;
    const actives = employees.filter((employee) => (employee.status || 'Active') === 'Active').length;

    return [
      { label: 'Collaborateurs', value: total, icon: 'account-group', accent: '#38BDF8' },
      { label: 'Administrateurs', value: admins, icon: 'shield-account', accent: '#22D3EE' },
      { label: 'Actifs', value: actives, icon: 'badge-account', accent: '#FACC15' },
    ];
  }, [employees]);

  const metricAnimations = useMemo(
    () => metrics.map(() => new Animated.Value(0)),
    [metrics]
  );

  useEffect(() => {
    metricAnimations.forEach((anim, index) => {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 520,
        delay: index * 90,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [metricAnimations]);

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

  const dismissModal = () => {
    setModalVisible(false);
    setNewUsername('');
    setNewPassword('');
    setNewRole('staff');
  };

  const handleGoBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    navigation?.navigate?.('AdminDashboard');
  };

  const handleAddEmployee = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      Alert.alert('Erreur', "Veuillez renseigner le nom d'utilisateur et le mot de passe.");
      return;
    }

    setAdding(true);
    try {
      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        newPassword.trim()
      );

      await createDocument('employees', {
        username: newUsername.trim(),
        password: hashedPassword,
        role: newRole,
        createdAt: new Date().toISOString(),
        status: 'Active',
      });

      Alert.alert('Succès', 'Employé ajouté avec succès.');
      dismissModal();
    } catch (error) {
      console.error('Erreur ajout employé:', error);
      Alert.alert('Erreur', "Impossible d'ajouter cet employé.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (employee) => {
    try {
      if (employee.username === 'admin') {
        Alert.alert('Action refusée', 'Impossible de supprimer le compte administrateur principal.');
        return;
      }

      await removeDocument('employees', employee.id);
      Alert.alert('Supprimé', `L'employé ${employee.username} a été supprimé.`);
    } catch (error) {
      console.error('Erreur suppression employé:', error);
      Alert.alert('Erreur', "Impossible d'exécuter cette action.");
    }
  };

  const getCardAnimation = (id, index) => {
    if (!cardAnimations[id]) {
      cardAnimations[id] = new Animated.Value(0);
      Animated.timing(cardAnimations[id], {
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
    if (!value) {
      return 'Profil récent';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Profil récent';
    }

    return `Depuis le ${date.toLocaleDateString('fr-FR')}`;
  };

  const initialsFrom = (name = '') => {
    if (!name) {
      return '??';
    }

    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase?.() || '')
      .join('')
      .padEnd(2, '');
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

  const renderEmployee = (employee, index) => {
    const anim = getCardAnimation(employee.id || index, index);
    const visuals = roleVisuals[employee.role] || roleVisuals.staff;

    return (
      <Animated.View
        key={employee.id || index}
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
            <Text style={styles.avatarText}>{initialsFrom(employee.username)}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username}>{employee.username}</Text>
            <Text style={styles.userMeta}>{formatCreatedAt(employee.createdAt)}</Text>
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
              <Text style={styles.badgeText}>{employee.status || 'Active'}</Text>
            </View>
          </View>

          {employee.username !== 'admin' ? (
            <AnimatedTouchable
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDelete(employee)}
              activeOpacity={0.85}
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

  const handleNavigateDashboard = () => {
    navigation?.navigate?.('AdminDashboard');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.85}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Gestion des accès</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: heroAnim,
              transform: [
                { translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }) },
                { scale: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
              ],
            },
          ]}
        >
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Equipe interne</Text>
          </View>
          <Text style={styles.heroTitle}>Accès collaborateurs</Text>
          <Text style={styles.heroSubtitle}>
            Centralisez les rôles, sécurisez les connexions et gardez votre équipe à jour.
          </Text>
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={[styles.heroPrimary, styles.heroPill]}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="account-plus" size={18} color="#0F172A" />
              <Text style={styles.heroPrimaryText}>Ajouter un membre</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.heroSecondary, styles.heroPill]}
              onPress={handleNavigateDashboard}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="view-dashboard" size={18} color="#F8FAFC" />
              <Text style={styles.heroSecondaryText}>Retour au dashboard</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indicateurs</Text>
          <Text style={styles.sectionSubtitle}>Suivi automatique basé sur vos employés.</Text>
          <View style={styles.metricsGrid}>
            {metrics.map((metric, index) => {
              const anim = metricAnimations[index];
              return (
                <Animated.View
                  key={metric.label}
                  style={[
                    styles.metricCard,
                    {
                      opacity: anim,
                      transform: [
                        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
                        { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
                      ],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.metricIconWrap,
                      { borderColor: metric.accent, backgroundColor: `${metric.accent}1A` },
                    ]}
                  >
                    <MaterialCommunityIcons name={metric.icon} size={22} color={metric.accent} />
                  </View>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                  <Text style={styles.metricValue}>{metric.value}</Text>
                  <Text style={styles.metricHint}>Mise à jour continue</Text>
                </Animated.View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Collaborateurs</Text>
              <Text style={styles.sectionSubtitle}>Gérez les profils et leurs statuts d'accès.</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.88}
            >
              <MaterialCommunityIcons name="plus" size={18} color="#0F172A" />
              <Text style={styles.addButtonText}>Nouvel accès</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#1E3A8A" style={styles.loader} />
          ) : employees.length === 0 ? (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="account-alert" size={28} color="#94A3B8" />
              <Text style={styles.emptyText}>Aucun employé enregistré pour le moment.</Text>
            </View>
          ) : (
            <Animated.View
              style={[
                styles.userList,
                {
                  opacity: listAnim,
                  transform: [
                    { translateY: listAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
                  ],
                },
              ]}
            >
              {employees.map((employee, index) => renderEmployee(employee, index))}
            </Animated.View>
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={dismissModal}
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
              <Text style={styles.roleLabel}>Rôle</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[styles.roleSelect, styles.roleSelectLeft, newRole === 'staff' && styles.roleActive]}
                  onPress={() => setNewRole('staff')}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.roleText, newRole === 'staff' && styles.roleTextActive]}>Staff</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleSelect, newRole === 'admin' && styles.roleActive]}
                  onPress={() => setNewRole('admin')}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.roleText, newRole === 'admin' && styles.roleTextActive]}>Admin</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={dismissModal}
                activeOpacity={0.85}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleAddEmployee}
                disabled={adding}
                activeOpacity={0.85}
              >
                {adding ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Ajouter</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default ManageUsers;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topBar: {
    marginTop: 8,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248,250,252,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248,250,252,0.18)',
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  topBarSpacer: {
    width: 40,
  },
  scroll: {
    paddingBottom: 40,
  },
  hero: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#1E3A8A',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(148,197,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
  },
  heroBadgeText: {
    color: '#E0F2FE',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#F8FAFC',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: 'rgba(241,245,249,0.85)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  heroPill: {
    marginRight: 12,
    marginBottom: 12,
  },
  heroPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FACC15',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  heroPrimaryText: {
    fontWeight: '700',
    color: '#0F172A',
    fontSize: 14,
    marginLeft: 8,
  },
  heroSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(248,250,252,0.4)',
  },
  heroSecondaryText: {
    fontWeight: '600',
    color: '#F8FAFC',
    fontSize: 14,
    marginLeft: 8,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtitle: {
    color: '#475569',
    fontSize: 13,
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  metricIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 8,
  },
  metricLabel: {
    color: '#1E293B',
    fontWeight: '600',
    fontSize: 14,
  },
  metricValue: {
    color: '#0F172A',
    fontSize: 26,
    fontWeight: '800',
  },
  metricHint: {
    color: '#64748B',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FACC15',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
  },
  addButtonText: {
    marginLeft: 3,
    color: '#0F172A',
    fontWeight: '500',
    fontSize: 8,
  },
  loader: {
    marginTop: 12,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 13,
  },
  userList: {
    marginTop: 4,
  },
  userItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(30,64,175,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#1E40AF',
    fontWeight: '700',
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
  },
  userMeta: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  userFooter: {
    marginTop: 8,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  userBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(148,163,184,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 10,
    marginBottom: 8,
  },
  badgeText: {
    marginLeft: 6,
    color: '#1E3A8A',
    fontWeight: '600',
    fontSize: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(220,38,38,0.12)',
    alignSelf: 'stretch',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.18)',
    marginTop: 4,
  },
  deleteText: {
    marginLeft: 6,
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
  protectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(148,163,184,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'stretch',
    justifyContent: 'center',
    marginTop: 4,
  },
  protectedText: {
    marginLeft: 6,
    color: '#1E3A8A',
    fontWeight: '600',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 12,
  },
  roleContainer: {
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  roleButtons: {
    flexDirection: 'row',
  },
  roleSelect: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.4)',
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  roleSelectLeft: {
    marginRight: 12,
  },
  roleActive: {
    borderColor: '#2563EB',
    backgroundColor: 'rgba(59,130,246,0.08)',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  roleTextActive: {
    color: '#1D4ED8',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#0F172A',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#2563EB',
  },
  submitButtonText: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
});
