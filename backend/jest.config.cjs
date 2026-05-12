/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  clearMocks: true,
  passWithNoTests: true,
  moduleNameMapper: {
    "^(\\.\\.?/.+)\\.js$": "$1"
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.test.json"
      }
    ]
  },
  moduleFileExtensions: ["ts", "js", "json"]
};
