// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCKZFFLgpEKDZfucQabDGIzqihJdiIyyCk",
  authDomain: "furniture-cost-calculato-d815d.firebaseapp.com",
  projectId: "furniture-cost-calculato-d815d",
  storageBucket: "furniture-cost-calculato-d815d.firebasestorage.app",
  messagingSenderId: "330133534211",
  appId: "1:330133534211:web:5d1f596bc63a345c7c4036",
  measurementId: "G-KDMZWBM0N3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);