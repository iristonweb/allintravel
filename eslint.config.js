import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

const projectFiles = [
  "client/src/**/*.{ts,tsx}",
  "server/**/*.ts",
  "shared/**/*.ts",
  "scripts/**/*.ts",
];

export default tseslint.config(
  {
    ignores: [
      ".local/**",
      "attached_assets/**",
      "dist/**",
      "api/**",
      "node_modules/**",
      "build/**",
      "client/public/**",
      "**/*.js",
      "**/*.mjs",
      "**/*.cjs",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: projectFiles,
    plugins: {
      "react-hooks": reactHooks,
    },
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
      },
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-require-imports": "off",
      "prefer-const": "warn",
    },
  },
);
