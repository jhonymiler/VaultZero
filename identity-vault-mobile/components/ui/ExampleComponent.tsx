import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';

interface ExampleComponentProps {
  title: string;
  isConnected: boolean;
  isLoading: boolean;
  onPress: () => void;
}

/**
 * Componente de exemplo demonstrando o uso correto da paleta de cores
 */
export const ExampleComponent: React.FC<ExampleComponentProps> = ({
  title,
  isConnected,
  isLoading,
  onPress
}) => {
  return (
    <View style={styles.container}>
      {/* Título usando cor de texto primária */}
      <Text style={styles.title}>{title}</Text>
      
      {/* Card com fundo secundário */}
      <View style={styles.card}>
        {/* Status com cores condicionais */}
        <View style={styles.statusRow}>
          <View style={[
            styles.statusDot,
            { backgroundColor: isConnected ? Colors.status.connected : Colors.status.disconnected }
          ]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Conectado' : 'Desconectado'}
          </Text>
        </View>
        
        {/* Ícone usando cor primária */}
        <Ionicons 
          name="wifi" 
          size={24} 
          color={isConnected ? Colors.status.success : Colors.status.error} 
        />
      </View>
      
      {/* Botão primário */}
      <TouchableOpacity style={styles.primaryButton} onPress={onPress}>
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.text.primary} />
        ) : (
          <>
            <Ionicons name="refresh" size={16} color={Colors.text.primary} />
            <Text style={styles.buttonText}>Atualizar</Text>
          </>
        )}
      </TouchableOpacity>
      
      {/* Botão secundário */}
      <TouchableOpacity style={styles.secondaryButton} onPress={onPress}>
        <Text style={styles.secondaryButtonText}>Configurações</Text>
      </TouchableOpacity>
      
      {/* Botão com gradiente */}
      <LinearGradient
        colors={Colors.gradient.primary}
        style={styles.gradientButton}
      >
        <TouchableOpacity style={styles.gradientButtonInner} onPress={onPress}>
          <Text style={styles.buttonText}>Ação Especial</Text>
        </TouchableOpacity>
      </LinearGradient>
      
      {/* Seção de informações */}
      <View style={styles.infoSection}>
        <Text style={styles.infoLabel}>Informação:</Text>
        <Text style={styles.infoValue}>Valor importante</Text>
      </View>
      
      {/* Mensagem de sucesso/erro */}
      <View style={[
        styles.messageBox,
        { backgroundColor: isConnected ? Colors.status.success + '20' : Colors.status.error + '20' }
      ]}>
        <Text style={[
          styles.messageText,
          { color: isConnected ? Colors.status.success : Colors.status.error }
        ]}>
          {isConnected ? 'Tudo funcionando perfeitamente!' : 'Verifique sua conexão'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  card: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: Colors.text.secondary,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: Colors.button.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: Colors.button.secondary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border.accent,
  },
  buttonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: Colors.primary.main,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  gradientButton: {
    borderRadius: 8,
    marginBottom: 16,
  },
  gradientButtonInner: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    marginBottom: 16,
  },
  infoLabel: {
    color: Colors.text.secondary,
    fontSize: 14,
  },
  infoValue: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  messageBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  messageText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default ExampleComponent;
