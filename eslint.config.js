import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // Never lint the Vite/Vercel build output or the Supabase-generated
    // types file — the latter is regenerated via `supabase gen types` and
    // is wrapped by the codegen pipeline; editing it breaks the workflow.
    ignores: ["dist", "src/integrations/supabase/types.ts"],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-empty": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-require-imports": "off",
      // Force every src/* file to use the central logger instead of
      // raw console.* (audit C-04). The logger silences debug/info in
      // production, scrubs Supabase error shapes to drop PII, and
      // keeps Sentry attribution clean. `console.warn` and
      // `console.error` are still allowed as escape hatches for
      // bootstrap code that runs before the logger module loads
      // (ErrorBoundary, sentry init); the rule warns instead of
      // erroring so those rare cases don't block CI.
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    // Files that legitimately need raw console.*: the logger module
    // itself, the ErrorBoundary which runs before module init, and
    // the Sentry shim which has to log its own bootstrap state.
    files: ["src/lib/logger.ts", "src/components/ErrorBoundary.tsx", "src/lib/sentry.ts"],
    rules: { "no-console": "off" },
  },
  {
    files: ["src/components/ui/**/*.{ts,tsx}", "src/contexts/**/*.{ts,tsx}", "src/i18n/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  }
);
