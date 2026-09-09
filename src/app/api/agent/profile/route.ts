import { NextRequest, NextResponse } from 'next/server';
import { ProfileStorageManager } from '@/lib/storage/profile-storage';
import { evaluateMandatoryBiomechanicalParameters } from '@/lib/agent/state-machine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId') || 'default-session';

  const profile = ProfileStorageManager.getProfile(sessionId);
  const messages = ProfileStorageManager.getMessages(sessionId);
  const evalResult = evaluateMandatoryBiomechanicalParameters(profile);

  return NextResponse.json({
    profile,
    evalResult,
    messageCount: messages.length,
  });
}
