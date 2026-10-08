"use client";

import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { clientAuth } from "@/lib/firebase-client";

const ERRORS: Record<string, string> = {
  "auth/invalid-credential": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "auth/invalid-email": "이메일 형식이 올바르지 않습니다.",
  "auth/email-already-in-use": "이미 가입된 이메일입니다. 로그인해 주세요.",
  "auth/weak-password": "비밀번호는 6자 이상이어야 합니다.",
  "auth/too-many-requests": "시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  "auth/operation-not-allowed": "Firebase 콘솔에서 이메일/비밀번호 로그인을 사용 설정해 주세요.",
};

function LoginForm() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next")?.startsWith("/") ? params.get("next")! : "/";

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, router, next]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "login") await signInWithEmailAndPassword(clientAuth(), email, password);
      else await createUserWithEmailAndPassword(clientAuth(), email, password);
    } catch (err) {
      setError((err instanceof FirebaseError && ERRORS[err.code]) || "로그인에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    if (!email) return setError("비밀번호를 재설정할 이메일을 먼저 입력해 주세요.");
    try {
      await sendPasswordResetEmail(clientAuth(), email);
      setNotice("비밀번호 재설정 메일을 보냈습니다.");
      setError("");
    } catch (err) {
      setError((err instanceof FirebaseError && ERRORS[err.code]) || "메일을 보내지 못했습니다.");
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand lg">
          <span className="brand-mark">✎</span> 활동지 AI 평가
        </div>
        <p className="muted">교사용 · 학생 활동지 PDF를 평가 기준에 맞춰 분석합니다.</p>

        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={mode === "login"} onClick={() => setMode("login")}>
            로그인
          </button>
          <button role="tab" aria-selected={mode === "signup"} onClick={() => setMode("signup")}>
            교사 계정 만들기
          </button>
        </div>

        <form onSubmit={onSubmit} className="stack">
          <label className="field">
            <span>이메일</span>
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span>비밀번호</span>
            <input
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="alert error">{error}</p>}
          {notice && <p className="alert ok">{notice}</p>}
          <button className="btn primary block" disabled={busy}>
            {busy ? "처리 중…" : mode === "login" ? "로그인" : "가입하고 시작하기"}
          </button>
          {mode === "login" && (
            <button type="button" className="link-btn" onClick={onReset}>
              비밀번호를 잊으셨나요?
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
