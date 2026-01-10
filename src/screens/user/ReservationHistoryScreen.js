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
import { collection, getDocs, query, where } from 'firebase/firestore';

import { auth, db } from '../../../firebase';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const ReservationHistoryScreen = ({ navigation }) => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isActive = true;

    const loadHistory = async () => {
      setLoading(true);
      try {
        const stored = await AsyncStorage.getItem('localUser');
        const local = stored ? JSON.parse(stored) : null;
        const userId = auth.currentUser?.uid || local?.id || null;

        const baseQuery = userId
          ? query(collection(db, 'reservations'), where('userId', '==', userId))
          : collection(db, 'reservations');

        const snapshot = await getDocs(baseQuery);
        const records = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

        records.sort((a, b) => {
          const aDate = buildDate(a.pickupDate, a.pickupTime);
          const bDate = buildDate(b.pickupDate, b.pickupTime);
          return (bDate?.getTime?.() || 0) - (aDate?.getTime?.() || 0);
        });

        if (isActive) {
          setReservations(records);
        }
      } catch (error) {
        console.error('Erreur chargement historique:', error);
        if (isActive) {
          setReservations([]);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadHistory();

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

  const reservationAnimatedValues = useMemo(
    () => reservations.map(() => new Animated.Value(0)),
    [reservations]
  );

  useEffect(() => {
    listAnim.setValue(0);
    Animated.timing(listAnim, {
      toValue: 1,
      duration: 520,
      delay: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [listAnim, reservations]);

  useEffect(() => {
    reservationAnimatedValues.forEach((anim, index) => {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 420,
        delay: index * 90,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [reservationAnimatedValues]);

  const summary = useMemo(() => {
    if (!reservations.length) {
      return { total: 0, upcoming: 0, cancelled: 0, completed: 0 };
    }

    const now = new Date();
    let upcoming = 0;
    let cancelled = 0;
    let completed = 0;

    reservations.forEach((reservation) => {
      const status = (reservation.status || '').toLowerCase();
      const pickupDate = buildDate(reservation.pickupDate, reservation.pickupTime);

      if (status.includes('ann') || status.includes('cancel')) {
        cancelled += 1;
      } else if (status.includes('term') || status.includes('complet')) {
        completed += 1;
      } else if (pickupDate && pickupDate > now) {
        upcoming += 1;
      }
    });

    return {
      total: reservations.length,
      upcoming,
      cancelled,
      completed,
    };
  }, [reservations]);

  const metrics = useMemo(
    () => [
      {
        label: 'Réservations totales',
        value: summary.total,
        icon: 'clipboard-text',
        accent: '#38BDF8',
        hint: 'Depuis votre inscription',
      },
      {
        label: 'À venir',
        value: summary.upcoming,
        icon: 'calendar-clock',
        accent: '#34D399',
        hint: 'Confirmées ou en attente',
      },
      {
        label: 'Annulées',
        value: summary.cancelled,
        icon: 'close-circle',
        accent: '#F87171',
        hint: 'Annulations cumulées',
      },
    ],
    [summary.total, summary.upcoming, summary.cancelled]
  );

  const nextReservation = useMemo(() => {
    const now = new Date();
    return reservations
      .map((reservation) => ({ reservation, date: buildDate(reservation.pickupDate, reservation.pickupTime) }))
      .filter(({ date, reservation }) => {
        const status = (reservation.status || '').toLowerCase();
        return date && date > now && !status.includes('ann') && !status.includes('cancel');
      })
      .sort((a, b) => (a.date?.getTime?.() || 0) - (b.date?.getTime?.() || 0))
      .map(({ reservation }) => reservation)[0];
  }, [reservations]);

  const handleBack = () => {
    if (navigation?.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation?.navigate('Profile');
  };

  const handleCreateReservation = () => navigation?.navigate('Catalog');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.85}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Mes réservations</Text>
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
            <Text style={styles.heroBadgeText}>Historique détaillé</Text>
          </View>
          <Text style={styles.heroTitle}>Votre parcours de location</Text>
          <Text style={styles.heroSubtitle}>
            Visualisez l'ensemble de vos réservations, suivez leurs statuts et préparez sereinement vos prochains déplacements.
          </Text>
          {nextReservation ? (
            <View style={styles.heroHighlight}>
              <MaterialCommunityIcons name="calendar-check" size={20} color="#155E75" />
              <View style={styles.heroHighlightInfo}>
                <Text style={styles.heroHighlightLabel}>Prochaine prise en charge</Text>
                <Text style={styles.heroHighlightValue}>{formatReservationDate(nextReservation)}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.heroHighlightMuted}>
              <MaterialCommunityIcons name="calendar-blank" size={20} color="#CBD5F5" />
              <Text style={styles.heroHighlightMutedText}>Aucune réservation imminente</Text>
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
          </View>
        </Animated.View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indicateurs clés</Text>
          <Text style={styles.sectionSubtitle}>Un aperçu rapide de votre activité.</Text>
          <View style={styles.metricsGrid}>
            {metrics.map((metric) => (
              <Animated.View
                key={metric.label}
                style={[
                  styles.metricCard,
                  {
                    opacity: listAnim,
                    transform: [
                      { translateY: listAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
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
              <Text style={styles.sectionTitle}>Historique complet</Text>
              <Text style={styles.sectionSubtitle}>Vos réservations, de la plus récente à la plus ancienne.</Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#1E40AF" style={styles.loader} />
          ) : reservations.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="tray" size={28} color="#94A3B8" />
              <Text style={styles.emptyText}>Vous n'avez encore effectué aucune réservation.</Text>
            </View>
          ) : (
            reservations.map((reservation, index) => {
              const anim = reservationAnimatedValues[index];
              const badge = getStatusBadge(reservation.status);

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
                    <View style={styles.cardVehicle}>
                      <MaterialCommunityIcons name="car-info" size={18} color="#1E3A8A" />
                      <Text style={styles.cardVehicleText}>{reservation.vehicleModel || 'Véhicule'}</Text>
                    </View>
                    <View style={[styles.cardStatus, { backgroundColor: badge.background }]}> 
                      <Text style={[styles.cardStatusText, { color: badge.color }]}>{badge.label}</Text>
                    </View>
                  </View>

                  <View style={styles.cardRow}>
                    <MaterialCommunityIcons name="account" size={16} color="#1E3A8A" />
                    <Text style={styles.cardValue}>{reservation.firstName} {reservation.lastName}</Text>
                  </View>
                  <View style={styles.cardRow}>
                    <MaterialCommunityIcons name="calendar-range" size={16} color="#1E3A8A" />
                    <Text style={styles.cardValue}>{formatReservationDate(reservation)}</Text>
                  </View>
                  <View style={styles.cardFooter}>
                    <View style={styles.cardFooterItem}>
                      <MaterialCommunityIcons name="clock-outline" size={15} color="#334155" />
                      <Text style={styles.cardFooterText}>{reservation.days ? `${reservation.days} jours` : 'Durée non précisée'}</Text>
                    </View>
                    <View style={styles.cardFooterItem}>
                      <MaterialCommunityIcons name="cash" size={15} color="#334155" />
                      <Text style={styles.cardFooterText}>
                        {reservation.totalPrice ? `€${Number(reservation.totalPrice).toFixed(2)}` : 'Tarif à confirmer'}
                      </Text>
                    </View>
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

const formatReservationDate = (reservation) => {
  const date = buildDate(reservation.pickupDate, reservation.pickupTime);
  if (!date) {
    return 'Date à confirmer';
  }
  const endDate = reservation.returnDate ? buildDate(reservation.returnDate, reservation.returnTime) : null;

  if (endDate) {
    return `${date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    })} → ${endDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    })}`;
  }

  return `${date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })} • ${date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

const getStatusBadge = (status) => {
  if (!status) {
    return { label: 'En attente', background: 'rgba(148,163,184,0.22)', color: '#334155' };
  }

  const value = status.toString().toLowerCase();

  if (value.includes('ann') || value.includes('cancel')) {
    return { label: 'Annulée', background: 'rgba(248,113,113,0.18)', color: '#B91C1C' };
  }

  if (value.includes('term') || value.includes('complet')) {
    return { label: 'Terminée', background: 'rgba(59,130,246,0.18)', color: '#1D4ED8' };
  }

  if (value.includes('confirm')) {
    return { label: 'Confirmée', background: 'rgba(34,197,94,0.18)', color: '#15803D' };
  }

  return { label: status, background: 'rgba(148,163,184,0.18)', color: '#334155' };
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
  heroHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(125,211,252,0.18)',
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  heroHighlightInfo: {
    flex: 1,
  },
  heroHighlightLabel: {
    color: 'rgba(248,250,252,0.75)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroHighlightValue: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  heroHighlightMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248,250,252,0.12)',
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  heroHighlightMutedText: {
    color: 'rgba(248,250,252,0.75)',
    fontSize: 13,
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
  heroPrimaryText: {
    color: '#0F172A',
    fontWeight: '700',
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
  cardVehicle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardVehicleText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  cardStatus: {
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cardStatusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  cardValue: {
    color: '#475569',
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 14,
  },
  cardFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardFooterText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ReservationHistoryScreen;
