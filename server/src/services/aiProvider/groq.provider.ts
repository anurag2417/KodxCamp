import Groq from 'groq-sdk';
import type {
  AIProvider,
  AIChatRequest,
  AIChatResponse,
  AIMessagePart,
} from './types.js';

interface GroqProviderOptions {
  apiKey: string;
  model: string;
  /**
   * Whether this instance is allowed to forward image parts to the
   * model. A single Groq API key can be used by two instances: one
   * text-only (for code evaluation against `openai/gpt-oss-120b`),
   * one vision-capable (for screenshot evaluation against
   * `meta-llama/llama-4-scout-17b-16e-instruct`).
   */
  supportsVision: boolean;
}

/**
 * Groq adapter.
 *
 * Groq's API is OpenAI-compatible: the request and response shapes
 * for `chat.completions.create` match OpenAI's. That's why this
 * adapter is short — most of the work is translating our internal
 * `AIMessagePart` union into the shape Groq's SDK expects, and
 * handling the text-only vs vision distinction.
 *
 * Two behaviours matter:
 *
 *   1. **Image stripping.** When `supportsVision` is false and a
 *      message contains image parts, those parts are dropped before
 *      the request is sent, and `usedImages` is set to `false` on
 *      the response. This is what lets a text-only provider (like
 *      `openai/gpt-oss-120b`) sit behind the same interface as a
 *      vision provider without the caller needing to know which is
 *      which.
 *
 *   2. **JSON mode.** When the request asks for `json_object`
 *      response format, we pass it through. Groq supports this for
 *      the models we use. Combined with the prompt's instruction to
 *      return JSON, it makes parsing reliable.
 *
 * The provider deliberately does not retry on transient errors. The
 * evaluation service is admin-triggered — a human clicks "Evaluate"
 * and waits. If a network blip happens, the honest response is to
 * surface the error, let the admin retry, and record the attempt.
 * Silent retries would make the score's provenance ambiguous.
 */
export class GroqProvider implements AIProvider {
  readonly name = 'groq';
  readonly model: string;
  readonly supportsVision: boolean;

  private readonly client: Groq;

  constructor(opts: GroqProviderOptions) {
    this.client = new Groq({ apiKey: opts.apiKey });
    this.model = opts.model;
    this.supportsVision = opts.supportsVision;
  }

  async chat(request: AIChatRequest): Promise<AIChatResponse> {
    let sentImages = false;
    let strippedImages = false;

    const messages: Groq.Chat.ChatCompletionMessageParam[] =
      request.messages.map((m) => {
        if (typeof m.content === 'string') {
          return {
            role: m.role,
            content: m.content,
          } as Groq.Chat.ChatCompletionMessageParam;
        }

        const parts = m.content
          .map((part) => this.toGroqPart(part, (wasImage, kept) => {
            if (!wasImage) return;
            if (kept) sentImages = true;
            else strippedImages = true;
          }))
          .filter((p): p is object => p !== null);

        return {
          role: m.role,
          content: parts,
        } as unknown as Groq.Chat.ChatCompletionMessageParam;
      });

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxTokens ?? 4096,
      response_format:
        request.responseFormat?.type === 'json_object'
          ? { type: 'json_object' }
          : undefined,
    });

    const text = response.choices?.[0]?.message?.content ?? '';
    const modelUsed = response.model ?? this.model;

    return {
      text,
      model: modelUsed,
      // usedImages is true only if we actually forwarded at least
      // one image. If we stripped one because the provider is
      // text-only, usedImages is false, which the admin UI reads as
      // "vision pass did not see the screenshots."
      usedImages: sentImages && !strippedImages,
      raw: response,
    };
  }

  /**
   * Convert an internal message part to a Groq content part.
   *
   * `onImage` is called for every image part with `(wasImage=true,
   * kept)` so the caller can track whether images made it through.
   * For non-image parts it is not called.
   *
   * Returns `null` when a part cannot be represented in Groq's
   * format (which happens for image parts when the provider is
   * text-only). The caller filters nulls out.
   */
  private toGroqPart(
    part: AIMessagePart,
    onImage: (wasImage: boolean, kept: boolean) => void,
  ): object | null {
    if (part.type === 'text') {
      return { type: 'text', text: part.text };
    }

    if (part.type === 'image') {
      if (!this.supportsVision) {
        onImage(true, false);
        return null;
      }
      onImage(true, true);
      return {
        type: 'image_url',
        image_url: { url: part.dataUrl },
      };
    }

    return null;
  }
}