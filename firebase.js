// firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configuration Firebase - Remplacez avec vos propres informations
// Vous les trouverez dans la console Firebase : Project Settings > Your apps
const firebaseConfig = {
  apiKey: "AIzaSyB4Y197zTbf8UnXXOjZ-6o7SxeJaNQUaf0",
  authDomain: "locationdevoiture-536bf.firebaseapp.com",
  projectId: "locationdevoiture-536bf",
  storageBucket: "locationdevoiture-536bf.firebasestorage.app",
  messagingSenderId: "928457299872",
  appId: "1:928457299872:web:542a0f29db13513f7936c5",
  measurementId: "G-Z5GKHM2DQJ"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser Firestore (base de données)
export const db = getFirestore(app);

// Initialiser Authentication (authentification) avec persistance native sur mobile
export const auth = Platform.OS === 'web'
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });


export default app;