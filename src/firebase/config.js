import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
   apiKey: "AIzaSyCpFphoGvOXC0xwEqwox6XgfFWcfsMVjRw",
  authDomain: "bisht-ro.firebaseapp.com",
  projectId: "bisht-ro",
  storageBucket: "bisht-ro.firebasestorage.app",
  messagingSenderId: "615024966575",
  appId: "1:615024966575:web:230c7f8f4d393828c4cd5a",
  measurementId: "G-731CC7HHRR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const auth = getAuth(app); 

export { db, auth };
