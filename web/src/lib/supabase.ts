import { createClient } from '@supabase/supabase-js'

// Server-side client using service role key (API routes only — never expose to browser)
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_KEY || ''

  if (!url) console.error("Missing NEXT_PUBLIC_SUPABASE_URL in env")
  if (!key) console.error("Missing SUPABASE_SERVICE_KEY in env")

  return createClient(url || '', key || '')
}

// Maps frontend platform id → Supabase table name
export const PLATFORM_TABLE: Record<string, string> = {
  swiggy: 'swiggy_workers',
  zomato: 'zomato_workers',
  amazon: 'amazon_flex_workers',
  amazon_flex: 'amazon_flex_workers',
  blinkit: 'blinkit_workers',
  zepto: 'zepto_workers',
  meesho: 'meesho_workers',
  porter: 'porter_workers',
  dunzo: 'dunzo_workers',
}
