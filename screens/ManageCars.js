import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { createDocument, listenToCollection, patchDocument, removeDocument } from '../src/services/firestore';

const CATEGORIES = [
  { id: 'suv', label: 'SUV' },
  { id: 'citadine', label: 'Citadine' },
  { id: 'compacte', label: 'Compacte' },
  { id: 'luxe', label: 'Luxe' },
  { id: 'familiale', label: 'Familiale' },
  { id: 'standard', label: 'Standard' },
];

const ManageCars = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('standard');
  const [year, setYear] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    const unsubscribe = listenToCollection({
      collectionName: 'cars',
      orderByField: 'model',
      onData: (data) => {
        setCars(data);
        setLoading(false);
      },
      onError: (error) => {
        console.error('Erreur Firestore (cars):', error);
        Alert.alert('Erreur', "Impossible de charger les véhicules.");
        setLoading(false);
      },
    });

    return unsubscribe;
  }, []);

  const resetForm = () => {
    setModel('');
    setCategory('standard');
    setYear(new Date().getFullYear().toString());
    setPrice('');
    setDescription('');
    setAvailable(true);
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (car) => {
    setModel(car.model || '');
    setCategory(car.category || 'standard');
    setYear(car.year ? String(car.year) : '');
    setPrice(car.dailyPrice ? String(car.dailyPrice) : '');
    setDescription(car.description || '');
    setAvailable(car.available);
    setEditingId(car.id);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!model.trim() || !price.trim()) {
      Alert.alert('Erreur', 'Le modèle et le prix sont obligatoires.');
      return;
    }

    setSaving(true);
    try {
      const carData = {
        model: model.trim(),
        category,
        year: parseInt(year) || new Date().getFullYear(),
        dailyPrice: parseFloat(price) || 0,
        description: description.trim(),
        available,
        updatedAt: new Date().toISOString(),
      };

      if (editingId) {
        await patchDocument('cars', editingId, carData);
        Alert.alert('Succès', 'Véhicule modifié avec succès.');
      } else {
        await createDocument('cars', {
          ...carData,
          createdAt: new Date().toISOString(),
        });
        Alert.alert('Succès', 'Véhicule ajouté avec succès.');
      }
      setModalVisible(false);
    } catch (error) {
      console.error('Erreur sauvegarde véhicule:', error);
      Alert.alert('Erreur', "Impossible de sauvegarder le véhicule.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (car) => {
    Alert.alert(
      'Confirmer la suppression',
      `Voulez-vous vraiment supprimer ${car.model} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeDocument('cars', car.id);
            } catch (err) {
              Alert.alert('Erreur', "Suppression échouée.");
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.carItem}>
      <View style={styles.carInfo}>
        <Text style={styles.carModel}>{item.model}</Text>
        <Text style={styles.carSubtext}>
          {item.category?.toUpperCase()} • {item.year}
        </Text>
        <Text style={styles.carPrice}>{item.dailyPrice}€ / jour</Text>
        <Text style={[styles.statusText, item.available ? styles.available : styles.unavailable]}>
          {item.available ? 'Disponible' : 'Indisponible'}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
          <Text style={styles.actionText}>Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
          <Text style={styles.actionText}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Parc Automobile</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Véhicule</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1E3A8A" style={styles.loader} />
      ) : (
        <FlatList
          data={cars}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun véhicule.</Text>}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{editingId ? 'Modifier Véhicule' : 'Nouveau Véhicule'}</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Modèle</Text>
                <TextInput style={styles.input} value={model} onChangeText={setModel} placeholder="Ex: Audi A3" />
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Année</Text>
                  <TextInput
                    style={styles.input}
                    value={year}
                    onChangeText={setYear}
                    keyboardType="numeric"
                    placeholder="2024"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Prix / jour (€)</Text>
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    placeholder="50"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Catégorie</Text>
                <View style={styles.categoryContainer}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.catChip, category === cat.id && styles.catChipActive]}
                      onPress={() => setCategory(cat.id)}
                    >
                      <Text style={[styles.catText, category === cat.id && styles.catTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  placeholder="Options, état, etc."
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.label}>Disponible immédiatement</Text>
                <Switch
                  value={available}
                  onValueChange={setAvailable}
                  trackColor={{ false: "#767577", true: "#10B981" }}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Enregistrer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  addButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  carItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  carInfo: {
    flex: 1,
    gap: 4,
  },
  carModel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  carSubtext: {
    fontSize: 14,
    color: '#64748B',
  },
  carPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F59E0B',
    marginTop: 2,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  available: {
    color: '#10B981',
  },
  unavailable: {
    color: '#EF4444',
  },
  actions: {
    gap: 8,
  },
  editButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    marginTop: 32,
  },
  loader: {
    marginTop: 40,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    height: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 20,
    gap: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  catChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  catText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  catTextActive: {
    color: '#3B82F6',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
  },
  cancelText: {
    fontWeight: '700',
    color: '#64748B',
  },
  saveText: {
    fontWeight: '700',
    color: '#fff',
  },
});

export default ManageCars;