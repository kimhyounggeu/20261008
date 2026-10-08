"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { apiFetch } from "@/lib/api-client";
import type { Evaluation } from "@/lib/types";

const STATUS = { processing: "평가 중", done: "완료", error: "오류" } as const;

function Dashboard() {
  const [items, setItems] = useState<Evaluation[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [rubric, setRubric] = useState("");

  useEffect(() => {
    apiFetch<{ evaluations: Evaluation[] }>("/api/evaluations")
      .then((d) => setItems(d.evaluations))
      .catch((e) => setError(e.message));
  }, []);

  const rubricTitles = useMemo(() => [...new Set(items?.map((e) => e.rubricSnapshot.title))], [items]);
  const filtered = items?.filter(
    (e) =>
      (!rubric || e.rubricSnapshot.title === rubric) &&
      (!query || `${e.studentName} ${e.fileName}`.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <div className="stack lg">
      <div className="row between wrap gap">
        <div>
          <h1 className="h1">평가 결과</h1>
          <p className="muted">업로드한 활동지의 AI 평가 결과입니다.</p>
        </div>
        <Link href="/evaluate" className="btn primary">
          + 활동지 평가하기
        </Link>
      </div>

      {items && items.length > 0 && (
        <div className="row gap wrap">
          <input
            className="search"
            placeholder="학생 이름·파일명 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select value={rubric} onChange={(e) => setRubric(e.target.value)}>
            <option value="">모든 평가 기준</option>
            {rubricTitles.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="alert error">{error}</p>}
      {!items && !error && <div className="spinner" />}
      {items?.length === 0 && (
        <div className="empty card">
          <p>아직 평가한 활동지가 없습니다.</p>
          <div className="row gap center-x">
            <Link href="/rubrics/new" className="btn">
              1. 평가 기준 만들기
            </Link>
            <Link href="/evaluate" className="btn primary">
              2. 활동지 올리기
            </Link>
          </div>
        </div>
      )}

      {filtered && filtered.length > 0 && (
        <div className="table-wrap card flush">
          <table className="table">
            <thead>
              <tr>
                <th>학생</th>
                <th className="hide-sm">평가 기준</th>
                <th>점수</th>
                <th className="hide-sm">일시</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link href={`/evaluations/${e.id}`} className="row-link">
                      <strong>{e.studentName || "이름 미입력"}</strong>
                      <span className="muted small ellipsis">{e.fileName}</span>
                    </Link>
                  </td>
                  <td className="hide-sm">{e.rubricSnapshot.title}</td>
                  <td>
                    {e.status === "done" ? (
                      <span className="nowrap">
                        <strong>{e.totalScore}</strong> <span className="muted">/ {e.maxTotal}</span>
                      </span>
                    ) : (
                      <span className={`badge ${e.status}`}>{STATUS[e.status]}</span>
                    )}
                  </td>
                  <td className="hide-sm muted small nowrap">{new Date(e.createdAt).toLocaleDateString("ko-KR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}
