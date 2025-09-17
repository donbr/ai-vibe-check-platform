import { NextRequest, NextResponse } from 'next/server'

interface ChatRequest {
  developer_message: string
  user_message: string
  model?: string
  api_key: string
}

// This is a simplified version of the original FastAPI chat endpoint
// for backwards compatibility with existing chat functionality
export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { developer_message, user_message, model = 'gpt-4o-mini', api_key } = body

    // Validate required fields
    if (!developer_message || !user_message || !api_key) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'developer', content: developer_message },
          { role: 'user', content: user_message }
        ],
        stream: true
      })
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      return NextResponse.json(
        { error: `OpenAI API error: ${error}` },
        { status: openaiResponse.status }
      )
    }

    // Return streaming response
    return new NextResponse(openaiResponse.body, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}