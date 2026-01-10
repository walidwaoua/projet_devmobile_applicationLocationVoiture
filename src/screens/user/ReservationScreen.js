import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { addDoc, collection, doc, getDoc, Timestamp } from 'firebase/firestore';

import { auth, db } from '../../../firebase';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const ReservationScreen = ({ navigation, route }) => {
  const car = route?.params?.car ?? null;
  const { width } = useWindowDimensions();
  const isCompact = width < 768;

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    pickupTime: '',
    returnTime: '',
    notes: '',
  });
  const [vehicleModel, setVehicleModel] = useState(car?.model || '');
  const [pickupDate, setPickupDate] = useState(null);
  const [returnDate, setReturnDate] = useState(null);
  const [showPickupPicker, setShowPickupPicker] = useState(false);
  const [showReturnPicker, setShowReturnPicker] = useState(false);
  const [showPickupTimePicker, setShowPickupTimePicker] = useState(false);
  const [showReturnTimePicker, setShowReturnTimePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [sessionMeta, setSessionMeta] = useState({ id: null, username: null, email: null });

  const heroAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    heroAnim.setValue(0);
    formAnim.setValue(0);

    Animated.timing(heroAnim, {
      toValue: 1,
      duration: 620,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.timing(formAnim, {
      toValue: 1,
      duration: 640,
      delay: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [heroAnim, formAnim]);

  useEffect(() => {
    if (car?.model && !vehicleModel) {
      setVehicleModel(car.model);
    }
  }, [car, vehicleModel]);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      try {
        const firebaseUser = auth.currentUser;
        let sessionId = null;
        let fallbackLogin = null;

        if (firebaseUser) {
          sessionId = firebaseUser.uid;
          fallbackLogin = firebaseUser.displayName || firebaseUser.email || null;
        } else {
          const stored = await AsyncStorage.getItem('localUser');
          if (stored) {
            const parsed = JSON.parse(stored);
            sessionId = parsed?.id || null;
            fallbackLogin = parsed?.username || null;
          }
        }

        if (!sessionId) {
          if (mounted) {
            setHydrating(false);
            navigation.replace('Login', {
              redirectTo: 'Reservation',
              redirectParams: { car },
            });
          }
          return;
        }

        if (mounted) {
          setSessionMeta({
            id: sessionId,
            username: fallbackLogin,
            email: fallbackLogin,
          });
        }

        const candidates = [doc(db, 'utilisateurs', sessionId), doc(db, 'users', sessionId)];
        let profileData = null;

        for (const candidate of candidates) {
          try {
            const snap = await getDoc(candidate);
            if (snap.exists()) {
              profileData = snap.data();
              break;
            }
          } catch (error) {
            console.warn('Erreur chargement profil (reservation):', error);
          }
        }

        if (mounted && profileData) {
          setForm((prev) => ({
            ...prev,
            firstName: profileData.firstName || profileData.prenom || prev.firstName,
            lastName: profileData.lastName || profileData.nom || prev.lastName,
            phone: profileData.phone || profileData.telephone || prev.phone,
            email: profileData.email || prev.email || fallbackLogin || '',
          }));
        } else if (mounted && fallbackLogin && !profileData) {
          setForm((prev) => ({
            ...prev,
            email: prev.email || fallbackLogin,
          }));
        }
      } catch (error) {
        console.error('Erreur initialisation réservation:', error);
      } finally {
        if (mounted) {
          setHydrating(false);
        }
      }
    };

    hydrate();

    return () => {
      mounted = false;
    };
  }, [car, navigation]);

  const dailyPrice = useMemo(() => {
    const value = Number(car?.dailyPrice);
    return Number.isFinite(value) ? Math.max(value, 0) : 0;
  }, [car]);

  const durationDays = useMemo(
    () => calculateDurationDays(pickupDate, returnDate),
    [pickupDate, returnDate]
  );

  const totalPrice = useMemo(
    () => Number((dailyPrice * durationDays).toFixed(2)),
    [dailyPrice, durationDays]
  );

  const estimatedReturnDate = useMemo(
    () => returnDate || computeReturnDateFromDuration(pickupDate, durationDays, form.pickupTime),
    [pickupDate, returnDate, durationDays, form.pickupTime]
  );

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePickupDateChange = (date) => {
    if (!date) {
      return;
    }

    const normalized = startOfDay(date);
    setPickupDate(normalized);
    setReturnDate((prev) => {
      if (!prev) {
        return prev;
      }
      const prevStart = startOfDay(prev);
      return prevStart.getTime() < normalized.getTime() ? normalized : prevStart;
    });
  };

  const handleReturnDateChange = (date) => {
    if (!date || !pickupDate) {
      return;
    }

    const normalized = startOfDay(date);
    const start = startOfDay(pickupDate);
    setReturnDate(normalized.getTime() < start.getTime() ? start : normalized);
  };

  const handlePickupTimeChange = (date) => {
    if (!date) {
      return;
    }

    const formatted = formatTime(date);
    setForm((prev) => ({
      ...prev,
      pickupTime: formatted,
      returnTime: prev.returnTime || formatted,
    }));
  };

  const handleReturnTimeChange = (date) => {
    if (!date) {
      return;
    }

    const formatted = formatTime(date);
    setForm((prev) => ({
      ...prev,
      returnTime: formatted,
    }));
  };

  const openPickupPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: pickupDate || new Date(),
        mode: 'date',
        display: 'calendar',
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            handlePickupDateChange(selectedDate);
          }
        },
      });
      return;
    }
    setShowPickupPicker(true);
  };

  const openReturnPicker = () => {
    if (!pickupDate) {
      Alert.alert('Information', 'Veuillez d’abord sélectionner la date de prise.');
      return;
    }

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: returnDate || pickupDate || new Date(),
        mode: 'date',
        display: 'calendar',
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            handleReturnDateChange(selectedDate);
          }
        },
      });
      return;
    }

    setShowReturnPicker(true);
  };

  const openPickupTimePicker = () => {
    const initialValue = timeStringToDate(form.pickupTime) || new Date();

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: initialValue,
        mode: 'time',
        is24Hour: true,
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            handlePickupTimeChange(selectedDate);
          }
        },
      });
      return;
    }

    setShowPickupTimePicker(true);
  };

  const openReturnTimePicker = () => {
    const initialValue =
      timeStringToDate(form.returnTime) || timeStringToDate(form.pickupTime) || new Date();

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: initialValue,
        mode: 'time',
        is24Hour: true,
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            handleReturnTimeChange(selectedDate);
          }
        },
      });
      return;
    }

    setShowReturnTimePicker(true);
  };

  const submitReservation = async () => {
    const requiredFields = [
      { key: 'firstName', label: 'Prénom' },
      { key: 'lastName', label: 'Nom' },
      { key: 'phone', label: 'Téléphone' },
      { key: 'pickupTime', label: 'Heure de prise' },
    ];

    const missingField = requiredFields.find((field) => !String(form[field.key] || '').trim());
    if (missingField) {
      Alert.alert('Champs obligatoires', `Veuillez renseigner ${missingField.label.toLowerCase()}.`);
      return;
    }

    if (!pickupDate) {
      Alert.alert('Date manquante', 'Veuillez sélectionner une date de prise.');
      return;
    }

    if (!vehicleModel.trim()) {
      Alert.alert('Modèle requis', 'Veuillez sélectionner un véhicule à réserver.');
      return;
    }

    try {
      setSubmitting(true);

      let userId = sessionMeta.id;
      let userEmail = form.email || sessionMeta.email || null;

      if (!userId) {
        const stored = await AsyncStorage.getItem('localUser');
        if (stored) {
          const parsed = JSON.parse(stored);
          userId = parsed?.id || null;
          userEmail = userEmail || parsed?.username || null;
        }
      }

      if (!userId) {
        Alert.alert('Connexion requise', 'Veuillez vous connecter avant de finaliser votre réservation.');
        navigation.navigate('Login', {
          redirectTo: 'Reservation',
          redirectParams: { car },
        });
        return;
      }

      const pickupDateString = pickupDate ? formatDateForStorage(pickupDate) : '';
      const returnDateSource = returnDate || estimatedReturnDate;
      const returnDateString = returnDateSource ? formatDateForStorage(returnDateSource) : '';

      const payload = {
        userId,
        userEmail,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        vehicleModel: vehicleModel.trim(),
        vehicleId: car?.id || null,
        pickupDate: pickupDateString,
        pickupTime: form.pickupTime.trim(),
        returnDate: returnDateString,
        returnTime: form.returnTime.trim() || form.pickupTime.trim(),
        days: durationDays,
        dailyPrice,
        totalPrice,
        notes: form.notes.trim(),
        status: 'Pending',
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'reservations'), payload);

      Alert.alert('Réservation créée', 'Votre demande a été enregistrée avec succès.');
      navigation.replace('ReservationHistory');
    } catch (error) {
      console.error('Erreur création réservation:', error);
      Alert.alert('Erreur', "Impossible d'enregistrer la réservation pour le moment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (hydrating) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={['top']}>
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text style={styles.loadingText}>Préparation de votre espace de réservation…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Nouvelle réservation</Text>
        <View style={styles.topSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.select({ ios: 90, android: 0 })}
      >
        <Animated.ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View
            style={[
              styles.heroCard,
              {
                opacity: heroAnim,
                transform: [
                  {
                    translateY: heroAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                  {
                    scale: heroAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.97, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.heroBadge}>
              <MaterialCommunityIcons name="car-sports" size={16} color="#38BDF8" />
              <Text style={styles.heroBadgeText}>Sélection personnalisée</Text>
            </View>
            <Text style={styles.heroTitle}>{vehicleModel ? vehicleModel : 'Choisissez un véhicule'}</Text>
            <Text style={styles.heroSubtitle}>
              Finalisez les détails de votre réservation et recevez une estimation instantanée du tarif.
            </Text>

            <View style={styles.heroStats}>
              <View style={styles.heroStatCard}>
                <MaterialCommunityIcons name="calendar" size={20} color="#1E3A8A" />
                <View>
                  <Text style={styles.heroStatLabel}>Durée</Text>
                  <Text style={styles.heroStatValue}>{durationDays} jour(s)</Text>
                </View>
              </View>
              <View style={styles.heroStatCard}>
                <MaterialCommunityIcons name="cash-multiple" size={20} color="#1E3A8A" />
                <View>
                  <Text style={styles.heroStatLabel}>Total estimé</Text>
                  <Text style={styles.heroStatValue}>{formatCurrency(totalPrice)}</Text>
                </View>
              </View>
            </View>

            {car?.dailyPrice ? (
              <View style={styles.priceChip}>
                <MaterialCommunityIcons name="tag-outline" size={18} color="#0F172A" />
                <Text style={styles.priceChipText}>{formatCurrency(Number(car.dailyPrice))} / jour</Text>
              </View>
            ) : (
              <Text style={styles.priceMissing}>
                Ajoutez un tarif journalier pour ce véhicule dans votre back-office afin de calculer le total automatiquement.
              </Text>
            )}
          </Animated.View>

          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: formAnim,
                transform: [
                  {
                    translateY: formAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [24, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>Informations personnelles</Text>
            <View style={[styles.inputGrid, isCompact && styles.inputGridStack]}>
              <FloatingInput
                label="Prénom"
                value={form.firstName}
                onChangeText={(value) => handleFieldChange('firstName', value)}
                icon="account"
                autoCapitalize="words"
                compact={isCompact}
              />
              <FloatingInput
                label="Nom"
                value={form.lastName}
                onChangeText={(value) => handleFieldChange('lastName', value)}
                icon="account-outline"
                autoCapitalize="words"
                compact={isCompact}
              />
            </View>
            <View style={[styles.inputGrid, isCompact && styles.inputGridStack]}>
              <FloatingInput
                label="Téléphone"
                value={form.phone}
                onChangeText={(value) => handleFieldChange('phone', value)}
                icon="phone"
                keyboardType="phone-pad"
                compact={isCompact}
              />
              <FloatingInput
                label="Email"
                value={form.email}
                onChangeText={(value) => handleFieldChange('email', value)}
                icon="email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="facultatif"
                compact={isCompact}
              />
            </View>

            <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Votre réservation</Text>
            <FloatingInput
              label="Véhicule"
              value={vehicleModel}
              onChangeText={setVehicleModel}
              icon="car"
              placeholder="Modèle sélectionné"
              autoCapitalize="words"
              compact={isCompact}
            />

            <View style={[styles.inputGrid, isCompact && styles.inputGridStack]}>
              <FloatingDateInput
                label="Date de prise"
                value={pickupDate}
                placeholder="Sélectionnez une date"
                icon="calendar-start"
                onPress={openPickupPicker}
                compact={isCompact}
              />
              <FloatingDateInput
                label="Heure de prise"
                value={form.pickupTime}
                placeholder="Sélectionnez une heure"
                icon="clock-outline"
                onPress={openPickupTimePicker}
                compact={isCompact}
              />
            </View>

            <View style={[styles.inputGrid, isCompact && styles.inputGridStack]}>
              <FloatingDateInput
                label="Date de retour"
                value={returnDate}
                placeholder={
                  estimatedReturnDate ? formatDateForDisplay(estimatedReturnDate) : 'Sélectionnez une date'
                }
                icon="calendar-end"
                onPress={openReturnPicker}
                compact={isCompact}
              />
              <FloatingDateInput
                label="Heure de retour"
                value={form.returnTime}
                placeholder={form.pickupTime ? `Par défaut ${form.pickupTime}` : 'Sélectionnez une heure'}
                icon="clock"
                onPress={openReturnTimePicker}
                compact={isCompact}
              />
            </View>

            {estimatedReturnDate && (
              <View style={styles.estimateBanner}>
                <MaterialCommunityIcons name="timeline-clock" size={18} color="#1E3A8A" />
                <View style={styles.estimateTextWrap}>
                  <Text style={styles.estimateTitle}>Retour estimé</Text>
                  <Text style={styles.estimateValue}>{formatDateForDisplay(estimatedReturnDate)}</Text>
                </View>
              </View>
            )}

            <FloatingInput
              label="Notes pour l'agence"
              value={form.notes}
              onChangeText={(value) => handleFieldChange('notes', value)}
              icon="note-text"
              placeholder="Optionnel"
              multiline
              numberOfLines={3}
              compact={isCompact}
            />

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tarif journalier</Text>
                <Text style={styles.summaryValue}>{formatCurrency(dailyPrice)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Durée</Text>
                <Text style={styles.summaryValue}>{durationDays} jour(s)</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                <Text style={styles.summaryTotalLabel}>Total estimé</Text>
                <Text style={styles.summaryTotalValue}>{formatCurrency(totalPrice)}</Text>
              </View>
            </View>

            <AnimatedTouchable
              activeOpacity={0.85}
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={submitReservation}
              disabled={submitting}
            >
              <MaterialCommunityIcons name="check-circle" size={18} color="#0F172A" />
              <Text style={styles.submitButtonText}>
                {submitting ? 'Enregistrement…' : 'Valider la réservation'}
              </Text>
            </AnimatedTouchable>
          </Animated.View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>

      {Platform.OS === 'ios' && (
        <>
          <DatePickerModal
            visible={showPickupPicker}
            value={pickupDate || new Date()}
            onChange={handlePickupDateChange}
            onClose={() => setShowPickupPicker(false)}
          />
          <DatePickerModal
            visible={showReturnPicker}
            value={returnDate || pickupDate || new Date()}
            onChange={handleReturnDateChange}
            onClose={() => setShowReturnPicker(false)}
          />
          <TimePickerModal
            visible={showPickupTimePicker}
            value={timeStringToDate(form.pickupTime) || new Date()}
            onChange={handlePickupTimeChange}
            onClose={() => setShowPickupTimePicker(false)}
          />
          <TimePickerModal
            visible={showReturnTimePicker}
            value={timeStringToDate(form.returnTime) || timeStringToDate(form.pickupTime) || new Date()}
            onChange={handleReturnTimeChange}
            onClose={() => setShowReturnTimePicker(false)}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const FloatingInput = ({
  label,
  icon,
  placeholder,
  multiline,
  numberOfLines,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
  compact,
}) => {
  const animated = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [animated, value]);

  const handleFocus = () => {
    Animated.timing(animated, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    if (value) {
      return;
    }
    Animated.timing(animated, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const labelStyle = {
    top: animated.interpolate({
      inputRange: [0, 1],
      outputRange: [18, 2],
    }),
    fontSize: animated.interpolate({
      inputRange: [0, 1],
      outputRange: [15, 11],
    }),
  };

  const wrapperStyles = [styles.inputWrapper, compact && styles.inputWrapperStack];

  return (
    <View style={wrapperStyles}>
      <MaterialCommunityIcons name={icon} size={18} color="#1E3A8A" style={styles.inputIcon} />
      <Animated.Text style={[styles.inputLabel, labelStyle]}>{label}</Animated.Text>
      <TextInput
        style={[styles.inputField, multiline && styles.inputMultiline]}
        placeholder={placeholder}
        placeholderTextColor="rgba(15,23,42,0.35)"
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </View>
  );
};

const FloatingDateInput = ({ label, icon, value, placeholder, onPress, compact }) => {
  const animated = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [animated, value]);

  const labelStyle = {
    top: animated.interpolate({
      inputRange: [0, 1],
      outputRange: [18, 2],
    }),
    fontSize: animated.interpolate({
      inputRange: [0, 1],
      outputRange: [15, 11],
    }),
  };

  const displayText = value
    ? value instanceof Date
      ? formatDateForDisplay(value)
      : String(value)
    : placeholder;

  const wrapperStyles = [styles.inputWrapper, compact && styles.inputWrapperStack];

  return (
    <TouchableOpacity style={wrapperStyles} activeOpacity={0.85} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={18} color="#1E3A8A" style={styles.inputIcon} />
      <Animated.Text style={[styles.inputLabel, labelStyle]}>{label}</Animated.Text>
      <Text style={value ? styles.dateValue : styles.datePlaceholder}>{displayText}</Text>
    </TouchableOpacity>
  );
};

const DatePickerModal = ({ visible, value, onChange, onClose }) => (
  <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
    <View style={styles.pickerOverlay}>
      <View style={styles.pickerSheet}>
        <DateTimePicker
          value={value instanceof Date ? value : new Date()}
          mode="date"
          display="inline"
          onChange={(_, selectedDate) => {
            if (selectedDate) {
              onChange(selectedDate);
            }
          }}
          style={styles.datePicker}
        />
        <TouchableOpacity style={styles.pickerCloseButton} onPress={onClose} activeOpacity={0.85}>
          <Text style={styles.pickerCloseText}>Terminé</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const TimePickerModal = ({ visible, value, onChange, onClose }) => (
  <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
    <View style={styles.pickerOverlay}>
      <View style={styles.pickerSheet}>
        <DateTimePicker
          value={value instanceof Date ? value : new Date()}
          mode="time"
          display="spinner"
          onChange={(_, selectedDate) => {
            if (selectedDate) {
              onChange(selectedDate);
            }
          }}
          style={styles.datePicker}
        />
        <TouchableOpacity style={styles.pickerCloseButton} onPress={onClose} activeOpacity={0.85}>
          <Text style={styles.pickerCloseText}>Terminé</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

function startOfDay(date) {
  if (!date) {
    return null;
  }
  const input = date instanceof Date ? new Date(date) : new Date(date);
  if (Number.isNaN(input.getTime())) {
    return null;
  }
  input.setHours(0, 0, 0, 0);
  return input;
}

function calculateDurationDays(start, end) {
  if (!start) {
    return 1;
  }
  const startDate = startOfDay(start);
  if (!startDate) {
    return 1;
  }
  if (!end) {
    return 1;
  }
  const endDate = startOfDay(end);
  if (!endDate) {
    return 1;
  }
  const diff = Math.max(Math.round((endDate.getTime() - startDate.getTime()) / 86400000), 0);
  return diff === 0 ? 1 : diff;
}

function computeReturnDateFromDuration(start, duration, pickupTime) {
  const base = startOfDay(start);
  if (!base) {
    return null;
  }

  const safeDuration = Math.max(Number(duration) || 1, 1);
  const result = new Date(base);
  result.setDate(result.getDate() + safeDuration);

  if (pickupTime) {
    const [hours, minutes] = pickupTime.split(':').map((part) => Number(part));
    if (!Number.isNaN(hours)) {
      result.setHours(hours);
    }
    if (!Number.isNaN(minutes)) {
      result.setMinutes(minutes);
    }
  }

  return result;
}

function formatDateForStorage(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function timeStringToDate(input) {
  if (!input) {
    return null;
  }

  if (input instanceof Date && !Number.isNaN(input.getTime())) {
    return input;
  }

  const [hoursRaw, minutesRaw] = String(input).split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatCurrency(value) {
  const amount = Number(value) || 0;
  return amount.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  });
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  flex: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#CBD5F5',
    fontSize: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  topSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },
  heroCard: {
    backgroundColor: '#1E3A8A',
    borderRadius: 28,
    padding: 24,
    gap: 18,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(125,211,252,0.15)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  heroBadgeText: {
    color: '#E0F2FE',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
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
  heroStats: {
    flexDirection: 'row',
    gap: 14,
  },
  heroStatCard: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.2)',
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  heroStatLabel: {
    color: 'rgba(248,250,252,0.72)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroStatValue: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  priceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    backgroundColor: '#FACC15',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  priceChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  priceMissing: {
    color: '#F8FAFC',
    fontSize: 12,
    opacity: 0.75,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 28,
    padding: 24,
    gap: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 22,
    elevation: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSpacing: {
    marginTop: 6,
  },
  inputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  inputGridStack: {
    flexDirection: 'column',
  },
  inputWrapper: {
    flex: 1,
    minWidth: '48%',
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.08)',
    paddingVertical: 18,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  inputWrapperStack: {
    minWidth: '100%',
  },
  inputIcon: {
    position: 'absolute',
    top: 20,
    right: 16,
    opacity: 0.75,
  },
  inputLabel: {
    position: 'absolute',
    left: 16,
    color: '#1E3A8A',
    fontWeight: '600',
  },
  inputField: {
    paddingTop: 18,
    paddingRight: 42,
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  dateValue: {
    marginTop: 18,
    paddingRight: 40,
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  datePlaceholder: {
    marginTop: 18,
    paddingRight: 40,
    color: 'rgba(15,23,42,0.35)',
    fontSize: 15,
    fontWeight: '600',
  },
  estimateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderRadius: 16,
    padding: 14,
  },
  estimateTextWrap: {
    flex: 1,
  },
  estimateTitle: {
    color: '#1E3A8A',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  estimateValue: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  summaryCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(241,245,249,0.9)',
    padding: 18,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#0F172A',
    fontWeight: '600',
  },
  summaryValue: {
    color: '#1E3A8A',
    fontWeight: '700',
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderColor: 'rgba(15,23,42,0.08)',
    paddingTop: 12,
  },
  summaryTotalLabel: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 15,
  },
  summaryTotalValue: {
    color: '#1D4ED8',
    fontWeight: '800',
    fontSize: 18,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FACC15',
    borderRadius: 999,
    paddingVertical: 16,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  pickerSheet: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  pickerCloseButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
  },
  pickerCloseText: {
    color: '#F8FAFC',
    fontWeight: '600',
    fontSize: 14,
  },
  datePicker: {
    alignSelf: 'stretch',
  },
});

export default ReservationScreen;
