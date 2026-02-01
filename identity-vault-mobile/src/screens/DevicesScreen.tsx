import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIdentity } from '../contexts/IdentityContext';
import { router } from 'expo-router';
import { Device } from '../types';
import { Colors } from '../../constants/Colors';

export default function DevicesScreen() {
  const { devices, identity, authenticateWithBiometric, removeDevice } = useIdentity();
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [removingDeviceId, setRemovingDeviceId] = useState<string | null>(null);

  const handleRemoveDevice = async (device: Device) => {
    if (device.isCurrentDevice) {
      Alert.alert(
        '🚫 Operação Não Permitida',
        `Você não pode remover "${device.name}" porque este é o dispositivo que você está usando agora.\n\n✓ Para remover este dispositivo, use outro dispositivo emparelhado\n✓ Ou revogue toda a identidade se não tiver outros dispositivos`,
        [
          { text: 'Entendi', style: 'default' }
        ]
      );
      return;
    }

    if (removingDeviceId) {
      Alert.alert('Aguarde', 'Uma operação de remoção já está em andamento.');
      return;
    }

    // Verificar se não é o último dispositivo (além do atual)
    const otherDevices = devices.filter(d => !d.isCurrentDevice);
    if (otherDevices.length === 1) {
      Alert.alert(
        'Atenção',
        'Este é o único dispositivo adicional conectado à sua identidade. Se você removê-lo, apenas o dispositivo atual terá acesso.\n\nTem certeza que deseja continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', style: 'destructive', onPress: () => confirmRemoval(device) }
        ]
      );
      return;
    }

    confirmRemoval(device);
  };

  const confirmRemoval = (device: Device) => {
    Alert.alert(
      'Remover Dispositivo',
      `Tem certeza que deseja remover "${device.name}"?\n\nEsta ação não pode ser desfeita. O dispositivo precisará ser emparelhado novamente para acessar esta identidade.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => executeRemoval(device),
        },
      ]
    );
  };

  const executeRemoval = async (device: Device) => {
    const isAuthenticated = await authenticateWithBiometric();
    if (isAuthenticated) {
      setRemovingDeviceId(device.id);
      try {
        const success = await removeDevice(device.id);
        if (success) {
          Alert.alert(
            'Sucesso', 
            `Dispositivo "${device.name}" removido com sucesso!\n\nO dispositivo não terá mais acesso a esta identidade.`
          );
        } else {
          Alert.alert(
            'Erro', 
            'Não foi possível remover o dispositivo. Tente novamente.'
          );
        }
      } catch (error) {
        Alert.alert(
          'Erro', 
          'Ocorreu um erro inesperado ao remover o dispositivo. Verifique sua conexão e tente novamente.'
        );
        console.error('Erro ao remover dispositivo:', error);
      } finally {
        setRemovingDeviceId(null);
      }
    }
  };

  const handleAddDevice = async () => {
    if (!deviceName.trim()) {
      Alert.alert('Erro', 'Por favor, digite um nome para o dispositivo');
      return;
    }

    const isAuthenticated = await authenticateWithBiometric();
    if (isAuthenticated) {
      // Simular adição de dispositivo
      Alert.alert(
        'QR Code Gerado',
        'Escaneie este QR Code no novo dispositivo para adicioná-lo.',
        [{ text: 'OK', onPress: () => setShowAddDevice(false) }]
      );
      setDeviceName('');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDeviceIcon = (type: Device['type']) => {
    switch (type) {
      case 'mobile':
        return '📱';
      case 'desktop':
        return '💻';
      case 'web':
        return '🌐';
      default:
        return '📱';
    }
  };

  const renderDeviceItem = (device: Device) => (
    <View key={device.id} style={[
      styles.deviceItem,
      device.isCurrentDevice && styles.currentDeviceItem
    ]}>
      <View style={styles.deviceInfo}>
        <View style={styles.deviceHeader}>
          <Text style={styles.deviceIcon}>
            {device.isCurrentDevice ? '📱✨' : getDeviceIcon(device.type)}
          </Text>
          <View style={styles.deviceDetails}>
            <View style={styles.deviceNameContainer}>
              <Text style={[
                styles.deviceName,
                device.isCurrentDevice && styles.currentDeviceName
              ]}>
                {device.name}
              </Text>
              {device.isCurrentDevice && (
                <Text style={styles.currentDeviceTag}>Este Dispositivo</Text>
              )}
            </View>
            {device.isCurrentDevice && (
              <Text style={styles.currentDeviceDescription}>
                Este é o dispositivo que você está usando agora e não pode ser removido.
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.deviceDates}>
          <Text style={styles.dateLabel}>Adicionado:</Text>
          <Text style={styles.dateValue}>{formatDate(device.addedAt)}</Text>
        </View>
        
        <View style={styles.deviceDates}>
          <Text style={styles.dateLabel}>Última Sincronização:</Text>
          <Text style={styles.dateValue}>{formatDate(device.lastSync)}</Text>
        </View>
      </View>

      {device.isCurrentDevice ? (
        <View style={styles.currentDeviceIndicator}>
          <Text style={styles.currentDeviceText}>Dispositivo Atual</Text>
          <Text style={styles.cannotRemoveText}>Não pode ser removido</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.removeButton,
            removingDeviceId === device.id && styles.removeButtonDisabled
          ]}
          disabled={removingDeviceId === device.id}
          onPress={() => handleRemoveDevice(device)}
        >
          <Text style={[
            styles.removeButtonText,
            removingDeviceId === device.id && styles.removeButtonTextDisabled
          ]}>
            {removingDeviceId === device.id ? 'Removendo...' : 'Remover'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Dispositivos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddDevice(true)}
        >
          <Text style={styles.addButtonText}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Seus Dispositivos</Text>
          <Text style={styles.infoText}>
            Gerencie todos os dispositivos conectados à sua identidade. 
            Você pode adicionar novos dispositivos gerando um QR Code ou 
            remover dispositivos que não utiliza mais.
          </Text>
        </View>

        <View style={styles.devicesContainer}>
          <Text style={styles.sectionTitle}>
            Dispositivos Conectados ({devices.length})
          </Text>
          
          {devices.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📱</Text>
              <Text style={styles.emptyStateTitle}>Nenhum dispositivo</Text>
              <Text style={styles.emptyStateText}>
                Adicione seu primeiro dispositivo para começar
              </Text>
            </View>
          ) : (
            devices.map(renderDeviceItem)
          )}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowAddDevice(true)}
          >
            <Text style={styles.actionIcon}>➕</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Adicionar Novo Dispositivo</Text>
              <Text style={styles.actionSubtitle}>
                Gerar QR Code para pareamento
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/scanner')}
          >
            <Text style={styles.actionIcon}>📷</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Escanear QR Code</Text>
              <Text style={styles.actionSubtitle}>
                Adicionar este dispositivo a outra identidade
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal para adicionar dispositivo */}
      <Modal
        visible={showAddDevice}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddDevice(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAddDevice(false)}
            >
              <Text style={styles.modalCloseText}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Adicionar Dispositivo</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Digite um nome para identificar o novo dispositivo. 
              Um QR Code será gerado para você escanear no dispositivo que deseja adicionar.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nome do Dispositivo</Text>
              <TextInput
                style={styles.input}
                value={deviceName}
                onChangeText={setDeviceName}
                placeholder="Ex: iPhone João, PC Casa"
                placeholderTextColor="#999"
                autoCapitalize="words"
              />
            </View>

            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleAddDevice}
            >
              <Text style={styles.generateButtonText}>Gerar QR Code</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 80,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary.main,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  addButton: {
    width: 80,
    alignItems: 'flex-end',
  },
  addButtonText: {
    fontSize: 16,
    color: Colors.primary.main,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: Colors.background.secondary,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  devicesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  deviceItem: {
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  currentDeviceTag: {
    fontSize: 12,
    color: Colors.status.successLight,
    fontWeight: '600',
  },
  deviceDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  dateValue: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  removeButton: {
    backgroundColor: Colors.status.errorLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-end',
    marginTop: 12,
  },
  removeButtonText: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  actionsContainer: {
    marginBottom: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalCloseButton: {},
  modalCloseText: {
    fontSize: 16,
    color: Colors.primary.main,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  modalPlaceholder: {
    width: 60,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: Colors.text.secondary,
    lineHeight: 24,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: Colors.text.primary,
  },
  generateButton: {
    backgroundColor: Colors.primary.main,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  generateButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  removeButtonDisabled: {
    backgroundColor: '#444',
    opacity: 0.5,
  },
  removeButtonTextDisabled: {
    color: '#888',
  },
  currentDeviceItem: {
    borderWidth: 2,
    borderColor: Colors.primary.main,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  deviceNameContainer: {
    flex: 1,
  },
  currentDeviceName: {
    color: Colors.primary.main,
    fontWeight: 'bold',
  },
  currentDeviceDescription: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  currentDeviceIndicator: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  currentDeviceText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cannotRemoveText: {
    color: Colors.text.primary,
    fontSize: 10,
    opacity: 0.8,
  },
});
