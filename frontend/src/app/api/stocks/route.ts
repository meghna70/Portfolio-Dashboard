// src/app/api/proxy/stocks/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/stocks`, {
      next: { revalidate: 0 }, // force fresh fetch if needed
    });

    if (!response.ok) {
      throw new Error(`Backend fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Proxy error:', err?.message || err);
    return new NextResponse('Failed to fetch data from backend', { status: 500 });
  }
}
