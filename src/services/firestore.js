import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

const mapSnapshot = (snapshot) =>
  snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));

export const listenToCollection = ({
  collectionName,
  onData,
  onError = console.error,
  orderByField,
  orderDirection = 'asc',
}) => {
  const baseRef = collection(db, collectionName);
  const q = orderByField ? query(baseRef, orderBy(orderByField, orderDirection)) : baseRef;

  return onSnapshot(
    q,
    (snapshot) => onData(mapSnapshot(snapshot)),
    (error) => onError(error)
  );
};

export const createDocument = (collectionName, data) => addDoc(collection(db, collectionName), data);

export const patchDocument = (collectionName, id, data) => updateDoc(doc(db, collectionName, id), data);

export const removeDocument = (collectionName, id) => deleteDoc(doc(db, collectionName, id));
