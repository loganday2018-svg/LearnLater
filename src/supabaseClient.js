import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lotzqnyejcnadoljgkvf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvdHpxbnllamNuYWRvbGpna3ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxOTcwMjcsImV4cCI6MjA4Mjc3MzAyN30.OLCIAFwwFqdsfGlP5B7E4umCN3Sh5T4Ho4kDYzXp1Jc'

// Edge function URLs are derived from the base URL
export const edgeFunctionUrl = (name) => `${supabaseUrl}/functions/v1/${name}`

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'learnlater-auth',
    storage: window.localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
