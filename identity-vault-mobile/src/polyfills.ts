/**
 * Polyfills globais para React Native
 * Necessário para bibliotecas que usam Buffer, crypto e outros módulos Node.js
 */

// Importar react-native-get-random-values primeiro (necessário para crypto)
import 'react-native-get-random-values';

// Polyfill para Buffer
import { Buffer } from 'buffer';
(global as any).Buffer = Buffer;

// Polyfill para process (se necessário)
if (typeof (global as any).process === 'undefined') {
  (global as any).process = require('process');
}

// Polyfill mais simples para crypto usando expo-crypto
import * as ExpoRandom from 'expo-crypto';
if (typeof (global as any).crypto === 'undefined') {
  (global as any).crypto = {
    getRandomValues: (arr: any) => {
      const randomBytes = ExpoRandom.getRandomBytes(arr.length);
      for (let i = 0; i < arr.length; i++) {
        arr[i] = randomBytes[i];
      }
      return arr;
    }
  };
}

// Polyfill para stream (necessário para cipher-base)
if (typeof (global as any).stream === 'undefined') {
  (global as any).stream = require('stream-browserify');
}

// Adicionar outras variáveis globais necessárias
if (typeof (global as any).location === 'undefined') {
  (global as any).location = {};
}

console.log('✅ Polyfills carregados: Buffer, crypto, process, stream, random values');
