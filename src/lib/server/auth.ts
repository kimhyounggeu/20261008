import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "./firebase-admin";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function list(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** 접근 허용 목록이 설정되어 있으면 교사 계정인지 확인한다. */
function isAllowedTeacher(email: string | undefined) {
  const emails = list(process.env.ALLOWED_EMAILS);
  const domains = list(process.env.ALLOWED_EMAIL_DOMAINS);
  if (!emails.length && !domains.length) return true;
  if (!email) return false;
  const lower = email.toLowerCase();
  return emails.includes(lower) || domains.some((d) => lower.endsWith(`@${d}`));
}

/** Authorization: Bearer <Firebase ID 토큰>을 검증하고 사용자 정보를 돌려준다. */
export async function requireTeacher(request: Request): Promise<DecodedIdToken> {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer (.+)$/);
  if (!match) throw new HttpError(401, "로그인이 필요합니다.");

  let decoded: DecodedIdToken;
  try {
    decoded = await adminAuth.verifyIdToken(match[1]!);
  } catch {
    throw new HttpError(401, "로그인 정보가 만료되었습니다. 다시 로그인해 주세요.");
  }

  if (!isAllowedTeacher(decoded.email)) {
    throw new HttpError(403, "이 계정은 사용 권한이 없습니다. 관리자에게 문의하세요.");
  }
  return decoded;
}

/** 라우트 핸들러 공통 오류 처리 */
export function handleError(error: unknown) {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  // 설정 문제는 교사가 원인을 알 수 있게 알려 준다(비밀 값은 포함하지 않음).
  const message = error instanceof Error ? error.message : "";
  if (message.includes("Could not load the default credentials")) {
    return Response.json(
      { error: "서버가 Firebase에 접근할 권한이 없습니다. 서비스 계정(GOOGLE_APPLICATION_CREDENTIALS) 설정을 확인해 주세요." },
      { status: 500 },
    );
  }
  if (/database \(default\) does not exist/i.test(message)) {
    return Response.json({ error: "Firestore 데이터베이스가 아직 만들어지지 않았습니다. Firebase 콘솔에서 만들어 주세요." }, { status: 500 });
  }
  if (/bucket does not exist|specified bucket/i.test(message)) {
    return Response.json({ error: "Storage 버킷이 없습니다. Firebase 콘솔에서 Storage를 시작해 주세요." }, { status: 500 });
  }
  if (/requires an index/i.test(message)) {
    return Response.json({ error: "Firestore 색인이 필요합니다. `firebase deploy --only firestore`로 색인을 배포해 주세요." }, { status: 500 });
  }
  return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
}
