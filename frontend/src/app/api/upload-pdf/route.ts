import { NextRequest, NextResponse } from 'next/server'

// This is a proxy route for PDF upload functionality
// In local development, it forwards to the Python FastAPI backend
// In production, you'll need to either:
// 1. Deploy the Python backend separately and set BACKEND_URL env var
// 2. Or implement PDF processing directly in this route

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData()

    // Forward the request to the Python backend
    const response = await fetch(`${BACKEND_URL}/api/upload-pdf`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { detail: error.detail || 'Failed to upload PDF' },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)

  } catch (error) {
    console.error('PDF upload error:', error)

    // If backend is not available, return a helpful error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        {
          detail: 'Backend service unavailable. Please ensure the Python backend is running on port 8000.'
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { detail: 'Internal server error during PDF upload' },
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