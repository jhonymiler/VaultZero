import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { IdentityService } from '../services/identity';

interface SimpleContextType {
  isLoading: boolean;
  hasIdentity: () => boolean;
  createIdentity: (name: string, deviceName: string) => Promise<void>;
  restoreIdentity: (mnemonic: string, name: string, deviceName: string) => Promise<void>;
  getCurrentIdentity: () => any;
  getMnemonic: () => string | null;
  getAddress: () => string | null;
  getDevices: () => any[];
  updateProfile: (profileData: any) => Promise<void>;
  getSyncStatus: () => any;
}

const SimpleContext = createContext<SimpleContextType | undefined>(undefined);

interface SimpleProviderProps {
  children: ReactNode;
}

export function SimpleProvider({ children }: SimpleProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const identityService = IdentityService.getInstance();

  useEffect(() => {
    const initializeServices = async () => {
      try {
        await identityService.initialize();
      } catch (error) {
        console.error('Error initializing services:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeServices();
  }, []);

  const hasIdentity = (): boolean => {
    return identityService.hasIdentity();
  };
  
  const createIdentity = async (name: string, deviceName: string): Promise<void> => {
    setIsLoading(true);
    try {
      await identityService.createIdentity(name, deviceName);
    } finally {
      setIsLoading(false);
    }
  };
  
  const restoreIdentity = async (mnemonic: string, name: string, deviceName: string): Promise<void> => {
    setIsLoading(true);
    try {
      await identityService.restoreIdentity(mnemonic, name, deviceName);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentIdentity = () => {
    console.log('🔍 SimpleContext.getCurrentIdentity: Obtendo identidade...');
    const identity = identityService.getCurrentIdentity();
    console.log('🔍 SimpleContext.getCurrentIdentity: Identidade obtida:', identity ? 'Existe' : 'Null');
    return identity;
  };
  
  const getMnemonic = () => {
    return identityService.getMnemonic();
  };
  
  const getAddress = () => {
    return identityService.getAddress();
  };
  
  const getDevices = () => {
    try {
      const devices = identityService.getDevices();
      return Array.isArray(devices) ? devices : [];
    } catch (error) {
      console.error('Error getting devices:', error);
      return [];
    }
  };
  
  const updateProfile = async (profileData: any) => {
    try {
      await identityService.updateProfile(profileData);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };
  
  const getSyncStatus = () => {
    try {
      const status = identityService.getSyncStatus();
      return status || {
        isConnected: false,
        connectedPeers: 0,
        lastSync: null,
        pendingTransactions: 0
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        isConnected: false,
        connectedPeers: 0,
        lastSync: null,
        pendingTransactions: 0
      };
    }
  };

  const value: SimpleContextType = {
    isLoading,
    hasIdentity,
    createIdentity,
    restoreIdentity,
    getCurrentIdentity,
    getMnemonic,
    getAddress,
    getDevices,
    updateProfile,
    getSyncStatus
  };

  return (
    <SimpleContext.Provider value={value}>
      {children}
    </SimpleContext.Provider>
  );
}

export const useSimple = (): SimpleContextType => {
  const context = useContext(SimpleContext);
  if (!context) {
    throw new Error('useSimple must be used within a SimpleProvider');
  }
  return context;
};
