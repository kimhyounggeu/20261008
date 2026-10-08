"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { apiFetch } from "@/lib/api-client";
import { MAX_PDF_BYTES, type Evaluation, type Rubric } from "@/lib/types";

const formatSize = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)}MB` : `${Math.ceil(b / 1024)}KB`);

function EvaluateForm() {
  const router = useRouter();
  const params = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const [rubrics, setRubrics] = useState<Rubric[] | null>(null);
  const [rubricId, setRubricId] = useState(params.get("rubric") ?? "");
  const [studentName, setStudentName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<{ rubrics: Rubric[] }>("/api/rubrics")
      .then((d) => {
        setRubrics(d.rubrics);
        setRubricId((cur) => (d.rubrics.some((r) => r.id === cur) ? cur : (d.rubrics[0]?.id ?? "")));
      })
      .catch((e) => setError(e.message));
  }, []);

  function pick(f: File | undefined) {
    setError("");
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) return setError("PDF 파일만 올릴 수 있습니다.");
    if (f.size > MAX_PDF_BYTES) return setError("PDF는 20MB 이하만 올릴 수 있습니다.");
    setFile(f);
    if (!studentName) setStudentName(f.name.replace(/\.pdf$/i, "").slice(0, 50));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files[0]);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) return setError("PDF 파일을 선택해 주세요.");
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("rubricId", rubricId);
      form.append("studentName", studentName);
      const d = await apiFetch<{ evaluation: Evaluation }>("/api/evaluations", { method: "POST", body: form });
      router.push(`/evaluations/${d.evaluation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "평가 요청에 실패했습니다.");
      setBusy(false);
    }
  }

  const selected = rubrics?.find((r) => r.id === rubricId);

  if (rubrics?.length === 0) {
    return (
      <div className="empty card narrow">
        <p>평가하려면 먼저 평가 기준이 필요합니다.</p>
        <Link href="/rubrics/new" className="btn primary">
          평가 기준 만들기
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="stack lg narrow">
      <div>
        <h1 className="h1">새 평가</h1>
        <p className="muted">학생 활동지 PDF를 올리면 Gemini가 읽고 기준별로 평가합니다.</p>
      </div>

      <section className="card stack">
        <label className="field">
          <span>평가 기준</span>
          <select value={rubricId} onChange={(e) => setRubricId(e.target.value)} required disabled={!rubrics}>
            {!rubrics && <option>불러오는 중…</option>}
            {rubrics?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </label>
        {selected && (
          <ul className="chips">
            {selected.criteria.map((c) => (
              <li key={c.id}>
                {c.name} · {c.maxScore}점
              </li>
            ))}
          </ul>
        )}
        <label className="field">
          <span>
            학생 이름 또는 번호 <em className="muted">(선택)</em>
          </span>
          <input maxLength={50} value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="예) 2-3 홍길동" />
        </label>
      </section>

      <div
        className={`dropzone${dragging ? " over" : ""}${file ? " has-file" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          hidden
          onChange={(e) => pick(e.target.files?.[0])}
        />
        {file ? (
          <>
            <div className="file-icon">PDF</div>
            <strong>{file.name}</strong>
            <span className="muted small">{formatSize(file.size)} · 클릭하면 다른 파일을 고를 수 있습니다</span>
          </>
        ) : (
          <>
            <div className="file-icon empty">↑</div>
            <strong>활동지 PDF를 끌어 놓거나 클릭해서 선택</strong>
            <span className="muted small">최대 20MB · 스캔본(손글씨)도 가능</span>
          </>
        )}
      </div>

      {error && <p className="alert error">{error}</p>}

      {busy ? (
        <div className="card progress-card">
          <div className="spinner" />
          <div>
            <strong>AI가 활동지를 읽고 평가하고 있습니다</strong>
            <p className="muted small">분량에 따라 30초~2분 정도 걸립니다. 이 창을 닫지 마세요.</p>
          </div>
        </div>
      ) : (
        <div className="row end">
          <button className="btn primary" disabled={!file || !rubricId}>
            평가 시작
          </button>
        </div>
      )}
    </form>
  );
}

export default function EvaluatePage() {
  return (
    <AppShell>
      <Suspense>
        <EvaluateForm />
      </Suspense>
    </AppShell>
  );
}
