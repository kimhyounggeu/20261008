import { FieldValue } from "firebase-admin/firestore";
import { handleError, requireTeacher } from "@/lib/server/auth";
import { getOwnedRubric, parseRubricInput, toRubric } from "@/lib/server/rubrics";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Ctx) {
  try {
    const user = await requireTeacher(request);
    const doc = await getOwnedRubric((await params).id, user.uid);
    return Response.json({ rubric: toRubric(doc) });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: Request, { params }: Ctx) {
  try {
    const user = await requireTeacher(request);
    const doc = await getOwnedRubric((await params).id, user.uid);
    const input = parseRubricInput(await request.json().catch(() => null));
    await doc.ref.update({ ...input, updatedAt: FieldValue.serverTimestamp() });
    return Response.json({ rubric: toRubric(await doc.ref.get()) });
  } catch (error) {
    return handleError(error);
  }
}

// 기존 평가 결과는 기준 사본(rubricSnapshot)을 갖고 있으므로 기준을 지워도 결과는 남는다.
export async function DELETE(request: Request, { params }: Ctx) {
  try {
    const user = await requireTeacher(request);
    const doc = await getOwnedRubric((await params).id, user.uid);
    await doc.ref.delete();
    return Response.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
