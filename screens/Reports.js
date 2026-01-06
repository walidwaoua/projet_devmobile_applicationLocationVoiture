import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminNavbar from '../src/components/AdminNavbar';
import { listenToCollection } from '../src/services/firestore';

const Reports = ({ navigation }) => {
  const [rentals, setRentals] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

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
      popularCar = carInfo ? carInfo.model : 'Véhicule non trouvé';
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
        const monthLabel = new Date(Number(year), Number(month) - 1).toLocaleString('fr-FR', {
          month: 'short',
          year: 'numeric',
        });
        return { month: monthLabel, count };
      });

    return {
      totalRentals,
      activeRentals,
      totalRevenue,
      popularCar,
      monthlyRentals,
    };
  }, [rentals, cars]);

  const handleNavigate = (screen) => {
    navigation?.navigate?.(screen);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <AdminNavbar activeScreen="Reports" onNavigate={handleNavigate} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Reports & Analytics</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#1E3A8A" style={styles.loader} />
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <View style={styles.statContainer}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{report.totalRentals}</Text>
                  <Text style={styles.statLabel}>Total Rentals</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{report.activeRentals}</Text>
                  <Text style={styles.statLabel}>Active Rentals</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>€{report.totalRevenue.toFixed(2)}</Text>
                  <Text style={styles.statLabel}>Total Revenue</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Popular Car</Text>
              <Text style={styles.popularCar}>{report.popularCar}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Monthly Rentals</Text>
              {report.monthlyRentals.length === 0 ? (
                <Text style={styles.emptyText}>Aucune location enregistrée.</Text>
              ) : (
                report.monthlyRentals.map((item, index) => (
                  <View key={index} style={styles.monthlyItem}>
                    <Text style={styles.monthText}>{item.month}</Text>
                    <Text style={styles.countText}>{item.count} locations</Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  content: {
    paddingTop: 32,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  popularCar: {
    fontSize: 18,
    color: '#44ff44',
    fontWeight: 'bold',
  },
  monthlyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  monthText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  countText: {
    fontSize: 16,
    color: '#666',
  },
  loader: {
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
});

export default Reports;