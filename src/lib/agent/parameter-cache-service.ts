/**
 * ParameterCacheService — Sdílená cache pro výsledky Luke LLM výzkumu
 *
 * Architektura:
 *  1. Supabase (server-side) — sdílená cache pro všechny uživatele
 *  2. In-memory (Map) — cache pro aktuální server process (rychlý L1 cache)
 *
 * Žádný localStorage — toto běží na serveru (Next.js API route).
 */

import { DomainAnalysisResult } from './domain-parameter-discovery';

// ——————————————————————————————————————————
// L1 In-Memory Cache (per server process)
// ——————————————————————————————————————————
interface MemCacheEntry {
  analysis: DomainAnalysisResult;
  expiresAt: number;
}

const MEM_CACHE = new Map<string, MemCacheEntry>();
const MEM_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minut

// ——————————————————————————————————————————
// Supabase client (server-side)
// ——————————————————————————————————————————
let supabaseClient: any = null;

async function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    supabaseClient = createClient(url, key);
    return supabaseClient;
  } catch {
    return null;
  }
}

// ——————————————————————————————————————————
// Key normalization
// ——————————————————————————————————————————
export function normalizeCacheKey(query: string, locale: string = 'cs'): string {
  return query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .trim()
    .slice(0, 100) + `::${locale}`;
}

// ——————————————————————————————————————————
// GET
// ——————————————————————————————————————————
export async function getCachedAnalysis(
  query: string,
  locale: string = 'cs'
): Promise<{ analysis: DomainAnalysisResult; source: 'mem_cache' | 'supabase_cache' } | null> {
  const key = normalizeCacheKey(query, locale);

  // L1: In-memory check
  const memEntry = MEM_CACHE.get(key);
  if (memEntry && memEntry.expiresAt > Date.now()) {
    return { analysis: memEntry.analysis, source: 'mem_cache' };
  }
  MEM_CACHE.delete(key); // Expired

  // L2: Supabase check
  const sb = await getSupabaseClient();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from('parameter_cache')
      .select('analysis, expires_at')
      .eq('cache_key', key)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return null;

    const analysis = data.analysis as DomainAnalysisResult;

    // Populate L1 from L2
    MEM_CACHE.set(key, { analysis, expiresAt: Date.now() + MEM_CACHE_TTL_MS });

    // Async: update usage stats (fire-and-forget)
    sb.from('parameter_cache')
      .update({ last_hit_at: new Date().toISOString() })
      .eq('cache_key', key)
      .then(() => {});

    return { analysis, source: 'supabase_cache' };
  } catch {
    return null;
  }
}

// ——————————————————————————————————————————
// SET
// ——————————————————————————————————————————
export async function setCachedAnalysis(
  query: string,
  analysis: DomainAnalysisResult,
  locale: string = 'cs'
): Promise<void> {
  const key = normalizeCacheKey(query, locale);

  // L1: In-memory store
  MEM_CACHE.set(key, { analysis, expiresAt: Date.now() + MEM_CACHE_TTL_MS });

  // L2: Supabase store (upsert)
  const sb = await getSupabaseClient();
  if (!sb) return;

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  try {
    await sb.from('parameter_cache').upsert(
      {
        cache_key: key,
        raw_query: query,
        analysis,
        locale,
        expires_at: expiresAt,
        last_hit_at: new Date().toISOString(),
      },
      { onConflict: 'cache_key', ignoreDuplicates: false }
    );
  } catch (err) {
    console.warn('[ParameterCache] Supabase upsert failed:', err);
  }
}

// ——————————————————————————————————————————
// INVALIDATE (pro admin účely)
// ——————————————————————————————————————————
export async function invalidateCachedAnalysis(query: string, locale: string = 'cs'): Promise<void> {
  const key = normalizeCacheKey(query, locale);
  MEM_CACHE.delete(key);

  const sb = await getSupabaseClient();
  if (!sb) return;

  await sb.from('parameter_cache').delete().eq('cache_key', key);
}
