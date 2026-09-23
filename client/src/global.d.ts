// Global augmentations for third-party libraries loaded via <script>.

/**
 * CheerpJ runtime (Java in the browser).
 *
 * Loaded via `client/index.html` → `cj3loader.js`.
 * Docs: https://cheerpj.com/docs/
 *
 * The global is present after the script executes, but is only usable
 * once `cheerpJInit()` has resolved.
 */
interface CheerpJStatic {
  /**
   * Initialize the runtime. Idempotent. First call downloads the JDK
   * (~30 MB); subsequent calls are instant.
   */
  cheerpJInit: (options?: {
    /** Base URL for CheerpJ runtime files. */
    runtimeURL?: string;
    /** Preload JARs into the classpath. */
    preloadResources?: Record<string, string>;
    /** Increase memory if the JVM heap needs it (in MB). */
    javaHeapSize?: number;
  }) => Promise<void>;

  /** Run a Java class with `main(String[] args)`. */
  cheerpjRunMain: (
    className: string,
    classPath: string,
    ...args: string[]
  ) => Promise<number>;

  /** Run an executable JAR. */
  cheerpjRunJar: (jarPath: string, ...args: string[]) => Promise<number>;

  /** Resolve a virtual file path inside the CheerpJ filesystem. */
  cheerpjAddStringFile: (path: string, content: string) => void;

  /** Create a directory. */
  cheerpjCreateDirectory: (path: string) => Promise<void>;
}

declare global {
  interface Window {
    cheerpJ?: CheerpJStatic;
  }
}

export {};