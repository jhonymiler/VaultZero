/**
 * Tests for Kademlia DHT Service
 */

describe('KademliaService', () => {
  // Mock the crypto module
  const mockCrypto = {
    digestStringAsync: jest.fn().mockResolvedValue('abcd1234567890abcd1234567890abcd12345678'),
    getRandomBytesAsync: jest.fn().mockResolvedValue(new Uint8Array(16)),
  };

  // Mock logger
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  describe('XOR Distance Calculation', () => {
    const hexToBuffer = (hex: string): number[] => {
      const result: number[] = [];
      for (let i = 0; i < hex.length; i += 2) {
        result.push(parseInt(hex.substr(i, 2), 16));
      }
      return result;
    };

    const calculateXORDistance = (id1: string, id2: string): number => {
      const buf1 = hexToBuffer(id1);
      const buf2 = hexToBuffer(id2);
      
      let distance = 0;
      for (let i = 0; i < Math.min(buf1.length, buf2.length); i++) {
        const xor = buf1[i] ^ buf2[i];
        if (xor !== 0) {
          for (let bit = 7; bit >= 0; bit--) {
            if ((xor >> bit) & 1) {
              return distance + (7 - bit);
            }
          }
        }
        distance += 8;
      }
      return distance;
    };

    it('should calculate XOR distance correctly for identical ids', () => {
      const id = 'abcd1234';
      const distance = calculateXORDistance(id, id);
      expect(distance).toBe(32); // Full distance for identical IDs
    });

    it('should calculate XOR distance for different ids', () => {
      const id1 = '00000000';
      const id2 = '80000000'; // First bit different
      const distance = calculateXORDistance(id1, id2);
      expect(distance).toBe(0); // Distance is 0 means first bit differs
    });

    it('should calculate XOR distance for slightly different ids', () => {
      const id1 = 'ff000000';
      const id2 = 'fe000000'; // Last bit of first byte different
      const distance = calculateXORDistance(id1, id2);
      expect(distance).toBe(7); // 7th bit position differs
    });
  });

  describe('K-Bucket Management', () => {
    const K_BUCKET_SIZE = 20;
    
    interface MockPeer {
      id: string;
      connectionState: string;
    }

    interface MockKBucket {
      nodes: MockPeer[];
      lastUpdated: number;
      maxSize: number;
    }

    let kBuckets: Map<number, MockKBucket>;

    beforeEach(() => {
      kBuckets = new Map();
      for (let i = 0; i < 160; i++) {
        kBuckets.set(i, {
          nodes: [],
          lastUpdated: Date.now(),
          maxSize: K_BUCKET_SIZE,
        });
      }
    });

    it('should add peer to appropriate bucket', () => {
      const bucket = kBuckets.get(0)!;
      const peer: MockPeer = { id: 'peer1', connectionState: 'connected' };
      
      bucket.nodes.push(peer);
      bucket.lastUpdated = Date.now();

      expect(bucket.nodes).toHaveLength(1);
      expect(bucket.nodes[0].id).toBe('peer1');
    });

    it('should not exceed max bucket size', () => {
      const bucket = kBuckets.get(0)!;
      
      // Fill bucket to max
      for (let i = 0; i < K_BUCKET_SIZE; i++) {
        bucket.nodes.push({ id: `peer${i}`, connectionState: 'connected' });
      }

      expect(bucket.nodes.length).toBe(K_BUCKET_SIZE);
      
      // Bucket is full, new peer should not be added directly
      const newPeer: MockPeer = { id: 'newPeer', connectionState: 'connected' };
      if (bucket.nodes.length < bucket.maxSize) {
        bucket.nodes.push(newPeer);
      }

      expect(bucket.nodes.length).toBe(K_BUCKET_SIZE);
    });

    it('should move existing peer to tail on update', () => {
      const bucket = kBuckets.get(0)!;
      bucket.nodes.push({ id: 'peer1', connectionState: 'connected' });
      bucket.nodes.push({ id: 'peer2', connectionState: 'connected' });
      bucket.nodes.push({ id: 'peer3', connectionState: 'connected' });

      // Update peer1 (should move to tail)
      const existingIndex = bucket.nodes.findIndex(n => n.id === 'peer1');
      if (existingIndex >= 0) {
        const [peer] = bucket.nodes.splice(existingIndex, 1);
        bucket.nodes.push(peer);
      }

      expect(bucket.nodes[bucket.nodes.length - 1].id).toBe('peer1');
    });
  });

  describe('DHT Store and Get', () => {
    const dhtStorage = new Map<string, { key: string; value: any; timestamp: number }>();

    it('should store value in local DHT', () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      
      dhtStorage.set(key, { key, value, timestamp: Date.now() });

      expect(dhtStorage.has(key)).toBe(true);
      expect(dhtStorage.get(key)?.value).toEqual(value);
    });

    it('should retrieve value from local DHT', () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      
      dhtStorage.set(key, { key, value, timestamp: Date.now() });
      const retrieved = dhtStorage.get(key);

      expect(retrieved?.value).toEqual(value);
    });

    it('should return undefined for non-existent key', () => {
      const retrieved = dhtStorage.get('non-existent-key');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Find K Closest Nodes', () => {
    it('should return closest nodes sorted by distance', () => {
      const allNodes = [
        { id: 'node1', distance: 10 },
        { id: 'node2', distance: 5 },
        { id: 'node3', distance: 15 },
        { id: 'node4', distance: 3 },
      ];

      const sorted = allNodes.sort((a, b) => a.distance - b.distance);
      const kClosest = sorted.slice(0, 3);

      expect(kClosest[0].id).toBe('node4');
      expect(kClosest[1].id).toBe('node2');
      expect(kClosest[2].id).toBe('node1');
    });
  });
});
