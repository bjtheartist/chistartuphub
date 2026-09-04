import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })

const DEFAULT_ORIGIN = 'https://chistartuphub.com'
// Only these origins may set Stripe redirect URLs or receive CORS responses.
const ALLOWED_ORIGINS = new Set([
  DEFAULT_ORIGIN,
  'https://www.chistartuphub.com',
  'http://localhost:5173',
])

const corsHeadersFor = (req: Request) => ({
  ...corsHeaders,
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(req.headers.get('origin') ?? '')
    ? (req.headers.get('origin') as string)
    : DEFAULT_ORIGIN,
  'Vary': 'Origin',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': DEFAULT_ORIGIN,
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeadersFor(req) })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
      })
    }

    // Get customer ID from subscriptions table
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!sub?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: 'No subscription found' }), {
        status: 404,
        headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({}))
    const origin = ALLOWED_ORIGINS.has(body.origin) ? body.origin : DEFAULT_ORIGIN

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${origin}/settings`,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Portal error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
    })
  }
})
