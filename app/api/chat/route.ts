import { NextRequest, NextResponse } from 'next/server';

const VAPI_BASE_URL = 'https://api.vapi.ai';

type ChatRequestBody = {
  input?: string;
  previousChatId?: string;
  assistantId?: string;
};

type VapiChatMessage = {
  role?: 'system' | 'user' | 'assistant' | 'tool' | 'developer';
  content?: string;
  message?: string;
};

type VapiChatResponse = {
  id?: string;
  output?: VapiChatMessage[];
};

export async function POST(request: NextRequest) {
  const privateKey = process.env.VAPI_PRIVATE_KEY;
  const defaultAssistantId = process.env.VAPI_ASSISTANT_ID;

  if (!privateKey) {
    return NextResponse.json(
      { error: 'Missing VAPI_PRIVATE_KEY environment variable.' },
      { status: 500 }
    );
  }

  let payload: ChatRequestBody = {};
  try {
    payload = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const input = payload?.input?.trim();
  if (!input) {
    return NextResponse.json({ error: 'Missing input text.' }, { status: 400 });
  }

  const assistantId = payload?.assistantId ?? defaultAssistantId;
  if (!assistantId && !payload?.previousChatId) {
    return NextResponse.json(
      { error: 'Provide assistantId or previousChatId (or set VAPI_ASSISTANT_ID).' },
      { status: 400 }
    );
  }

  const vapiPayload: Record<string, unknown> = { input };
  if (assistantId) {
    vapiPayload.assistantId = assistantId;
  }
  if (payload?.previousChatId) {
    vapiPayload.previousChatId = payload.previousChatId;
  }

  try {
    const vapiResponse = await fetch(`${VAPI_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${privateKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(vapiPayload)
    });

    const data = (await vapiResponse.json().catch(() => ({}))) as VapiChatResponse & {
      message?: string | string[];
      error?: string;
    };

    if (!vapiResponse.ok) {
      const vapiMessage =
        (typeof data?.message === 'string' && data.message) ||
        (Array.isArray(data?.message) && data.message.join(', ')) ||
        (typeof data?.error === 'string' && data.error) ||
        'Vapi chat request failed';

      return NextResponse.json(
        { error: 'Vapi chat request failed.', status: vapiResponse.status, message: vapiMessage, details: data },
        { status: vapiResponse.status }
      );
    }

    const assistantReplies =
      data?.output
        ?.filter((item) => item?.role === 'assistant')
        .map((item) => item?.content ?? item?.message ?? '')
        .filter((text): text is string => Boolean(text && text.trim())) ?? [];

    const reply = assistantReplies.join('\n\n').trim();

    return NextResponse.json({
      chatId: data?.id,
      reply,
      output: data?.output ?? []
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to reach Vapi chat API.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 502 }
    );
  }
}
