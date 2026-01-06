import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createDocument, listenToCollection, patchDocument, removeDocument } from '../src/services/firestore';

const CATEGORIES = [
  { id: 'suv', label: 'SUV' },
  { id: 'citadine', label: 'Citadine' },
  { id: 'compacte', label: 'Compacte' },
  { id: 'luxe', label: 'Luxe' },
  { id: 'familiale', label: 'Familiale' },
  { id: 'standard', label: 'Standard' },
];

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const ManageCars = ({ navigation }) => {
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

  const heroAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef({}).current;

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
    Object.keys(cardAnimations).forEach((key) => delete cardAnimations[key]);
    listAnim.setValue(0);
    Animated.timing(listAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [cars, cardAnimations, listAnim]);

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
    setYear(car.year ? String(car.year) : new Date().getFullYear().toString());
    setPrice(car.dailyPrice ? String(car.dailyPrice) : '');
    setDescription(car.description || '');
    setAvailable(Boolean(car.available));
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
        year: parseInt(year, 10) || new Date().getFullYear(),
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

  const getCardAnimation = (id, index) => {
    if (!cardAnimations[id]) {
      const value = new Animated.Value(0);
      cardAnimations[id] = value;
      Animated.timing(value, {
        toValue: 1,
        duration: 420,
        delay: index * 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
    return cardAnimations[id];
  };

  const renderItem = ({ item, index }) => {
    const anim = getCardAnimation(item.id || index, index);
    const updatedAt = item.updatedAt ? new Date(item.updatedAt) : null;

    return (
      <Animated.View
        style={[
          styles.carItem,
          {
            opacity: anim,
            transform: [
              { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
              { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
            ],
          },
        ]}
      >
        <View style={styles.carHeader}>
          <View style={styles.carIconWrap}>
            <MaterialCommunityIcons name="car-sports" size={22} color="#1E3A8A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.carModel}>{item.model || 'Modèle inconnu'}</Text>
            <Text style={styles.carSubtext}>
              {(item.category || 'Standard').toUpperCase()} • {item.year || 'Année ?'}
            </Text>
          </View>
          <View style={[styles.statusPill, item.available ? styles.statusAvailable : styles.statusUnavailable]}>
            <Text style={styles.statusPillText}>{item.available ? 'Disponible' : 'Indisponible'}</Text>
          </View>
        </View>

        <Text style={styles.carDescription} numberOfLines={2}>
          {item.description || 'Ajoutez une description pour mettre en avant ce véhicule.'}
        </Text>

        <View style={styles.carFooter}>
          <View>
            <Text style={styles.carPrice}>
              {item.dailyPrice ? `€${Number(item.dailyPrice).toFixed(2)} / jour` : 'Tarif à définir'}
            </Text>
            <Text style={styles.carMeta}>
              {updatedAt ? `Mis à jour le ${updatedAt.toLocaleDateString('fr-FR')}` : 'Nouvelle fiche'}
            </Text>
          </View>
          <View style={styles.actionRow}>
            <AnimatedTouchable style={[styles.actionButton, styles.editButton]} onPress={() => openEditModal(item)}>
              <MaterialCommunityIcons name="pencil" size={18} color="#1E3A8A" />
              <Text style={styles.actionButtonText}>Modifier</Text>
            </AnimatedTouchable>
            <AnimatedTouchable style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(item)}>
              <MaterialCommunityIcons name="trash-can" size={18} color="#DC2626" />
              <Text style={[styles.actionButtonText, styles.deleteText]}>Supprimer</Text>
            </AnimatedTouchable>
          </View>
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
        <Text style={styles.topTitle}>Gestion des véhicules</Text>
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
            <MaterialCommunityIcons name="garage" size={26} color="#0F172A" />
          </View>
          <Text style={styles.heroTitle}>Pilotez votre flotte</Text>
          <Text style={styles.heroSubtitle}>
            Ajoutez de nouveaux modèles, ajustez les tarifs et assurez la disponibilité en quelques gestes.
          </Text>
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.heroPrimary} onPress={openAddModal}>
              <MaterialCommunityIcons name="plus-circle" size={18} color="#0F172A" />
              <Text style={styles.heroPrimaryText}>Nouveau véhicule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroSecondary} onPress={() => navigation.navigate('Reports')}>
              <MaterialCommunityIcons name="file-chart" size={18} color="#F8FAFC" />
              <Text style={styles.heroSecondaryText}>Voir les rapports</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Parc actuel</Text>
            <Text style={styles.sectionHint}>{cars.length} véhicule(s)</Text>
          </View>
          {loading ? (
            <ActivityIndicator size="small" color="#1E3A8A" style={styles.loader} />
          ) : (
            <AnimatedFlatList
              data={cars}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              ListEmptyComponent={<Text style={styles.emptyText}>Ajoutez votre premier véhicule pour démarrer.</Text>}
              style={{ opacity: listAnim }}
              scrollEnabled={false}
            />
          )}
        </View>
      </Animated.ScrollView>

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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Modifier un véhicule' : 'Nouveau véhicule'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <MaterialCommunityIcons name="close" size={22} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Modèle</Text>
                <TextInput
                  style={styles.input}
                  value={model}
                  onChangeText={setModel}
                  placeholder="Ex : Audi A3"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, styles.rowItem]}>
                  <Text style={styles.label}>Année</Text>
                  <TextInput
                    style={styles.input}
                    value={year}
                    onChangeText={setYear}
                    keyboardType="numeric"
                    placeholder="2024"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={[styles.formGroup, styles.rowItem]}>
                  <Text style={styles.label}>Prix / jour (€)</Text>
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    placeholder="50"
                    placeholderTextColor="#94A3B8"
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
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.label}>Disponible immédiatement</Text>
                <Switch
                  value={available}
                  onValueChange={setAvailable}
                  trackColor={{ false: '#64748B', true: '#22C55E' }}
                  thumbColor={available ? '#15803D' : '#E2E8F0'}
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
    paddingBottom: 40,
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
    paddingBottom: 24,
  },
  carItem: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    gap: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  carHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  carIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(30,58,138,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carModel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  carSubtext: {
    fontSize: 14,
    color: '#475569',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusAvailable: {
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  statusUnavailable: {
    backgroundColor: 'rgba(248,113,113,0.15)',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  carDescription: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  carFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  carPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
  },
  carMeta: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(30,58,138,0.08)',
  },
  actionButtonText: {
    color: '#1E3A8A',
    fontWeight: '600',
    fontSize: 13,
  },
  editButton: {
    backgroundColor: 'rgba(30,58,138,0.08)',
  },
  deleteButton: {
    backgroundColor: 'rgba(220,38,38,0.12)',
  },
  deleteText: {
    color: '#DC2626',
  },
  loader: {
    marginTop: 30,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    height: '82%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formGroup: {
    marginBottom: 16,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  rowItem: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  textArea: {
    height: 90,
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
    color: '#1E3A8A',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
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