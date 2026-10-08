import { FieldValue } from "firebase-admin/firestore";
import { handleError, requireTeacher } from "@/lib/server/auth";
import { parseRubricInput, rubricsCol, toRubric } from "@/lib/server/rubrics";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireTeacher(request);
    const snap = await rubricsCol().where("ownerId", "==", user.uid).orderBy("updatedAt", "desc").limit(100).get();
    return Response.json({ rubrics: snap.docs.map(toRubric) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireTeacher(request);
    const input = parseRubricInput(await request.json().catch(() => null));
    const ref = await rubricsCol().add({
      ...input,
      ownerId: user.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return Response.json({ rubric: toRubric(await ref.get()) }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
