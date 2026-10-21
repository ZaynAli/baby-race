import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

export const configStatus = {
  hasUrl: supabaseUrl.startsWith('https://') && !supabaseUrl.includes('YOUR_PROJECT'),
  hasKey: supabaseAnonKey.length > 20 && !supabaseAnonKey.includes('YOUR_SUPABASE'),
}

export const isConfigured = configStatus.hasUrl && configStatus.hasKey

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null
