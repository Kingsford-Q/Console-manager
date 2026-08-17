// Creates a new auth user + profile row. Only callable by a Super Admin.
//
// SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are
// injected automatically by the Edge Functions runtime — nothing to set
// manually. The service role key never leaves this server-side function.
//
// Deploy: supabase functions deploy create-user
// Invoke from the client: supabase.functions.invoke('create-user', { body: { email, password, full_name, role } })

import { createClient } from 'npm:@supabase/supabase-js@2'

const VALID_ROLES = ['SUPER_ADMIN', 'READ_ONLY']

// Browsers send a CORS preflight (OPTIONS) before the real POST when calling
// an Edge Function from a different origin (e.g. the deployed Vercel app).
// Without these headers on every response, the browser blocks the request
// before it even reaches this code.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return json({ error: 'Missing authorization header' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Client scoped to the caller's own JWT, used only to identify who is calling.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser()
  if (callerError || !caller) {
    return json({ error: 'Not authenticated' }, 401)
  }

  // Service-role client, used for the authorization check and the actual creation.
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data: callerProfile, error: callerProfileError } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()

  if (callerProfileError || callerProfile?.role !== 'SUPER_ADMIN') {
    return json({ error: 'Not authorized' }, 403)
  }

  let body: { email?: string; password?: string; full_name?: string; role?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { email, password, full_name, role } = body

  if (!email || !password || !full_name || !role) {
    return json({ error: 'email, password, full_name, and role are all required' }, 400)
  }
  if (!VALID_ROLES.includes(role)) {
    return json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` }, 400)
  }
  if (password.length < 8) {
    return json({ error: 'Password must be at least 8 characters' }, 400)
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError || !created.user) {
    const message = createError?.message ?? 'Failed to create user'
    const status = /already registered|already exists/i.test(message) ? 409 : 400
    return json({ error: message }, status)
  }

  const { error: insertError } = await adminClient.from('profiles').insert({
    id: created.user.id,
    full_name,
    role,
  })

  if (insertError) {
    // Roll back the auth user so we don't end up with an orphaned account.
    await adminClient.auth.admin.deleteUser(created.user.id)
    return json({ error: insertError.message }, 400)
  }

  return json({ id: created.user.id, email, full_name, role }, 201)
})
