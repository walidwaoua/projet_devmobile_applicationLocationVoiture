import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { Alert } from 'react-native';

export const seedAdminUser = async () => {
    const email = 'admin@locavoiture.com';
    const password = 'admin123';

    try {
        // 1. Try to create the user (Auth)
        let user;
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            user = userCredential.user;
            console.log('Admin user created in Auth');
        } catch (authError) {
            if (authError.code === 'auth/email-already-in-use') {
                // If user exists, sign in to get the UID
                console.log('Admin user already exists in Auth, signing in...');
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                user = userCredential.user;
            } else {
                throw authError;
            }
        }

        // 2. Create/Update the user document in Firestore (Admin Role)
        if (user) {
            await setDoc(doc(db, 'users', user.uid), {
                name: 'Admin User',
                email: email,
                role: 'admin',
                createdAt: new Date().toISOString(),
                status: 'Active',
            }, { merge: true }); // Merge to avoid overwriting existing non-critical data if any

            console.log('Admin document created/updated in Firestore');
            Alert.alert('Succès', `Admin créé/vérifié !\nEmail: ${email}\nMdp: ${password}`);
            return true;
        }
    } catch (error) {
        console.error('Error seeding admin:', error);
        Alert.alert('Erreur', `Erreur lors de la création de l'admin: ${error.message}`);
        return false;
    }
};
