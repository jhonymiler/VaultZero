/**
 * Declarações de tipos para react-native-bip39
 */

declare module 'react-native-bip39' {
  declare module 'react-native-bip39' {
  export function generateMnemonic(strength?: number, rng?: (size: number) => Buffer, wordlist?: string[]): string;
  export function mnemonicToSeed(mnemonic: string, password?: string): Promise<Buffer>;
  export function mnemonicToSeedSync(mnemonic: string, password?: string): Buffer;
  export function validateMnemonic(mnemonic: string, wordlist?: string[]): boolean;
  export function entropyToMnemonic(entropy: string | Buffer, wordlist?: string[]): string;
  export function mnemonicToEntropy(mnemonic: string, wordlist?: string[]): string;
  export const wordlists: {
    chinese_simplified: string[];
    chinese_traditional: string[];
    english: string[];
    french: string[];
    italian: string[];
    japanese: string[];
    korean: string[];
    spanish: string[];
  };
}
}
