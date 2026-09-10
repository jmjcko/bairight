import { NextRequest, NextResponse } from 'next/server';
import { loadAgentMarkdownDefinition, saveAgentMarkdownDefinition } from '@/lib/agent/markdown-agent-loader';

export async function GET() {
  try {
    const agentData = loadAgentMarkdownDefinition();
    return NextResponse.json(agentData);
  } catch (error) {
    console.error('Error fetching agent definition:', error);
    return NextResponse.json(
      { error: 'Failed to load agent markdown definition' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body.content !== 'string' || !body.content.trim()) {
      return NextResponse.json(
        { error: 'Invalid agent definition payload: content string is required' },
        { status: 400 }
      );
    }

    const result = saveAgentMarkdownDefinition(body.content);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving agent definition:', error);
    return NextResponse.json(
      { error: 'Failed to save agent markdown definition' },
      { status: 500 }
    );
  }
}
