"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RubricForm } from "@/components/RubricForm";
import { apiFetch } from "@/lib/api-client";
import type { Rubric } from "@/lib/types";

function EditRubric() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch<{ rubric: Rubric }>(`/api/rubrics/${id}`)
      .then((d) => setRubric(d.rubric))
      .catch((e) => setError(e.message));
  }, [id]);

  async function remove() {
    if (!confirm("이 평가 기준을 삭제할까요? 이미 평가한 결과는 그대로 남습니다.")) return;
    try {
      await apiFetch(`/api/rubrics/${id}`, { method: "DELETE" });
      router.push("/rubrics");
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제하지 못했습니다.");
    }
  }

  return (
    <div className="stack lg narrow">
      <Link href="/rubrics" className="back">
        ← 평가 기준 목록
      </Link>
      <div className="row between wrap gap">
        <h1 className="h1">평가 기준 수정</h1>
        {rubric && (
          <div className="row gap">
            <Link href={`/evaluate?rubric=${rubric.id}`} className="btn">
              이 기준으로 평가
            </Link>
            <button className="btn ghost danger" onClick={remove}>
              삭제
            </button>
          </div>
        )}
      </div>
      {error && <p className="alert error">{error}</p>}
      {saved && <p className="alert ok">저장했습니다. 새로 평가하는 활동지부터 수정된 기준이 적용됩니다.</p>}
      {!rubric && !error && <div className="spinner" />}
      {rubric && (
        <RubricForm
          key={rubric.updatedAt}
          initial={rubric}
          submitLabel="변경 사항 저장"
          onSubmit={async (value) => {
            const d = await apiFetch<{ rubric: Rubric }>(`/api/rubrics/${id}`, {
              method: "PUT",
              body: JSON.stringify(value),
            });
            setRubric(d.rubric);
            setSaved(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
    </div>
  );
}

export default function EditRubricPage() {
  return (
    <AppShell>
      <EditRubric />
    </AppShell>
  );
}
