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

import { listenToCollection } from '../src/services/firestore';

const Reports = ({ navigation }) => {
  const [rentals, setRentals] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let rentalsLoaded = false;
    let carsLoaded = false;

    const stopRentals = listenToCollection({
      collectionName: 'rentals',
      onData: (data) => {
        setRentals(data);
        rentalsLoaded = true;
        setLoading(!(rentalsLoaded && carsLoaded));
      },
      onError: (error) => {
        console.error('Erreur Firestore (rentals):', error);
        rentalsLoaded = true;
        setLoading(!(rentalsLoaded && carsLoaded));
      },
    });

    const stopCars = listenToCollection({
      collectionName: 'cars',
      onData: (data) => {
        setCars(data);
        carsLoaded = true;
        setLoading(!(rentalsLoaded && carsLoaded));
      },
      onError: (error) => {
        console.error('Erreur Firestore (cars):', error);
        carsLoaded = true;
        setLoading(!(rentalsLoaded && carsLoaded));
      },
    });

    return () => {
      stopRentals?.();
      stopCars?.();
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

  const report = useMemo(() => {
    const totalRentals = rentals.length;
    const activeRentals = rentals.filter((rental) => rental.status === 'Active').length;
    const totalRevenue = rentals.reduce((acc, rental) => acc + (Number(rental.totalPrice) || 0), 0);

    const carPopularity = rentals.reduce((acc, rental) => {
      if (rental.carId) {
        acc[rental.carId] = (acc[rental.carId] || 0) + 1;
      }
      return acc;
    }, {});

    let popularCar = 'Aucun véhicule';
    if (Object.keys(carPopularity).length > 0) {
      const [topCarId] = Object.entries(carPopularity).sort((a, b) => b[1] - a[1])[0];
      const carInfo = cars.find((car) => car.id === topCarId);
      popularCar = carInfo
        ? `${carInfo.brand || ''} ${carInfo.model || ''}`.trim() || 'Véhicule identifié'
        : 'Véhicule non trouvé';
    }

    const monthlyMap = rentals.reduce((acc, rental) => {
      if (!rental.startDate) {
        return acc;
      }
      const date = new Date(rental.startDate);
      if (Number.isNaN(date.getTime())) {
        return acc;
      }
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const monthlyRentals = Object.entries(monthlyMap)
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
      totalRentals,
      activeRentals,
      totalRevenue,
      popularCar,
      monthlyRentals,
    };
  }, [rentals, cars]);

  const metrics = useMemo(
    () => [
      {
        label: 'Locations totales',
        value: report.totalRentals,
        icon: 'briefcase-check',
        accent: '#38BDF8',
        hint: 'Historique complet',
      },
      {
        label: 'Locations actives',
        value: report.activeRentals,
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
    [report.totalRentals, report.activeRentals, report.totalRevenue]
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
    () => report.monthlyRentals.map(() => new Animated.Value(0)),
    [report.monthlyRentals]
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
  }, [listAnim, report.monthlyRentals]);

  const averageRevenue = useMemo(() => {
    if (!report.totalRentals) {
      return 0;
    }
    return report.totalRevenue / report.totalRentals;
  }, [report.totalRentals, report.totalRevenue]);

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
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={[styles.heroPrimary, styles.heroPill]}
              onPress={handleNavigateRentals}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="clipboard-text" size={18} color="#0F172A" />
              <Text style={styles.heroPrimaryText}>Consulter les locations</Text>
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

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color="#FACC15" />
            <Text style={styles.loaderText}>Analyse des données en cours...</Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Indicateurs clés</Text>
              <Text style={styles.sectionSubtitle}>Mesurez l'activité récente de vos locations.</Text>
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
                      <Text style={styles.metricHint}>{metric.hint}</Text>
                    </Animated.View>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Aperçus</Text>
              <Text style={styles.sectionSubtitle}>Comprenez la santé financière et la demande.</Text>
              <View style={styles.insightsRow}>
                <View style={[styles.insightCard, { backgroundColor: 'rgba(34,197,94,0.12)' }] }>
                  <View style={[styles.insightIcon, { backgroundColor: 'rgba(34,197,94,0.18)' }] }>
                    <MaterialCommunityIcons name="cash-register" size={20} color="#15803D" />
                  </View>
                  <Text style={styles.insightLabel}>Revenu moyen</Text>
                  <Text style={styles.insightValue}>€{averageRevenue.toFixed(2)}</Text>
                  <Text style={styles.insightHint}>Par location confirmée</Text>
                </View>
                <View style={[styles.insightCard, { backgroundColor: 'rgba(250,204,21,0.12)' }] }>
                  <View style={[styles.insightIcon, { backgroundColor: 'rgba(250,204,21,0.22)' }] }>
                    <MaterialCommunityIcons name="star-circle" size={20} color="#D97706" />
                  </View>
                  <Text style={styles.insightLabel}>Véhicule le plus demandé</Text>
                  <Text style={styles.insightValue}>{report.popularCar}</Text>
                  <Text style={styles.insightHint}>Basé sur les locations</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Locations mensuelles</Text>
                  <Text style={styles.sectionSubtitle}>Suivez la cadence mois par mois.</Text>
                </View>
                <View style={styles.tag}>
                  <MaterialCommunityIcons name="calendar-month" size={16} color="#1E40AF" />
                  <Text style={styles.tagText}>{report.monthlyRentals.length} périodes suivies</Text>
                </View>
              </View>

              {report.monthlyRentals.length === 0 ? (
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
                  {report.monthlyRentals.map((item, index) => {
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  insightCard: {
    width: '48%',
    borderRadius: 20,
    padding: 18,
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
