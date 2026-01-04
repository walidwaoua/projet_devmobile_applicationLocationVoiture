import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Button, FlatList, ScrollView, TouchableOpacity } from 'react-native';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

const itemsCollection = collection(db, 'items');

const FEATURES = [
  {
    id: 'fleet',
    title: 'Gestion complète de la flotte',
    description: 'Suivez la disponibilité, l\'entretien et le kilométrage de chaque véhicule en temps réel.',
  },
  {
    id: 'pricing',
    title: 'Tarification dynamique',
    description: 'Proposez des tarifs flexibles selon la saison, la durée ou des codes promotionnels personnalisés.',
  },
  {
    id: 'crm',
    title: 'Suivi client intégré',
    description: 'Historique des réservations, préférences et rappel automatique des documents importants.',
  },
];

const RESERVATION_STEPS = [
  {
    id: 'search',
    title: '1. Recherche intuitive',
    description: 'Un moteur performant pour filtrer par ville, type de véhicule, dates ou options supplémentaires.',
  },
  {
    id: 'selection',
    title: '2. Sélection et extras',
    description: 'Présentez les détails du véhicule, les assurances et les équipements additionnels en un coup d\'œil.',
  },
  {
    id: 'payment',
    title: '3. Confirmation sécurisée',
    description: 'Paiement en ligne chiffré, documents générés automatiquement et notifications instantanées.',
  },
];

const HomeScreen = () => {
  const [text, setText] = useState('');
  const [items, setItems] = useState([]);

  const loadItems = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(itemsCollection);
      const itemsList = querySnapshot.docs.map(snapshot => ({
        id: snapshot.id,
        ...snapshot.data(),
      }));
      setItems(itemsList);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const addItem = async () => {
    if (text.trim() === '') {
      return;
    }

    try {
      await addDoc(itemsCollection, {
        text,
        createdAt: new Date().toISOString(),
      });
      setText('');
      loadItems();
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
    }
  };

  const deleteItem = async (id) => {
    try {
      await deleteDoc(doc(db, 'items', id));
      loadItems();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Votre plateforme de location de voitures</Text>
        <Text style={styles.heroSubtitle}>
          Présentez votre catalogue, simplifiez la réservation et fidélisez vos clients avec une expérience
          mobile haut de gamme.
        </Text>
        <TouchableOpacity style={styles.heroButton}>
          <Text style={styles.heroButtonText}>Découvrir la démo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fonctionnalités clés</Text>
        <View style={styles.cardsWrapper}>
          {FEATURES.map((feature) => (
            <View key={feature.id} style={styles.card}>
              <Text style={styles.cardTitle}>{feature.title}</Text>
              <Text style={styles.cardDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Méthode de réservation</Text>
        <View style={styles.stepsWrapper}>
          {RESERVATION_STEPS.map((step) => (
            <View key={step.id} style={styles.step}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bloc note (démo)</Text>
        <Text style={styles.sectionDescription}>
          Ajoutez quelques idées ou tâches liées à votre lancement. Les données sont sauvegardées dans Firestore.
        </Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Entrez un texte"
            value={text}
            onChangeText={setText}
          />
          <Button title="Ajouter" onPress={addItem} />
        </View>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.itemText}>{item.text}</Text>
              <Button
                title="Supprimer"
                color="red"
                onPress={() => deleteItem(item.id)}
              />
            </View>
          )}
          scrollEnabled={false}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun élément pour le moment.</Text>}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#f5f7fb',
    gap: 32,
  },
  hero: {
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.9)',
  },
  heroButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  heroButtonText: {
    color: '#1E293B',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionDescription: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
  cardsWrapper: {
    gap: 12,
  },
  card: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  cardDescription: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
  },
  stepsWrapper: {
    gap: 12,
  },
  step: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
    gap: 6,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  stepDescription: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    marginBottom: 10,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
});

export default HomeScreen;
