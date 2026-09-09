import { NextRequest, NextResponse } from 'next/server';
import { evaluateIntakeFormWithAgent, IntakeFormData } from '@/lib/agent/markdown-agent-loader';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as IntakeFormData;

    if (!body || !body.product_category) {
      return NextResponse.json(
        { error: 'Invalid form payload: product_category is required.' },
        { status: 400 }
      );
    }

    const prescription = await evaluateIntakeFormWithAgent(body);
    return NextResponse.json(prescription);
  } catch (error) {
    console.error('Error evaluating intake form with markdown agent:', error);
    return NextResponse.json(
      { error: 'Internal server error evaluating intake form.' },
      { status: 500 }
    );
  }
}
