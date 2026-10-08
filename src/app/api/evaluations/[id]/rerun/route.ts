import type { RubricInput } from "@/lib/types";
import { handleError, HttpError, requireTeacher } from "@/lib/server/auth";
import { downloadPdf, getOwnedEvaluation, runEvaluation, toEvaluation } from "@/lib/server/evaluations";
import { rubricsCol, toRubric } from "@/lib/server/rubrics";

export const runtime = "nodejs";
export const maxDuration = 300;

type Ctx = { params: Promise<{ id: string }> };

/**
 * 저장된 PDF로 다시 평가한다.
 * body.useLatestRubric가 true면 수정된 현재 기준으로, 아니면 처음 평가 때의 기준으로 평가한다.
 */
export async function POST(request: Request, { params }: Ctx) {
  try {
    const user = await requireTeacher(request);
    const doc = await getOwnedEvaluation((await params).id, user.uid);
    const body = (await request.json().catch(() => ({}))) as { useLatestRubric?: boolean };

    let rubric = doc.get("rubricSnapshot") as RubricInput;
    if (body.useLatestRubric) {
      const rubricDoc = await rubricsCol().doc(doc.get("rubricId")).get();
      if (!rubricDoc.exists || rubricDoc.get("ownerId") !== user.uid) {
        throw new HttpError(404, "원래 평가 기준이 삭제되어 현재 기준으로 다시 평가할 수 없습니다.");
      }
      const latest = toRubric(rubricDoc);
      rubric = { title: latest.title, description: latest.description, criteria: latest.criteria };
      await doc.ref.update({
        rubricSnapshot: rubric,
        results: [],
        maxTotal: latest.criteria.reduce((s, c) => s + c.maxScore, 0),
      });
    }

    const pdf = await downloadPdf(doc.get("storagePath"));
    await runEvaluation(doc.ref, pdf, doc.get("fileName"), rubric, doc.get("studentName") ?? "");
    return Response.json({ evaluation: toEvaluation(await doc.ref.get()) });
  } catch (error) {
    return handleError(error);
  }
}
