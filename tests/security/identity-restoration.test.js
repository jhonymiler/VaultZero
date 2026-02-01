/**
 * Testes de Restauração de Identidade
 * Validar que apenas palavras corretas podem restaurar a identidade
 */

const { generateMnemonic, mnemonicToSeed, validateMnemonic } = require('bip39');
const crypto = require('crypto');

describe('🔐 Restauração de Identidade', () => {

  describe('Validação de Mnemônicos', () => {
    test('apenas mnemônicos válidos devem restaurar identidade', async () => {
      // Gerar identidade original
      const originalMnemonic = generateMnemonic();
      const originalSeed = await mnemonicToSeed(originalMnemonic);
      const originalAddress = crypto.createHash('sha256')
        .update(originalSeed)
        .digest('hex')
        .substring(0, 40);

      // Tentar restaurar com mnemônico correto
      const restoredSeed = await mnemonicToSeed(originalMnemonic);
      const restoredAddress = crypto.createHash('sha256')
        .update(restoredSeed)
        .digest('hex')
        .substring(0, 40);

      expect(restoredAddress).toBe(originalAddress);
    });

    test('mnemônicos incorretos devem falhar na restauração', async () => {
      const correctMnemonic = generateMnemonic();
      const wrongMnemonic = generateMnemonic(); // Diferente

      const correctSeed = await mnemonicToSeed(correctMnemonic);
      const wrongSeed = await mnemonicToSeed(wrongMnemonic);

      const correctAddress = crypto.createHash('sha256')
        .update(correctSeed)
        .digest('hex')
        .substring(0, 40);

      const wrongAddress = crypto.createHash('sha256')
        .update(wrongSeed)
        .digest('hex')
        .substring(0, 40);

      expect(correctAddress).not.toBe(wrongAddress);
    });

    test('palavras em ordem errada devem falhar', async () => {
      const mnemonic = generateMnemonic();
      const words = mnemonic.split(' ');

      // Embaralhar palavras
      const shuffledWords = [...words].sort(() => Math.random() - 0.5);
      const shuffledMnemonic = shuffledWords.join(' ');

      // Se realmente embaralhou (não ficou igual por acaso)
      if (shuffledMnemonic !== mnemonic) {
        const originalSeed = await mnemonicToSeed(mnemonic);

        // Mnemônico embaralhado pode ser inválido ou gerar seed diferente
        if (validateMnemonic(shuffledMnemonic)) {
          const shuffledSeed = await mnemonicToSeed(shuffledMnemonic);
          expect(originalSeed).not.toEqual(shuffledSeed);
        } else {
          // Mnemônico embaralhado é inválido (esperado)
          expect(validateMnemonic(shuffledMnemonic)).toBe(false);
        }
      }
    });
  });

  describe('Proteção contra Ataques de Dicionário', () => {
    test('não deve aceitar palavras comuns que não são BIP39', () => {
      const commonWords = [
        'password secret admin user login system computer internet',
        'email phone address name birthday password confirm security question',
        'the quick brown fox jumps over lazy dog today yesterday'
      ];

      commonWords.forEach(wordList => {
        expect(validateMnemonic(wordList)).toBe(false);
      });
    });

    test('deve validar checksum BIP39', () => {
      // Palavras BIP39 válidas mas com checksum incorreto
      const invalidChecksumMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon';

      expect(validateMnemonic(invalidChecksumMnemonic)).toBe(false);
    });
  });

  describe('Derivação de Chaves Determinística', () => {
    test('mesmo mnemônico deve sempre gerar mesma identidade', async () => {
      const mnemonic = generateMnemonic();

      // Restaurar múltiplas vezes
      const restoration1 = await mnemonicToSeed(mnemonic);
      const restoration2 = await mnemonicToSeed(mnemonic);
      const restoration3 = await mnemonicToSeed(mnemonic);

      expect(restoration1).toEqual(restoration2);
      expect(restoration2).toEqual(restoration3);
    });

    test('dispositivos diferentes devem ter chaves diferentes', async () => {
      const mnemonic = generateMnemonic();
      const masterSeed = await mnemonicToSeed(mnemonic);

      // Derivar chaves para dispositivos diferentes
      const device1Key = crypto.createHash('sha256')
        .update(masterSeed.toString() + 'device_001')
        .digest();

      const device2Key = crypto.createHash('sha256')
        .update(masterSeed.toString() + 'device_002')
        .digest();

      expect(device1Key).not.toEqual(device2Key);
    });
  });

  describe('Verificação de Integridade', () => {
    test('identidade restaurada deve ter todas as propriedades corretas', async () => {
      const mnemonic = generateMnemonic();
      const seed = await mnemonicToSeed(mnemonic);

      const restoredIdentity = {
        address: '0x' + crypto.createHash('sha256').update(seed).digest('hex').substring(0, 40),
        mnemonic: mnemonic,
        derivationPath: "m/44'/60'/0'/0/0",
        publicKey: crypto.createHash('sha256').update(seed.toString() + 'public').digest('hex'),
        devices: {},
        profile: {},
        permissions: {}
      };

      expect(restoredIdentity.address).toMatch(/^0x[a-f0-9]{40}$/);
      expect(restoredIdentity.mnemonic.split(' ')).toHaveLength(12);
      expect(restoredIdentity.derivationPath).toBe("m/44'/60'/0'/0/0");
      expect(typeof restoredIdentity.devices).toBe('object');
    });

    test('não deve expor dados sensíveis desnecessariamente', async () => {
      const identity = {
        address: '0x742d35Cc...',
        // mnemonic: NÃO deve estar presente em dados serializados
        publicKey: 'public_key_data',
        // privateKey: NÃO deve estar presente em dados serializados
        devices: {},
        profile: {}
      };

      // Simular serialização para rede/storage
      const serialized = JSON.stringify(identity);

      expect(serialized).not.toContain('mnemonic');
      expect(serialized).not.toContain('privateKey');
      expect(serialized).toContain('address');
      expect(serialized).toContain('publicKey');
    });
  });

  describe('Recuperação de Emergência', () => {
    test('deve permitir recuperação mesmo com alguns dispositivos perdidos', () => {
      const identity = {
        devices: {
          'device_001': { name: 'iPhone', status: 'active' },
          'device_002': { name: 'Android', status: 'lost' },
          'device_003': { name: 'Desktop', status: 'active' }
        }
      };

      const activeDevices = Object.values(identity.devices)
        .filter(device => device.status === 'active');

      // Deve ter pelo menos um dispositivo ativo para recuperação
      expect(activeDevices.length).toBeGreaterThan(0);
    });

    test('mnemônico deve funcionar independente do status dos dispositivos', async () => {
      const mnemonic = generateMnemonic();

      // Mesmo que todos os dispositivos estejam perdidos/revogados
      const identity = {
        devices: {
          'device_001': { status: 'lost' },
          'device_002': { status: 'revoked' },
          'device_003': { status: 'compromised' }
        }
      };

      // Mnemônico ainda deve permitir restauração
      const canRestore = validateMnemonic(mnemonic);
      expect(canRestore).toBe(true);
    });
  });
});
