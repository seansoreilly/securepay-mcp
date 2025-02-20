export default [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: (await import("@typescript-eslint/parser")).default,
    },
    plugins: {
      "@typescript-eslint": (await import("@typescript-eslint/eslint-plugin")).default
    },
    rules: {
      // Add any project-specific rules here
      "no-unused-vars": "warn",
      "no-console": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
];
