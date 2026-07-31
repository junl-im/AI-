import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithRedirect,
  type User,
} from 'firebase/auth'

function readFirebaseConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }
}

export function isFirebaseConfigured(): boolean {
  return Object.values(readFirebaseConfig()).every(Boolean)
}

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error('SOA-3001: Firebase 환경 변수가 설정되지 않았습니다.')
  }
  return getApps().length > 0 ? getApp() : initializeApp(readFirebaseConfig())
}

export async function startGoogleSignIn(): Promise<void> {
  const auth = getAuth(getFirebaseApp())
  await signInWithRedirect(auth, new GoogleAuthProvider())
}

export async function consumeGoogleSignInResult(): Promise<User | null> {
  if (!isFirebaseConfigured()) return null
  const result = await getRedirectResult(getAuth(getFirebaseApp()))
  return result?.user ?? null
}
