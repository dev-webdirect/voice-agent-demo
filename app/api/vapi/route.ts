import { NextRequest, NextResponse } from 'next/server';

const VAPI_BASE_URL = 'https://api.vapi.ai';

type CreateCallBody = {
  assistantId?: string;
  assistant?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  const webAuthToken = process.env.VAPI_PUBLIC_KEY;
  const defaultAssistantId = process.env.VAPI_ASSISTANT_ID;

  if (!webAuthToken) {
    return NextResponse.json(
      {
        error: 'Missing VAPI_PUBLIC_KEY or VAPI_PUBLIC_JWT environment variable for web call creation.'
      },
      { status: 500 }
    );
  }

  let payload: CreateCallBody = {};
  try {
    if (request.headers.get('content-length') !== '0') {
      payload = (await request.json()) as CreateCallBody;
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const assistantId = payload?.assistantId ?? defaultAssistantId;
  const finalPayload: CreateCallBody = {
    ...payload,
    assistantId
  };

  if (!finalPayload?.assistantId && !finalPayload?.assistant) {
    return NextResponse.json(
      {
        error: 'Provide assistantId in body or set VAPI_ASSISTANT_ID in environment variables.'
      },
      { status: 400 }
    );
  }

  try {
    const vapiResponse = await fetch(`${VAPI_BASE_URL}/call/web`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${webAuthToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(finalPayload)
    });

    const data = await vapiResponse.json().catch(() => ({}));

    if (!vapiResponse.ok) {
      const vapiMessage =
        (typeof data?.message === 'string' && data.message) ||
        (typeof data?.error === 'string' && data.error) ||
        (typeof data?.details?.message === 'string' && data.details.message) ||
        'Unknown Vapi error';

      return NextResponse.json(
        {
          error: 'Vapi request failed.',
          status: vapiResponse.status,
          message: vapiMessage,
          details: data
        },
        { status: vapiResponse.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to reach Vapi API.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 502 }
    );
  }
}
