"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "./AuthProvider";

const NAV = [
  { href: "/", label: "평가 결과" },
  { href: "/evaluate", label: "새 평가" },
  { href: "/rubrics", label: "평가 기준" },
];

/** 로그인한 교사만 볼 수 있는 화면의 공통 틀 */
export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return (
      <div className="center-screen">
        <div className="spinner" aria-label="불러오는 중" />
      </div>
    );
  }

  const isActive = (href: string) => (href === "/" ? pathname === "/" || pathname.startsWith("/evaluations") : pathname.startsWith(href));

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand">
            <span className="brand-mark">✎</span> 활동지 AI 평가
          </Link>
          <nav className="nav">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={isActive(n.href) ? "active" : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="account">
            <span className="muted small hide-sm">{user.email}</span>
            <button className="btn ghost sm" onClick={() => logout().then(() => router.replace("/login"))}>
              로그아웃
            </button>
          </div>
        </div>
      </header>
      <main className="container">{children}</main>
    </>
  );
}
