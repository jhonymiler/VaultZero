/**
 * Tests for Auth Routes
 */

// Mock dependencies
jest.mock('../../auth/index.js', () => ({
  AuthenticationManager: jest.fn().mockImplementation(() => ({
    registerBiometric: jest.fn().mockResolvedValue({ success: true, identity: { id: 'test-id' } }),
    registerWithPasskey: jest.fn().mockResolvedValue({ options: {} }),
    completePasskeyRegistration: jest.fn().mockResolvedValue({ success: true }),
    authenticateWithBiometric: jest.fn().mockResolvedValue({ success: true }),
    authenticateWithPasskey: jest.fn().mockResolvedValue({ success: true }),
  })),
}));

jest.mock('../../blockchain/ledger.js', () => ({
  LocalLedgerManager: jest.fn().mockImplementation(() => ({
    addIdentity: jest.fn().mockResolvedValue(true),
  })),
}));

jest.mock('../../network/gossip.js', () => ({
  GossipProtocol: jest.fn().mockImplementation(() => ({
    announceIdentity: jest.fn(),
  })),
}));

import express from 'express';
import request from 'supertest';
import { createAuthRoutes } from '../routes/auth.js';

describe('Auth Routes', () => {
  let app: express.Application;
  let mockAuthManager: any;
  let mockLedger: any;
  let mockGossip: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    mockAuthManager = {
      registerBiometric: jest.fn().mockResolvedValue({ success: true, identity: { id: 'test-id' } }),
      registerWithPasskey: jest.fn().mockResolvedValue({ options: { challenge: 'test' } }),
      completePasskeyRegistration: jest.fn().mockResolvedValue({ success: true, identity: { id: 'test-id' } }),
      authenticateWithBiometric: jest.fn().mockResolvedValue({ success: true }),
      authenticateWithPasskey: jest.fn().mockResolvedValue({ options: {} }),
    };

    mockLedger = {
      addIdentity: jest.fn().mockResolvedValue(true),
    };

    mockGossip = {
      announceIdentity: jest.fn(),
    };

    const authRouter = createAuthRoutes(mockAuthManager, mockLedger, mockGossip);
    app.use('/api/auth', authRouter);
  });

  describe('POST /api/auth/register/biometric', () => {
    it('should register user with biometric data', async () => {
      const response = await request(app)
        .post('/api/auth/register/biometric')
        .send({
          userId: 'user123',
          biometricData: 'mock-biometric-data',
          biometricType: 'fingerprint',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockAuthManager.registerBiometric).toHaveBeenCalledWith(
        'user123',
        'mock-biometric-data',
        'fingerprint'
      );
    });

    it('should return 400 if biometric data is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register/biometric')
        .send({
          userId: 'user123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Biometric data is required');
    });
  });

  describe('POST /api/auth/register/passkey', () => {
    it('should initiate passkey registration', async () => {
      const response = await request(app)
        .post('/api/auth/register/passkey')
        .send({
          userId: 'user123',
          userName: 'testuser',
          userDisplayName: 'Test User',
        });

      expect(response.status).toBe(200);
      expect(mockAuthManager.registerWithPasskey).toHaveBeenCalledWith(
        'user123',
        'testuser',
        'Test User'
      );
    });
  });

  describe('POST /api/auth/authenticate/biometric', () => {
    it('should authenticate user with biometric', async () => {
      const response = await request(app)
        .post('/api/auth/authenticate/biometric')
        .send({
          userId: 'user123',
          biometricType: 'fingerprint',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/authenticate/passkey', () => {
    it('should initiate passkey authentication', async () => {
      const response = await request(app)
        .post('/api/auth/authenticate/passkey')
        .send({
          userId: 'user123',
        });

      expect(response.status).toBe(200);
    });
  });
});
