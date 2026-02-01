import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/Colors';

interface CustomQRScannerProps {
  onScan: (data: string) => void;
  scanning: boolean;
  cameraType: 'front' | 'back';
  onCameraToggle: () => void;
}

const CustomQRScanner: React.FC<CustomQRScannerProps> = ({ 
  onScan, 
  scanning, 
  cameraType,
  onCameraToggle
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const scannerRef = useRef<any>(null);
  const { width, height } = Dimensions.get('window');
  const scanAreaSize = Math.min(width, height) * 0.7;

  // Otimização para Android - adiciona delay antes de inicializar a câmera
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        // Pequeno delay para garantir que o componente esteja montado
        if (Platform.OS === 'android') {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        if (permission && permission.granted) {
          setTimeout(() => setCameraReady(true), 300);
        }
      } catch (error) {
        console.error('Erro ao inicializar câmera:', error);
        setCameraReady(false);
      }
    };

    initializeCamera();
  }, [permission]);

  useEffect(() => {
    if (!scanning) {
      setScanned(false);
      setIsProcessing(false);
    }
  }, [scanning]);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    // Prevenção de múltiplos escaneamentos
    if (scanned || !scanning || isProcessing) return;
    
    // Validação básica do QR Code
    if (!data || data.length < 10) return;
    
    setScanned(true);
    setIsProcessing(true);
    
    try {
      // Feedback háptico otimizado para Android
      if (Platform.OS === 'android') {
        // Vibração mais suave para dispositivos mais antigos
        await Haptics.selectionAsync();
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Delay otimizado para dispositivos Android mais antigos
      const delay = Platform.OS === 'android' ? 200 : 100;
      setTimeout(() => {
        onScan(data);
        setIsProcessing(false);
      }, 100);
    } catch (error) {
      console.error('Erro ao processar QR code:', error);
      setIsProcessing(false);
      setScanned(false);
    }
  };

  const requestPermissions = async () => {
    try {
      const result = await requestPermission();
      
      if (!result?.granted) {
        Alert.alert(
          'Permissão Negada',
          'Para usar o scanner QR, você precisa permitir o acesso à câmera nas configurações do aplicativo.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
      Alert.alert(
        'Erro',
        'Não foi possível acessar a câmera. Verifique as configurações do seu dispositivo.',
        [{ text: 'OK' }]
      );
    }
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <Text style={styles.statusText}>Verificando permissões da câmera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.statusText}>
          Acesso à câmera é necessário para escanear QR Codes
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={requestPermissions}
        >
          <Text style={styles.permissionButtonText}>Conceder Permissão</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Aguarda a câmera estar pronta antes de renderizar
  if (!cameraReady) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.statusText}>Iniciando câmera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={scannerRef}
        style={StyleSheet.absoluteFillObject}
        facing={cameraType}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        {/* Overlay com área de escaneamento */}
        <View style={styles.overlay}>
          <View style={styles.scanAreaContainer}>
            <View style={[styles.scanArea, { 
              width: scanAreaSize, 
              height: scanAreaSize,
              top: (height - scanAreaSize) / 2 - 100 // Posiciona mais acima
            }]}>
              {/* Cantos da área de escaneamento */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {/* Linha de escaneamento animada */}
              {scanning && !scanned && (
                <View style={styles.scanLine} />
              )}
            </View>
            
            {/* Instruções */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionText}>
                {scanned 
                  ? 'QR Code detectado!' 
                  : 'Posicione o QR Code dentro da área destacada'
                }
              </Text>
              {scanning && !scanned && (
                <Text style={styles.subInstructionText}>
                  Mantenha o dispositivo estável
                </Text>
              )}
            </View>
          </View>
        </View>
      </CameraView>
      
      {/* Controles na parte inferior */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={onCameraToggle}
          disabled={isProcessing}
        >
          <Text style={styles.controlText}>🔄 Trocar Câmera</Text>
        </TouchableOpacity>
        
        {scanned && (
          <TouchableOpacity 
            style={[styles.controlButton, styles.scanAgainButton]}
            onPress={() => {
              setScanned(false);
              setIsProcessing(false);
            }}
            disabled={isProcessing}
          >
            <Text style={styles.controlText}>📷 Escanear Novamente</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanAreaContainer: {
    flex: 1,
    position: 'relative',
  },
  scanArea: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
  },
  corner: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderColor: Colors.primary.main,
    borderWidth: 4,
  },
  topLeft: {
    top: -4,
    left: -4,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: -4,
    right: -4,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: -4,
    left: -4,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: -4,
    right: -4,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.primary.main,
    opacity: 0.8,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 180,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionText: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    ...(Platform.OS !== 'web' && {
      textShadowColor: 'rgba(0,0,0,0.8)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    }),
  },
  subInstructionText: {
    color: Colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    ...(Platform.OS !== 'web' && {
      textShadowColor: 'rgba(0,0,0,0.8)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    }),
  },
  statusText: {
    color: Colors.text.primary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  scanAgainButton: {
    backgroundColor: 'rgba(0,102,204,0.8)',
    borderColor: Colors.primary.main,
  },
  controlText: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 20,
  },
  permissionButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CustomQRScanner;
