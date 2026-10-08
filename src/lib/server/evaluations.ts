import "server-only";

import { FieldValue, Timestamp, type DocumentReference, type DocumentSnapshot } from "firebase-admin/firestore";
import type { Evaluation, RubricInput } from "../types";
import { HttpError } from "./auth";
import { bucket, db } from "./firebase-admin";
import { evaluatePdf, geminiModel } from "./gemini";

export const evaluationsCol = () => db.collection("evaluations");

const toIso = (v: unknown) => (v instanceof Timestamp ? v.toDate().toISOString() : "");

export function toEvaluation(doc: DocumentSnapshot): Evaluation {
  const d = doc.data()!;
  return {
    id: doc.id,
    rubricId: d.rubricId,
    rubricSnapshot: d.rubricSnapshot,
    studentName: d.studentName ?? "",
    fileName: d.fileName,
    fileSize: d.fileSize ?? 0,
    status: d.status,
    results: d.results ?? [],
    overallFeedback: d.overallFeedback ?? "",
    totalScore: d.totalScore ?? 0,
    maxTotal: d.maxTotal ?? 0,
    model: d.model ?? "",
    error: d.error ?? null,
    createdAt: toIso(d.createdAt),
    updatedAt: toIso(d.updatedAt),
  };
}

export async function getOwnedEvaluation(id: string, uid: string) {
  const doc = await evaluationsCol().doc(id).get();
  if (!doc.exists || doc.get("ownerId") !== uid) throw new HttpError(404, "평가 결과를 찾을 수 없습니다.");
  return doc;
}

export function storagePathFor(uid: string, evaluationId: string) {
  return `worksheets/${uid}/${evaluationId}.pdf`;
}

export async function uploadPdf(path: string, pdf: Buffer, fileName: string) {
  await bucket()
    .file(path)
    .save(pdf, {
      resumable: false,
      contentType: "application/pdf",
      metadata: { metadata: { originalName: encodeURIComponent(fileName) } },
    });
}

export async function downloadPdf(path: string) {
  const [data] = await bucket().file(path).download();
  return data;
}

export async function deletePdf(path: string) {
  await bucket().file(path).delete({ ignoreNotFound: true });
}

/** Gemini 평가를 실행하고 결과(또는 오류)를 Firestore 문서에 기록한다. */
export async function runEvaluation(
  ref: DocumentReference,
  pdf: Buffer,
  fileName: string,
  rubric: RubricInput,
  studentName: string,
) {
  await ref.update({ status: "processing", error: null, model: geminiModel(), updatedAt: FieldValue.serverTimestamp() });
  try {
    const result = await evaluatePdf(pdf, fileName, rubric, studentName);
    await ref.update({ ...result, status: "done", error: null, updatedAt: FieldValue.serverTimestamp() });
  } catch (error) {
    console.error("Gemini evaluation failed", error);
    const message = error instanceof Error ? error.message : String(error);
    await ref.update({
      status: "error",
      error: `AI 평가 중 오류가 발생했습니다: ${message.slice(0, 300)}`,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

/** 업로드된 파일이 실제 PDF인지 시그니처로 확인한다. */
export function isPdf(buf: Buffer) {
  return buf.subarray(0, 5).toString("latin1") === "%PDF-";
}
