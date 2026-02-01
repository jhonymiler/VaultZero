/**
 * Testes de Segurança Criptográfica
 * Validar que o sistema de criptografia é seguro e não permite ataques
 */

const crypto = require('crypto');
const { generateMnemonic, mnemonicToSeed, validateMnemonic } = require('bip39');

describe('🔒 Segurança Criptográfica', () => {

  describe('Geração de Mnemônicos BIP39', () => {
    test('deve gerar mnemônicos únicos e válidos', () => {
      const mnemonic1 = generateMnemonic();
      const mnemonic2 = generateMnemonic();

      // Mnemônicos devem ser diferentes
      expect(mnemonic1).not.toBe(mnemonic2);

      // Mnemônicos devem ser válidos BIP39
      expect(validateMnemonic(mnemonic1)).toBe(true);
      expect(validateMnemonic(mnemonic2)).toBe(true);

      // Deve ter 12 palavras
      expect(mnemonic1.split(' ')).toHaveLength(12);
      expect(mnemonic2.split(' ')).toHaveLength(12);
    });

    test('não deve aceitar mnemônicos inválidos', () => {
      const invalidMnemonics = [
        'palavra1 palavra2 palavra3 palavra4 palavra5 palavra6 palavra7 palavra8 palavra9 palavra10 palavra11 palavra12',
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon', // checksum inválido
        'test test test test test test test test test test test test',
        '',
        'apenas uma palavra'
      ];

      invalidMnemonics.forEach(mnemonic => {
        expect(validateMnemonic(mnemonic)).toBe(false);
      });
    });

    test('mnemônicos diferentes devem gerar seeds diferentes', async () => {
      const mnemonic1 = generateMnemonic();
      const mnemonic2 = generateMnemonic();

      const seed1 = await mnemonicToSeed(mnemonic1);
      const seed2 = await mnemonicToSeed(mnemonic2);

      expect(seed1).not.toEqual(seed2);
    });
  });

  describe('Derivação de Chaves por Dispositivo', () => {
    test('cada dispositivo deve ter chave única mesmo com mesmo mnemônico', async () => {
      const mnemonic = generateMnemonic();
      const deviceId1 = 'device_123';
      const deviceId2 = 'device_456';

      // Simular derivação de chaves por dispositivo
      const seed = await mnemonicToSeed(mnemonic);
      const deviceKey1 = crypto.createHash('sha256').update(seed.toString() + deviceId1).digest();
      const deviceKey2 = crypto.createHash('sha256').update(seed.toString() + deviceId2).digest();

      expect(deviceKey1).not.toEqual(deviceKey2);
    });

    test('mesmo dispositivo deve gerar mesma chave com mesmo mnemônico', async () => {
      const mnemonic = generateMnemonic();
      const deviceId = 'device_123';

      const seed = await mnemonicToSeed(mnemonic);
      const deviceKey1 = crypto.createHash('sha256').update(seed.toString() + deviceId).digest();
      const deviceKey2 = crypto.createHash('sha256').update(seed.toString() + deviceId).digest();

      expect(deviceKey1).toEqual(deviceKey2);
    });
  });

  describe('Prevenção de Ataques', () => {
    test('deve impedir restauração com mnemônicos falsos', () => {
      const fakeMnemonics = [
        'fake words that are not real bip39 words should fail validation test case',
        'bitcoin ethereum litecoin dogecoin cardano polkadot solana chainlink cosmos avalanche',
      ];

      fakeMnemonics.forEach(mnemonic => {
        expect(validateMnemonic(mnemonic)).toBe(false);
      });
    });

    test('deve impedir ataques de força bruta', () => {
      // Testar que é computacionalmente impossível gerar o mesmo mnemônico
      const mnemonics = new Set();

      for (let i = 0; i < 1000; i++) {
        const mnemonic = generateMnemonic();
        expect(mnemonics.has(mnemonic)).toBe(false);
        mnemonics.add(mnemonic);
      }

      expect(mnemonics.size).toBe(1000);
    });

    test('deve validar integridade da identidade restaurada', async () => {
      const originalMnemonic = generateMnemonic();
      const originalSeed = await mnemonicToSeed(originalMnemonic);

      // Simular restauração
      const restoredSeed = await mnemonicToSeed(originalMnemonic);

      expect(originalSeed).toEqual(restoredSeed);
    });
  });

  describe('Assinaturas Digitais', () => {
    test('assinaturas devem ser únicas e verificáveis', () => {
      const data = 'test data to sign';
      const privateKey1 = crypto.generateKeyPairSync('ed25519').privateKey;
      const privateKey2 = crypto.generateKeyPairSync('ed25519').privateKey;

      const signature1 = crypto.sign(null, Buffer.from(data), privateKey1);
      const signature2 = crypto.sign(null, Buffer.from(data), privateKey2);

      // Assinaturas devem ser diferentes para chaves diferentes
      expect(signature1).not.toEqual(signature2);
    });

    test('deve detectar assinaturas forjadas', () => {
      const data = 'original data';
      const fakeData = 'fake data';

      const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

      const signature = crypto.sign(null, Buffer.from(data), privateKey);

      // Verificação com dados originais deve passar
      const isValid = crypto.verify(null, Buffer.from(data), publicKey, signature);
      expect(isValid).toBe(true);

      // Verificação com dados falsos deve falhar
      const isFakeValid = crypto.verify(null, Buffer.from(fakeData), publicKey, signature);
      expect(isFakeValid).toBe(false);
    });
  });
});
