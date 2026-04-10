"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { Role } from "@/lib/kanban-types";
import { ROLE_LABELS } from "@/lib/kanban-types";
import { MaterialIcon } from "@/components/MaterialIcon";

const ROLES: Role[] = [
  "administrador",
  "atendente",
  "designer",
  "finalizador",
];

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<Role>("atendente");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const name = username.trim();
    if (!name) {
      setError("Informe seu nome.");
      return;
    }
    setPending(true);
    try {
      const res = await signIn("credentials", {
        username: name,
        role,
        redirect: false,
      });
      if (res?.error) {
        setError("Não foi possível entrar.");
        setPending(false);
        return;
      }
      window.location.href = callbackUrl;
    } catch {
      setError("Erro de rede. Tente de novo.");
      setPending(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface industrial-bg flex items-center justify-center p-6">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <main className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-headline text-3xl font-extrabold tracking-widest text-primary uppercase mb-2">
            ArtFlow
          </h1>
          <p className="font-body text-sm font-medium tracking-wide text-on-surface-variant">
            SISTEMA DE GESTÃO DE ARTES PARA CONFECÇÃO
          </p>
        </div>

        <section className="glass-panel relative overflow-hidden rounded-xl p-10 shadow-lg">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-secondary-fixed-dim to-secondary" />
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label
                htmlFor="username"
                className="ml-1 block font-label text-[0.6875rem] font-semibold uppercase tracking-wider text-on-surface-variant"
              >
                Nome / usuário
              </label>
              <div className="relative">
                <MaterialIcon
                  name="person"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant"
                />
                <input
                  id="username"
                  type="text"
                  autoComplete="name"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu nome"
                  className="w-full rounded-lg border-none bg-surface-container-high py-3 pr-4 pl-10 font-body text-sm text-on-surface placeholder:text-outline/50 transition-all duration-200 focus:border-b-2 focus:border-secondary focus:ring-0"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="role"
                className="ml-1 block font-label text-[0.6875rem] font-semibold uppercase tracking-wider text-on-surface-variant"
              >
                Cargo / função
              </label>
              <div className="relative">
                <MaterialIcon
                  name="badge"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant"
                />
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full appearance-none rounded-lg border-none bg-surface-container-high py-3 pr-10 pl-10 font-body text-sm text-on-surface transition-all duration-200 focus:border-b-2 focus:border-secondary focus:ring-0"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                <MaterialIcon
                  name="expand_more"
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
              </div>
            </div>

            {error ? (
              <div
                className="flex items-center gap-2 rounded-lg border border-error/10 bg-error-container/30 px-3 py-2"
                role="alert"
              >
                <MaterialIcon
                  name="error"
                  filled
                  className="text-[20px] text-error"
                />
                <p className="font-body text-xs font-semibold uppercase tracking-tight text-on-error-container">
                  {error}
                </p>
              </div>
            ) : null}

            <div className="pt-2">
              <button
                type="submit"
                disabled={pending}
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-gradient-to-br from-primary to-primary-container py-4 font-headline text-sm font-bold tracking-widest text-on-primary uppercase shadow-md transition-all duration-200 hover:translate-y-[-1px] hover:shadow-xl active:translate-y-px disabled:opacity-60"
              >
                {pending ? "Entrando…" : "Entrar"}
                <MaterialIcon name="arrow_forward" className="text-lg" />
              </button>
            </div>
          </form>

          <div className="mt-8 flex items-center justify-between text-[0.6875rem] font-semibold tracking-wider text-outline uppercase">
            <span className="cursor-not-allowed opacity-50" title="Em breve">
              Esqueci minha senha
            </span>
            <span className="h-1 w-1 rounded-full bg-outline-variant" />
            <span className="cursor-not-allowed opacity-50" title="Em breve">
              Solicitar acesso
            </span>
          </div>
        </section>

        <footer className="mt-8 flex flex-col items-center gap-4 text-center">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 opacity-40">
              <MaterialIcon name="factory" className="text-sm" />
              <span className="text-[0.6rem] font-bold tracking-[0.2em] uppercase">
                Facility
              </span>
            </div>
            <div className="flex items-center gap-1.5 opacity-40">
              <MaterialIcon name="shield" className="text-sm" />
              <span className="text-[0.6rem] font-bold tracking-[0.2em] uppercase">
                Secure terminal
              </span>
            </div>
          </div>
          <div className="my-2 h-px w-full bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent" />
        </footer>
      </main>

      <div className="fixed right-10 bottom-10 z-10 hidden max-w-[200px] flex-col gap-2 opacity-50 lg:flex">
        <div className="h-1 w-20 bg-secondary" />
        <p className="font-headline text-xs font-bold leading-tight tracking-tighter text-on-surface-variant uppercase">
          Precisão no design,
          <br />
          agilidade na produção.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface font-body text-sm text-on-surface-variant">
          Carregando…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
