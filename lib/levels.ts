export const LEVELS = [{ ar: 'برونزي', i: '🥉', min: 0 }, { ar: 'فضي', i: '🥈', min: 10000 }, { ar: 'ذهبي', i: '🥇', min: 100000 }, { ar: 'بلاتيني', i: '💎', min: 500000 }, { ar: 'ماسي', i: '👑', min: 2000000 }]
export function levelOf(v: number) { let k = 0; LEVELS.forEach((l, i) => { if (v >= l.min) k = i }); return { l: LEVELS[k], n: LEVELS[k + 1] || null } }
