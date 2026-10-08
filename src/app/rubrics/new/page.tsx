"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { EMPTY_RUBRIC, RubricForm } from "@/components/RubricForm";
import { apiFetch } from "@/lib/api-client";
import type { Rubric } from "@/lib/types";

function NewRubric() {
  const router = useRouter();
  return (
    <div className="stack lg narrow">
      <Link href="/rubrics" className="back">
        ← 평가 기준 목록
      </Link>
      <h1 className="h1">새 평가 기준</h1>
      <RubricForm
        initial={EMPTY_RUBRIC}
        submitLabel="평가 기준 저장"
        onSubmit={async (value) => {
          await apiFetch<{ rubric: Rubric }>("/api/rubrics", { method: "POST", body: JSON.stringify(value) });
          router.push("/rubrics");
        }}
      />
    </div>
  );
}

export default function NewRubricPage() {
  return (
    <AppShell>
      <NewRubric />
    </AppShell>
  );
}
