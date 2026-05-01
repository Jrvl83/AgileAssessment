import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyDcsMNbGqwmkbgg3k41dPfKCEgWMnX0SaM',
  authDomain: 'agile-assessment-5a117.firebaseapp.com',
  projectId: 'agile-assessment-5a117',
  storageBucket: 'agile-assessment-5a117.firebasestorage.app',
  messagingSenderId: '41571782884',
  appId: '1:41571782884:web:e8b96178aeffc4649edcf1',
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const fns = getFunctions(app);
