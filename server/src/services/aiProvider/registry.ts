import { env, isAITextConfigured, isAIVisionConfigured } from '../../config/env.js';
import { GroqProvider } from './groq.provider.js';
import { NullProvider } from './null.provider.js';
import type { AIProvider } from './types.js';

/**
 * Provider registry.
 *
 * A tiny singleton that reads the environment once and returns the
 * right `AIProvider` for each pass. Text and vision are resolved
 * independently — a deployment can run code-only evaluation by
 * leaving `AI_VISION_PROVIDER` at `'null'`, and the text pass will
 * still work.
 *
 * The registry does not cache "did we try and fail?" — it caches
 * the constructed provider. That means if the environment changes
 * at runtime (it shouldn't), the registry keeps the provider it
 * built on first access. Restart the server to pick up env changes.
 * That is the same policy the rest of the app follows.
 */
class AIProviderRegistry {
  private textProvider: AIProvider | null = null;
  private visionProvider: AIProvider | null = null;

  /**
   * The provider used for code evaluation.
   *
   * Never null. When the environment does not have a Groq key, or
   * `AI_TEXT_PROVIDER` is `'null'`, this returns a `NullProvider`.
   * The evaluator service can always assume a provider exists; the
   * `NullProvider` handles the "not configured" case honestly.
   */
  getTextProvider(): AIProvider {
    if (this.textProvider) return this.textProvider;

    if (isAITextConfigured() && env.GROQ_API_KEY) {
      this.textProvider = new GroqProvider({
        apiKey: env.GROQ_API_KEY,
        model: env.AI_TEXT_MODEL,
        supportsVision: false,
      });
    } else {
      this.textProvider = new NullProvider({
        model: 'text/none',
        supportsVision: false,
      });
    }

    return this.textProvider;
  }

  /**
   * The provider used for screenshot evaluation.
   *
   * Returns `null` when no vision provider is configured. The
   * evaluator service treats a `null` return as "skip the vision
   * pass" — that is a supported deployment, not an error.
   *
   * A `NullProvider` is deliberately NOT returned here. The text
   * pass always has *some* provider, because a code review is the
   * primary outcome and even a "not configured" answer is
   * meaningful. The vision pass is secondary: without a vision
   * model, there is nothing to say, and returning a `NullProvider`
   * would just clutter the UI with a second "not configured"
   * message.
   */
  getVisionProvider(): AIProvider | null {
    if (this.visionProvider) return this.visionProvider;

    if (isAIVisionConfigured() && env.GROQ_API_KEY) {
      this.visionProvider = new GroqProvider({
        apiKey: env.GROQ_API_KEY,
        model: env.AI_VISION_MODEL,
        supportsVision: true,
      });
    }

    return this.visionProvider;
  }

  /**
   * Whether the text pass has a real provider (not the null
   * fallback). Used by the admin UI to render "AI evaluation:
   * configured" vs "not configured" without a network call.
   */
  isTextConfigured(): boolean {
    return this.getTextProvider().name !== 'null';
  }

  /**
   * Whether a vision provider is configured. Returns `false` when
   * `getVisionProvider()` would return `null`.
   */
  isVisionConfigured(): boolean {
    return this.getVisionProvider() !== null;
  }
}

export const aiProviderRegistry = new AIProviderRegistry();