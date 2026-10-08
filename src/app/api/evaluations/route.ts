import { FieldValue } from "firebase-admin/firestore";
import { MAX_PDF_BYTES } from "@/lib/types";
import { handleError, HttpError, requireTeacher } from "@/lib/server/auth";
import {
  evaluationsCol,
  isPdf,
  runEvaluation,
  storagePathFor,
  toEvaluation,
  uploadPdf,
} from "@/lib/server/evaluations";
import { getOwnedRubric, toRubric } from "@/lib/server/rubrics";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  try {
    const user = await requireTeacher(request);
    const snap = await evaluationsCol().where("ownerId", "==", user.uid).orderBy("createdAt", "desc").limit(200).get();
    return Response.json({ evaluations: snap.docs.map(toEvaluation) });
  } catch (error) {
    return handleError(error);
  }
}

/** multipart/form-data: file(PDF), rubricId, studentName */
export async function POST(request: Request) {
  try {
    const user = await requireTeacher(request);
    const form = await request.formData().catch(() => {
      throw new HttpError(400, "업로드 형식이 올바르지 않습니다.");
    });

    const file = form.get("file");
    const rubricId = String(form.get("rubricId") ?? "");
    const studentName = String(form.get("studentName") ?? "").trim().slice(0, 50);

    if (!(file instanceof File) || file.size === 0) throw new HttpError(400, "PDF 파일을 선택해 주세요.");
    if (file.size > MAX_PDF_BYTES) throw new HttpError(413, "PDF는 20MB 이하만 올릴 수 있습니다.");
    if (!rubricId) throw new HttpError(400, "평가 기준을 선택해 주세요.");

    const pdf = Buffer.from(await file.arrayBuffer());
    if (!isPdf(pdf)) throw new HttpError(400, "PDF 파일만 올릴 수 있습니다.");

    const rubric = toRubric(await getOwnedRubric(rubricId, user.uid));
    const snapshot = { title: rubric.title, description: rubric.description, criteria: rubric.criteria };
    const fileName = file.name.slice(0, 200) || "worksheet.pdf";

    const ref = evaluationsCol().doc();
    const storagePath = storagePathFor(user.uid, ref.id);
    await uploadPdf(storagePath, pdf, fileName);

    await ref.set({
      ownerId: user.uid,
      rubricId,
      rubricSnapshot: snapshot,
      studentName,
      fileName,
      fileSize: pdf.byteLength,
      storagePath,
      status: "processing",
      results: [],
      overallFeedback: "",
      totalScore: 0,
      maxTotal: snapshot.criteria.reduce((s, c) => s + c.maxScore, 0),
      model: "",
      error: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await runEvaluation(ref, pdf, fileName, snapshot, studentName);
    return Response.json({ evaluation: toEvaluation(await ref.get()) }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
