import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { listenToCollection, patchDocument, removeDocument } from '../src/services/firestore';

const STATUS_PENDING = 'Pending';
const STATUS_ACTIVE = 'Active';
const STATUS_COMPLETED = 'Completed';

const normalizeStatus = (status) => {
  const value = String(status || '')
    .trim()
    .toLowerCase();

  if (
    ['active', 'en cours', 'confirmée', 'confirmee', 'approved', 'confirmé', 'confirme'].includes(value)
  ) {
    return STATUS_ACTIVE;
  }

  if (
    [
      'completed',
      'clôturée',
      'cloturee',
      'terminée',
      'terminee',
      'returned',
      'done',
      'archived',
    ].includes(value)
  ) {
    return STATUS_COMPLETED;
  }

  return STATUS_PENDING;
};

const buildCustomerName = (reservation) => {
  const firstName = String(reservation?.firstName || '')
    .trim()
    .replace(/\s+/g, ' ');
  const lastName = String(reservation?.lastName || '')
    .trim()
    .replace(/\s+/g, ' ');

  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (fullName) {
    return fullName;
  }

  if (reservation?.userEmail) {
    return reservation.userEmail;
  }

  if (reservation?.customer) {
    return reservation.customer;
  }

  return 'Client inconnu';
};

const mapReservationRecord = (reservation) => {
  const status = normalizeStatus(reservation?.status);
  const startDate = reservation?.pickupDate || reservation?.startDate || null;
  const endDate = reservation?.returnDate || reservation?.endDate || null;

  return {
    id: reservation?.id,
    status,
    customerName: buildCustomerName(reservation),
    carLabel:
      reservation?.vehicleModel ||
      reservation?.vehicleName ||
      reservation?.car ||
      reservation?.carLabel ||
      'Véhicule à confirmer',
    startDate,
    endDate,
    pickupTime: reservation?.pickupTime || null,
    returnTime: reservation?.returnTime || null,
    notes: reservation?.notes || '',
    totalPrice: Number(reservation?.totalPrice) || 0,
    dailyPrice: Number(reservation?.dailyPrice) || 0,
    raw: reservation,
  };
};

const toDate = (value) => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value?.toDate === 'function') {
    return value.toDate();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateWithTime = (dateValue, timeValue) => {
  const date = toDate(dateValue);
  if (!date) {
    return 'Date inconnue';
  }

  const formattedDate = date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  if (!timeValue) {
    return formattedDate;
  }

  return `${formattedDate} - ${timeValue}`;
};

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const ManageRentals = ({ navigation }) => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef({}).current;
  const metricsAnim = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  const pendingCount = useMemo(() => rentals.filter((r) => r.status === STATUS_PENDING).length, [rentals]);
  const activeCount = useMemo(() => rentals.filter((r) => r.status === STATUS_ACTIVE).length, [rentals]);
  const completedCount = useMemo(
    () => rentals.filter((r) => r.status === STATUS_COMPLETED).length,
    [rentals],
  );

  const metrics = useMemo(
    () => [
      {
        label: 'En attente',
        value: pendingCount,
        icon: 'clock-outline',
        accent: '#FACC15',
      },
      {
        label: 'En cours',
        value: activeCount,
        icon: 'car-key',
        accent: '#38BDF8',
      },
      {
        label: 'Clôturées',
        value: completedCount,
        icon: 'check-circle',
        accent: '#34D399',
      },
    ],
    [pendingCount, activeCount, completedCount],
  );

  useEffect(() => {
    const unsubscribe = listenToCollection({
      collectionName: 'reservations',
      orderByField: 'createdAt',
      orderDirection: 'desc',
      onData: (data) => {
        const normalized = data.map(mapReservationRecord);
        setRentals(normalized);
        setLoading(false);
      },
      onError: (error) => {
        console.error('Erreur Firestore (reservations):', error);
        Alert.alert('Erreur', 'Impossible de charger les réservations.');
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
        duration: 500,
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
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [rentals, cardAnimations, listAnim]);

  const handleRentalAction = async (rental, action) => {
    try {
      if (action === 'approve') {
        await patchDocument('reservations', rental.id, {
          status: STATUS_ACTIVE,
          approvedAt: new Date().toISOString(),
        });
        Alert.alert('Validée', `La réservation de ${rental.customerName} est confirmée.`);
      } else if (action === 'deny') {
        await removeDocument('reservations', rental.id);
        Alert.alert('Refusée', `La demande de ${rental.customerName} a été supprimée.`);
      } else if (action === 'complete') {
        await patchDocument('reservations', rental.id, {
          status: STATUS_COMPLETED,
          completedAt: new Date().toISOString(),
        });
        Alert.alert('Clôturée', `La réservation de ${rental.customerName} est clôturée.`);
      }
    } catch (error) {
      console.error('Erreur traitement location:', error);
      Alert.alert('Erreur', "L'action demandée a échoué. Réessayez plus tard.");
    }
  };

  const getCardAnimation = (id, index) => {
    if (!cardAnimations[id]) {
      const value = new Animated.Value(0);
      cardAnimations[id] = value;
      Animated.timing(value, {
        toValue: 1,
        duration: 420,
        delay: index * 90,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
    return cardAnimations[id];
  };

  const statusVisuals = {
    [STATUS_PENDING]: {
      label: 'En attente',
      background: 'rgba(250,204,21,0.18)',
      color: '#B45309',
      icon: 'clock-alert',
    },
    [STATUS_ACTIVE]: {
      label: 'En cours',
      background: 'rgba(14,165,233,0.18)',
      color: '#0369A1',
      icon: 'car-key',
    },
    [STATUS_COMPLETED]: {
      label: 'Clôturée',
      background: 'rgba(34,197,94,0.18)',
      color: '#047857',
      icon: 'check-circle',
    },
  };

  const renderItem = ({ item, index }) => {
    const anim = getCardAnimation(item.id || index, index);
    const visuals = statusVisuals[item.status] || statusVisuals[STATUS_PENDING];

    return (
      <Animated.View
        style={[
          styles.rentalItem,
          {
            opacity: anim,
            transform: [
              { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
              { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
            ],
          },
        ]}
      >
        <View style={styles.rentalHeader}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account-circle" size={26} color="#1E3A8A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{item.customerName || 'Client inconnu'}</Text>
            <Text style={styles.rentalMeta}>{item.carLabel || 'Véhicule à confirmer'}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: visuals.background }]}>
            <MaterialCommunityIcons name={visuals.icon} size={16} color={visuals.color} />
            <Text style={[styles.statusPillText, { color: visuals.color }]}>{visuals.label}</Text>
          </View>
        </View>

        <View style={styles.scheduleRow}>
          <View style={styles.scheduleBlock}>
            <Text style={styles.scheduleLabel}>Début</Text>
            <Text style={styles.scheduleValue}>
              {formatDateWithTime(item.startDate, item.pickupTime)}
            </Text>
          </View>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#94A3B8" />
          <View style={styles.scheduleBlock}>
            <Text style={styles.scheduleLabel}>Retour</Text>
            <Text style={styles.scheduleValue}>
              {formatDateWithTime(item.endDate, item.returnTime)}
            </Text>
          </View>
        </View>

        {item.notes ? <Text style={styles.notesText}>{item.notes}</Text> : null}

        <View style={styles.actionRow}>
          {item.status === STATUS_PENDING && (
            <>
              <AnimatedTouchable
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleRentalAction(item, 'approve')}
              >
                <MaterialCommunityIcons name="check" size={18} color="#0F172A" />
                <Text style={styles.approveText}>Valider</Text>
              </AnimatedTouchable>
              <AnimatedTouchable
                style={[styles.actionButton, styles.denyButton]}
                onPress={() => handleRentalAction(item, 'deny')}
              >
                <MaterialCommunityIcons name="close" size={18} color="#DC2626" />
                <Text style={styles.denyText}>Refuser</Text>
              </AnimatedTouchable>
            </>
          )}
          {item.status === STATUS_ACTIVE && (
            <AnimatedTouchable
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleRentalAction(item, 'complete')}
            >
              <MaterialCommunityIcons name="flag-checkered" size={18} color="#0F172A" />
              <Text style={styles.approveText}>Clôturer</Text>
            </AnimatedTouchable>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Gestion des locations</Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="calendar-clock" size={26} color="#0F172A" />
          </View>
          <Text style={styles.heroTitle}>Pilotez les réservations</Text>
          <Text style={styles.heroSubtitle}>
            Suivez les demandes, validez les départs et clôturez les retours en conservant une vision claire du planning.
          </Text>
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.heroPrimary} onPress={() => navigation.navigate('ManageCars')}>
              <MaterialCommunityIcons name="garage" size={18} color="#0F172A" />
              <Text style={styles.heroPrimaryText}>Affecter un véhicule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroSecondary} onPress={() => navigation.navigate('Reports')}>
              <MaterialCommunityIcons name="file-chart" size={18} color="#F8FAFC" />
              <Text style={styles.heroSecondaryText}>Voir les rapports</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.metricRow}>
          {metrics.map((metric, idx) => (
            <Animated.View
              key={metric.label}
              style={[
                styles.metricCard,
                {
                  opacity: metricsAnim[idx],
                  transform: [
                    {
                      translateY: metricsAnim[idx].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.metricIcon, { backgroundColor: `${metric.accent}30` }]}>
                <MaterialCommunityIcons name={metric.icon} size={18} color={metric.accent} />
              </View>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </Animated.View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Locations en suivi</Text>
            <Text style={styles.sectionHint}>{rentals.length} dossier(s)</Text>
          </View>
          {loading ? (
            <ActivityIndicator size="small" color="#1E3A8A" style={styles.loader} />
          ) : (
            <AnimatedFlatList
              data={rentals}
              renderItem={renderItem}
              keyExtractor={(item) => String(item.id || item?.raw?.id)}
              contentContainerStyle={styles.list}
              ListEmptyComponent={<Text style={styles.emptyText}>Aucune réservation pour le moment.</Text>}
              style={{ opacity: listAnim }}
              scrollEnabled={false}
            />
          )}
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(248,250,252,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  scroll: {
    paddingBottom: 44,
  },
  hero: {
    marginHorizontal: 20,
    backgroundColor: '#1E3A8A',
    borderRadius: 28,
    padding: 24,
    gap: 16,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 22,
    elevation: 10,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#FACC15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: 'rgba(241,245,249,0.85)',
    fontSize: 14,
    lineHeight: 20,
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
    color: '#0F172A',
    fontWeight: '700',
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
    borderColor: 'rgba(248,250,252,0.35)',
  },
  heroSecondaryText: {
    color: '#F8FAFC',
    fontWeight: '600',
    fontSize: 14,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    gap: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 26,
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionHint: {
    color: '#64748B',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  list: {
    gap: 16,
  },
  loader: {
    marginTop: 30,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 12,
  },
  rentalItem: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
    gap: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  rentalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(30,58,138,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  rentalMeta: {
    color: '#475569',
    fontSize: 13,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(148,163,184,0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  scheduleBlock: {
    flex: 1,
    gap: 2,
  },
  scheduleLabel: {
    color: '#64748B',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  scheduleValue: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  notesText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
  },
  approveButton: {
    backgroundColor: '#FACC15',
  },
  denyButton: {
    backgroundColor: 'rgba(220,38,38,0.12)',
  },
  completeButton: {
    backgroundColor: '#38BDF8',
  },
  approveText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
  },
  denyText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default ManageRentals;