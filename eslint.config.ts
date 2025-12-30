import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
	{
		files: ['**/*.ts'],
		ignores: ['dist/**', 'build/**', 'node_modules/**'],
		extends: [js.configs.recommended, tseslint.configs.recommended],
		languageOptions: {
			ecmaVersion: 2020,
			globals: {
				...globals.node,
			},
		},
		rules: {
			'no-var': 'error',
			'prefer-const': 'error',
			'no-constructor-return': 'error',
			'no-duplicate-imports': 'error',
			'no-self-compare': 'error',
			'no-unmodified-loop-condition': 'error',
			'no-useless-assignment': 'error',
			'no-eval': 'error',

			'array-callback-return': 'error',
			'default-case': 'error',
			eqeqeq: ['error', 'always'],

			'max-classes-per-file': ['error', 1],
			'max-depth': ['error', 4],
			'max-lines': ['warn', 300],
			'max-lines-per-function': ['error', { max: 80, skipComments: true }],
			'max-nested-callbacks': ['error', 2],
			'max-params': ['error', 4],

			'require-await': 'warn',
		},
	},
	{
		files: ['**/*.test.ts', '**/tests/**/*.ts'],
		rules: {
			'max-lines': 'off',
			'max-lines-per-function': 'off',
			'max-nested-callbacks': 'off',
			'max-params': 'off',
		},
	},
	{
		files: ['**/*asserts.ts'],
		rules: {
			'max-lines': 'off',
			'max-lines-per-function': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
		},
	},
]);
