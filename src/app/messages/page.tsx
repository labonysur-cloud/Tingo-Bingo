import { redirect } from 'next/navigation';

export default async function MessagesRedirectPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined> }) {
  // Preserve query params when redirecting to /chat
  const params = new URLSearchParams();
  // `searchParams` can be a Promise in some Next.js versions - await it safely
  const resolved = await searchParams;
  for (const [k, v] of Object.entries(resolved || {})) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      for (const item of v) params.append(k, item);
    } else {
      params.append(k, v);
    }
  }

  const qs = params.toString();
  redirect(qs ? `/chat?${qs}` : `/chat`);
}