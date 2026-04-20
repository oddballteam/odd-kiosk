import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SLACK_TOKEN = Deno.env.get('SLACK_BOT_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.record

    if (!record || payload.type !== 'INSERT') {
      return new Response('OK', { status: 200 })
    }

    if (!record.host_employee_id) {
      return new Response('No host ID', { status: 200 })
    }

    // Look up the host's Slack user ID
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { data: employee } = await supabase
      .from('employees')
      .select('slack_user_id')
      .eq('id', record.host_employee_id)
      .single()

    if (!employee?.slack_user_id) {
      return new Response('No Slack ID for host', { status: 200 })
    }

    // Send Slack DM
    const message = [
      `👋 *${record.visitor_name}* from *${record.visitor_company}* just checked in to see you.`,
      record.reason_for_visit ? `> ${record.reason_for_visit}` : '',
    ].filter(Boolean).join('\n')

    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SLACK_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: employee.slack_user_id,
        text: message,
        mrkdwn: true,
      }),
    })

    const result = await res.json()
    if (!result.ok) {
      console.error('Slack error:', result.error)
      return new Response(result.error, { status: 500 })
    }

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response('Error', { status: 500 })
  }
})
