const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    files: ["eslint.config.js", "server.js", "api/**/*.js", "src/**/*.js", "tests/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-console": "off",
    },
  },
  {
    files: ["script.js", "landing.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.es2022,
        marked: "readonly",
        DOMPurify: "readonly",
        renderMathInElement: "readonly",
        katex: "readonly",
        Prism: "readonly",
      },
    },
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-console": "off",
    },
  },
  {
    ignores: [
      "node_modules/",
      "dist/",
      ".vercel/",
      "frontend/",
      "backend/",
      "tokenization-server/",
      "assets/",
    ],
  },
];
