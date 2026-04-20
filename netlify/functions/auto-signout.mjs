/**
 * Netlify Scheduled Function — runs every day at 5:00 PM (17:00) UTC-adjusted.
 * Set the cron to match your timezone. For US Central (UTC-5), 17:00 local = 22:00 UTC.
 * Update the cron expression in netlify.toml as needed for your timezone.
 *
 * What it does:
 *   1. Finds all visitors signed in today with no sign-out time.
 *   2. Sets their time_out to the run time (approximately 5 PM).
 *   3. Logs a daily summary report.
 */

export const config = {
  schedule: '0 22 * * *', // 22:00 UTC = 5:00 PM US Central (adjust for your TZ)
}

export default async function handler() {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
    return
  }

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const signOutTime = now.toISOString()

  // Find all visitors still signed in today
  const listRes = await fetch(
    `${supabaseUrl}/rest/v1/visitor_log?visit_date=eq.${today}&time_out=is.null&select=id,visitor_name,host_employee_name,time_in`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
    }
  )

  const visitors = await listRes.json()

  if (!Array.isArray(visitors) || visitors.length === 0) {
    console.log(`[auto-signout] ${today}: No active visitors to sign out.`)
    return
  }

  console.log(`[auto-signout] ${today}: Signing out ${visitors.length} visitor(s).`)

  // Bulk update — set time_out and flag as auto signed out
  const updateRes = await fetch(
    `${supabaseUrl}/rest/v1/visitor_log?visit_date=eq.${today}&time_out=is.null`,
    {
      method: 'PATCH',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        time_out: signOutTime,
        auto_signed_out: true,
      }),
    }
  )

  if (!updateRes.ok) {
    const body = await updateRes.text()
    console.error(`[auto-signout] Update failed: ${updateRes.status} — ${body}`)
    return
  }

  // Log the daily report
  console.log('=== Daily Visitor Report ===')
  console.log(`Date: ${today}`)
  console.log(`Total auto-signed-out: ${visitors.length}`)
  visitors.forEach(v => {
    const timeIn = new Date(v.time_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    console.log(`  - ${v.visitor_name} (visited ${v.host_employee_name}, in at ${timeIn})`)
  })
  console.log('============================')
}
