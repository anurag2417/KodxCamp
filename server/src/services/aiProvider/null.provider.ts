import type {
  AIProvider,
  AIChatRequest,
  AIChatResponse,
} from './types.js';

/**
 * A provider that never calls a network service.
 *
 * Used when the environment has no AI API key, or when the operator
 * explicitly sets `AI_TEXT_PROVIDER=null` / `AI_VISION_PROVIDER=null`
 * to disable a pass.
 *
 * The point is not "pretend nothing happened." The point is to
 * return a payload the admin UI can render as **"AI evaluation is
 * not configured on this deployment"** — a clear, honest statement
 * — rather than an error, a blank screen, or a boot failure.
 *
 * Because the response is valid JSON, the same parsing path that
 * handles a real evaluation handles this one. The parsed `score`
 * field is `null` and the `overallFeedback` string says what
 * happened.
 */
export class NullProvider implements AIProvider {
  readonly name = 'null';
  readonly model: string;
  readonly supportsVision: boolean;

  constructor(opts: { model?: string; supportsVision?: boolean } = {}) {
    this.model = opts.model ?? 'none';
    this.supportsVision = opts.supportsVision ?? false;
  }

  async chat(request: AIChatRequest): Promise<AIChatResponse> {
    void request; // signature compatibility

    // The response shape matches what the evaluator expects from a
    // real provider, so downstream parsing and persistence behave
    // identically whether a key is present or not.
    const text = JSON.stringify({
      evaluatorNotConfigured: true,
      score: null,
      categoryScores: [],
      requirementResults: [],
      overallFeedback:
        'AI evaluation is not configured on this deployment. ' +
        'Set GROQ_API_KEY and enable AI_TEXT_PROVIDER / ' +
        'AI_VISION_PROVIDER in the server environment to turn it on.',
    });

    return {
      text,
      model: this.model,
      usedImages: false,
      raw: { provider: 'null' },
    };
  }
}