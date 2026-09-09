import { NextRequest, NextResponse } from 'next/server';
import { processAgentConversation } from '@/lib/agent/agent-executor';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, message } = body;

    if (!sessionId || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Missing required parameters: sessionId and message' },
        { status: 400 }
      );
    }

    const result = await processAgentConversation(sessionId, message);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Agent chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error processing agent consultation' },
      { status: 500 }
    );
  }
}
