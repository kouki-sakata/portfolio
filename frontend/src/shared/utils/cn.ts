import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * TailwindCSSクラス名を結合し、競合を適切に解決するユーティリティ関数
 *
 * @param inputs - 結合するクラス名（文字列、オブジェクト、配列など）
 * @returns 結合されたクラス名文字列
 *
 * @example
 * ```ts
 * cn('bg-red-500', 'bg-blue-500') // => 'bg-blue-500' (後者が優先)
 * cn('p-4', { 'text-center': true, 'text-left': false }) // => 'p-4 text-center'
 * cn(['flex', 'items-center'], 'justify-between') // => 'flex items-center justify-between'
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}