'use client'
import { createClient } from '@/lib/client'
export default function GoogleBtn() {
  return <button className="btn o" style={{ width: '100%' }} onClick={() => createClient().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + '/auth/callback' } })}>المتابعة بحساب Google</button>
}
