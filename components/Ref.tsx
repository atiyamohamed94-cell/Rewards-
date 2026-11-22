'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/client'
export function RefCapture() {
  useEffect(() => { try { const c = new URLSearchParams(location.search).get('ref'); if (c && /^[A-Za-z0-9]{8}$/.test(c)) document.cookie = 'ref=' + c + ';path=/;max-age=2592000' } catch {} }, [])
  return null
}
export function RefClaim() {
  useEffect(() => { const m = document.cookie.match(/(?:^|; )ref=([A-Za-z0-9]{8})/); if (!m) return
    createClient().rpc('claim_referral', { p_code: m[1] }).then(() => { document.cookie = 'ref=;path=/;max-age=0' }) }, [])
  return null
}
