import { handleError, requireTeacher } from "@/lib/server/auth";
import { deletePdf, getOwnedEvaluation, toEvaluation } from "@/lib/server/evaluations";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Ctx) {
  try {
    const user = await requireTeacher(request);
    const doc = await getOwnedEvaluation((await params).id, user.uid);
    return Response.json({ evaluation: toEvaluation(doc) });
  } catch (error) {
    return handleError(error);
  }
}

/** 평가 결과와 저장된 PDF를 함께 삭제한다. */
export async function DELETE(request: Request, { params }: Ctx) {
  try {
    const user = await requireTeacher(request);
    const doc = await getOwnedEvaluation((await params).id, user.uid);
    await deletePdf(doc.get("storagePath"));
    await doc.ref.delete();
    return Response.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
