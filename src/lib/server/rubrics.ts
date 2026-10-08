import "server-only";

import { randomUUID } from "node:crypto";
import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import type { Criterion, Rubric, RubricInput } from "../types";
import { HttpError } from "./auth";
import { db } from "./firebase-admin";

export const rubricsCol = () => db.collection("rubrics");

const toIso = (v: unknown) => (v instanceof Timestamp ? v.toDate().toISOString() : "");

export function toRubric(doc: DocumentSnapshot): Rubric {
  const d = doc.data()!;
  return {
    id: doc.id,
    title: d.title,
    description: d.description ?? "",
    criteria: d.criteria ?? [],
    createdAt: toIso(d.createdAt),
    updatedAt: toIso(d.updatedAt),
  };
}

/** 본인 소유 문서만 반환하고, 아니면 404 (존재 여부도 숨긴다) */
export async function getOwnedRubric(id: string, uid: string) {
  const doc = await rubricsCol().doc(id).get();
  if (!doc.exists || doc.get("ownerId") !== uid) throw new HttpError(404, "평가 기준을 찾을 수 없습니다.");
  return doc;
}

function str(v: unknown, field: string, max: number, required = false) {
  const s = typeof v === "string" ? v.trim() : "";
  if (required && !s) throw new HttpError(400, `${field}을(를) 입력해 주세요.`);
  if (s.length > max) throw new HttpError(400, `${field}은(는) ${max}자 이하로 입력해 주세요.`);
  return s;
}

/** 요청 본문을 검증해 저장 가능한 형태로 정리한다. */
export function parseRubricInput(body: unknown): RubricInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const title = str(b.title, "기준 이름", 100, true);
  const description = str(b.description, "과제 설명", 3000);

  if (!Array.isArray(b.criteria) || b.criteria.length === 0) {
    throw new HttpError(400, "평가 항목을 하나 이상 추가해 주세요.");
  }
  if (b.criteria.length > 20) throw new HttpError(400, "평가 항목은 20개까지 만들 수 있습니다.");

  const criteria: Criterion[] = b.criteria.map((raw, i) => {
    const c = (raw ?? {}) as Record<string, unknown>;
    const maxScore = Number(c.maxScore);
    if (!Number.isFinite(maxScore) || maxScore <= 0 || maxScore > 100) {
      throw new HttpError(400, `${i + 1}번 항목의 배점은 1~100 사이로 입력해 주세요.`);
    }
    return {
      id: typeof c.id === "string" && /^[\w-]{1,64}$/.test(c.id) ? c.id : randomUUID(),
      name: str(c.name, `${i + 1}번 항목 이름`, 100, true),
      description: str(c.description, `${i + 1}번 항목 설명`, 2000),
      maxScore: Math.round(maxScore * 10) / 10,
    };
  });

  return { title, description, criteria };
}
