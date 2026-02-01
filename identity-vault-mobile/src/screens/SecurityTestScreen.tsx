import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useIdentity } from '../contexts/IdentityContext';
import SecurityMonitorService from '../services/security-monitor';
import { NotificationService } from '../services/notification';
import { DeviceFingerprintService } from '../services/device-fingerprint';
import { SecurityEvent, Device } from '../types';
import { Colors } from '../../constants/Colors';

export default function SecurityTestScreen() {
  const { identity } = useIdentity();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [quarantinedDevices, setQuarantinedDevices] = useState<Device[]>([]);
  const [testMnemonic, setTestMnemonic] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedDeviceId, setSimulatedDeviceId] = useState<string | null>(null);
  const securityMonitor = SecurityMonitorService.getInstance();

  useEffect(() => {
    loadSecurityData();
    // Carregar mnemônico de exemplo para testes
    if (identity?.mnemonic) {
      setTestMnemonic(identity.mnemonic);
    }
  }, [identity]);

  const loadSecurityData = async () => {
    try {
      const events = securityMonitor.getRecentSecurityEvents();
      setSecurityEvents(events);

      if (identity) {
        const devices = await securityMonitor.getQuarantinedDevices(identity.address);
        setQuarantinedDevices(devices);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de segurança:', error);
    }
  };

  const simulateNewDeviceRecovery = async () => {
    if (!identity || !testMnemonic) {
      Alert.alert('Erro', 'Identidade ou mnemônico não disponível para teste');
      return;
    }

    try {
      setIsSimulating(true);
      
      // Simular novo dispositivo
      const result = await securityMonitor.simulateNewDeviceRecovery(identity.address);
      setSimulatedDeviceId(result.simulatedDeviceId);

      Alert.alert(
        '🧪 Simulação Iniciada',
        `Novo dispositivo simulado!\n\nID: ${result.simulatedDeviceId}\n\nÉ novo dispositivo: ${result.securityResult.isNewDevice ? 'Sim' : 'Não'}\nPrecisa quarentena: ${result.securityResult.shouldQuarantine ? 'Sim' : 'Não'}\nDispositivos existentes: ${result.securityResult.existingDevices.length}`,
        [{ text: 'OK', onPress: loadSecurityData }]
      );
    } catch (error) {
      Alert.alert('Erro', 'Falha na simulação');
      console.error(error);
    } finally {
      setIsSimulating(false);
    }
  };

  const restoreSimulatedFingerprint = async () => {
    try {
      await DeviceFingerprintService.restoreOriginalDevice();
      setSimulatedDeviceId(null);
      setIsSimulating(false);
      await loadSecurityData();
      
      Alert.alert('✅ Sucesso', 'Fingerprint original restaurado');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao restaurar fingerprint');
      console.error(error);
    }
  };

  const testNotifications = async () => {
    try {
      const notificationService = NotificationService.getInstance();
      
      // Verificar permissões
      const status = await notificationService.getPermissionStatus();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissões Necessárias',
          'As notificações não estão habilitadas. Deseja tentar novamente?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Tentar Novamente', 
              onPress: async () => {
                await notificationService.initialize();
                Alert.alert('✅ Sucesso', 'Notificações habilitadas');
              }
            }
          ]
        );
        return;
      }

      // Enviar notificação de teste
      await notificationService.sendTestNotification();
      Alert.alert('📱 Enviado', 'Notificação de teste enviada!');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao enviar notificação de teste');
      console.error(error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const notificationService = NotificationService.getInstance();
      await notificationService.clearAllNotifications();
      Alert.alert('🧹 Limpo', 'Todas as notificações foram removidas');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao limpar notificações');
      console.error(error);
    }
  };

  const approveDevice = async (deviceId: string) => {
    if (!identity) return;

    try {
      const currentDeviceId = await DeviceFingerprintService.generateDeviceFingerprint();
      await securityMonitor.approveDevice(identity.address, deviceId, currentDeviceId);
      await loadSecurityData();
      
      Alert.alert('✅ Aprovado', 'Dispositivo aprovado com sucesso');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao aprovar dispositivo');
      console.error(error);
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
            await securityMonitor.clearEvents();
            await loadSecurityData();
            Alert.alert('✅ Sucesso', 'Eventos limpos');
          }
        }
      ]
    );
  };

  const showDeviceInfo = async () => {
    try {
      const deviceInfo = await DeviceFingerprintService.getDeviceInfo();
      Alert.alert(
        '📱 Informações do Dispositivo',
        `Fingerprint: ${deviceInfo.fingerprint}\n\nPlataforma: ${deviceInfo.platform}\n\nDetalhes: ${JSON.stringify(deviceInfo.characteristics, null, 2)}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Erro', 'Falha ao obter informações do dispositivo');
    }
  };

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'device_added': return 'phone-portrait-outline';
      case 'recovery_attempted': return 'warning-outline';
      case 'device_approved': return 'checkmark-circle-outline';
      case 'suspicious_activity': return 'alert-circle-outline';
      default: return 'information-circle-outline';
    }
  };

  const getEventColor = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'device_added': return '#4CAF50';
      case 'recovery_attempted': return '#FF9800';
      case 'device_approved': return '#2196F3';
      case 'suspicious_activity': return '#F44336';
      default: return '#666';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>🧪 Teste de Segurança</Text>
          <Text style={styles.subtitle}>Simule cenários de múltiplos dispositivos</Text>
        </View>

        {/* Seção de Simulação */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="flask" size={20} color="#FF9800" /> Simulação de Novo Dispositivo
          </Text>
          
          <View style={styles.simulationControls}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={simulateNewDeviceRecovery}
              disabled={isSimulating || !identity}
            >
              <Text style={styles.buttonText}>
                {isSimulating ? 'Simulando...' : '🎭 Simular Novo Dispositivo'}
              </Text>
            </TouchableOpacity>

            {simulatedDeviceId && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={restoreSimulatedFingerprint}
              >
                <Text style={styles.buttonText}>🔄 Restaurar Dispositivo Original</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.infoButton]}
              onPress={showDeviceInfo}
            >
              <Text style={styles.buttonText}>📱 Ver Info do Dispositivo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Seção de Notificações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="notifications" size={20} color="#2196F3" /> Teste de Notificações
          </Text>
          
          <View style={styles.simulationControls}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={testNotifications}
            >
              <Text style={styles.buttonText}>📱 Enviar Notificação de Teste</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={clearAllNotifications}
            >
              <Text style={styles.buttonText}>🧹 Limpar Todas Notificações</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dispositivos em Quarentena */}
        {quarantinedDevices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="warning" size={20} color="#FF9800" /> 
              {' '}Dispositivos em Quarentena ({quarantinedDevices.length})
            </Text>
            
            {quarantinedDevices.map((device) => (
              <View key={device.id} style={styles.quarantineDevice}>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <Text style={styles.deviceId}>ID: {device.id}</Text>
                  <Text style={styles.quarantineInfo}>
                    Quarentena até: {device.quarantineUntil?.toLocaleString()}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => approveDevice(device.id)}
                >
                  <Text style={styles.approveButtonText}>✅ Aprovar</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Eventos de Segurança */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
              {' '}Eventos Recentes ({securityEvents.length})
            </Text>
            
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearSecurityEvents}
            >
              <Text style={styles.clearButtonText}>🗑️ Limpar</Text>
            </TouchableOpacity>
          </View>
          
          {securityEvents.length === 0 ? (
            <Text style={styles.noEvents}>Nenhum evento registrado</Text>
          ) : (
            securityEvents.map((event) => (
              <View key={event.id} style={styles.securityEvent}>
                <View style={styles.eventHeader}>
                  <Ionicons 
                    name={getEventIcon(event.type)} 
                    size={24} 
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
        </View>

        {/* Informações de Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="information-circle" size={20} color="#2196F3" />
            {' '}Status do Sistema
          </Text>
          
          <View style={styles.statusInfo}>
            <Text style={styles.statusItem}>
              🔄 Dispositivo Simulado: {simulatedDeviceId ? 'Ativo' : 'Não'}
            </Text>
            {simulatedDeviceId && (
              <Text style={styles.statusItem}>
                🆔 ID Simulado: {simulatedDeviceId}
              </Text>
            )}
            <Text style={styles.statusItem}>
              🛡️ Eventos Registrados: {securityEvents.length}
            </Text>
            <Text style={styles.statusItem}>
              ⏳ Dispositivos em Quarentena: {quarantinedDevices.length}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  section: {
    backgroundColor: Colors.background.secondary,
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  simulationControls: {
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary.main,
  },
  secondaryButton: {
    backgroundColor: '#FF9800',
  },
  infoButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  quarantineDevice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  deviceId: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  quarantineInfo: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 4,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  approveButtonText: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  securityEvent: {
    padding: 12,
    backgroundColor: Colors.background.primary,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventInfo: {
    marginLeft: 12,
    flex: 1,
  },
  eventType: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  eventTime: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  eventDetails: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 8,
    marginLeft: 36,
  },
  noEvents: {
    textAlign: 'center',
    color: Colors.text.secondary,
    fontSize: 16,
    padding: 20,
  },
  statusInfo: {
    gap: 8,
  },
  statusItem: {
    fontSize: 14,
    color: Colors.text.secondary,
    paddingVertical: 4,
  },
});
