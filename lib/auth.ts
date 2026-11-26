import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('gealink_token')?.value

  if (!token) return null

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null

  return data.user
}