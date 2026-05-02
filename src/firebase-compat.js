import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import 'firebase/compat/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyDcsMNbGqwmkbgg3k41dPfKCEgWMnX0SaM',
  authDomain: 'agile-assessment-5a117.firebaseapp.com',
  projectId: 'agile-assessment-5a117',
  storageBucket: 'agile-assessment-5a117.firebasestorage.app',
  messagingSenderId: '41571782884',
  appId: '1:41571782884:web:e8b96178aeffc4649edcf1',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const db = firebase.firestore();
export const auth = firebase.auth();
export const fns = firebase.functions();
export { firebase };
