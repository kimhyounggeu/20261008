import { handleError, requireTeacher } from "@/lib/server/auth";
import { downloadPdf, getOwnedEvaluation } from "@/lib/server/evaluations";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/** 본인이 올린 PDF만 서버를 거쳐 내려준다(Storage 직접 접근은 규칙으로 차단). */
export async function GET(request: Request, { params }: Ctx) {
  try {
    const user = await requireTeacher(request);
    const doc = await getOwnedEvaluation((await params).id, user.uid);
    const data = await downloadPdf(doc.get("storagePath"));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(doc.get("fileName"))}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
