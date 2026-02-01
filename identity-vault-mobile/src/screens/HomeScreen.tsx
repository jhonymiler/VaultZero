import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSimple } from '../contexts/SimpleContext';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlockchainIdentity, Device, SyncStatus } from '../types';
import { Colors } from '../../constants/Colors';
import { IdentityService } from '../services/identity';
import SecurityMonitorService from '../services/security-monitor';
import { useCallback } from 'react';

export default function HomeScreen() {
  const { 
    getCurrentIdentity,
    getAddress,
    getDevices,
    getSyncStatus
  } = useSimple();

  const [refreshing, setRefreshing] = useState(false);
  const [identity, setIdentity] = useState<BlockchainIdentity | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isConnected: false,
    connectedPeers: 0,
    lastSync: null,
    pendingTransactions: 0
  });
  const [permissions, setPermissions] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  
  // Carrega os dados iniciais
  useEffect(() => {
    loadIdentityData();

    // Configurar atualização periódica do status de sincronização
    const syncInterval = setInterval(() => {
      try {
        const status = getSyncStatus();
        if (status) {
          setSyncStatus(status);
        }
      } catch (error) {
        console.error('Error updating sync status:', error);
      }
    }, 10000); // Atualizar a cada 10 segundos

    return () => {
      clearInterval(syncInterval); // Limpar o intervalo quando o componente for desmontado
    };
  }, []);

  // Recarregar dados quando a tela ganhar foco (ex: volta do QR Scanner)
  useFocusEffect(
    useCallback(() => {
      console.log('👀 Tela HomeScreen ganhou foco, recarregando dados...');
      
      // Recarregar identidade do armazenamento para garantir dados atualizados
      const reloadAndUpdate = async () => {
        try {
          const identityService = IdentityService.getInstance();
          await identityService.reloadIdentity();
          loadIdentityData();
        } catch (error) {
          console.error('❌ Erro ao recarregar identidade:', error);
          loadIdentityData(); // Fallback para carregar dados sem reload
        }
      };
      
      reloadAndUpdate();
    }, [])
  );
  
  // Carrega os dados da identidade
  const loadIdentityData = () => {
    try {
      console.log('🔄 Carregando dados da identidade...');
      
      const currentIdentity = getCurrentIdentity();
      setIdentity(currentIdentity);
      
      const userDevices = getDevices();
      setDevices(userDevices);

      // Carregar permissões
      const identityService = IdentityService.getInstance();
      const userPermissions = identityService.getPermissions() || [];
      console.log('📋 Permissões carregadas:', userPermissions.length);
      setPermissions(userPermissions);

      // Carregar eventos de segurança
      const securityMonitor = SecurityMonitorService.getInstance();
      const events = securityMonitor.getRecentSecurityEvents();
      setSecurityEvents(events);
      
      const status = getSyncStatus();
      if (status) {
        setSyncStatus(status);
      } else {
        // Em caso de falha na obtenção do status, defina um estado padrão não conectado
        setSyncStatus({
          isConnected: false,
          connectedPeers: 0,
          lastSync: null,
          pendingTransactions: 0
        });
        console.warn('Status de sincronização não disponível. Verifique a conexão de rede.');
      }
    } catch (error) {
      console.error('Error loading identity data:', error);
    }
  };

  const copyToClipboard = async (text: string | null, message: string = 'Copiado para área de transferência') => {
    if (!text) return;
    
    await Clipboard.setStringAsync(text);
    if (Platform.OS === 'android') {
      // ToastAndroid.show(message, ToastAndroid.SHORT);
      Alert.alert('Copiado', message);
    } else {
      Alert.alert('Copiado', message);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return 'N/A';
    
    try {
      const d = new Date(date);
      // Verificar se a data é válida
      if (isNaN(d.getTime())) {
        return 'Data inválida';
      }
      return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Erro de formato';
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Forçar sincronização com a rede P2P
      if (identity) {
        // Sincronização manual se necessário
        await new Promise(resolve => {
          try {
            // Tentar obter um status atualizado em tempo real
            const status = getSyncStatus();
            if (status) {
              setSyncStatus(status);
            }
            resolve(null);
          } catch (error) {
            console.error('Error during manual sync:', error);
            resolve(null);
          }
        });
      }
      
      // Recarregar todos os dados da identidade
      loadIdentityData();
      
      // Feedback tátil para indicar atualização concluída
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error refreshing data:', error);
      // Feedback tátil para indicar erro
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRevokePermission = async (site: string) => {
    try {
      const identityService = IdentityService.getInstance();
      await identityService.revokePermission(site);
      
      // Recarregar permissões
      const userPermissions = identityService.getPermissions();
      setPermissions(userPermissions);
      
      Alert.alert('Sucesso', 'Permissão revogada com sucesso');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível revogar a permissão');
      console.error(error);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'device_added': return 'phone-portrait';
      case 'recovery_attempted': return 'refresh';
      case 'device_approved': return 'checkmark-circle';
      case 'suspicious_activity': return 'warning';
      default: return 'information-circle';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'device_added': return '#4CAF50';
      case 'recovery_attempted': return '#FF9800';
      case 'device_approved': return '#4CAF50';
      case 'suspicious_activity': return '#F44336';
      default: return '#2196F3';
    }
  };

  const clearSecurityEvents = async () => {
    Alert.alert(
      'Limpar Eventos',
      'Tem certeza que deseja limpar todos os eventos de segurança?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              const securityMonitor = SecurityMonitorService.getInstance();
              await securityMonitor.clearEvents();
              setSecurityEvents([]);
              Alert.alert('✅ Sucesso', 'Eventos limpos');
            } catch (error) {
              Alert.alert('Erro', 'Falha ao limpar eventos');
            }
          }
        }
      ]
    );
  };

  // Renderiza a seção de Informações da Blockchain
  const renderBlockchainSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Identidade Blockchain</Text>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Endereço:</Text>
        <TouchableOpacity 
          onPress={() => copyToClipboard(getAddress(), 'Endereço copiado!')}
          style={styles.copyContainer}
        >
          <Text style={styles.value} numberOfLines={1}>
            {getAddress() || '0x...'}
          </Text>
          <Ionicons name="copy-outline" size={16} color={Colors.primary.main} />
        </TouchableOpacity>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Nome:</Text>
        <Text style={styles.value}>
          {identity?.profile?.name || 'Não definido'}
        </Text>
      </View>
    </View>
  );

  // Renderiza a seção de Status da Rede
  const renderNetworkSection = () => {
    // Calcular tempo desde a última sincronização
    const getTimeSinceLastSync = (): string => {
      if (!syncStatus.lastSync) return 'Nunca';
      
      const now = new Date();
      const lastSync = new Date(syncStatus.lastSync);
      const diffMs = now.getTime() - lastSync.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Agora mesmo';
      if (diffMins === 1) return '1 minuto atrás';
      if (diffMins < 60) return `${diffMins} minutos atrás`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours === 1) return '1 hora atrás';
      if (diffHours < 24) return `${diffHours} horas atrás`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return '1 dia atrás';
      return `${diffDays} dias atrás`;
    };
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Status da Rede</Text>
          <TouchableOpacity
            style={styles.syncButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={Colors.text.primary} />
            ) : (
              <Ionicons name="sync" size={16} color={Colors.text.primary} />
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Status:</Text>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: syncStatus.isConnected ? Colors.status.success : Colors.status.error }
            ]} />
            <Text style={styles.value}>
              {syncStatus.isConnected ? 'Conectado' : 'Desconectado'}
            </Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Peers:</Text>
          <Text style={styles.value}>
            {syncStatus.connectedPeers === 0 && !syncStatus.isConnected ? 
              'Nenhum (offline)' : 
              `${syncStatus.connectedPeers} ${syncStatus.connectedPeers === 1 ? 'dispositivo' : 'dispositivos'}`
            }
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Última Sincronização:</Text>
          <Text style={styles.value}>
            {formatDate(syncStatus.lastSync)}
            {syncStatus.lastSync && (
              <Text style={styles.subValue}> ({getTimeSinceLastSync()})</Text>
            )}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Transações Pendentes:</Text>
          <Text style={[
            styles.value, 
            syncStatus.pendingTransactions > 0 ? styles.pendingValue : {}
          ]}>
            {syncStatus.pendingTransactions > 0 ? 
              `${syncStatus.pendingTransactions} (aguardando sincronização)` : 
              'Nenhuma'
            }
          </Text>
        </View>
        
        {!syncStatus.isConnected && (
          <Text style={styles.networkHint}>
            Dica: Verifique sua conexão com a internet para sincronizar seus dados.
          </Text>
        )}
      </View>
    );
  };

  // Renderiza a seção de Dispositivos
  const renderDevicesSection = () => {
    // Mostrar no máximo 3 dispositivos na tela inicial
    const displayedDevices = devices.slice(0, 3);
    const hasMoreDevices = devices.length > 3;
    
    // Identifica o dispositivo atual com base na chave pública
    const getCurrentDeviceId = () => {
      if (!identity) return null;
      // Na implementação real, devemos ter uma maneira de identificar o dispositivo atual
      // Aqui estamos usando a primeira chave como padrão ou o dispositivo marcado
      return devices.find(d => d.isCurrentDevice)?.id || (devices[0]?.id || null);
    };
    
    const currentDeviceId = getCurrentDeviceId();
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dispositivos ({devices.length})</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/scanner')}
          >
            <Text style={styles.addButtonText}>+ Adicionar</Text>
          </TouchableOpacity>
        </View>
        
        {devices.length === 0 ? (
          <View>
            <Text style={styles.emptyText}>Nenhum dispositivo cadastrado</Text>
            <Text style={styles.deviceHint}>
              Adicione dispositivos para melhorar a segurança e recuperação da sua identidade.
            </Text>
          </View>
        ) : (
          displayedDevices.map((device, index) => {
            const isCurrentDevice = device.id === currentDeviceId;
            return (
              <View key={device.id || index} style={[
                styles.deviceItem,
                isCurrentDevice ? styles.currentDeviceItem : {}
              ]}>
                <View style={styles.deviceInfo}>
                  <View style={styles.deviceHeader}>
                    <Text style={styles.deviceName}>{device.name}</Text>
                    <Ionicons 
                      name={device.type === 'mobile' ? 'phone-portrait' : 'desktop'} 
                      size={16} 
                      color={Colors.text.secondary} 
                    />
                  </View>
                  <Text style={styles.deviceMeta}>
                    Adicionado em: {formatDate(device.addedAt)}
                  </Text>
                  <Text style={styles.deviceMeta}>
                    Última sincronização: {formatDate(device.lastSync)}
                  </Text>
                </View>
                {isCurrentDevice && (
                  <View style={styles.currentDeviceBadge}>
                    <Text style={styles.currentDeviceText}>Atual</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
        
        {hasMoreDevices && (
          <Text style={styles.moreDevicesText}>
            + {devices.length - 3} dispositivos adicionais
          </Text>
        )}
        
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => router.push('/devices')}
        >
          <Text style={styles.viewAllText}>
            {devices.length > 0 ? 'Gerenciar Dispositivos' : 'Adicionar Dispositivos'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.primary.main} />
        </TouchableOpacity>
      </View>
    );
  };

  // Renderiza a seção de permissões
  const renderPermissionsSection = () => (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setShowPermissions(!showPermissions)}
      >
        <Text style={styles.sectionTitle}>
          <Ionicons name="shield-checkmark" size={18} color={Colors.primary.main} />
          {' '}Permissões ({permissions.length})
        </Text>
        <Ionicons 
          name={showPermissions ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={Colors.text.secondary} 
        />
      </TouchableOpacity>
      
      {showPermissions && (
        <View style={styles.collapseContent}>
          {permissions.length > 0 ? (
            permissions.map((permission, index) => (
              <View key={index} style={styles.permissionCard}>
                <View style={styles.permissionHeader}>
                  <Ionicons name="globe-outline" size={24} color={Colors.primary.main} />
                  <Text style={styles.permissionSite} numberOfLines={1} ellipsizeMode="middle">
                    {permission.siteUrl || permission.site || 'Site desconhecido'}
                  </Text>
                </View>
                
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionDetail}>
                    <Text style={styles.permissionDetailLabel}>Dados compartilhados: </Text>
                    {(permission.fields || []).join(', ')}
                  </Text>
                  <Text style={styles.permissionDetail}>
                    <Text style={styles.permissionDetailLabel}>Concedido em: </Text>
                    {new Date(permission.grantedAt).toLocaleDateString()}
                  </Text>
                  {permission.expiresAt && (
                    <Text style={styles.permissionDetail}>
                      <Text style={styles.permissionDetailLabel}>Expira em: </Text>
                      {new Date(permission.expiresAt).toLocaleDateString()}
                    </Text>
                  )}
                  <Text style={styles.permissionDetail}>
                    <Text style={styles.permissionDetailLabel}>Login automático: </Text>
                    {permission.autoLogin ? 'Sim' : 'Não'}
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.revokeButton}
                  onPress={() => handleRevokePermission(permission.siteUrl)}
                >
                  <Ionicons name="close-circle-outline" size={20} color="#fff" />
                  <Text style={styles.revokeButtonText}>Revogar Acesso</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>
              Nenhuma permissão concedida a sites
            </Text>
          )}
        </View>
      )}
    </View>
  );

  // Renderiza a seção de eventos recentes
  const renderEventsSection = () => (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setShowEvents(!showEvents)}
      >
        <Text style={styles.sectionTitle}>
          <Ionicons name="time-outline" size={18} color={Colors.primary.main} />
          {' '}Eventos Recentes ({securityEvents.length})
        </Text>
        <Ionicons 
          name={showEvents ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={Colors.text.secondary} 
        />
      </TouchableOpacity>
      
      {showEvents && (
        <View style={styles.collapseContent}>
          <View style={styles.eventsHeader}>
            <TouchableOpacity
              style={styles.clearEventsButton}
              onPress={clearSecurityEvents}
            >
              <Ionicons name="trash-outline" size={16} color="#fff" />
              <Text style={styles.clearEventsText}>Limpar</Text>
            </TouchableOpacity>
          </View>
          
          {securityEvents.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum evento registrado</Text>
          ) : (
            securityEvents.slice(0, 5).map((event) => (
              <View key={event.id} style={styles.securityEvent}>
                <View style={styles.eventHeader}>
                  <Ionicons 
                    name={getEventIcon(event.type)} 
                    size={20} 
                    color={getEventColor(event.type)} 
                  />
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventType}>
                      {event.type === 'device_added' && '📱 Dispositivo Adicionado'}
                      {event.type === 'recovery_attempted' && '🔄 Tentativa de Recuperação'}
                      {event.type === 'device_approved' && '✅ Dispositivo Aprovado'}
                      {event.type === 'suspicious_activity' && '⚠️ Atividade Suspeita'}
                    </Text>
                    <Text style={styles.eventTime}>
                      {event.timestamp.toLocaleString()}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.eventDetails}>
                  Dispositivo: {event.deviceId.substring(0, 16)}...
                  {event.details?.identityAddress && (
                    `\nIdentidade: ${event.details.identityAddress.substring(0, 10)}...`
                  )}
                </Text>
              </View>
            ))
          )}
          
          {securityEvents.length > 5 && (
            <Text style={styles.moreEventsText}>
              + {securityEvents.length - 5} eventos anteriores
            </Text>
          )}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={[Colors.primary.main]}
          />
        }
      >
        <Text style={styles.title}>VaultZero</Text>
        <Text style={styles.subtitle}>
          Sua identidade descentralizada
        </Text>

        {/* Cards de Status compactos */}
        <View style={styles.statusRow}>
          <View style={[styles.statusCard, syncStatus.isConnected ? styles.connectedCard : styles.disconnectedCard]}>
            <Ionicons 
              name={syncStatus.isConnected ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={syncStatus.isConnected ? Colors.status.connected : Colors.status.disconnected} 
            />
            <Text style={styles.statusText}>
              {syncStatus.isConnected ? 'Conectado' : 'Desconectado'}
            </Text>
            <Text style={styles.statusSubtext}>
              {syncStatus.connectedPeers} peer{syncStatus.connectedPeers !== 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.statusCard}>
            <Ionicons name="phone-portrait-outline" size={20} color={Colors.primary.main} />
            <Text style={styles.statusText}>{devices.length} Dispositivos</Text>
            <Text style={styles.statusSubtext}>Autorizados</Text>
          </View>
        </View>

        {/* Seções colapsadas por padrão */}
        {renderBlockchainSection()}
        {renderDevicesSection()}
        {renderPermissionsSection()}
        {renderEventsSection()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 32,
  },
  // Botão principal destacado em verde
  mainActionButton: {
    backgroundColor: Colors.status.success,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: Colors.status.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mainActionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginTop: 8,
  },
  mainActionSubtext: {
    fontSize: 14,
    color: Colors.text.primary,
    opacity: 0.9,
    marginTop: 4,
  },
  // Cards de status compactos
  statusRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statusCard: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  connectedCard: {
    borderWidth: 1,
    borderColor: Colors.status.connected,
  },
  disconnectedCard: {
    borderWidth: 1,
    borderColor: Colors.status.disconnected,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 8,
  },
  statusSubtext: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  syncButton: {
    backgroundColor: Colors.primary.main,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subValue: {
    fontSize: 12,
    color: Colors.text.muted,
    fontStyle: 'italic',
  },
  pendingValue: {
    color: Colors.status.warning,
  },
  networkHint: {
    fontSize: 12,
    color: Colors.text.muted,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
  section: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: Colors.text.secondary,
    width: '40%',
  },
  value: {
    fontSize: 14,
    color: Colors.text.primary,
    flex: 1,
  },
  copyContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  deviceItem: {
    backgroundColor: Colors.border.primary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentDeviceItem: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary.main,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  deviceMeta: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  deviceHint: {
    fontSize: 12,
    color: Colors.text.muted,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  currentDeviceBadge: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentDeviceText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  moreDevicesText: {
    color: Colors.text.secondary,
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  viewAllText: {
    color: Colors.primary.main,
    fontSize: 14,
    marginRight: 4,
  },
  addButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addButtonText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    color: Colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 10,
  },
  networkDebugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.border.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
    opacity: 0.8,
  },
  networkDebugText: {
    color: Colors.text.muted,
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
  // Estilos para a seção de permissões
  collapseContent: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  permissionCard: {
    backgroundColor: Colors.border.primary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionSite: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
    marginLeft: 8,
  },
  permissionInfo: {
    marginLeft: 32,
  },
  permissionDetail: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  permissionDetailLabel: {
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  revokeButton: {
    backgroundColor: Colors.status.error,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  revokeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  // Estilos para a seção de eventos de segurança
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clearEventsButton: {
    backgroundColor: Colors.status.error,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearEventsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  securityEvent: {
    backgroundColor: Colors.border.primary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventInfo: {
    marginLeft: 8,
    flex: 1,
  },
  eventType: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  eventTime: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  eventDetails: {
    fontSize: 12,
    color: Colors.text.primary,
    marginTop: 4,
  },
  moreEventsText: {
    color: Colors.text.secondary,
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
});
