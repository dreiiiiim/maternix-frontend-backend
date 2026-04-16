/**
 * Next.js instrumentation file — runs once on server startup before SSR.
 *
 * Node.js 22+ exposes `localStorage` as a global web API, but without
 * `--localstorage-file` the object is stub-only (getItem / setItem are not
 * functions). Next.js's dev-overlay calls `localStorage.getItem` during SSR
 * which crashes the page. We replace the broken stub with a proper
 * in-memory implementation so the server doesn't crash.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (
      typeof localStorage !== 'undefined' &&
      typeof localStorage.getItem !== 'function'
    ) {
      const store = new Map<string, string>();

      const mock: Storage = {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
        clear: () => {
          store.clear();
        },
        key: (index: number) => [...store.keys()][index] ?? null,
        get length() {
          return store.size;
        },
      };

      try {
        Object.defineProperty(globalThis, 'localStorage', {
          value: mock,
          writable: true,
          configurable: true,
        });
      } catch {
        // If defineProperty fails (e.g., non-configurable), fall back to assignment
        (globalThis as Record<string, unknown>).localStorage = mock;
      }
    }
  }
}
