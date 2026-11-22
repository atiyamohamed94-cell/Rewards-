'use client'
import { useState } from 'react'
export default function Logo({ h = 30 }: { h?: number }) {
  const [bad, setBad] = useState(false)
  return <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    {!bad && <img src="/logo.png" alt="" height={h} width={h} style={{ height: h, width: h }} onError={() => setBad(true)} />}
    <b style={{ fontSize: h * 0.6, color: '#fff', letterSpacing: .3 }}>Content Hub</b></span>
}
