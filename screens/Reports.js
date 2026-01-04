import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

// Mock data for reports
const reportsData = {
  totalRentals: 150,
  activeRentals: 12,
  totalRevenue: 45000,
  popularCar: 'Toyota Corolla',
  monthlyRentals: [
    { month: 'Jan', count: 20 },
    { month: 'Feb', count: 25 },
    { month: 'Mar', count: 30 },
    { month: 'Apr', count: 35 },
    { month: 'May', count: 40 },
  ],
};

const Reports = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Reports & Analytics</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{reportsData.totalRentals}</Text>
            <Text style={styles.statLabel}>Total Rentals</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{reportsData.activeRentals}</Text>
            <Text style={styles.statLabel}>Active Rentals</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>${reportsData.totalRevenue}</Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Car</Text>
        <Text style={styles.popularCar}>{reportsData.popularCar}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Rentals</Text>
        {reportsData.monthlyRentals.map((item, index) => (
          <View key={index} style={styles.monthlyItem}>
            <Text style={styles.monthText}>{item.month}</Text>
            <Text style={styles.countText}>{item.count} rentals</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
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
});

export default Reports;