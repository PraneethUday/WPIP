import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { delivery_id, city, tier } = body

    if (!delivery_id) {
      return NextResponse.json({ error: 'delivery_id is required' }, { status: 400 })
    }

    const res = await fetch(`${BACKEND_URL}/api/premium/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delivery_id, city: city || 'Unknown', tier: tier || 'standard' }),
    })

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('Premium prediction error:', err)
    return NextResponse.json({ error: 'Failed to compute premium. Backend may be offline.' }, { status: 502 })
  }
}
