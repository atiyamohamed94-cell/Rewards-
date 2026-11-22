import { cookies } from 'next/headers'
export async function getLang(): Promise<'ar' | 'en'> { return (await cookies()).get('lang')?.value === 'en' ? 'en' : 'ar' }
