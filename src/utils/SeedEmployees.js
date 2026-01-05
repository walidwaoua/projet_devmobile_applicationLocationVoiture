import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import * as Crypto from 'expo-crypto';
import { Alert } from 'react-native';

export const seedEmployees = async () => {
    try {
        const employeesRef = collection(db, 'employees');
        const q = query(employeesRef, where('username', '==', 'admin'));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            console.log('Admin employee already exists');
            Alert.alert('Info', 'L\'utilisateur admin existe déjà dans la table employees.');
            return false;
        }

        // Hash the password "admin"
        const password = 'admin';
        const hashedPassword = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            password
        );

        // Create the admin user
        await addDoc(employeesRef, {
            username: 'admin',
            password: hashedPassword,
            role: 'admin',
            createdAt: new Date().toISOString(),
        });

        console.log('Admin employee created successfully');
        Alert.alert('Succès', 'Utilisateur admin créé dans la table employees !\nUsername: admin\nPassword: admin');
        return true;
    } catch (error) {
        console.error('Error seeding employees:', error);
        Alert.alert('Erreur', `Erreur lors de la création de l'employé: ${error.message}`);
        return false;
    }
};
