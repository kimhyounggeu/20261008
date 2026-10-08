"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { apiFetch, openPdf } from "@/lib/api-client";
import type { Evaluation } from "@/lib/types";

const pct = (score: number, max: number) => (max > 0 ? Math.round((score / max) * 100) : 0);
const level = (p: number) => (p >= 80 ? "high" : p >= 50 ? "mid" : "low");

function EvaluationView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ev, setEv] = useState<Evaluation | null>(null);
  const [error, setError] = useState("");
  const [rerunning, setRerunning] = useState(false);

  useEffect(() => {
    apiFetch<{ evaluation: Evaluation }>(`/api/evaluations/${id}`)
      .then((d) => setEv(d.evaluation))
      .catch((e) => setError(e.message));
  }, [id]);

  async function rerun(useLatestRubric: boolean) {
    setRerunning(true);
    setError("");
    try {
      const d = await apiFetch<{ evaluation: Evaluation }>(`/api/evaluations/${id}/rerun`, {
        method: "POST",
        body: JSON.stringify({ useLatestRubric }),
      });
      setEv(d.evaluation);
    } catch (e) {
      setError(e instanceof Error ? e.message : "다시 평가하지 못했습니다.");
    } finally {
      setRerunning(false);
    }
  }

  async function remove() {
    if (!confirm("평가 결과와 업로드한 PDF를 모두 삭제할까요?")) return;
    try {
      await apiFetch(`/api/evaluations/${id}`, { method: "DELETE" });
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제하지 못했습니다.");
    }
  }

  if (!ev) {
    return (
      <div className="stack">
        {error ? <p className="alert error">{error}</p> : <div className="spinner" />}
      </div>
    );
  }

  const total = pct(ev.totalScore, ev.maxTotal);

  return (
    <div className="stack lg">
      <Link href="/" className="back">
        ← 평가 결과 목록
      </Link>

      <section className="card result-head">
        <div className="stack sm grow">
          <span className="eyebrow">{ev.rubricSnapshot.title}</span>
          <h1 className="h1">{ev.studentName || "이름 미입력"}</h1>
          <p className="muted small">
            {ev.fileName} · {new Date(ev.createdAt).toLocaleString("ko-KR")}
            {ev.model && ` · ${ev.model}`}
          </p>
          <div className="row gap wrap">
            <button className="btn sm" onClick={() => openPdf(ev.id)}>
              PDF 보기
            </button>
            <button className="btn sm" onClick={() => rerun(false)} disabled={rerunning}>
              다시 평가
            </button>
            <button className="btn sm" onClick={() => rerun(true)} disabled={rerunning} title="수정된 평가 기준으로 다시 평가합니다">
              현재 기준으로 다시 평가
            </button>
            <button className="btn sm ghost danger" onClick={remove} disabled={rerunning}>
              삭제
            </button>
          </div>
        </div>
        {ev.status === "done" && (
          <div className={`score-ring ${level(total)}`} style={{ ["--p" as string]: total }}>
            <div>
              <strong>{ev.totalScore}</strong>
              <span>/ {ev.maxTotal}</span>
            </div>
          </div>
        )}
      </section>

      {error && <p className="alert error">{error}</p>}

      {(rerunning || ev.status === "processing") && (
        <div className="card progress-card">
          <div className="spinner" />
          <div>
            <strong>AI가 평가하고 있습니다</strong>
            <p className="muted small">잠시 후 결과가 표시됩니다.</p>
          </div>
        </div>
      )}

      {!rerunning && ev.status === "error" && (
        <div className="alert error">
          {ev.error ?? "평가 중 오류가 발생했습니다."} <br />
          ‘다시 평가’를 눌러 재시도할 수 있습니다.
        </div>
      )}

      {!rerunning && ev.status === "done" && (
        <>
          {ev.overallFeedback && (
            <section className="card overall">
              <h2 className="h3">종합 의견</h2>
              <p className="pre">{ev.overallFeedback}</p>
            </section>
          )}

          <ol className="result-list">
            {ev.results.map((r, i) => {
              const p = pct(r.score, r.maxScore);
              return (
                <li key={r.criterionId} className="card result-item">
                  <div className="row between gap">
                    <h3 className="h3">
                      <span className="criterion-num sm">{i + 1}</span> {r.name}
                    </h3>
                    <span className={`score ${level(p)}`}>
                      {r.score}
                      <small> / {r.maxScore}</small>
                    </span>
                  </div>
                  <div className={`bar ${level(p)}`}>
                    <span style={{ width: `${p}%` }} />
                  </div>
                  <div className="result-cols">
                    <div>
                      <h4 className="label">판단 근거</h4>
                      <p className="pre">{r.rationale}</p>
                    </div>
                    {r.suggestions && (
                      <div className="suggest">
                        <h4 className="label">개선 제안</h4>
                        <p className="pre">{r.suggestions}</p>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="muted small center">
            AI 평가는 참고 자료입니다. 최종 점수는 교사가 활동지를 확인한 뒤 결정해 주세요.
          </p>
        </>
      )}
    </div>
  );
}

export default function EvaluationPage() {
  return (
    <AppShell>
      <EvaluationView />
    </AppShell>
  );
}
