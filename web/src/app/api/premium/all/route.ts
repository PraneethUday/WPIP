import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/premium/all?limit=100`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ count: 0, data: [], error: 'Backend offline' }, { status: 502 })
  }
}
