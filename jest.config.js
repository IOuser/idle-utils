module.exports = {
    collectCoverage: false,
    coverageDirectory: '<rootDir>/coverage',
    setupFiles: ['<rootDir>/tests/shim.js'],
    transform: {
        '^.+\\.(ts|tsx|js)$': 'ts-jest',
    },
    moduleDirectories: ['node_modules', 'src'],
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    testMatch: ['**/*.spec.(ts|tsx|js)'],
    testPathIgnorePatterns: ['<rootDir>/(lib|dest|dist)/'],
    transformIgnorePatterns: ['<rootDir>/node_modules/(?!idle-callback).+\\.js$'],
};
