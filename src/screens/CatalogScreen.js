import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { auth } from '../../firebase';
import { listenToCollection } from '../services/firestore';
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CATEGORIES = [
  { id: 'all', label: 'Afficher tout', icon: 'view-dashboard-outline' },
  { id: 'suv', label: 'SUV', icon: 'car-estate' },
  { id: 'citadine', label: 'Citadine', icon: 'car-hatchback' },
  { id: 'compacte', label: 'Compacte', icon: 'car-side' },
  { id: 'luxe', label: 'Luxe', icon: 'diamond-stone' },
  { id: 'familiale', label: 'Familiale', icon: 'van-passenger' },
  { id: 'standard', label: 'Standard', icon: 'car' },
];

const normalizeCategory = (value) => {
  if (!value) {
    return 'standard';
  }
  return String(value).trim().toLowerCase();
};

const CatalogScreen = ({ navigation }) => {
  const onLoginPress = () => navigation.navigate('Login');
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingCarId, setProcessingCarId] = useState(null);
  const { width } = useWindowDimensions();
  const isCompact = width < 768;
  const isUltraCompact = width < 420;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslate = useRef(new Animated.Value(32)).current;
  const listOpacity = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef({});
  const chipAnimations = useRef(null);

  if (!chipAnimations.current) {
    chipAnimations.current = {};
    CATEGORIES.forEach((cat) => {
      chipAnimations.current[cat.id] = new Animated.Value(cat.id === activeCategory ? 1 : 0);
    });
  }

  useEffect(() => {
    const unsubscribe = listenToCollection({
      collectionName: 'cars',
      orderByField: 'model',
      onData: (data) => {
        setCars(data);
        setLoading(false);
      },
      onError: (error) => {
        console.error('Erreur Firestore (catalogue):', error);
        setLoading(false);
      },
    });

    return unsubscribe;
  }, []);

  const catalogByCategory = useMemo(() => {
    return cars.reduce((acc, car) => {
      const key = normalizeCategory(car.category);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(car);
      return acc;
    }, {});
  }, [cars]);

  const filteredCars = useMemo(() => {
    if (activeCategory === 'all') {
      return cars;
    }
    return catalogByCategory[activeCategory] ?? [];
  }, [catalogByCategory, activeCategory, cars]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(heroTranslate, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [heroOpacity, heroTranslate]);

  useEffect(() => {
    const animations = CATEGORIES.map((cat) =>
      Animated.timing(chipAnimations.current[cat.id], {
        toValue: cat.id === activeCategory ? 1 : 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );
    Animated.parallel(animations).start();
  }, [activeCategory]);

  useEffect(() => {
    listOpacity.setValue(0);
    Animated.timing(listOpacity, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [filteredCars, listOpacity]);

  const buildChipStyle = (id, extraStyle) => {
    const value = chipAnimations.current[id];
    const animatedStyle = [
      styles.categoryChip,
      {
        transform: [
          {
            scale: value.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.03],
            }),
          },
        ],
        backgroundColor: value.interpolate({
          inputRange: [0, 1],
          outputRange: ['rgba(15,23,42,0.38)', 'rgba(59,130,246,0.12)'],
        }),
        borderColor: value.interpolate({
          inputRange: [0, 1],
          outputRange: ['rgba(148,163,184,0.35)', 'rgba(96,165,250,1)'],
        }),
        shadowOpacity: value.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.25],
        }),
        shadowRadius: value.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 12],
        }),
        shadowColor: 'rgba(96,165,250,0.8)',
        shadowOffset: { width: 0, height: 6 },
        elevation: value.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 4],
        }),
      },
    ];
    if (extraStyle) {
      animatedStyle.push(extraStyle);
    }
    return animatedStyle;
  };

  const animatedHeroStyle = {
    opacity: heroOpacity,
    transform: [{ translateY: heroTranslate }],
  };

  const getCardValue = (id) => {
    if (!cardAnimations.current[id]) {
      const value = new Animated.Value(0);
      cardAnimations.current[id] = value;
      Animated.timing(value, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
    return cardAnimations.current[id];
  };

  const handleReservePress = useCallback(
    async (car) => {
      const payload = {
        id: car.id,
        model: car.model,
        category: car.category,
        dailyPrice: car.dailyPrice,
        description: car.description,
        image: car.image,
        year: car.year,
        seats: car.seats,
        transmission: car.transmission,
        fuel: car.fuel,
      };

      setProcessingCarId(car.id);
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          navigation.navigate('Reservation', { car: payload });
          return;
        }

        const stored = await AsyncStorage.getItem('localUser');
        const session = stored ? JSON.parse(stored) : null;
        if (session?.role === 'utilisateur') {
          navigation.navigate('Reservation', { car: payload });
          return;
        }
      } catch (error) {
        console.error('Erreur contrôle session réservation:', error);
      } finally {
        setProcessingCarId(null);
      }

      navigation.navigate('Login', {
        redirectTo: 'Reservation',
        redirectParams: { car: payload },
      });
    },
    [navigation]
  );

  const renderCar = ({ item }) => {
    const cardAnim = getCardValue(item.id);

    const cardStyle = [
      styles.card,
      (isCompact || isUltraCompact) && styles.cardCompact,
      isUltraCompact && styles.cardUltraCompact,
      {
        opacity: cardAnim,
        transform: [
          {
            translateY: cardAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [24, 0],
            }),
          },
        ],
      },
    ];

    return (
      <Animated.View style={cardStyle}>
        <View style={[styles.cardHeader, (isCompact || isUltraCompact) && styles.cardHeaderCompact]}>
          <Text
            style={[styles.cardTitle, (isCompact || isUltraCompact) && styles.cardTitleCompact]}
          >
            {item.model || 'Modèle non renseigné'}
          </Text>
          <View style={[styles.tag, (isCompact || isUltraCompact) && styles.tagCompact]}>
            <Text style={[styles.tagText, (isCompact || isUltraCompact) && styles.tagTextCompact]}>
              {(item.category || 'Standard').toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={[styles.cardMeta, (isCompact || isUltraCompact) && styles.cardMetaCompact]}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="calendar" size={18} color="#1E3A8A" />
            <Text style={[styles.metaText, (isCompact || isUltraCompact) && styles.metaTextCompact]}>
              {item.year || 'Année ?'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons
              name={item.available ? 'checkbox-marked-circle-outline' : 'clock-outline'}
              size={18}
              color={item.available ? '#16A34A' : '#DC2626'}
            />
            <Text
              style={[
                styles.metaText,
                (isCompact || isUltraCompact) && styles.metaTextCompact,
                item.available ? styles.available : styles.unavailable,
              ]}
            >
              {item.available ? 'Disponible' : 'En préparation'}
            </Text>
          </View>
        </View>
        <Text
          style={[styles.cardDescription, (isCompact || isUltraCompact) && styles.cardDescriptionCompact]}
          numberOfLines={3}
        >
          {item.description || 'Ajoutez une description pour mettre en avant ce véhicule.'}
        </Text>
        <View style={[styles.cardFooter, (isCompact || isUltraCompact) && styles.cardFooterCompact]}>
          <View>
            {item.dailyPrice ? (
              <Text style={[styles.price, (isCompact || isUltraCompact) && styles.priceCompact]}>
                €{Number(item.dailyPrice).toFixed(2)} / jour
              </Text>
            ) : (
              <Text
                style={[styles.pricePlaceholder, (isCompact || isUltraCompact) && styles.pricePlaceholderCompact]}
              >
                Ajoutez un tarif journalier
              </Text>
            )}
            <TouchableOpacity
              style={[styles.loginLink, (isCompact || isUltraCompact) && styles.loginLinkCompact]}
              onPress={onLoginPress}
            >
              <Text
                style={[styles.loginLinkText, (isCompact || isUltraCompact) && styles.loginLinkTextCompact]}
              >
                Connexion agence
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.reserveButton, (isCompact || isUltraCompact) && styles.reserveButtonCompact]}
            onPress={() => handleReservePress(item)}
            disabled={processingCarId === item.id}
          >
            <Text style={[styles.reserveButtonText, (isCompact || isUltraCompact) && styles.reserveButtonTextCompact]}>
              {processingCarId === item.id ? 'Connexion...' : 'Réserver'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        (isCompact || isUltraCompact) && styles.containerCompact,
        isUltraCompact && styles.containerUltraCompact,
      ]}
    >
      <Animated.View
        style={[
          styles.hero,
          animatedHeroStyle,
          (isCompact || isUltraCompact) && styles.heroCompact,
          isUltraCompact && styles.heroUltraCompact,
        ]}
      >
        <Text
          style={[
            styles.headline,
            (isCompact || isUltraCompact) && styles.headlineCompact,
            isUltraCompact && styles.headlineUltraCompact,
          ]}
        >
          Explorez notre flotte à la demande
        </Text>
        <Text
          style={[
            styles.subtitle,
            (isCompact || isUltraCompact) && styles.subtitleCompact,
            isUltraCompact && styles.subtitleUltraCompact,
          ]}
        >
          Filtrez par catégorie pour trouver rapidement les véhicules adaptés à vos clients.
        </Text>
      </Animated.View>

      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.categories,
          (isCompact || isUltraCompact) && styles.categoriesCompact,
          isUltraCompact && styles.categoriesUltraCompact,
        ]}
        ItemSeparatorComponent={() => (
          <View style={{ width: isUltraCompact ? 8 : isCompact ? 10 : 12 }} />
        )}
        renderItem={({ item }) => {
          const isActive = item.id === activeCategory;
          const chipStyle = buildChipStyle(
            item.id,
            (isCompact || isUltraCompact) && styles.categoryChipCompact
          );
          return (
            <AnimatedPressable
              onPress={() => setActiveCategory(item.id)}
              style={chipStyle}
            >
              <View
                style={[
                  styles.categoryIconWrap,
                  (isCompact || isUltraCompact) && styles.categoryIconWrapCompact,
                  isActive && styles.categoryIconWrapActive,
                ]}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={isUltraCompact ? 14 : 16}
                  color={isActive ? '#60A5FA' : '#CBD5F5'}
                />
              </View>
              <Text
                style={[
                  styles.categoryText,
                  (isCompact || isUltraCompact) && styles.categoryTextCompact,
                  isUltraCompact && styles.categoryTextUltraCompact,
                  isActive && styles.categoryTextActive,
                ]}
              >
                {item.label}
              </Text>
            </AnimatedPressable>
          );
        }}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#60A5FA" style={styles.loader} />
      ) : filteredCars.length === 0 ? (
        <Animated.View style={[styles.emptyState, { opacity: listOpacity }]}>
          <MaterialCommunityIcons name="car-off" size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Aucun véhicule dans cette catégorie</Text>
          <Text style={styles.emptySubtitle}>
            Ajoutez des véhicules avec un champ "category" dans Firestore (suv, citadine, compacte, luxe, familiale ou standard).
          </Text>
        </Animated.View>
      ) : (
        <Animated.FlatList
          style={{ opacity: listOpacity }}
          data={filteredCars}
          keyExtractor={(item) => item.id}
          renderItem={renderCar}
          contentContainerStyle={[
            styles.list,
            (isCompact || isUltraCompact) && styles.listCompact,
            isUltraCompact && styles.listUltraCompact,
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 20,
    paddingBottom: 28,
    gap: 16,
  },
  containerCompact: {
    paddingHorizontal: 16,
    gap: 14,
  },
  containerUltraCompact: {
    paddingHorizontal: 12,
    paddingBottom: 18,
    gap: 12,
  },
  hero: {
    gap: 8,
    borderRadius: 18,
    padding: 16,
    backgroundColor: 'rgba(30,41,59,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
  },
  heroCompact: {
    padding: 14,
    borderRadius: 16,
  },
  heroUltraCompact: {
    padding: 12,
  },
  headline: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  headlineCompact: {
    fontSize: 22,
  },
  headlineUltraCompact: {
    fontSize: 20,
    lineHeight: 26,
  },
  subtitle: {
    color: '#CBD5F5',
    fontSize: 14,
    lineHeight: 20,
  },
  subtitleCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  subtitleUltraCompact: {
    fontSize: 12,
    lineHeight: 17,
  },
  categories: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  categoriesCompact: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  categoriesUltraCompact: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(15,23,42,0.38)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    overflow: 'hidden',
    height: 44,
  },
  categoryChipCompact: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    borderRadius: 22,
    height: 40,
  },
  categoryIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.45)',
    backgroundColor: 'rgba(15,23,42,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  categoryIconWrapCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  categoryIconWrapActive: {
    borderColor: 'rgba(96,165,250,0.9)',
    backgroundColor: 'rgba(37,99,235,0.18)',
  },
  categoryText: {
    color: '#E2E8F0',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
    lineHeight: 16,
    flexShrink: 0,
  },
  categoryTextCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
  categoryTextUltraCompact: {
    fontSize: 10,
    lineHeight: 13,
  },
  categoryTextActive: {
    color: '#60A5FA',
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    paddingVertical: 10,
    gap: 18,
  },
  listCompact: {
    paddingVertical: 8,
    gap: 16,
  },
  listUltraCompact: {
    paddingVertical: 6,
    gap: 14,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8,
  },
  cardCompact: {
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  cardUltraCompact: {
    borderRadius: 16,
    padding: 16,
    gap: 11,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderCompact: {
    alignItems: 'flex-start',
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  cardTitleCompact: {
    fontSize: 18,
    marginRight: 8,
  },
  tag: {
    backgroundColor: '#1E3A8A',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tagCompact: {
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tagTextCompact: {
    fontSize: 11,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  cardMetaCompact: {
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#E2E8F0',
    fontSize: 14,
  },
  metaTextCompact: {
    fontSize: 13,
  },
  available: {
    color: '#34D399',
  },
  unavailable: {
    color: '#F87171',
  },
  cardDescription: {
    color: '#CBD5F5',
    fontSize: 14,
    lineHeight: 20,
  },
  cardDescriptionCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 16,
  },
  cardFooterCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
  },
  price: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 18,
  },
  priceCompact: {
    fontSize: 17,
  },
  pricePlaceholder: {
    color: '#94A3B8',
    fontSize: 14,
  },
  pricePlaceholderCompact: {
    fontSize: 13,
  },
  loginLink: {
    marginTop: 6,
  },
  loginLinkCompact: {
    marginTop: 4,
  },
  loginLinkText: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  loginLinkTextCompact: {
    fontSize: 12,
  },
  reserveButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  reserveButtonCompact: {
    paddingVertical: 11,
    paddingHorizontal: 20,
    alignSelf: 'stretch',
  },
  reserveButtonText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 15,
    textTransform: 'uppercase',
  },
  reserveButtonTextCompact: {
    fontSize: 14,
  },
});

export default CatalogScreen;