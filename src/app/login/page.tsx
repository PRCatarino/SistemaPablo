"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { Role } from "@/lib/kanban-types";
import { ROLE_LABELS } from "@/lib/kanban-types";

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
    <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl">
      <h1 className="text-xl font-bold text-slate-900">Kanban de artes</h1>
      <p className="mt-1 text-sm text-slate-600">
        Confecção de camisas — identifique-se para acessar o quadro.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="username"
            className="block text-xs font-medium text-slate-500 uppercase tracking-wide"
          >
            Nome do usuário
          </label>
          <input
            id="username"
            type="text"
            autoComplete="name"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-500/30 focus:ring-2"
            placeholder="Seu nome"
          />
        </div>
        <div>
          <label
            htmlFor="role"
            className="block text-xs font-medium text-slate-500 uppercase tracking-wide"
          >
            Cargo
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-500/30 focus:ring-2"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
        >
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl text-sm text-slate-500">
            Carregando…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
