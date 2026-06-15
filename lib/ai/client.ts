import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import OpenAI from 'openai'

export type AiProvider = 'ANTHROPIC' | 'GEMINI' | 'OPENAI'

export interface StreamedPlanResult {
  textChunks: AsyncIterable<string>
  getToolInput: () => Promise<Record<string, unknown>>
}

const SAVE_PLAN_TOOL_SCHEMA = {
  type: 'object' as const,
  properties: {
    coachAnalysis: { type: 'string', description: 'Coach analysis text (German)' },
    paces: {
      type: 'object',
      properties: {
        easyMin: { type: 'string' }, easyMax: { type: 'string' },
        longRunMin: { type: 'string' }, longRunMax: { type: 'string' },
        tempo: { type: 'string' }, kombiStart: { type: 'string' },
        kombiEnd: { type: 'string' }, ziel5km: { type: 'string' },
      },
      required: ['easyMin', 'easyMax', 'longRunMin', 'longRunMax', 'tempo', 'kombiStart', 'kombiEnd', 'ziel5km'],
    },
    stationsPrioritaeten: {
      type: 'array',
      items: { type: 'string' },
      description: 'Stations ordered by training priority',
    },
    phasen: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nummer: { type: 'number' }, wochenVon: { type: 'number' },
          wochenBis: { type: 'number' }, titel: { type: 'string' },
          fokus: { type: 'string' },
        },
        required: ['nummer', 'wochenVon', 'wochenBis', 'titel', 'fokus'],
      },
    },
    wochen: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nummer: { type: 'number' },
          phase: { type: 'number' },
          einheiten: { type: 'object' },
        },
        required: ['nummer', 'phase', 'einheiten'],
      },
    },
  },
  required: ['coachAnalysis', 'paces', 'stationsPrioritaeten', 'phasen', 'wochen'],
}

export async function* streamPlan(
  provider: AiProvider,
  apiKey: string,
  prompt: string
): AsyncGenerator<string, Record<string, unknown>> {
  if (provider === 'ANTHROPIC') {
    const client = new Anthropic({ apiKey })
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
      tools: [{ name: 'save_plan', description: 'Save the training plan as structured data', input_schema: SAVE_PLAN_TOOL_SCHEMA }],
      tool_choice: { type: 'auto' },
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text
      }
    }

    const final = await stream.finalMessage()
    const toolUse = final.content.find(b => b.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') throw new Error('AI did not call save_plan tool')
    return toolUse.input as Record<string, unknown>
  }

  if (provider === 'GEMINI') {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ functionDeclarations: [{ name: 'save_plan', description: 'Save the training plan as structured data', parameters: { ...SAVE_PLAN_TOOL_SCHEMA, type: SchemaType.OBJECT } as any }] }],
    })

    const result = await model.generateContentStream(prompt)
    let toolInput: Record<string, unknown> | null = null

    for await (const chunk of result.stream) {
      const text = chunk.text()
      if (text) yield text

      const parts = chunk.candidates?.[0]?.content?.parts ?? []
      for (const part of parts) {
        if (part.functionCall?.name === 'save_plan') {
          toolInput = part.functionCall.args as Record<string, unknown>
        }
      }
    }

    // If no tool call found in stream, check final response
    if (!toolInput) {
      const final = await result.response
      const parts = final.candidates?.[0]?.content?.parts ?? []
      for (const part of parts) {
        if (part.functionCall?.name === 'save_plan') {
          toolInput = part.functionCall.args as Record<string, unknown>
        }
      }
    }

    if (!toolInput) throw new Error('AI did not call save_plan tool')
    return toolInput
  }

  if (provider === 'OPENAI') {
    const client = new OpenAI({ apiKey })
    const stream = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
      tools: [{ type: 'function', function: { name: 'save_plan', description: 'Save the training plan as structured data', parameters: SAVE_PLAN_TOOL_SCHEMA } }],
      tool_choice: 'auto',
      stream: true,
    })

    let toolCallArgsRaw = ''
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta
      if (delta?.content) yield delta.content
      if (delta?.tool_calls?.[0]?.function?.arguments) {
        toolCallArgsRaw += delta.tool_calls[0].function.arguments
      }
    }

    if (!toolCallArgsRaw) throw new Error('AI did not call save_plan tool')
    return JSON.parse(toolCallArgsRaw) as Record<string, unknown>
  }

  throw new Error(`Unknown provider: ${provider}`)
}
