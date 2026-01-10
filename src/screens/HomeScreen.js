import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Easing,
  Modal,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createDocument, listenToCollection, removeDocument } from '../services/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import Navbar from '../components/Navbar';

const FEATURES = [
  {
    id: 'fleet',
    icon: 'car-multiple',
    title: 'Pilotage de la flotte LuxDrive',
    description: 'Suivez disponibilité, entretien et kilométrage de chaque véhicule LuxDrive en temps réel pour un service irréprochable.',
  },
  {
    id: 'pricing',
    icon: 'cash-multiple',
    title: 'Tarification maîtrisée',
    description: 'Ajustez les tarifs selon saison, durée ou offres exclusives pour offrir le meilleur à la communauté LuxDrive.',
  },
  {
    id: 'crm',
    icon: 'account-check',
    title: 'Suivi client LuxDrive',
    description: 'Centralisez l\'historique des réservations et automatisez les rappels pour accompagner chaque conducteur LuxDrive sereinement.',
  },
];

const AGENCY_SERVICES = [
  {
    id: 'branding',
    icon: 'cellphone-cog',
    title: 'Identité LuxDrive affirmée',
    description: 'Interface intégralement aux couleurs LuxDrive et parcours pensés pour notre équipe dédiée.',
  },
  {
    id: 'support',
    icon: 'headset',
    title: 'Assistance 7j/7',
    description: 'Support client continu, notifications proactives et guides pour garantir des retraits sans stress.',
  },
  {
    id: 'analytics',
    icon: 'chart-box',
    title: 'Décisions pilotées par LuxDrive',
    description: 'Rapports clairs, prévisions de disponibilité et KPI dédiés à la performance de LuxDrive.',
  },
];

const RESERVATION_STEPS = [
  {
    id: 'search',
    badge: '1',
    title: 'Recherche intuitive',
    description: 'Parcourez la flotte LuxDrive par durée, catégorie ou options premium en quelques secondes.',
  },
  {
    id: 'selection',
    badge: '2',
    title: 'Sélection & confort',
    description: 'Choisissez votre véhicule et ajoutez assurances ou équipements LuxDrive selon vos besoins.',
  },
  {
    id: 'payment',
    badge: '3',
    title: 'Confirmation sécurisée',
    description: 'Recevez immédiatement votre contrat digital LuxDrive et vos instructions de retrait sécurisées.',
  },
];

const HomeScreen = ({ navigation }) => {
  const onCatalogPress = () => navigation.navigate('Catalog');
  const onLoginPress = () => navigation.navigate('Login');
  const [text, setText] = useState('');
  const [items, setItems] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [savingNote, setSavingNote] = useState(false);
  const [cars, setCars] = useState([]);
  const [loadingCars, setLoadingCars] = useState(true);
  const [showUserActions, setShowUserActions] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const handleMenuPress = () => setMenuVisible(true);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const carsAnim = useRef(new Animated.Value(0)).current;
  const featuresAnim = useRef(new Animated.Value(0)).current;
  const servicesAnim = useRef(new Animated.Value(0)).current;
  const stepsAnim = useRef(new Animated.Value(0)).current;
  const notesAnim = useRef(new Animated.Value(0)).current;

  const closeMenu = () => setMenuVisible(false);

  const handleNavigate = (routeName) => {
    closeMenu();
    navigation.navigate(routeName);
  };

  const handleLogout = async () => {
    closeMenu();
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }

    try {
      await AsyncStorage.removeItem('localUser');
    } catch (storageError) {
      console.error('Erreur nettoyage session locale:', storageError);
    }

    setShowUserActions(false);
    Alert.alert('Déconnexion', 'Vous êtes déconnecté.');
  };

  const menuItems = showUserActions
    ? [
        { label: 'Mon profil', icon: 'account-circle', action: () => handleNavigate('Profile') },
        {
          label: 'Mes réservations',
          icon: 'clipboard-text-clock',
          action: () => handleNavigate('ReservationHistory'),
        },
        { label: 'Catalogue', icon: 'car-info', action: () => handleNavigate('Catalog') },
        { label: 'Se déconnecter', icon: 'logout', action: handleLogout, danger: true },
      ]
    : [
        { label: 'Se connecter', icon: 'login', action: () => handleNavigate('Login') },
        { label: 'Créer un compte', icon: 'account-plus', action: () => handleNavigate('Register') },
        { label: 'Catalogue', icon: 'car-info', action: () => handleNavigate('Catalog') },
      ];

  useEffect(() => {
    Animated.sequence([
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(carsAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(featuresAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(servicesAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(stepsAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(notesAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [heroAnim, carsAnim, featuresAnim, servicesAnim, stepsAnim, notesAnim]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // try local session
        try {
          const raw = await AsyncStorage.getItem('localUser');
          if (raw) {
            const parsed = JSON.parse(raw);
            setShowUserActions(parsed.role === 'utilisateur');
            return;
          }
        } catch (e) {}

        setShowUserActions(false);
        return;
      }

      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        const role = snap.exists() ? snap.data().role : null;
        // Show actions only for regular users (no admin/staff)
        if (role && (role === 'admin' || role === 'staff')) {
          setShowUserActions(false);
        } else {
          setShowUserActions(true);
        }
      } catch (e) {
        setShowUserActions(true);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubscribe = listenToCollection({
      collectionName: 'items',
      orderByField: 'createdAt',
      orderDirection: 'desc',
      onData: (data) => {
        setItems(data);
        setLoadingNotes(false);
      },
      onError: (error) => {
        console.error('Erreur Firestore (items):', error);
        setLoadingNotes(false);
      },
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = listenToCollection({
      collectionName: 'cars',
      orderByField: 'model',
      onData: (data) => {
        setCars(data.slice(0, 6));
        setLoadingCars(false);
      },
      onError: (error) => {
        console.error('Erreur Firestore (cars):', error);
        setLoadingCars(false);
      },
    });

    return unsubscribe;
  }, []);

  const addItem = async () => {
    if (!text.trim() || savingNote) {
      return;
    }

    setSavingNote(true);
    try {
      await createDocument('items', {
        text: text.trim(),
        createdAt: new Date().toISOString(),
      });
      setText('');
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
    } finally {
      setSavingNote(false);
    }
  };

  const deleteItem = async (id) => {
    try {
      await removeDocument('items', id);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const fadeUp = (value) => ({
    opacity: value,
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [24, 0],
        }),
      },
    ],
  });

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Navbar
        title="Accueil"
        onMenuPress={handleMenuPress}
        onCatalogPress={onCatalogPress}
        onLoginPress={onLoginPress}
        onLogoutPress={handleLogout}
        isAuthenticated={showUserActions}
        showBack={false}
        navigation={navigation}
      />
      <Modal
        animationType="fade"
        transparent
        visible={menuVisible}
        onRequestClose={closeMenu}
      >
        <View style={styles.menuOverlay}>
          <Pressable style={styles.menuBackdrop} onPress={closeMenu} />
          <View style={styles.menuSheet}>
            <Text style={styles.menuTitle}>
              {showUserActions ? 'Espace client' : 'Navigation'}
            </Text>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, item.danger && styles.menuItemDanger]}
                onPress={item.action}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={22}
                  color={item.danger ? '#DC2626' : '#1E40AF'}
                />
                <Text
                  style={[styles.menuItemText, item.danger && styles.menuItemTextDanger]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
      <Animated.View style={[styles.hero, fadeUp(heroAnim)]}>
        <View style={styles.heroHeader}>
          <Text style={styles.heroBadge}>LUXDRIVE PREMIUM</Text>
          <Text style={styles.heroTitle}>LuxDrive</Text>
        </View>
        <Text style={styles.heroSubtitle}>
          LuxDrive simplifie la découverte, la réservation et la récupération de votre véhicule premium,
          tout en pilotant une flotte maîtrisée depuis un tableau de bord moderne.
        </Text>
        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.heroPrimary} onPress={onCatalogPress}>
            <Text style={styles.heroPrimaryText}>Voir le catalogue</Text>
          </TouchableOpacity>
          {!showUserActions && (
            <TouchableOpacity style={styles.heroSecondary} onPress={onLoginPress}>
              <Text style={styles.heroSecondaryText}>Se connecter</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      <Animated.View style={[styles.section, styles.catalogSection, fadeUp(carsAnim)]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Nos véhicules phares</Text>
            <Text style={styles.sectionDescription}>
              Un aperçu de la flotte LuxDrive. Enrichissez les visuels et tarifs depuis le back-office pour refléter notre offre premium.
            </Text>
          </View>
        </View>
        {loadingCars ? (
          <ActivityIndicator size="small" color="#1E3A8A" style={styles.inlineLoader} />
        ) : cars.length === 0 ? (
          <Text style={styles.emptyText}>Ajoutez vos premiers véhicules pour alimenter le catalogue.</Text>
        ) : (
          <FlatList
            data={cars}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
            renderItem={({ item }) => (
              <View style={styles.vehicleCard}>
                <View style={styles.vehicleHeader}>
                  <Text style={styles.vehicleModel}>{item.model || 'Modèle inconnu'}</Text>
                  <Text style={[styles.vehicleStatus, item.available ? styles.available : styles.unavailable]}>
                    {item.available ? 'Disponible' : 'Indisponible'}
                  </Text>
                </View>
                <Text style={styles.vehicleDetails}>
                  {item.year ? `Année ${item.year}` : 'Année non renseignée'}
                </Text>
                {item.dailyPrice ? (
                  <Text style={styles.vehiclePrice}>€{Number(item.dailyPrice).toFixed(2)} / jour</Text>
                ) : (
                  <Text style={styles.vehiclePriceMuted}>Ajoutez un tarif journalier</Text>
                )}
              </View>
            )}
          />
        )}
      </Animated.View>

      <Animated.View style={[styles.section, fadeUp(featuresAnim)]}>
        <Text style={styles.sectionTitle}>Fonctionnalités clés</Text>
        <View style={styles.cardsWrapper}>
          {FEATURES.map((feature) => (
            <View key={feature.id} style={styles.card}>
              <MaterialCommunityIcons
                name={feature.icon}
                size={32}
                color="#1E3A8A"
                style={styles.cardIcon}
              />
              <Text style={styles.cardTitle}>{feature.title}</Text>
              <Text style={styles.cardDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View style={[styles.section, fadeUp(servicesAnim)]}>
        <Text style={styles.sectionTitle}>Services LuxDrive</Text>
        <View style={styles.cardsWrapper}>
          {AGENCY_SERVICES.map((service) => (
            <View key={service.id} style={[styles.card, styles.serviceCard]}>
              <MaterialCommunityIcons
                name={service.icon}
                size={30}
                color="#0F172A"
                style={styles.cardIcon}
              />
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.cardDescription}>{service.description}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View style={[styles.section, fadeUp(stepsAnim)]}>
        <Text style={styles.sectionTitle}>Méthode de réservation</Text>
        <View style={styles.stepsWrapper}>
          {RESERVATION_STEPS.map((step) => (
            <View key={step.id} style={styles.step}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{step.badge}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </Animated.View>

      
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: '#0F172A',
    gap: 28,
  },
  hero: {
    backgroundColor: '#1E3A8A',
    borderRadius: 24,
    padding: 24,
    gap: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8,
  },
  heroHeader: {
    gap: 6,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: 'rgba(241,245,249,0.85)',
    fontSize: 15,
    lineHeight: 22,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  heroPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FACC15',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  heroPrimaryText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  heroSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(248,250,252,0.4)',
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  heroSecondaryText: {
    color: '#F8FAFC',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  menuSheet: {
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingVertical: 22,
    alignSelf: 'stretch',
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 12,
    zIndex: 2,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(148,163,184,0.16)',
    marginBottom: 10,
  },
  menuItemDanger: {
    backgroundColor: 'rgba(248,113,113,0.16)',
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  menuItemTextDanger: {
    color: '#DC2626',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 22,
    gap: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  catalogSection: {
    gap: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionDescription: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 4,
  },
  cardsWrapper: {
    gap: 14,
  },
  card: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  serviceCard: {
    backgroundColor: '#E0F2FE',
  },
  cardIcon: {
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  serviceTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardDescription: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
  },
  stepsWrapper: {
    gap: 12,
  },
  step: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: '#fff',
    fontWeight: '700',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  stepDescription: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  link: {
    color: '#1E3A8A',
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  vehicleCard: {
    width: 220,
    borderRadius: 18,
    backgroundColor: '#111827',
    padding: 18,
    gap: 12,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  vehicleModel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    flexShrink: 1,
  },
  vehicleStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '600',
  },
  available: {
    backgroundColor: 'rgba(74,222,128,0.15)',
    color: '#4ADE80',
  },
  unavailable: {
    backgroundColor: 'rgba(248,113,113,0.15)',
    color: '#F87171',
  },
  vehicleDetails: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  vehiclePrice: {
    color: '#FBBF24',
    fontWeight: '700',
    fontSize: 16,
  },
  vehiclePriceMuted: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5F5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  itemText: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
  },
  itemDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  deleteButton: {
    borderRadius: 999,
    backgroundColor: '#DC2626',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  inlineLoader: {
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 12,
  },
});

export default HomeScreen;
