import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { listenToCollection } from '../services/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const CATEGORIES = [
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

const CatalogScreen = ({ onReserve, onLoginPress }) => {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
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
    return catalogByCategory[activeCategory] ?? [];
  }, [catalogByCategory, activeCategory]);

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

  const buildChipStyle = (id) => {
    const value = chipAnimations.current[id];
    return [
      styles.categoryChip,
      {
        transform: [
          {
            scale: value.interpolate({
              inputRange: [0, 1],
              outputRange: [0.96, 1.08],
            }),
          },
        ],
        backgroundColor: value.interpolate({
          inputRange: [0, 1],
          outputRange: ['rgba(30,41,59,0.45)', '#F59E0B'],
        }),
        borderColor: value.interpolate({
          inputRange: [0, 1],
          outputRange: ['rgba(148,163,184,0.4)', 'rgba(245,158,11,0.85)'],
        }),
        shadowOpacity: value.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.35],
        }),
        shadowRadius: value.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 14],
        }),
        shadowOffset: {
          width: 0,
          height: 8,
        },
        elevation: value.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 6],
        }),
      },
    ];
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

  const renderCar = ({ item }) => {
    const cardAnim = getCardValue(item.id);

    const cardStyle = [
      styles.card,
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
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.model || 'Modèle non renseigné'}</Text>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{(item.category || 'Standard').toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="calendar" size={18} color="#1E3A8A" />
            <Text style={styles.metaText}>{item.year || 'Année ?'}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons
              name={item.available ? 'checkbox-marked-circle-outline' : 'clock-outline'}
              size={18}
              color={item.available ? '#16A34A' : '#DC2626'}
            />
            <Text style={[styles.metaText, item.available ? styles.available : styles.unavailable]}>
              {item.available ? 'Disponible' : 'En préparation'}
            </Text>
          </View>
        </View>
        <Text style={styles.cardDescription} numberOfLines={3}>
          {item.description || 'Ajoutez une description pour mettre en avant ce véhicule.'}
        </Text>
        <View style={styles.cardFooter}>
          <View>
            {item.dailyPrice ? (
              <Text style={styles.price}>€{Number(item.dailyPrice).toFixed(2)} / jour</Text>
            ) : (
              <Text style={styles.pricePlaceholder}>Ajoutez un tarif journalier</Text>
            )}
            <TouchableOpacity style={styles.loginLink} onPress={onLoginPress}>
              <Text style={styles.loginLinkText}>Connexion agence</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.reserveButton} onPress={() => onReserve?.(item)}>
            <Text style={styles.reserveButtonText}>Réserver</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.hero, animatedHeroStyle]}>
        <Text style={styles.headline}>Explorez notre flotte à la demande</Text>
        <Text style={styles.subtitle}>
          Filtrez par catégorie pour trouver rapidement les véhicules adaptés à vos clients.
        </Text>
      </Animated.View>

      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
        ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
        renderItem={({ item }) => {
          const isActive = item.id === activeCategory;
          const chipStyle = buildChipStyle(item.id);
          return (
            <AnimatedTouchable
              onPress={() => setActiveCategory(item.id)}
              style={chipStyle}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={18}
                color={isActive ? '#0F172A' : '#94A3B8'}
              />
              <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>{item.label}</Text>
            </AnimatedTouchable>
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
          contentContainerStyle={styles.list}
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
  hero: {
    gap: 8,
    borderRadius: 18,
    padding: 16,
    backgroundColor: 'rgba(30,41,59,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
  },
  headline: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subtitle: {
    color: '#CBD5F5',
    fontSize: 14,
    lineHeight: 20,
  },
  categories: {
    paddingVertical: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(30,41,59,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
  },
  categoryText: {
    color: '#CBD5F5',
    fontWeight: '600',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  categoryTextActive: {
    color: '#0F172A',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  tag: {
    backgroundColor: '#1E3A8A',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 16,
  },
  price: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 18,
  },
  pricePlaceholder: {
    color: '#94A3B8',
    fontSize: 14,
  },
  loginLink: {
    marginTop: 6,
  },
  loginLinkText: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
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
  reserveButtonText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 15,
    textTransform: 'uppercase',
  },
});

export default CatalogScreen;
