import type { NextConfig } from "next";

// Firebase App Hosting은 빌드 시 연결된 웹 앱 설정을 FIREBASE_WEBAPP_CONFIG로 넣어 준다.
// 로컬에서는 .env.local의 NEXT_PUBLIC_FIREBASE_* 값을 쓴다.
type WebAppConfig = Partial<Record<"apiKey" | "authDomain" | "projectId" | "appId", string>>;

function readWebAppConfig(): WebAppConfig {
  try {
    return process.env.FIREBASE_WEBAPP_CONFIG ? JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG) : {};
  } catch {
    return {};
  }
}

const webapp = readWebAppConfig();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || webapp.apiKey || "",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || webapp.authDomain || "",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || webapp.projectId || "",
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || webapp.appId || "",
  },
  // firebase-admin, @google/genai는 서버 번들에 포함하지 않고 node_modules에서 직접 불러온다.
  serverExternalPackages: ["firebase-admin", "@google/genai"],
};

export default nextConfig;
