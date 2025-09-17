import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST() {
  try {
    // Forward the request to the Python backend
    const response = await fetch(`${BACKEND_URL}/api/clear-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { detail: error.detail || 'Failed to clear PDF' },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)

  } catch (error) {
    console.error('Clear PDF error:', error)

    // If backend is not available, return error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        {
          detail: 'Backend service unavailable. Please ensure the Python backend is running on port 8000.'
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { detail: 'Internal server error during PDF clear' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}