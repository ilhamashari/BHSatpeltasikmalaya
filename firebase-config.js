// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDqxAq23-TycvMqWtahatCDAPyS9avI-d4",
  authDomain: "bhsatpeltasikmalaya.firebaseapp.com",
  projectId: "bhsatpeltasikmalaya",
  storageBucket: "bhsatpeltasikmalaya.appspot.com",
  messagingSenderId: "203492163419",
  appId: "1:203492163419:web:64f67f256b360d2e07a47e"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services with error handling
let db, storage, auth;

try {
    db = firebase.firestore();
    storage = firebase.storage();
    auth = firebase.auth();
} catch (error) {
    console.error('Error initializing Firebase services:', error);
    // Fallback: set to null if service not available
    db = null;
    storage = null;
    auth = null;
}

// Database collections
const jembatanCollection = db ? db.collection('jembatan') : null;

// Firebase Database Functions
class FirebaseService {
    // Add new jembatan
    static async addJembatan(jembatanData) {
        if (!db || !jembatanCollection) {
            throw new Error('Firestore not available');
        }
        try {
            const docRef = await jembatanCollection.add({
                ...jembatanData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding jembatan:', error);
            throw error;
        }
    }
    // Get all jembatan
    static async getAllJembatan() {
        try {
            const snapshot = await jembatanCollection.orderBy('createdAt', 'desc').get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting jembatan:', error);
            throw error;
        }
    }
    // Update jembatan
    static async updateJembatan(id, jembatanData) {
        try {
            await jembatanCollection.doc(id).update({
                ...jembatanData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating jembatan:', error);
            throw error;
        }
    }
    // Delete jembatan
    static async deleteJembatan(id) {
        try {
            await jembatanCollection.doc(id).delete();
        } catch (error) {
            console.error('Error deleting jembatan:', error);
            throw error;
        }
    }
    // Upload foto
    static async uploadFoto(file, jembatanId) {
        if (!storage) {
            throw new Error('Firebase Storage not available');
        }
        try {
            const storageRef = storage.ref();
            const fotoRef = storageRef.child(`jembatan/${jembatanId}/${file.name}`);
            const snapshot = await fotoRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            return downloadURL;
        } catch (error) {
            console.error('Error uploading foto:', error);
            throw error;
        }
    }
    // Delete foto
    static async deleteFoto(fotoURL) {
        try {
            const fotoRef = storage.refFromURL(fotoURL);
            await fotoRef.delete();
        } catch (error) {
            console.error('Error deleting foto:', error);
            throw error;
        }
    }
    // Real-time listener
    static onJembatanUpdate(callback) {
        return jembatanCollection
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const jembatanData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(jembatanData);
            });
    }
}

// Export for use in other files
window.FirebaseService = FirebaseService; 