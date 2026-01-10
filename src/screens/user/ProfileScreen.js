import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

import { auth, db } from '../../../firebase';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const ProfileScreen = ({ navigation }) => {
  const [profileName, setProfileName] = useState('Utilisateur');
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      setLoading(true);
      try {
        let displayName = 'Utilisateur';
        let userId = null;

        const currentUser = auth.currentUser;
        if (currentUser) {
          userId = currentUser.uid;
          try {
            const profileRef = doc(db, 'users', currentUser.uid);
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
              const data = profileSnap.data();
              displayName = data.name || data.username || currentUser.email || displayName;
            } else {
              displayName = currentUser.displayName || currentUser.email || displayName;
            }
          } catch (error) {
            displayName = currentUser.displayName || currentUser.email || displayName;
          }
        } else {
          const stored = await AsyncStorage.getItem('localUser');
          if (stored) {
            const local = JSON.parse(stored);
            userId = local.id || null;
            displayName = local.username || displayName;

            if (local.id) {
              try {
                const localRef = doc(db, 'utilisateurs', local.id);
                const localSnap = await getDoc(localRef);
                if (localSnap.exists()) {
                  const data = localSnap.data();
                  displayName = data.username || data.name || displayName;
                }
              } catch (error) {
                // fallback already handled
              }
            }
          }
        }

        let reservationsList = [];
        if (userId) {
          try {
            const reservationsRef = collection(db, 'reservations');
            const reservationsQuery = query(reservationsRef, where('userId', '==', userId));
            const snapshot = await getDocs(reservationsQuery);
            reservationsList = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
          } catch (error) {
            console.error('Erreur récupération réservations:', error);
          }
        }

        reservationsList.sort((a, b) => {
          const aDate = buildDate(a.pickupDate, a.pickupTime);
          const bDate = buildDate(b.pickupDate, b.pickupTime);
          return (bDate?.getTime?.() || 0) - (aDate?.getTime?.() || 0);
        });

        if (isActive) {
          setProfileName(displayName);
          setReservations(reservationsList);
        }
      } catch (error) {
        console.error('Erreur chargement profil:', error);
        if (isActive) {
          setProfileName('Utilisateur');
          setReservations([]);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isActive = false;
    };
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
    listAnim.setValue(0);
    Animated.timing(listAnim, {
      toValue: 1,
      duration: 540,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [listAnim, reservations]);

  const stats = useMemo(() => {
    if (!reservations.length) {
      return {
        total: 0,
        upcoming: 0,
        completed: 0,
        cancelled: 0,
        totalSpent: 0,
        nextReservation: null,
      };
    }

    const now = new Date();
    let upcoming = 0;
    let completed = 0;
    let cancelled = 0;
    let totalSpent = 0;
    let nextReservation = null;

    reservations.forEach((reservation) => {
      const status = (reservation.status || '').toLowerCase();
      const pickupDate = buildDate(reservation.pickupDate, reservation.pickupTime);
      totalSpent += Number(reservation.totalPrice) || 0;

      if (status.includes('ann') || status.includes('cancel')) {
        cancelled += 1;
        return;
      }

      if (pickupDate && pickupDate > now) {
        upcoming += 1;
        if (!nextReservation || pickupDate < nextReservation) {
          nextReservation = pickupDate;
        }
      } else if (status.includes('term') || status.includes('complet')) {
        completed += 1;
      }
    });

    return {
      total: reservations.length,
      upcoming,
      completed,
      cancelled,
      totalSpent,
      nextReservation,
    };
  }, [reservations]);

  const metrics = useMemo(
    () => [
      {
        label: 'Réservations',
        value: stats.total,
        icon: 'clipboard-text-outline',
        accent: '#38BDF8',
        hint: 'Toutes périodes',
      },
      {
        label: 'À venir',
        value: stats.upcoming,
        icon: 'calendar-clock',
        accent: '#34D399',
        hint: 'Confirmées',
      },
      {
        label: 'Total estimé',
        value: `€${stats.totalSpent.toFixed(2)}`,
        icon: 'cash-multiple',
        accent: '#FACC15',
        hint: 'Montant cumulé',
      },
    ],
    [stats.total, stats.upcoming, stats.totalSpent]
  );

  const upcomingReservations = useMemo(() => {
    const now = new Date();
    return reservations
      .filter((reservation) => {
        const status = (reservation.status || '').toLowerCase();
        if (status.includes('ann') || status.includes('cancel')) {
          return false;
        }
        const pickupDate = buildDate(reservation.pickupDate, reservation.pickupTime);
        return pickupDate && pickupDate >= now;
      })
      .sort((a, b) => {
        const aDate = buildDate(a.pickupDate, a.pickupTime);
        const bDate = buildDate(b.pickupDate, b.pickupTime);
        return (aDate?.getTime?.() || 0) - (bDate?.getTime?.() || 0);
      })
      .slice(0, 3);
  }, [reservations]);

  const reservationAnimatedValues = useMemo(
    () => upcomingReservations.map(() => new Animated.Value(0)),
    [upcomingReservations]
  );

  useEffect(() => {
    reservationAnimatedValues.forEach((anim, index) => {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 420,
        delay: index * 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [reservationAnimatedValues]);

  const handleBack = () => {
    if (navigation?.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation?.navigate('Home');
  };

  const handleCreateReservation = () => navigation?.navigate('Reservation');
  const handleOpenHistory = () => navigation?.navigate('ReservationHistory');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.85}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Mon espace</Text>
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
                { scale: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
              ],
            },
          ]}
        >
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Profil utilisateur</Text>
          </View>
          <Text style={styles.heroTitle}>Bonjour, {profileName}</Text>
          <Text style={styles.heroSubtitle}>
            Retrouvez vos réservations, gérez vos informations et suivez vos prochaines locations en un coup d'œil.
          </Text>
          {stats.nextReservation && (
            <View style={styles.highlightCard}>
              <MaterialCommunityIcons name="calendar-check" size={20} color="#2563EB" />
              <View style={styles.highlightInfo}>
                <Text style={styles.highlightLabel}>Prochaine prise en charge</Text>
                <Text style={styles.highlightValue}>{formatDateTime(stats.nextReservation)}</Text>
              </View>
            </View>
          )}
          <View style={styles.heroActions}>
            <AnimatedTouchable
              style={[styles.heroButton, styles.heroPrimary]}
              onPress={handleCreateReservation}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="calendar-plus" size={18} color="#0F172A" />
              <Text style={styles.heroPrimaryText}>Nouvelle réservation</Text>
            </AnimatedTouchable>
            <AnimatedTouchable
              style={[styles.heroButton, styles.heroSecondary]}
              onPress={handleOpenHistory}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="clipboard-text" size={18} color="#F8FAFC" />
              <Text style={styles.heroSecondaryText}>Consulter l'historique</Text>
            </AnimatedTouchable>
          </View>
        </Animated.View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indicateurs personnels</Text>
          <Text style={styles.sectionSubtitle}>Suivez l'activité de vos réservations.</Text>
          <View style={styles.metricsGrid}>
            {metrics.map((metric) => (
              <Animated.View
                key={metric.label}
                style={[
                  styles.metricCard,
                  {
                    opacity: listAnim,
                    transform: [
                      { translateY: listAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
                      { scale: listAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
                    ],
                  },
                ]}
              >
                <View
                  style={[styles.metricIconWrap, { borderColor: metric.accent, backgroundColor: `${metric.accent}1A` }]}
                >
                  <MaterialCommunityIcons name={metric.icon} size={22} color={metric.accent} />
                </View>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricValue}>{metric.value}</Text>
                <Text style={styles.metricHint}>{metric.hint}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Réservations à venir</Text>
              <Text style={styles.sectionSubtitle}>Vos trois prochaines étapes importantes.</Text>
            </View>
            <TouchableOpacity onPress={handleOpenHistory} activeOpacity={0.8}>
              <Text style={styles.linkText}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#1E40AF" style={styles.loader} />
          ) : upcomingReservations.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="clock-outline" size={26} color="#94A3B8" />
              <Text style={styles.emptyText}>Aucune réservation programmée pour le moment.</Text>
            </View>
          ) : (
            upcomingReservations.map((reservation, index) => {
              const anim = reservationAnimatedValues[index];
              return (
                <Animated.View
                  key={reservation.id}
                  style={[
                    styles.reservationCard,
                    anim && {
                      opacity: anim,
                      transform: [
                        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
                        { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
                      ],
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardBadge}>
                      <MaterialCommunityIcons name="car" size={16} color="#2563EB" />
                      <Text style={styles.cardBadgeText}>{reservation.vehicleModel || 'Véhicule'}</Text>
                    </View>
                    <Text style={styles.cardStatus}>{formatStatus(reservation.status)}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{reservation.firstName} {reservation.lastName}</Text>
                  <View style={styles.cardRow}>
                    <MaterialCommunityIcons name="calendar" size={16} color="#1E3A8A" />
                    <Text style={styles.cardValue}>{formatReservationDate(reservation)}</Text>
                  </View>
                  <View style={styles.cardRow}>
                    <MaterialCommunityIcons name="map-marker" size={16} color="#1E3A8A" />
                    <Text style={styles.cardValue}>{reservation.pickupLocation || 'Lieu à confirmer'}</Text>
                  </View>
                </Animated.View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const buildDate = (dateString, timeString) => {
  if (!dateString) {
    return null;
  }

  try {
    const [day, month, year] = dateString.split(/[\/\-]/).map((value) => Number(value));
    const [hour = 0, minute = 0] = (timeString || '00:00').split(':').map((value) => Number(value));
    const parsedDate = new Date(year, month - 1, day, hour, minute);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  } catch (error) {
    return null;
  }
};

const formatDateTime = (date) => {
  if (!date) {
    return 'Date à confirmer';
  }
  return date.toLocaleString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatReservationDate = (reservation) => {
  const date = buildDate(reservation.pickupDate, reservation.pickupTime);
  return formatDateTime(date);
};

const formatStatus = (status) => {
  if (!status) {
    return 'En attente';
  }
  const value = status.toString().toLowerCase();
  if (value.includes('ann') || value.includes('cancel')) {
    return 'Annulée';
  }
  if (value.includes('term') || value.includes('complet')) {
    return 'Terminée';
  }
  if (value.includes('confirm')) {
    return 'Confirmée';
  }
  return status;
};

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
    paddingBottom: 36,
  },
  hero: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#1E3A8A',
    borderRadius: 28,
    padding: 24,
    gap: 18,
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
    paddingHorizontal: 16,
    paddingVertical: 6,
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
  },
  heroSubtitle: {
    color: 'rgba(241,245,249,0.9)',
    fontSize: 15,
    lineHeight: 22,
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248,250,252,0.12)',
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  highlightInfo: {
    flex: 1,
  },
  highlightLabel: {
    color: 'rgba(248,250,252,0.75)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  highlightValue: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    gap: 8,
  },
  heroPrimary: {
    backgroundColor: '#FACC15',
  },
  heroSecondary: {
    borderWidth: 1,
    borderColor: 'rgba(248,250,252,0.35)',
  },
  heroPrimaryText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 14,
  },
  heroSecondaryText: {
    color: '#F8FAFC',
    fontWeight: '600',
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
  linkText: {
    color: '#1E40AF',
    fontWeight: '600',
    fontSize: 13,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  metricCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
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
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  metricHint: {
    color: '#64748B',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
  },
  loader: {
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
  },
  reservationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37,99,235,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  cardBadgeText: {
    color: '#1E3A8A',
    fontSize: 12,
    fontWeight: '600',
  },
  cardStatus: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  cardValue: {
    color: '#475569',
    fontSize: 13,
  },
});

export default ProfileScreen;
