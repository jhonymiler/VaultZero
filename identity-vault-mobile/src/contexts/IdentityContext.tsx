import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { BlockchainIdentity, Device, SyncStatus } from '../types';
import { IdentityService } from '../services/identity';
import { BiometricService } from '../services/biometric';
import { NotificationService } from '../services/notification';

interface IdentityContextType {
  // Estado
  identity: BlockchainIdentity | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isBiometricAvailable: boolean;
  syncStatus: SyncStatus;
  devices: Device[];

  // Ações
  createIdentity: (name: string) => Promise<void>;
  restoreIdentity: (mnemonic: string, deviceName: string) => Promise<void>;
  authenticateWithBiometric: () => Promise<boolean>;
  updateProfile: (profileData: any) => Promise<void>;
  clearIdentity: () => Promise<void>;
  removeDevice: (deviceId: string) => Promise<boolean>;
  getMnemonic: () => string | null;
  getAddress: () => string | null;
  refreshSyncStatus: () => void;
  hasIdentity: () => boolean;
}

const IdentityContext = createContext<IdentityContextType | undefined>(undefined);

interface IdentityProviderProps {
  children: ReactNode;
}

export function IdentityProvider({ children }: IdentityProviderProps) {
  const [identity, setIdentity] = useState<BlockchainIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isConnected: false,
    connectedPeers: 0,
    lastSync: new Date(),
    pendingTransactions: 0
  });
  const [devices, setDevices] = useState<Device[]>([]);

  const identityService = IdentityService.getInstance();

  // Inicializar serviços
  useEffect(() => {
    initializeServices();
  }, []);

  // Atualizar status de sincronização periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSyncStatus();
    }, 5000); // A cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  const initializeServices = async () => {
    try {
      setIsLoading(true);

      // Inicializar serviço de identidade
      await identityService.initialize();

      // Inicializar serviço de notificações
      try {
        const notificationService = NotificationService.getInstance();
        await notificationService.initialize();
      } catch (error) {
        console.warn('NotificationService initialization failed:', error);
      }

      // Verificar se existe identidade
      const currentIdentity = identityService.getCurrentIdentity();
      setIdentity(currentIdentity);
      setIsAuthenticated(!!currentIdentity);

      // Verificar disponibilidade de biometria
      const biometricAvailable = await BiometricService.isBiometricAvailable();
      setIsBiometricAvailable(biometricAvailable);

      // Carregar dispositivos
      if (currentIdentity) {
        const deviceList = identityService.getDevices();
        setDevices(deviceList);
      }

      // Atualizar status de sincronização
      refreshSyncStatus();

    } catch (error) {
      console.error('Error initializing services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createIdentity = async (name: string) => {
    try {
      setIsLoading(true);
      const newIdentity = await identityService.createIdentity(name, `Dispositivo Principal`);
      setIdentity(newIdentity);
      setIsAuthenticated(true);
      
      const deviceList = identityService.getDevices();
      setDevices(deviceList);
      
      refreshSyncStatus();
    } catch (error) {
      console.error('Error creating identity:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const restoreIdentity = async (mnemonic: string, deviceName: string) => {
    try {
      setIsLoading(true);
      const result = await identityService.restoreIdentity(mnemonic, `Dispositivo Restaurado`, deviceName);
      
      setIdentity(result.identity);
      setIsAuthenticated(true);
      
      const deviceList = identityService.getDevices();
      setDevices(deviceList);
      
      refreshSyncStatus();

      // Se o dispositivo está em quarentena, mostrar alerta informativo
      if (result.needsApproval && result.quarantineInfo) {
        console.log('🔒 Dispositivo em quarentena até:', result.quarantineInfo.quarantineUntil);
        console.log('📱 Dispositivos existentes:', result.quarantineInfo.existingDevicesCount);
        // Aqui você pode mostrar um Alert ou navegação para tela de segurança
      }
      
    } catch (error) {
      console.error('Error restoring identity:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const authenticateWithBiometric = async (): Promise<boolean> => {
    try {
      const result = await identityService.authenticateWithBiometric();
      if (result) {
        setIsAuthenticated(true);
      }
      return result;
    } catch (error) {
      console.error('Error authenticating with biometric:', error);
      return false;
    }
  };

  const updateProfile = async (profileData: any) => {
    try {
      await identityService.updateProfile(profileData);
      const updatedIdentity = identityService.getCurrentIdentity();
      setIdentity(updatedIdentity);
      refreshSyncStatus();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const clearIdentity = async () => {
    try {
      setIsLoading(true);
      await identityService.clearIdentity();
      setIdentity(null);
      setIsAuthenticated(false);
      setDevices([]);
      refreshSyncStatus();
    } catch (error) {
      console.error('Error clearing identity:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeDevice = async (deviceId: string): Promise<boolean> => {
    try {
      const success = await identityService.removeDevice(deviceId);
      if (success) {
        // Atualizar lista de dispositivos
        const updatedIdentity = identityService.getCurrentIdentity();
        setIdentity(updatedIdentity);
        const deviceList = identityService.getDevices();
        setDevices(deviceList);
        refreshSyncStatus();
      }
      return success;
    } catch (error) {
      console.error('Error removing device:', error);
      return false;
    }
  };

  const getMnemonic = (): string | null => {
    return identityService.getMnemonic();
  };

  const getAddress = (): string | null => {
    return identityService.getAddress();
  };

  const refreshSyncStatus = () => {
    const currentSyncStatus = identityService.getSyncStatus();
    setSyncStatus(currentSyncStatus);
  };

  const hasIdentity = (): boolean => {
    return identity !== null;
  };

  const value: IdentityContextType = {
    // Estado
    identity,
    isLoading,
    isAuthenticated,
    isBiometricAvailable,
    syncStatus,
    devices,

    // Ações
    createIdentity,
    restoreIdentity,
    authenticateWithBiometric,
    updateProfile,
    clearIdentity,
    removeDevice,
    getMnemonic,
    getAddress,
    refreshSyncStatus,
    hasIdentity
  };

  return (
    <IdentityContext.Provider value={value}>
      {children}
    </IdentityContext.Provider>
  );
}

export const useIdentity = (): IdentityContextType => {
  const context = useContext(IdentityContext);
  if (!context) {
    throw new Error('useIdentity must be used within an IdentityProvider');
  }
  return context;
};
