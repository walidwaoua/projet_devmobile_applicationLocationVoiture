import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { listenToCollection } from '../src/services/firestore';

const METRIC_META = [
  { key: 'cars', label: 'Véhicules', icon: 'car-multiple', accent: '#60A5FA' },
  { key: 'rentals', label: 'Locations', icon: 'clipboard-list', accent: '#A855F7' },
  { key: 'pending', label: 'En attente', icon: 'progress-clock', accent: '#FACC15' },
  { key: 'users', label: 'Collaborateurs', icon: 'account-group', accent: '#34D399' },
];

const ACTION_META = [
  {
    id: 'cars',
    title: 'Gestion de la flotte',
    subtitle: 'Ajoutez, éditez ou archivez vos véhicules en un clic.',
    icon: 'car-wrench',
    accent: '#60A5FA',
    screen: 'ManageCars',
  },
  {
    id: 'rentals',
    title: 'Suivi des locations',
    subtitle: 'Validez les demandes et clôturez les contrats en cours.',
    icon: 'calendar-check',
    accent: '#A855F7',
    screen: 'ManageRentals',
  },
  {
    id: 'users',
    title: 'Accès collaborateurs',
    subtitle: 'Attribuez les rôles et sécurisez les accès à la plateforme.',
    icon: 'account-cog',
    accent: '#34D399',
    screen: 'ManageUsers',
  },
  {
    id: 'reports',
    title: 'Rapports & KPI',
    subtitle: 'Analysez vos performances et anticipez les besoins.',
    icon: 'chart-box',
    accent: '#F97316',
    screen: 'Reports',
  },
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const AdminDashboard = ({ navigation }) => {

  const [metrics, setMetrics] = useState({ cars: 0, rentals: 0, pending: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const metricAnimations = useRef(Array(METRIC_META.length).fill(null).map(() => new Animated.Value(0))).current;
  const actionAnimations = useRef(Array(ACTION_META.length).fill(null).map(() => new Animated.Value(0))).current;

  useEffect(() => {
    let completed = 0;

    const stopCars = listenToCollection({
      collectionName: 'cars',
      onData: (data) => {
        setMetrics((prev) => ({ ...prev, cars: data.length }));
        completed += 1;
        setLoading(completed < 3);
      },
      onError: (error) => {
        console.error('Erreur métriques voitures:', error);
        completed += 1;
        setLoading(completed < 3);
      },
    });

    const stopRentals = listenToCollection({
      collectionName: 'rentals',
      onData: (data) => {
        setMetrics((prev) => ({
          ...prev,
          rentals: data.length,
          pending: data.filter((item) => item.status === 'Pending').length,
        }));
        completed += 1;
        setLoading(completed < 3);
      },
      onError: (error) => {
        console.error('Erreur métriques locations:', error);
        completed += 1;
        setLoading(completed < 3);
      },
    });

    const stopUsers = listenToCollection({
      collectionName: 'users',
      onData: (data) => {
        setMetrics((prev) => ({ ...prev, users: data.length }));
        completed += 1;
        setLoading(completed < 3);
      },
      onError: (error) => {
        console.error('Erreur métriques utilisateurs:', error);
        completed += 1;
        setLoading(completed < 3);
      },
    });

    return () => {
      stopCars?.();
      stopRentals?.();
      stopUsers?.();
    };
  }, []);

  useEffect(() => {
    heroAnim.setValue(0);
    metricAnimations.forEach((anim) => anim.setValue(0));
    actionAnimations.forEach((anim) => anim.setValue(0));

    const hero = Animated.timing(heroAnim, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    const metricSequence = METRIC_META.map((_, index) =>
      Animated.timing(metricAnimations[index], {
        toValue: 1,
        duration: 460,
        delay: index * 90,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );

    const actionSequence = ACTION_META.map((_, index) =>
      Animated.timing(actionAnimations[index], {
        toValue: 1,
        duration: 460,
        delay: index * 110,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );

    hero.start(() => {
      Animated.stagger(90, metricSequence).start(() => {
        Animated.stagger(110, actionSequence).start();
      });
    });
  }, [heroAnim, metricAnimations, actionAnimations]);

  const heroStyle = {
    opacity: heroAnim,
    transform: [
      {
        translateY: heroAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-20, 0],
        }),
      },
      {
        scale: heroAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.98, 1],
        }),
      },
    ],
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.hero, heroStyle]}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Pilotage agence</Text>
          </View>
          <Text style={styles.heroTitle}>Suivi en temps réel</Text>
          <Text style={styles.heroSubtitle}>
            Visualisez l’état de votre flotte, vos réservations et votre équipe en un coup d’œil.
          </Text>
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.heroPrimary}
              onPress={() => navigation.navigate('ManageCars')}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="car-cog" size={18} color="#0F172A" />
              <Text style={styles.heroPrimaryText}>Gérer les véhicules</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.heroSecondary}
              onPress={() => navigation.navigate('Reports')}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="chart-line" size={18} color="#F8FAFC" />
              <Text style={styles.heroSecondaryText}>Voir les rapports</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indicateurs clés</Text>
          <Text style={styles.sectionSubtitle}>Données synchronisées automatiquement avec Firestore.</Text>
          <View style={styles.metricsGrid}>
            {METRIC_META.map((meta, index) => {
              const anim = metricAnimations[index];
              const animatedStyle = {
                opacity: anim,
                transform: [
                  {
                    translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }),
                  },
                  {
                    scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }),
                  },
                ],
              };

              const value = metrics[meta.key] ?? 0;

              return (
                <Animated.View key={meta.key} style={[styles.metricCard, animatedStyle]}>
                  <View style={[styles.metricIconWrap, { borderColor: meta.accent, backgroundColor: `${meta.accent}1A` }]}>
                    <MaterialCommunityIcons name={meta.icon} size={22} color={meta.accent} />
                  </View>
                  <Text style={styles.metricLabel}>{meta.label}</Text>
                  <Text style={styles.metricValue}>{value}</Text>
                  <Text style={styles.metricHint}>Mise à jour automatique</Text>
                </Animated.View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <Text style={styles.sectionSubtitle}>Accédez directement aux modules de gestion.</Text>

          {loading ? (
            <ActivityIndicator size="small" color="#1E3A8A" style={styles.loader} />
          ) : (
            ACTION_META.map((action, index) => {
              const anim = actionAnimations[index];
              const animatedStyle = {
                opacity: anim,
                transform: [
                  {
                    translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
                  },
                ],
              };

              return (
                <AnimatedTouchable
                  key={action.id}
                  style={[styles.actionCard, animatedStyle]}
                  onPress={() => navigation.navigate(action.screen)}
                  activeOpacity={0.88}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: `${action.accent}1A` }]}> 
                    <MaterialCommunityIcons name={action.icon} size={22} color={action.accent} />
                  </View>
                  <View style={styles.actionCopy}>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={28} color="#1E293B" />
                </AnimatedTouchable>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scroll: {
    paddingBottom: 36,
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
    gap: 12,
  },
  heroPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FACC15',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  heroPrimaryText: {
    fontWeight: '700',
    color: '#0F172A',
    fontSize: 14,
  },
  heroSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtitle: {
    color: '#475569',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 18,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    gap: 10,
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
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCopy: {
    flex: 1,
    gap: 4,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  loader: {
    marginTop: 12,
  },
});

export default AdminDashboard;