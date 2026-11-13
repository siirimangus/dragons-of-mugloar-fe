import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['dist', 'coverage', 'docs', 'node_modules'] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        plugins: { 'react-hooks': reactHooks },
        rules: {
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            '@typescript-eslint/consistent-type-imports': 'error',
        },
    },
    {
        // Purity rule: domain/ is plain TypeScript. No React, no network, no browser, no other layers.
        files: ['src/domain/**/*.{ts,tsx}'],
        rules: {
            'no-restricted-globals': [
                'error',
                'fetch',
                'console',
                'window',
                'document',
                'localStorage',
            ],
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['react', 'react/*', 'react-dom', 'react-dom/*', 'zod'],
                            message: 'domain/ is pure TypeScript: no React and no libraries.',
                        },
                        {
                            group: [
                                '../api',
                                '../api/*',
                                '../state',
                                '../state/*',
                                '../components',
                                '../components/*',
                                '../screens',
                                '../screens/*',
                            ],
                            message: 'domain/ must not depend on other layers.',
                        },
                    ],
                },
            ],
        },
    },
);
