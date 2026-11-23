'use client'
import { useState } from 'react'
export default function AvatarImg({ src, size = 88, emoji = '👤' }: any) {
  const [bad, setBad] = useState(false)
  return src && !bad ? <img src={src} alt="" width={size} height={size} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} onError={() => setBad(true)} />
    : <span className="avatar" style={{ width: size, height: size, fontSize: size / 2.2 }}>{emoji}</span>
}
