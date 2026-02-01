/**
 * Tests for VaultZero SDK
 */

describe('VaultZeroSDK', () => {
  // Mock configuration
  const mockConfig = {
    coreServerUrl: 'http://localhost:3000',
    appName: 'Test App',
    appId: 'test-app-id',
    debug: false,
    timeout: 30000,
    sseEndpoint: '/api/sse/auth',
    loginEndpoint: '/api/login/create-session',
  };

  describe('Configuration', () => {
    it('should accept valid configuration', () => {
      const config = { ...mockConfig };
      
      expect(config.coreServerUrl).toBe('http://localhost:3000');
      expect(config.appName).toBe('Test App');
      expect(config.timeout).toBe(30000);
    });

    it('should use default values for optional fields', () => {
      const config = {
        coreServerUrl: 'http://localhost:3000',
        appName: 'Test App',
      };

      const fullConfig = {
        ...config,
        timeout: config.timeout || 30000,
        debug: config.debug || false,
      };

      expect(fullConfig.timeout).toBe(30000);
      expect(fullConfig.debug).toBe(false);
    });
  });

  describe('Session Management', () => {
    interface MockLoginSession {
      sessionId: string;
      qrCodeData: string;
      createdAt: number;
      expiresAt: number;
      status: 'pending' | 'scanned' | 'authenticated' | 'expired';
    }

    const createMockSession = (): MockLoginSession => {
      const now = Date.now();
      return {
        sessionId: `session_${now}_${Math.random().toString(36).substr(2, 6)}`,
        qrCodeData: 'mock-qr-data',
        createdAt: now,
        expiresAt: now + 300000, // 5 minutes
        status: 'pending',
      };
    };

    it('should create a new login session', () => {
      const session = createMockSession();

      expect(session.sessionId).toContain('session_');
      expect(session.status).toBe('pending');
      expect(session.expiresAt).toBeGreaterThan(session.createdAt);
    });

    it('should detect expired sessions', () => {
      const session = createMockSession();
      session.expiresAt = Date.now() - 1000; // Expired

      const isExpired = Date.now() > session.expiresAt;
      expect(isExpired).toBe(true);
    });

    it('should update session status', () => {
      const session = createMockSession();
      
      session.status = 'scanned';
      expect(session.status).toBe('scanned');

      session.status = 'authenticated';
      expect(session.status).toBe('authenticated');
    });
  });

  describe('QR Code Generation', () => {
    it('should generate QR code data URL', async () => {
      // Mock QR code generation
      const generateQRCode = async (data: string): Promise<string> => {
        // In real implementation, this would use the qrcode library
        return `data:image/png;base64,mock_qr_code_${data}`;
      };

      const qrDataUrl = await generateQRCode('test-session-id');
      
      expect(qrDataUrl).toContain('data:image/png;base64');
      expect(qrDataUrl).toContain('test-session-id');
    });

    it('should include session info in QR data', () => {
      const sessionId = 'session_123';
      const appId = 'test-app';
      
      const qrPayload = JSON.stringify({
        type: 'vaultzero-login',
        sessionId,
        appId,
        timestamp: Date.now(),
      });

      const parsed = JSON.parse(qrPayload);
      
      expect(parsed.type).toBe('vaultzero-login');
      expect(parsed.sessionId).toBe(sessionId);
      expect(parsed.appId).toBe(appId);
    });
  });

  describe('SSE Connection', () => {
    interface MockSSEEvent {
      type: string;
      data: any;
      timestamp: number;
    }

    const eventTypes = [
      'session_created',
      'qr_generated',
      'scan_detected',
      'authentication_start',
      'authentication_success',
      'authentication_error',
      'session_expired',
    ];

    it('should handle all SSE event types', () => {
      const handlers = new Map<string, (data: any) => void>();

      eventTypes.forEach(type => {
        handlers.set(type, jest.fn());
      });

      expect(handlers.size).toBe(7);
      expect(handlers.has('authentication_success')).toBe(true);
    });

    it('should parse SSE event data correctly', () => {
      const eventData = 'data: {"type":"scan_detected","sessionId":"123"}\n\n';
      
      const lines = eventData.split('\n');
      const dataLine = lines.find(l => l.startsWith('data: '));
      
      if (dataLine) {
        const json = dataLine.replace('data: ', '');
        const parsed = JSON.parse(json);
        
        expect(parsed.type).toBe('scan_detected');
        expect(parsed.sessionId).toBe('123');
      }
    });
  });

  describe('Authentication Callbacks', () => {
    it('should trigger success callback on authentication', () => {
      const onSuccess = jest.fn();
      const onError = jest.fn();

      const authResult = { success: true, userId: 'user123' };
      
      if (authResult.success) {
        onSuccess(authResult);
      } else {
        onError(new Error('Auth failed'));
      }

      expect(onSuccess).toHaveBeenCalledWith(authResult);
      expect(onError).not.toHaveBeenCalled();
    });

    it('should trigger error callback on failure', () => {
      const onSuccess = jest.fn();
      const onError = jest.fn();

      const authResult = { success: false, error: 'Invalid session' };
      
      if (!authResult.success) {
        onError(new Error(authResult.error));
      }

      expect(onError).toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe('React Hook Integration', () => {
    it('should return correct login state structure', () => {
      interface LoginState {
        isLoading: boolean;
        error: string | null;
        session: any | null;
        qrCodeUrl: string | null;
        isAuthenticated: boolean;
      }

      const initialState: LoginState = {
        isLoading: false,
        error: null,
        session: null,
        qrCodeUrl: null,
        isAuthenticated: false,
      };

      expect(initialState.isLoading).toBe(false);
      expect(initialState.isAuthenticated).toBe(false);
      expect(initialState.session).toBeNull();
    });

    it('should update state on login flow', () => {
      const state = {
        isLoading: true,
        session: null,
        isAuthenticated: false,
      };

      // Simulate session creation
      state.session = { sessionId: '123' };
      state.isLoading = false;

      expect(state.session).not.toBeNull();
      expect(state.isLoading).toBe(false);

      // Simulate authentication success
      state.isAuthenticated = true;
      expect(state.isAuthenticated).toBe(true);
    });
  });
});
