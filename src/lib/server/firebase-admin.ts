import "server-only";

import { getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// App Hosting(Cloud Run)에서는 서비스 계정 자격 증명과 FIREBASE_CONFIG가 자동으로 주어진다.
// 로컬에서는 Application Default Credentials와 .env.local의 FIREBASE_* 값을 사용한다.
function createApp(): App {
  if (getApps().length) return getApps()[0]!;

  let fromEnv: { projectId?: string; storageBucket?: string } = {};
  try {
    if (process.env.FIREBASE_CONFIG) fromEnv = JSON.parse(process.env.FIREBASE_CONFIG);
  } catch {
    // FIREBASE_CONFIG가 JSON이 아니면 무시
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || fromEnv.projectId;
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET || fromEnv.storageBucket || (projectId ? `${projectId}.firebasestorage.app` : undefined);

  return initializeApp({ projectId, storageBucket });
}

const app = createApp();

export const adminAuth = getAuth(app);
export const db = getFirestore(app);
export const bucket = () => getStorage(app).bucket();
