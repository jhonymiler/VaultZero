import express from 'express';
import { AuthenticationManager } from '../auth/index.js';
import { LocalLedgerManager } from '../blockchain/ledger.js';
import { GossipProtocol } from '../network/gossip.js';

export function createAuthRoutes(
  authManager: AuthenticationManager,
  localLedger: LocalLedgerManager,
  gossipProtocol: GossipProtocol
) {
  const router = express.Router();

  // Register with biometric
  router.post('/register/biometric', async (req, res) => {
    try {
      const { userId, biometricData, biometricType } = req.body;
      console.log('📱 Registering new biometric identity for:', userId);
      
      if (!biometricData) {
        return res.status(400).json({ error: 'Biometric data is required' });
      }
      
      const result = await authManager.registerBiometric(userId, biometricData, biometricType);
      console.log('✅ Biometric registration result:', result.success);
      
      if (result.success && result.identity) {
        await localLedger.addIdentity(result.identity);
        gossipProtocol.announceIdentity(result.identity);
      }
      
      res.json(result);
    } catch (error) {
      console.error('❌ Registration failed:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Register with passkey
  router.post('/register/passkey', async (req, res) => {
    try {
      const { userId, userName, userDisplayName } = req.body;
      console.log('🔑 Registering passkey for:', userName);
      
      const result = await authManager.registerWithPasskey(userId, userName, userDisplayName);
      res.json(result);
    } catch (error) {
      console.error('❌ Passkey registration failed:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Complete passkey registration
  router.post('/register/passkey/complete', async (req, res) => {
    try {
      const { userId, response } = req.body;
      console.log('🔍 Completing passkey registration for:', userId);
      
      const result = await authManager.completePasskeyRegistration(userId, response);
      
      if (result.success && result.identity) {
        await localLedger.addIdentity(result.identity);
        gossipProtocol.announceIdentity(result.identity);
      }
      
      res.json(result);
    } catch (error) {
      console.error('❌ Passkey registration completion failed:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Authenticate with biometric
  router.post('/authenticate/biometric', async (req, res) => {
    try {
      const { userId, biometricType } = req.body;
      console.log('🔐 Authenticating biometric for:', userId);
      
      const result = await authManager.authenticateWithBiometric(userId, biometricType);
      console.log('✅ Biometric authentication result:', result.success);
      
      res.json(result);
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Authenticate with passkey
  router.post('/authenticate/passkey', async (req, res) => {
    try {
      const { userId } = req.body;
      console.log('🔐 Authenticating passkey for:', userId);
      
      const result = await authManager.authenticateWithPasskey(userId);
      res.json(result);
    } catch (error) {
      console.error('❌ Passkey authentication failed:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  return router;
}
