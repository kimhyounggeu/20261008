"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// 브라우저에서는 로그인(Firebase Authentication)만 사용한다.
// Firestore·Storage·Gemini 접근은 모두 서버 API를 통한다.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let auth: Auth | null = null;

/** 빌드(프리렌더) 중에는 초기화하지 않도록 처음 쓰일 때 만든다. */
export function clientAuth(): Auth {
  if (!auth) {
    const app = getApps().length ? getApp() : initializeApp(config);
    auth = getAuth(app);
  }
  return auth;
}
