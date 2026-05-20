export const config = {
  schedule: '0 12 */3 * *', // every 3 days at noon UTC
}

export default async function handler() {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[keepalive] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    return
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/employees?limit=1&select=id`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  })

  if (res.ok) {
    console.log(`[keepalive] Supabase pinged successfully — ${new Date().toISOString()}`)
  } else {
    console.error(`[keepalive] Ping failed: ${res.status}`)
  }
}
