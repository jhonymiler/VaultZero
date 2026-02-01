import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { IdentityService } from '../services/identity';
import CustomQRScanner from '../components/CustomQRScanner';
import { Colors } from '../../constants/Colors';
import { AuthRequest, QRCodeData } from '../types';

interface FieldData {
  name: string;
  value: string;
  isNew: boolean;
  isRequired: boolean;
}

export default function QRScannerScreen() {
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [authRequest, setAuthRequest] = useState<AuthRequest | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [fieldData, setFieldData] = useState<Record<string, FieldData>>({});
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  
  const identityService = IdentityService.getInstance();

  const authenticateWithBiometric = async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticar para confirmar sua identidade',
        disableDeviceFallback: false,
        cancelLabel: 'Cancelar'
      });
      
      return result.success;
    } catch (error) {
      console.error('Error authenticating:', error);
      return false;
    }
  };

  const handleBarCodeScanned = async (data: string) => {
    if (scanned) return;
    
    setScanned(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const qrData: QRCodeData = JSON.parse(data);
      await processQRData(qrData);
    } catch (error) {
      Alert.alert(
        'QR Code Inválido',
        'O QR Code escaneado não é válido para VaultZero.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
    }
  };

  const processQRData = async (qrData: QRCodeData) => {
    switch (qrData.type) {
      case 'auth':
        await handleAuthenticationQR(qrData);
        break;
      
      case 'device-pair':
        await handleDevicePairingQR(qrData);
        break;
      
      case 'identity-share':
        await handleIdentityShareQR(qrData);
        break;
      
      default:
        Alert.alert(
          'QR Code Inválido',
          'O tipo de QR Code não é reconhecido pelo VaultZero.',
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
        break;
    }
  };

  const handleAuthenticationQR = async (qrData: QRCodeData) => {
    const auth = qrData.data as AuthRequest;
    if (!auth || !auth.siteUrl || !auth.requestId) {
      Alert.alert(
        'QR Code Inválido',
        'Dados de autenticação incompletos no QR Code.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
      return;
    }

    // Criar dados de campo com informações existentes ou novos
    const fields: Record<string, FieldData> = {};
    interface FieldsMap {
      [key: string]: FieldData;
    }

    auth.requestedFields.forEach((fieldName: string): void => {
      const rawValue = identityService.getUserFieldValue(fieldName);
      const existingValue: string | undefined = rawValue === null ? undefined : rawValue;
      fields[fieldName] = {
      name: fieldName,
      value: existingValue || '',
      isNew: !existingValue,
      isRequired: true // Por simplicidade, consideramos todos obrigatórios
      };
    });

    setAuthRequest(auth);
    setFieldData(fields);
    setSelectedFields(
      auth.requestedFields.filter((field: string): boolean => !!fields[field].value)
    ); // Selecionar campos que já têm valor
    setShowModal(true);
  };

  const handleDevicePairingQR = async (qrData: QRCodeData) => {
    if (!qrData.data?.deviceName) {
      Alert.alert(
        'QR Code Inválido',
        'Dados de pareamento incompletos no QR Code.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
      return;
    }

    Alert.alert(
      'Adicionar Dispositivo',
      `Deseja adicionar o dispositivo:\n"${qrData.data.deviceName}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => setScanned(false),
        },
        {
          text: 'Adicionar',
          onPress: async () => {
            const isAuthenticated = await authenticateWithBiometric();
            
            if (isAuthenticated) {
              setIsLoading(true);
              setTimeout(() => {
                setIsLoading(false);
                Alert.alert(
                  'Dispositivo Adicionado',
                  `"${qrData.data.deviceName}" foi adicionado com sucesso!`,
                  [{ 
                    text: 'OK', 
                    onPress: () => {
                      router.replace('/(tabs)');
                    }
                  }]
                );
              }, 1000);
            } else {
              Alert.alert(
                'Falha na Autenticação',
                'Não foi possível confirmar sua identidade.',
                [{ text: 'OK', onPress: () => setScanned(false) }]
              );
            }
          },
        },
      ]
    );
  };

  const handleIdentityShareQR = async (qrData: QRCodeData) => {
    Alert.alert(
      'Compartilhar Identidade',
      'Este QR Code solicita acesso à sua identidade. Deseja compartilhar?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => setScanned(false),
        },
        {
          text: 'Compartilhar',
          onPress: async () => {
            const isAuthenticated = await authenticateWithBiometric();
            
            if (isAuthenticated) {
              setIsLoading(true);
              setTimeout(() => {
                setIsLoading(false);
                Alert.alert(
                  'Identidade Compartilhada',
                  'Sua identidade foi compartilhada com sucesso!',
                  [{ text: 'OK', onPress: () => router.back() }]
                );
              }, 1000);
            } else {
              Alert.alert(
                'Falha na Autenticação',
                'Não foi possível confirmar sua identidade.',
                [{ text: 'OK', onPress: () => setScanned(false) }]
              );
            }
          },
        },
      ]
    );
  };

  const toggleCameraType = () => {
    setCameraType(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleFieldToggle = (field: string) => {
    setSelectedFields(current => {
      if (current.includes(field)) {
        return current.filter(f => f !== field);
      } else {
        return [...current, field];
      }
    });
  };

  const handleFieldValueChange = (fieldName: string, value: string) => {
    setFieldData(current => ({
      ...current,
      [fieldName]: {
        ...current[fieldName],
        value
      }
    }));
  };

  const validateAndPrepareData = (): { userData: Record<string, string>; missingRequired: string[] } => {
    const userData: Record<string, string> = {};
    const missingRequired: string[] = [];

    selectedFields.forEach(fieldName => {
      const field = fieldData[fieldName];
      if (field.value.trim()) {
        userData[fieldName] = field.value.trim();
      } else if (field.isRequired) {
        missingRequired.push(fieldName);
      }
    });

    return { userData, missingRequired };
  };

  const handleSubmit = async () => {
    if (!authRequest) return;

    const { userData, missingRequired } = validateAndPrepareData();

    // Verificar se campos obrigatórios estão preenchidos
    if (missingRequired.length > 0) {
      Alert.alert(
        'Campos Obrigatórios',
        `Os seguintes campos são obrigatórios: ${missingRequired.join(', ')}`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Verificar se pelo menos um campo foi selecionado
    if (selectedFields.length === 0) {
      Alert.alert(
        'Nenhum Campo Selecionado',
        'Selecione pelo menos um campo para compartilhar.',
        [{ text: 'OK' }]
      );
      return;
    }

    setShowModal(false);
    
    const isAuthenticated = await authenticateWithBiometric();
    
    if (isAuthenticated) {
      setIsLoading(true);
      
      try {
        // Salvar novos campos no perfil
        for (const fieldName of selectedFields) {
          const field = fieldData[fieldName];
          if (field.isNew && field.value.trim()) {
            await identityService.updateField(fieldName, field.value.trim());
          }
        }

        // Autorizar website
        const result = await identityService.authorizeWebsite(
          authRequest.siteUrl,
          authRequest.requestId,
          authRequest.challenge,
          selectedFields,
          userData
        );

        setIsLoading(false);

        if (result.success) {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowModal(false);
          router.replace('/(tabs)');
        } else {
          setScanned(false)
        }
      } catch (error) {
        setIsLoading(false);
        Alert.alert(
          'Erro na Autorização',
          'Não foi possível completar a autorização. Tente novamente mais tarde.',
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
      }
    } else {
      Alert.alert(
        'Falha na Autenticação',
        'Não foi possível confirmar sua identidade.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Escanear QR Code</Text>
        <TouchableOpacity style={styles.flipButton} onPress={toggleCameraType}>
          <Ionicons name="camera-reverse" size={24} color={Colors.primary.main} />
        </TouchableOpacity>
      </View>

      <View style={styles.cameraContainer}>
        <CustomQRScanner
          onScan={handleBarCodeScanned}
          scanning={!scanned}
          cameraType={cameraType}
          onCameraToggle={toggleCameraType}
        />
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
          <Text style={styles.loadingText}>Processando...</Text>
        </View>
      )}

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>
          {scanned ? 'Processando...' : 'Posicione o QR Code na área destacada'}
        </Text>
        <Text style={styles.instructionText}>
          Aceito QR Codes de login, pareamento de dispositivos e compartilhamento de identidade
        </Text>
        
        {scanned && !isLoading && (
          <TouchableOpacity
            style={styles.scanAgainButton}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.scanAgainButtonText}>Escanear Novamente</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal para selecionar campos a serem compartilhados */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowModal(false);
          setScanned(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Solicitação de Login</Text>
            
            <Text style={styles.modalSite}>{authRequest?.siteUrl}</Text>
            
            <Text style={styles.modalSubtitle}>Selecione os dados a compartilhar:</Text>
            
            <ScrollView style={styles.fieldsList}>
              {authRequest?.requestedFields?.map((fieldName: string, index: number) => {
                interface FieldItemProps {
                  fieldName: string;
                  field: FieldData;
                  isSelected: boolean;
                  index: number;
                }

                const field: FieldData = fieldData[fieldName];
                const isSelected: boolean = selectedFields.includes(fieldName);

                return (
                  <View key={index} style={styles.fieldContainer}>
                    <TouchableOpacity 
                      style={styles.fieldHeader}
                      onPress={() => handleFieldToggle(fieldName)}
                    >
                      <View style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected
                      ]}>
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                      </View>
                      <View style={styles.fieldInfo}>
                        <Text style={styles.fieldText}>{fieldName}</Text>
                        {field.isNew && (
                          <Text style={styles.newFieldLabel}>Novo campo</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                    
                    {isSelected && (
                      <TextInput
                        style={styles.fieldInput}
                        value={field.value}
                        onChangeText={(value: string) => handleFieldValueChange(fieldName, value)}
                        placeholder={`Digite seu ${fieldName}`}
                        placeholderTextColor="#666"
                      />
                    )}
                  </View>
                );
              })}
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowModal(false);
                  setScanned(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleSubmit}
              >
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: Colors.primary.main,
    fontSize: 16,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  flipButton: {
    padding: 8,
  },
  cameraContainer: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.text.primary,
    fontSize: 16,
    marginTop: 12,
  },
  instructions: {
    padding: 20,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  scanAgainButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  scanAgainButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    marginTop: 12,
  },
  permissionButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    backgroundColor: '#222222',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSite: {
    fontSize: 16,
    color: Colors.primary.main,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 10,
  },
  fieldsList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  fieldItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.primary.main,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary.main,
  },
  fieldText: {
    color: Colors.text.primary,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.secondary,
  },
  cancelButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Colors.button.primary,
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldInfo: {
    flex: 1,
    marginLeft: 12,
  },
  newFieldLabel: {
    fontSize: 12,
    color: Colors.primary.main,
    fontStyle: 'italic',
  },
  fieldInput: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: Colors.text.primary,
    fontSize: 16,
    marginLeft: 40,
  },
});
