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
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { listenToCollection } from '../src/services/firestore';

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
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const Reports = ({ navigation }) => {
  const [reservations, setReservations] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const isCompact = width < 768;
  const isUltraCompact = width < 420;

  useEffect(() => {
    let isActive = true;
    let reservationsLoaded = false;
    let carsLoaded = false;

    setLoading(true);

    const completeIfReady = () => {
      if (!isActive || !reservationsLoaded || !carsLoaded) {
        return;
      }

      setLoading(false);
      setLastUpdated(new Date());
    };

    const stopReservations = listenToCollection({
      collectionName: 'reservations',
      orderByField: 'createdAt',
      orderDirection: 'desc',
      onData: (data) => {
        if (!isActive) {
          return;
        }

        setReservations(data);
        reservationsLoaded = true;
        completeIfReady();
      },
      onError: (error) => {
        console.error('Erreur lors du chargement des réservations :', error);
        if (!isActive) {
          return;
        }

        setLoading(false);
      },
    });

    const stopCars = listenToCollection({
      collectionName: 'cars',
      onData: (data) => {
        if (!isActive) {
          return;
        }

        setCars(data);
        carsLoaded = true;
        completeIfReady();
      },
      onError: (error) => {
        console.error('Erreur lors du chargement des véhicules :', error);
        if (!isActive) {
          return;
        }

        setLoading(false);
      },
    });

    return () => {
      isActive = false;
      stopReservations?.();
      stopCars?.();
    };
  }, []);

  const report = useMemo(() => {
    const normalized = reservations.map((reservation) => {
      const pickupDate =
        reservation?.pickupDate ||
        reservation?.startDate ||
        reservation?.start_date ||
        reservation?.start ||
        reservation?.departureDate ||
        null;

      const returnDate =
        reservation?.returnDate ||
        reservation?.endDate ||
        reservation?.end_date ||
        reservation?.end ||
        reservation?.arrivalDate ||
        null;

      const totalCandidates = [
        reservation?.totalPrice,
        reservation?.total,
        reservation?.amount,
        reservation?.price,
        reservation?.priceTotal,
        reservation?.totalAmount,
      ];

      const parsedTotal = totalCandidates
        .map((candidate) => Number(candidate))
        .find((value) => Number.isFinite(value) && value >= 0);

      const computedTotal = (() => {
        const daily = Number(reservation?.dailyPrice);
        const days = Number(reservation?.days || reservation?.duration || reservation?.durationDays);
        if (Number.isFinite(daily) && Number.isFinite(days) && daily >= 0 && days > 0) {
          return daily * days;
        }
        if (Number.isFinite(daily) && daily >= 0 && (!Number.isFinite(days) || days <= 0)) {
          return daily;
        }
        return 0;
      })();

      return {
        id: reservation?.id,
        status: normalizeStatus(reservation?.status),
        pickupDate,
        returnDate,
        pickupTime: reservation?.pickupTime || reservation?.pickup_time || reservation?.startTime || null,
        returnTime: reservation?.returnTime || reservation?.return_time || reservation?.endTime || null,
        vehicleId:
          reservation?.vehicleId ||
          reservation?.vehicleID ||
          reservation?.carId ||
          reservation?.carID ||
          reservation?.vehicle,
        vehicleModel:
          reservation?.vehicleModel ||
          reservation?.vehicleName ||
          reservation?.carModel ||
          reservation?.carName ||
          reservation?.car ||
          reservation?.vehicleLabel,
        totalPrice: Number.isFinite(parsedTotal) ? parsedTotal : computedTotal,
      };
    });

    const totalReservations = normalized.length;
    const activeReservations = normalized.filter((item) => item.status === STATUS_ACTIVE).length;
    const totalRevenue = normalized.reduce((acc, item) => acc + (Number.isFinite(item.totalPrice) ? item.totalPrice : 0), 0);

    const carPopularity = normalized.reduce((acc, item) => {
      const key = item.vehicleId || item.vehicleModel;
      if (!key) {
        return acc;
      }
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    let popularCar = 'Aucun véhicule';
    if (Object.keys(carPopularity).length > 0) {
      const [topKey] = Object.entries(carPopularity).sort((a, b) => b[1] - a[1])[0];
      const carInfo = cars.find((car) => car.id === topKey);
      if (carInfo) {
        const label = `${carInfo.brand || ''} ${carInfo.model || ''}`.trim();
        popularCar = label || 'Véhicule identifié';
      } else {
        popularCar = topKey;
      }
    }

    const monthlyMap = normalized.reduce((acc, item) => {
      const date = toDate(item.pickupDate);
      if (!date) {
        return acc;
      }
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const monthlyReservations = Object.entries(monthlyMap)
      .sort((a, b) => (a[0] > b[0] ? 1 : -1))
      .map(([key, count]) => {
        const [year, month] = key.split('-');
        const label = new Date(Number(year), Number(month) - 1).toLocaleString('fr-FR', {
          month: 'short',
          year: 'numeric',
        });
        return { month: label, count };
      });

    return {
      totalReservations,
      activeReservations,
      totalRevenue,
      popularCar,
      monthlyReservations,
    };
  }, [reservations, cars]);

  const metrics = useMemo(
    () => [
      {
        label: 'Réservations totales',
        value: report.totalReservations,
        icon: 'clipboard-text',
        accent: '#38BDF8',
        hint: 'Historique complet',
      },
      {
        label: 'Réservations actives',
        value: report.activeReservations,
        icon: 'clock-check',
        accent: '#22D3EE',
        hint: 'En cours actuellement',
      },
      {
        label: 'Revenus cumulés',
        value: `€${report.totalRevenue.toFixed(2)}`,
        icon: 'cash-multiple',
        accent: '#FACC15',
        hint: 'Depuis le lancement',
      },
    ],
    [report.totalReservations, report.activeReservations, report.totalRevenue]
  );

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
        delay: index * 110,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [metricAnimations]);

  const monthlyAnimations = useMemo(
    () => report.monthlyReservations.map(() => new Animated.Value(0)),
    [report.monthlyReservations]
  );

  useEffect(() => {
    monthlyAnimations.forEach((anim, index) => {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 420,
        delay: index * 90,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [monthlyAnimations]);

  useEffect(() => {
    listAnim.setValue(0);
    Animated.timing(listAnim, {
      toValue: 1,
      duration: 560,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [listAnim, report.monthlyReservations]);

  const averageRevenue = useMemo(() => {
    if (!report.totalReservations) {
      return 0;
    }
    return report.totalRevenue / report.totalReservations;
  }, [report.totalReservations, report.totalRevenue]);

  const handleGoBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    navigation?.navigate?.('AdminDashboard');
  };

  const handleNavigateDashboard = () => {
    navigation?.navigate?.('AdminDashboard');
  };

  const handleNavigateRentals = () => {
    navigation?.navigate?.('ManageRentals');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.85}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Rapports & Analyses</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.hero,
            isCompact && styles.heroCompact,
            isUltraCompact && styles.heroUltraCompact,
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
            <Text style={styles.heroBadgeText}>Vue globale</Text>
          </View>
          <Text style={styles.heroTitle}>Performance de la flotte</Text>
          <Text style={styles.heroSubtitle}>
            Visualisez les revenus, l'activité et les tendances pour guider vos décisions.
          </Text>
          <View style={[styles.heroActions, (isCompact || isUltraCompact) && styles.heroActionsCompact]}>
            <TouchableOpacity
              style={[
                styles.heroPrimary,
                styles.heroPill,
                (isCompact || isUltraCompact) && styles.heroActionButtonCompact,
              ]}
              onPress={handleNavigateRentals}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="clipboard-text" size={18} color="#0F172A" />
              <Text style={styles.heroPrimaryText}>Consulter les locations</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.heroSecondary,
                styles.heroPill,
                (isCompact || isUltraCompact) && styles.heroActionButtonCompact,
              ]}
              onPress={handleNavigateDashboard}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="view-dashboard" size={18} color="#F8FAFC" />
              <Text style={styles.heroSecondaryText}>Retour au dashboard</Text>
            </TouchableOpacity>
          </View>
          {lastUpdated && (
            <Text
              style={[
                styles.lastUpdated,
                (isCompact || isUltraCompact) && styles.lastUpdatedCompact,
              ]}
            >
              {`Dernière mise à jour : ${lastUpdated.toLocaleString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: 'short',
              })}`}
            </Text>
          )}
        </Animated.View>

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color="#FACC15" />
            <Text style={styles.loaderText}>Analyse des données en cours...</Text>
          </View>
        ) : (
          <>
            <View
              style={[
                styles.section,
                isCompact && styles.sectionCompact,
                isUltraCompact && styles.sectionUltraCompact,
              ]}
            >
              <Text style={styles.sectionTitle}>Indicateurs clés</Text>
              <Text style={styles.sectionSubtitle}>Mesurez l'activité récente de vos locations.</Text>
              <View style={[styles.metricsGrid, (isCompact || isUltraCompact) && styles.metricsGridCompact]}>
                {metrics.map((metric, index) => {
                  const anim = metricAnimations[index];
                  return (
                    <Animated.View
                      key={metric.label}
                      style={[
                        styles.metricCard,
                        (isCompact || isUltraCompact) && styles.metricCardCompact,
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
                      <Text
                        style={[styles.metricValue, (isCompact || isUltraCompact) && styles.metricValueCompact]}
                      >
                        {metric.value}
                      </Text>
                      <Text style={styles.metricHint}>{metric.hint}</Text>
                    </Animated.View>
                  );
                })}
              </View>
            </View>

            <View
              style={[
                styles.section,
                isCompact && styles.sectionCompact,
                isUltraCompact && styles.sectionUltraCompact,
              ]}
            >
              <Text style={styles.sectionTitle}>Aperçus</Text>
              <Text style={styles.sectionSubtitle}>Comprenez la santé financière et la demande.</Text>
              <View style={[styles.insightsRow, (isCompact || isUltraCompact) && styles.insightsRowCompact]}>
                <View
                  style={[
                    styles.insightCard,
                    { backgroundColor: 'rgba(34,197,94,0.12)' },
                    (isCompact || isUltraCompact) && styles.insightCardCompact,
                  ]}
                >
                  <View style={[styles.insightIcon, { backgroundColor: 'rgba(34,197,94,0.18)' }]}>
                    <MaterialCommunityIcons name="cash-register" size={20} color="#15803D" />
                  </View>
                  <Text style={styles.insightLabel}>Revenu moyen</Text>
                  <Text style={styles.insightValue}>€{averageRevenue.toFixed(2)}</Text>
                  <Text style={styles.insightHint}>Par location confirmée</Text>
                </View>
                <View
                  style={[
                    styles.insightCard,
                    { backgroundColor: 'rgba(250,204,21,0.12)' },
                    (isCompact || isUltraCompact) && styles.insightCardCompact,
                  ]}
                >
                  <View style={[styles.insightIcon, { backgroundColor: 'rgba(250,204,21,0.22)' }]}>
                    <MaterialCommunityIcons name="star-circle" size={20} color="#D97706" />
                  </View>
                  <Text style={styles.insightLabel}>Véhicule le plus demandé</Text>
                  <Text style={styles.insightValue}>{report.popularCar}</Text>
                  <Text style={styles.insightHint}>Basé sur les locations</Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.section,
                isCompact && styles.sectionCompact,
                isUltraCompact && styles.sectionUltraCompact,
              ]}
            >
              <View
                style={[
                  styles.sectionHeader,
                  (isCompact || isUltraCompact) && styles.sectionHeaderCompact,
                ]}
              >
                <View>
                  <Text style={styles.sectionTitle}>Locations mensuelles</Text>
                  <Text style={styles.sectionSubtitle}>Suivez la cadence mois par mois.</Text>
                </View>
                <View style={[styles.tag, (isCompact || isUltraCompact) && styles.tagCompact]}>
                  <MaterialCommunityIcons name="calendar-month" size={16} color="#1E40AF" />
                  <Text style={styles.tagText}>{report.monthlyReservations.length} périodes suivies</Text>
                </View>
              </View>

              {report.monthlyReservations.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <MaterialCommunityIcons name="chart-timeline-variant" size={28} color="#94A3B8" />
                  <Text style={styles.emptyText}>Aucune location enregistrée pour le moment.</Text>
                </View>
              ) : (
                <Animated.View
                  style={[
                    styles.timelineList,
                    {
                      opacity: listAnim,
                      transform: [
                        { translateY: listAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
                      ],
                    },
                  ]}
                >
                  {report.monthlyReservations.map((item, index) => {
                    const anim = monthlyAnimations[index];
                    return (
                      <Animated.View
                        key={`${item.month}-${index}`}
                        style={[
                          styles.timelineItem,
                          {
                            opacity: anim,
                            transform: [
                              { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
                              { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
                            ],
                          },
                        ]}
                      >
                        <View style={styles.timelineIconWrap}>
                          <MaterialCommunityIcons name="chart-line" size={16} color="#1E40AF" />
                        </View>
                        <View style={styles.timelineInfo}>
                          <Text style={styles.timelineMonth}>{item.month}</Text>
                          <Text style={styles.timelineCount}>
                            {item.count} {item.count > 1 ? 'locations' : 'location'}
                          </Text>
                        </View>
                      </Animated.View>
                    );
                  })}
                </Animated.View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Reports;

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
  heroCompact: {
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 22,
  },
  heroUltraCompact: {
    marginHorizontal: 12,
    borderRadius: 22,
    padding: 20,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(148,197,255,0.2)',
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
    color: 'rgba(241,245,249,0.88)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  heroActionsCompact: {
    flexDirection: 'column',
    gap: 10,
  },
  heroPill: {
    marginRight: 12,
    marginBottom: 12,
  },
  heroActionButtonCompact: {
    width: '100%',
    justifyContent: 'center',
    marginRight: 0,
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
  lastUpdated: {
    marginTop: 8,
    color: 'rgba(248,250,252,0.78)',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  lastUpdatedCompact: {
    fontSize: 11,
  },
  loaderWrap: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  loaderText: {
    marginTop: 12,
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
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
  sectionCompact: {
    marginHorizontal: 16,
    borderRadius: 22,
    paddingHorizontal: 18,
  },
  sectionUltraCompact: {
    marginHorizontal: 12,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionHeaderCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
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
    marginTop: 18,
  },
  metricsGridCompact: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    gap: 14,
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
  metricCardCompact: {
    width: '100%',
  },
  metricIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 10,
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
  metricValueCompact: {
    fontSize: 21,
  },
  metricHint: {
    color: '#64748B',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 6,
  },
  insightsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  insightsRowCompact: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    gap: 12,
  },
  insightCard: {
    width: '48%',
    borderRadius: 20,
    padding: 18,
  },
  insightCardCompact: {
    width: '100%',
  },
  insightIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  insightLabel: {
    color: '#1E293B',
    fontWeight: '600',
    fontSize: 14,
  },
  insightValue: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 6,
  },
  insightHint: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,64,175,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  tagCompact: {
    alignSelf: 'flex-start',
  },
  tagText: {
    marginLeft: 6,
    color: '#1E40AF',
    fontWeight: '600',
    fontSize: 12,
  },
  timelineList: {
    marginTop: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  timelineIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(30,64,175,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  timelineInfo: {
    flex: 1,
  },
  timelineMonth: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  timelineCount: {
    color: '#475569',
    fontSize: 13,
    marginTop: 4,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
  },
});
