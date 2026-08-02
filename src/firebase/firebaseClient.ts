const FIREBASE_VERSION = '11.4.0'
const FIREBASE_APP_MODULE_URL = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`
const FIREBASE_AUTH_MODULE_URL = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`

interface FirebaseConfig {
  apiKey: string | undefined
  authDomain: string | undefined
  projectId: string | undefined
  storageBucket: string | undefined
  messagingSenderId: string | undefined
  appId: string | undefined
}

interface FirebaseApp {
  readonly name: string
}

interface FirebaseUser {
  readonly displayName: string | null
}

interface FirebaseAppModule {
  getApp(): FirebaseApp
  getApps(): FirebaseApp[]
  initializeApp(config: FirebaseConfig): FirebaseApp
}

interface FirebaseAuth {
  readonly app: FirebaseApp
}

interface FirebaseAuthResult {
  readonly user: FirebaseUser
}

interface FirebaseAuthModule {
  GoogleAuthProvider: new () => object
  getAuth(app: FirebaseApp): FirebaseAuth
  getRedirectResult(auth: FirebaseAuth): Promise<FirebaseAuthResult | null>
  signInWithRedirect(auth: FirebaseAuth, provider: object): Promise<void>
}

interface FirebaseModules {
  readonly app: FirebaseAppModule
  readonly auth: FirebaseAuthModule
}

let modulesPromise: Promise<FirebaseModules> | null = null

function readFirebaseConfig(): FirebaseConfig {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }
}

async function loadFirebaseModules(): Promise<FirebaseModules> {
  modulesPromise ??= Promise.all([
    import(/* @vite-ignore */ FIREBASE_APP_MODULE_URL) as Promise<FirebaseAppModule>,
    import(/* @vite-ignore */ FIREBASE_AUTH_MODULE_URL) as Promise<FirebaseAuthModule>,
  ]).then(([app, auth]) => ({ app, auth }))
  return modulesPromise
}

export function isFirebaseConfigured(): boolean {
  return Object.values(readFirebaseConfig()).every(Boolean)
}

export async function getFirebaseApp(): Promise<FirebaseApp> {
  if (!isFirebaseConfigured()) {
    throw new Error('SOA-3001: Firebase 환경 변수가 설정되지 않았습니다.')
  }
  const { app } = await loadFirebaseModules()
  return app.getApps().length > 0 ? app.getApp() : app.initializeApp(readFirebaseConfig())
}

export async function startGoogleSignIn(): Promise<void> {
  const { auth } = await loadFirebaseModules()
  await auth.signInWithRedirect(auth.getAuth(await getFirebaseApp()), new auth.GoogleAuthProvider())
}

export async function consumeGoogleSignInResult(): Promise<FirebaseUser | null> {
  if (!isFirebaseConfigured()) return null
  const { auth } = await loadFirebaseModules()
  const result = await auth.getRedirectResult(auth.getAuth(await getFirebaseApp()))
  return result?.user ?? null
}
