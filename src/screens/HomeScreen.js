import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Easing,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createDocument, listenToCollection, removeDocument } from '../services/firestore';

const FEATURES = [
  {
    id: 'fleet',
    icon: 'car-multiple',
    title: 'Gestion complète de la flotte',
    description: 'Visualisez disponibilité, entretien et kilométrage de chaque véhicule en temps réel.',
  },
  {
    id: 'pricing',
    icon: 'cash-multiple',
    title: 'Tarification dynamique',
    description: 'Adaptez vos prix selon la saison, la durée ou des campagnes promotionnelles ciblées.',
  },
  {
    id: 'crm',
    icon: 'account-check',
    title: 'Suivi client intégré',
    description: 'Gardez l\'historique complet des réservations et automatisez les rappels de documents.',
  },
];

const AGENCY_SERVICES = [
  {
    id: 'branding',
    icon: 'cellphone-cog',
    title: 'Application à vos couleurs',
    description: 'Branding, écrans dédiés agences et parcours personnalisés pour vos équipes terrain.',
  },
  {
    id: 'support',
    icon: 'headset',
    title: 'Support 7j/7',
    description: 'Assistance client, notifications automatiques et centre d\'aide intégré pour vos conducteurs.',
  },
  {
    id: 'analytics',
    icon: 'chart-box',
    title: 'Pilotage data-driven',
    description: 'Rapports chiffrés, prévisions de disponibilité et suivi des KPI de vos agences locales.',
  },
];

const RESERVATION_STEPS = [
  {
    id: 'search',
    badge: '1',
    title: 'Recherche intuitive',
    description: 'Filtrez par ville, période, catégorie de véhicule ou options premium en quelques secondes.',
  },
  {
    id: 'selection',
    badge: '2',
    title: 'Sélection & extras',
    description: 'Proposez des fiches détaillées, assurances et équipements complémentaires clairement.',
  },
  {
    id: 'payment',
    badge: '3',
    title: 'Confirmation sécurisée',
    description: 'Paiement chiffré, contrats générés automatiquement et notifications en temps réel.',
  },
];

const HomeScreen = ({ onCatalogPress, onLoginPress }) => {
  const [text, setText] = useState('');
  const [items, setItems] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [savingNote, setSavingNote] = useState(false);
  const [cars, setCars] = useState([]);
  const [loadingCars, setLoadingCars] = useState(true);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const carsAnim = useRef(new Animated.Value(0)).current;
  const featuresAnim = useRef(new Animated.Value(0)).current;
  const servicesAnim = useRef(new Animated.Value(0)).current;
  const stepsAnim = useRef(new Animated.Value(0)).current;
  const notesAnim = useRef(new Animated.Value(0)).current;

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
    <Animated.ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.hero, fadeUp(heroAnim)]}>
        <View style={styles.heroHeader}>
          <Text style={styles.heroBadge}>LOCATION PREMIUM</Text>
          <Text style={styles.heroTitle}>LuxDrive </Text>
        </View>
        <Text style={styles.heroSubtitle}>
          Offrez à vos clients une expérience fluide pour découvrir, réserver et récupérer leurs véhicules,
          tout en pilotant votre flotte depuis un tableau de bord moderne.
        </Text>
        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.heroPrimary} onPress={onCatalogPress}>
            <Text style={styles.heroPrimaryText}>Voir le catalogue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroSecondary} onPress={onLoginPress}>
            <Text style={styles.heroSecondaryText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View style={[styles.section, styles.catalogSection, fadeUp(carsAnim)]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Nos véhicules phares</Text>
            <Text style={styles.sectionDescription}>
              Un aperçu des modèles disponibles dans votre catalogue. Ajoutez des images et des prix depuis le back-office.
            </Text>
          </View>
          <TouchableOpacity onPress={onCatalogPress}>
            <Text style={styles.link}>Tout afficher</Text>
          </TouchableOpacity>
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
        <Text style={styles.sectionTitle}>Services pour votre agence</Text>
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

      <Animated.View style={[styles.section, fadeUp(notesAnim)]}>
        <Text style={styles.sectionTitle}>Bloc note (démo)</Text>
        <Text style={styles.sectionDescription}>
          Gardez les idées clés de votre lancement produit. Les entrées sont enregistrées dans Firestore en direct.
        </Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Référence, action marketing, todo..."
            value={text}
            onChangeText={setText}
          />
          <Button title={savingNote ? '...' : 'Ajouter'} onPress={addItem} />
        </View>
        {loadingNotes ? (
          <ActivityIndicator size="small" color="#1E3A8A" style={styles.inlineLoader} />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemText}>{item.text}</Text>
                  {item.createdAt && (
                    <Text style={styles.itemDate}>
                      {new Date(item.createdAt).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  )}
                </View>
                <TouchableOpacity style={styles.deleteButton} onPress={() => deleteItem(item.id)}>
                  <Text style={styles.deleteButtonText}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            )}
            scrollEnabled={false}
            ListEmptyComponent={<Text style={styles.emptyText}>Aucun élément pour le moment.</Text>}
          />
        )}
      </Animated.View>
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
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
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.9)',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  heroPrimary: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
  heroPrimaryText: {
    color: '#1E293B',
    fontWeight: '700',
    fontSize: 15,
  },
  heroSecondary: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  heroSecondaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
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
