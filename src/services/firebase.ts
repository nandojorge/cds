import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { CDItem } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore (with databaseId specified in firebase-applet-config.json)
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Clean undefined fields before writing to Firestore
function cleanFirestoreData(data: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined) {
      cleaned[key] = data[key];
    }
  });
  return cleaned;
}

// Stable Device/User Identifier
export function getLocalUserId(): string {
  let uid = localStorage.getItem('mycollection_user_id');
  if (!uid) {
    uid = 'user_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('mycollection_user_id', uid);
  }
  return uid;
}

// Auth helpers
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout Error:', error);
    throw error;
  }
}

// Subscribe to real-time CDs & Wishlist collection in Firestore
export function subscribeToCDs(
  onData: (cds: CDItem[]) => void, 
  onError?: (err: Error) => void
) {
  const cdsRef = collection(db, 'cds');

  return onSnapshot(
    cdsRef,
    (snapshot) => {
      const items: CDItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          title: data.title || '',
          artist: data.artist || '',
          year: data.year || 0,
          genre: data.genre || undefined,
          coverUrl: data.coverUrl || undefined,
          mbid: data.mbid || undefined,
          barcode: data.barcode || undefined,
          label: data.label || undefined,
          country: data.country || undefined,
          trackCount: data.trackCount || undefined,
          tracks: Array.isArray(data.tracks) ? data.tracks : [],
          status: data.status || 'collection',
          mediaFormat: data.mediaFormat || 'CD',
          marketPrice: data.marketPrice || undefined,
          desiredPrice: data.desiredPrice || undefined,
          purchaseNotes: data.purchaseNotes || undefined,
          priority: data.priority || undefined,
          addedAt: data.addedAt || new Date().toISOString(),
          addedToCollectionDate: data.addedToCollectionDate || undefined,
          loanedTo: data.loanedTo || undefined,
          loanDate: data.loanDate || undefined,
          condition: data.condition || undefined,
          shelfLocation: data.shelfLocation || undefined,
          actualPrice: data.actualPrice || undefined,
          rating: data.rating || undefined,
        });
      });
      onData(items);
    },
    (error) => {
      console.error('Error fetching real-time CDs from Firestore:', error);
      if (onError) onError(error);
    }
  );
}

// Add or Update a CD directly in Firestore
export async function saveCDToFirestore(cd: CDItem, userId?: string): Promise<void> {
  const docRef = doc(db, 'cds', cd.id);
  const data = cleanFirestoreData({
    ...cd,
    userId: userId || auth.currentUser?.uid || getLocalUserId(),
    updatedAt: new Date().toISOString(),
  });
  await setDoc(docRef, data, { merge: true });
}

// Update a CD in Firestore
export async function updateCDInFirestore(cd: CDItem, userId?: string): Promise<void> {
  const docRef = doc(db, 'cds', cd.id);
  const data = cleanFirestoreData({
    ...cd,
    userId: userId || auth.currentUser?.uid || getLocalUserId(),
    updatedAt: new Date().toISOString(),
  });
  await setDoc(docRef, data, { merge: true });
}

// Delete a CD from Firestore
export async function deleteCDFromFirestore(cdId: string): Promise<void> {
  const docRef = doc(db, 'cds', cdId);
  await deleteDoc(docRef);
}

// Initial direct sync: write initial seed items to Firestore if database collection is empty
export async function initializeAndSeedFirestore(items: CDItem[]): Promise<boolean> {
  try {
    const cdsRef = collection(db, 'cds');
    const snap = await getDocs(cdsRef);

    if (snap.empty && items.length > 0) {
      const batch = writeBatch(db);
      const uid = auth.currentUser?.uid || getLocalUserId();
      for (const item of items) {
        const docRef = doc(db, 'cds', item.id);
        const data = cleanFirestoreData({
          ...item,
          userId: uid,
          updatedAt: new Date().toISOString(),
        });
        batch.set(docRef, data);
      }
      await batch.commit();
      console.log(`Successfully seeded ${items.length} CDs to Firestore collection 'cds'`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error seeding Firestore data:', error);
    // Fallback: try individual setDoc in case batch encounters an issue
    try {
      const uid = auth.currentUser?.uid || getLocalUserId();
      for (const item of items) {
        await saveCDToFirestore(item, uid);
      }
      return true;
    } catch (fallbackError) {
      console.error('Fallback seed error:', fallbackError);
      return false;
    }
  }
}
