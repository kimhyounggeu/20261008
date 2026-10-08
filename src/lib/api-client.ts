"use client";

import { clientAuth } from "./firebase-client";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** 로그인한 사용자의 ID 토큰을 붙여 서버 API를 호출한다. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const user = clientAuth().currentUser;
  if (!user) throw new ApiError("로그인이 필요합니다.", 401);

  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");

  const res = await fetch(path, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? `요청 실패 (${res.status})`, res.status);
  return data as T;
}

/** 인증이 필요한 PDF를 받아 새 탭에서 연다. */
export async function openPdf(evaluationId: string) {
  const user = clientAuth().currentUser;
  if (!user) return;
  const win = window.open("", "_blank");
  const token = await user.getIdToken();
  const res = await fetch(`/api/evaluations/${evaluationId}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    win?.close();
    alert("PDF를 불러오지 못했습니다.");
    return;
  }
  const url = URL.createObjectURL(await res.blob());
  if (win) win.location.href = url;
  else window.location.href = url;
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
