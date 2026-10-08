"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { apiFetch } from "@/lib/api-client";
import type { Rubric } from "@/lib/types";

function RubricList() {
  const [rubrics, setRubrics] = useState<Rubric[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<{ rubrics: Rubric[] }>("/api/rubrics")
      .then((d) => setRubrics(d.rubrics))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="stack lg">
      <div className="row between wrap gap">
        <div>
          <h1 className="h1">평가 기준</h1>
          <p className="muted">활동지마다 평가 항목과 배점을 정해 두고 재사용하세요.</p>
        </div>
        <Link href="/rubrics/new" className="btn primary">
          + 새 평가 기준
        </Link>
      </div>

      {error && <p className="alert error">{error}</p>}
      {!rubrics && !error && <div className="spinner" />}
      {rubrics?.length === 0 && (
        <div className="empty card">
          <p>아직 평가 기준이 없습니다.</p>
          <Link href="/rubrics/new" className="btn primary">
            첫 평가 기준 만들기
          </Link>
        </div>
      )}

      <ul className="grid-cards">
        {rubrics?.map((r) => (
          <li key={r.id}>
            <Link href={`/rubrics/${r.id}`} className="card link-card">
              <h3 className="h3">{r.title}</h3>
              {r.description && <p className="muted clamp-2">{r.description}</p>}
              <p className="small muted">
                항목 {r.criteria.length}개 · 총 {r.criteria.reduce((s, c) => s + c.maxScore, 0)}점
              </p>
              <ul className="chips">
                {r.criteria.slice(0, 4).map((c) => (
                  <li key={c.id}>{c.name}</li>
                ))}
                {r.criteria.length > 4 && <li>+{r.criteria.length - 4}</li>}
              </ul>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RubricsPage() {
  return (
    <AppShell>
      <RubricList />
    </AppShell>
  );
}
