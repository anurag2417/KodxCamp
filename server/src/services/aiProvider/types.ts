/**
 * AI provider abstraction.
 *
 * The evaluator service talks to providers through this interface and
 * nothing else. It does not import `groq-sdk`, does not know what an
 * "OpenAI-compatible" endpoint is, and does not care whether the
 * provider can see images.
 *
 * A provider handles **messages**, not evaluations. The evaluation
 * service is the thing that knows about project specifications and
 * rubrics. A provider is just "given this conversation, return this
 * text." That separation is what lets us add a vision provider (or
 * swap Groq for Anthropic later) without touching the evaluation
 * service or the prompt templates.
 *
 * Two concrete providers ship today:
 *
 *   - `GroqProvider`  — Groq's OpenAI-compatible API. Constructed
 *                       twice per run: once text-only for code
 *                       evaluation, once with image support for
 *                       screenshot evaluation.
 *   - `NullProvider`  — returns a fixed "not configured" payload
 *                       without any network call. Selected when the
 *                       environment has no API key, so the admin UI
 *                       can render the evaluation slot honestly
 *                       without the deployment failing to boot.
 */

/* ─── Message shape ──────────────────────────────────────────────── */

/**
 * One piece of a message's content.
 *
 * A message's content is either a plain string (the common case for
 * system prompts) or an ordered list of parts. Text parts carry
 * text; image parts carry a base64 data URL and a MIME type.
 *
 * Providers that do not support images strip image parts silently
 * and report `usedImages: false` on the response. Providers that do
 * support images pass them through and report `usedImages: true`.
 */
export type AIMessagePart =
  | { type: 'text'; text: string }
  | { type: 'image'; mimeType: string; dataUrl: string };

export interface AIMessage {
  role: 'system' | 'user';
  /**
   * Either a plain string (used when the message has no images) or
   * an ordered list of parts. The providers normalise both forms
   * into whatever their underlying API expects.
   */
  content: string | AIMessagePart[];
}

/* ─── Request / response ─────────────────────────────────────────── */

export interface AIChatRequest {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  /**
   * When set, the provider should ask the model to emit JSON.
   * The evaluator always sets `{ type: 'json_object' }`; it then
   * validates the parsed result with a Zod schema server-side.
   *
   * We deliberately use `json_object` rather than `json_schema`.
   * JSON schema enforcement is not uniformly supported across
   * OpenAI-compatible endpoints, and the schema is already enforced
   * by our own parser. `json_object` is the widest-supported mode.
   */
  responseFormat?: { type: 'json_object' };
}

export interface AIChatResponse {
  /** The model's raw text output. */
  text: string;
  /** The model identifier the provider actually used. */
  model: string;
  /**
   * Whether the provider forwarded image parts to the model.
   *
   * A text-only provider that receives an image part strips it and
   * returns `false` here. The evaluation service records this flag on
   * the `AIEvaluation` row so the admin UI can distinguish "vision
   * pass ran and looked at images" from "vision pass ran but the
   * provider ignored the images."
   */
  usedImages: boolean;
  /** The provider's raw response, for debugging. Never persisted. */
  raw: unknown;
}

/* ─── Provider ───────────────────────────────────────────────────── */

export interface AIProvider {
  /**
   * Short identifier, e.g. `'groq'` or `'null'`. Persisted on every
   * `AIEvaluation` row so an evaluation can be traced back to the
   * provider that produced it.
   */
  readonly name: string;

  /**
   * The model identifier the provider will call, e.g.
   * `'openai/gpt-oss-120b'`. Persisted alongside `name`.
   */
  readonly model: string;

  /**
   * Whether this provider forwards image parts to the model.
   * Informational — a text-only provider is still useful, it just
   * cannot see screenshots.
   */
  readonly supportsVision: boolean;

  /**
   * Send a request and return the model's response.
   *
   * Implementations must not throw on transient errors they can
   * handle internally, but they MUST throw on unrecoverable errors
   * (bad API key, model not found, network failure). The evaluator
   * service wraps calls in try/catch and records failures honestly.
   */
  chat(request: AIChatRequest): Promise<AIChatResponse>;
}