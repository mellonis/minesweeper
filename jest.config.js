export default {
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          target: "ES2020",
          lib: ["ES2020", "DOM", "DOM.Iterable"],
          strict: true,
          esModuleInterop: true,
        },
      },
    ],
  },
};
