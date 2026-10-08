"use client";

import { useState, type FormEvent } from "react";
import type { Criterion, RubricInput } from "@/lib/types";

const newCriterion = (): Criterion => ({
  id: crypto.randomUUID(),
  name: "",
  description: "",
  maxScore: 10,
});

export const EMPTY_RUBRIC: RubricInput = {
  title: "",
  description: "",
  criteria: [newCriterion()],
};

interface Props {
  initial: RubricInput;
  submitLabel: string;
  onSubmit: (value: RubricInput) => Promise<void>;
}

/** 평가 기준 입력·수정 폼 */
export function RubricForm({ initial, submitLabel, onSubmit }: Props) {
  const [value, setValue] = useState<RubricInput>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const total = value.criteria.reduce((s, c) => s + (Number(c.maxScore) || 0), 0);

  const updateCriterion = (id: string, patch: Partial<Criterion>) =>
    setValue((v) => ({ ...v, criteria: v.criteria.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));

  const move = (index: number, dir: -1 | 1) =>
    setValue((v) => {
      const next = [...v.criteria];
      const target = index + dir;
      if (target < 0 || target >= next.length) return v;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return { ...v, criteria: next };
    });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit({ ...value, criteria: value.criteria.map((c) => ({ ...c, maxScore: Number(c.maxScore) })) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="stack lg">
      <section className="card stack">
        <label className="field">
          <span>기준 이름</span>
          <input
            required
            maxLength={100}
            placeholder="예) 2학년 과학 · 광합성 탐구 활동지"
            value={value.title}
            onChange={(e) => setValue({ ...value, title: e.target.value })}
          />
        </label>
        <label className="field">
          <span>
            과제 설명 <em className="muted">(선택 · AI가 활동지를 이해하는 데 참고합니다)</em>
          </span>
          <textarea
            rows={3}
            maxLength={3000}
            placeholder="학년, 교과, 활동 목표, 학생에게 제시한 질문 등을 적어 주세요."
            value={value.description}
            onChange={(e) => setValue({ ...value, description: e.target.value })}
          />
        </label>
      </section>

      <div className="row between">
        <h2 className="h2">평가 항목</h2>
        <span className="pill">총 {total}점</span>
      </div>

      <ol className="criteria-list">
        {value.criteria.map((c, i) => (
          <li key={c.id} className="card criterion-edit">
            <div className="criterion-num">{i + 1}</div>
            <div className="stack grow">
              <div className="row gap wrap">
                <label className="field grow">
                  <span>항목 이름</span>
                  <input
                    required
                    maxLength={100}
                    placeholder="예) 가설 설정의 타당성"
                    value={c.name}
                    onChange={(e) => updateCriterion(c.id, { name: e.target.value })}
                  />
                </label>
                <label className="field score-field">
                  <span>배점</span>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    step={0.5}
                    value={c.maxScore}
                    onChange={(e) => updateCriterion(c.id, { maxScore: e.target.value as unknown as number })}
                  />
                </label>
              </div>
              <label className="field">
                <span>평가 내용 · 수준 기술</span>
                <textarea
                  rows={3}
                  maxLength={2000}
                  placeholder={"예) 상(9~10): 변인을 명확히 구분하고 근거를 들어 가설을 세움\n중(5~8): 가설은 있으나 근거가 부족함\n하(0~4): 가설이 없거나 탐구 문제와 관련 없음"}
                  value={c.description}
                  onChange={(e) => updateCriterion(c.id, { description: e.target.value })}
                />
              </label>
            </div>
            <div className="criterion-tools">
              <button type="button" className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="위로">
                ↑
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => move(i, 1)}
                disabled={i === value.criteria.length - 1}
                aria-label="아래로"
              >
                ↓
              </button>
              <button
                type="button"
                className="icon-btn danger"
                onClick={() => setValue((v) => ({ ...v, criteria: v.criteria.filter((x) => x.id !== c.id) }))}
                disabled={value.criteria.length === 1}
                aria-label="항목 삭제"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ol>

      <button
        type="button"
        className="btn dashed"
        onClick={() => setValue((v) => ({ ...v, criteria: [...v.criteria, newCriterion()] }))}
        disabled={value.criteria.length >= 20}
      >
        + 평가 항목 추가
      </button>

      {error && <p className="alert error">{error}</p>}
      <div className="row end">
        <button className="btn primary" disabled={busy}>
          {busy ? "저장 중…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
