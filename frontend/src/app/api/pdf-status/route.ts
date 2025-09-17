import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET() {
  try {
    // Forward the request to the Python backend
    const response = await fetch(`${BACKEND_URL}/api/pdf-status`)

    if (!response.ok) {
      return NextResponse.json(
        { status: 'no_pdf', message: 'Failed to get PDF status' },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)

  } catch (error) {
    console.error('PDF status error:', error)

    // If backend is not available, return no PDF status
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json({
        status: 'no_pdf',
        message: 'Backend service unavailable'
      })
    }

    return NextResponse.json(
      { status: 'no_pdf', message: 'Failed to get PDF status' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}