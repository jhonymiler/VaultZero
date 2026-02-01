import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIdentity } from '../contexts/IdentityContext';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/Colors';

export default function BackupScreen() {
  const { getMnemonic, getAddress, authenticateWithBiometric } = useIdentity();
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleShowMnemonic = async () => {
    try {
      const success = await authenticateWithBiometric();
      if (success) {
        setIsAuthenticated(true);
        setShowMnemonic(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('Erro', 'Falha na autenticação biométrica');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao autenticar');
    }
  };

  const handleCopyMnemonic = async () => {
    const mnemonic = getMnemonic();
    if (mnemonic) {
      await Clipboard.setString(mnemonic);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Copiado', 'Palavras de recuperação copiadas para a área de transferência');
    }
  };

  const handleShareMnemonic = async () => {
    const mnemonic = getMnemonic();
    if (mnemonic) {
      try {
        await Share.share({
          message: `Minhas palavras de recuperação VaultZero:\n\n${mnemonic}\n\n⚠️ MANTENHA ESTAS PALAVRAS SEGURAS E PRIVADAS!`,
          title: 'Backup VaultZero',
        });
      } catch (error) {
        console.error('Error sharing mnemonic:', error);
      }
    }
  };

  const handleCopyAddress = async () => {
    const address = getAddress();
    if (address) {
      await Clipboard.setString(address);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Copiado', 'Endereço copiado para a área de transferência');
    }
  };

  const mnemonicWords = getMnemonic()?.split(' ') || [];
  const address = getAddress();

  const renderMnemonicWord = (word: string, index: number) => (
    <View key={index} style={styles.wordItem}>
      <Text style={styles.wordNumber}>{index + 1}</Text>
      <Text style={styles.wordText}>{word}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Backup & Recuperação</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Aviso de Segurança */}
        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningTitle}>Importante</Text>
          <Text style={styles.warningText}>
            Suas palavras de recuperação são a única forma de restaurar sua identidade. 
            Mantenha-as seguras e nunca as compartilhe com terceiros.
          </Text>
        </View>

        {/* Endereço da Identidade */}
        <View style={styles.addressCard}>
          <Text style={styles.cardTitle}>Seu Endereço Blockchain</Text>
          <Text style={styles.cardDescription}>
            Este é seu endereço único na rede blockchain
          </Text>
          
          <View style={styles.addressContainer}>
            <Text style={styles.addressText} numberOfLines={1}>
              {address || 'Não disponível'}
            </Text>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyAddress}>
              <Text style={styles.copyButtonText}>Copiar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Palavras de Recuperação */}
        <View style={styles.mnemonicCard}>
          <Text style={styles.cardTitle}>Palavras de Recuperação</Text>
          <Text style={styles.cardDescription}>
            12 palavras que permitem recuperar sua identidade
          </Text>

          {!showMnemonic ? (
            <View style={styles.hiddenMnemonic}>
              <Text style={styles.hiddenIcon}>🔒</Text>
              <Text style={styles.hiddenTitle}>Palavras Ocultas</Text>
              <Text style={styles.hiddenDescription}>
                Toque no botão abaixo para revelar suas palavras de recuperação
              </Text>
              
              <TouchableOpacity
                style={styles.revealButton}
                onPress={handleShowMnemonic}
              >
                <Text style={styles.revealButtonText}>
                  Mostrar Palavras de Recuperação
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.mnemonicVisible}>
              <View style={styles.wordsGrid}>
                {mnemonicWords.map(renderMnemonicWord)}
              </View>

              <View style={styles.mnemonicActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.copyAction]}
                  onPress={handleCopyMnemonic}
                >
                  <Text style={styles.actionButtonText}>📋 Copiar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.shareAction]}
                  onPress={handleShareMnemonic}
                >
                  <Text style={styles.actionButtonText}>📤 Compartilhar</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.hideButton}
                onPress={() => setShowMnemonic(false)}
              >
                <Text style={styles.hideButtonText}>Ocultar Palavras</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Instruções de Backup */}
        <View style={styles.instructionsCard}>
          <Text style={styles.cardTitle}>Como Fazer Backup Seguro</Text>
          
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>1</Text>
            <Text style={styles.instructionText}>
              Anote as 12 palavras em papel, na ordem correta
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>2</Text>
            <Text style={styles.instructionText}>
              Guarde o papel em local seguro (cofre, gaveta trancada)
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>3</Text>
            <Text style={styles.instructionText}>
              Considere fazer múltiplas cópias em locais diferentes
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>4</Text>
            <Text style={styles.instructionText}>
              NUNCA salve as palavras digitalmente ou tire fotos
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>5</Text>
            <Text style={styles.instructionText}>
              Teste a recuperação em outro dispositivo periodicamente
            </Text>
          </View>
        </View>

        {/* Como Recuperar */}
        <View style={styles.recoveryCard}>
          <Text style={styles.cardTitle}>Como Recuperar Identidade</Text>
          <Text style={styles.cardDescription}>
            Para restaurar sua identidade em um novo dispositivo:
          </Text>

          <Text style={styles.recoveryStep}>
            1. Instale o app VaultZero no novo dispositivo
          </Text>
          <Text style={styles.recoveryStep}>
            2. Escolha &quot;Restaurar Identidade&quot; na tela inicial
          </Text>
          <Text style={styles.recoveryStep}>
            3. Digite suas 12 palavras de recuperação na ordem correta
          </Text>
          <Text style={styles.recoveryStep}>
            4. Configure um nome para o novo dispositivo
          </Text>
          <Text style={styles.recoveryStep}>
            5. Sua identidade será restaurada automaticamente
          </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {},
  backButtonText: {
    fontSize: 16,
    color: Colors.primary.main,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  warningCard: {
    backgroundColor: Colors.status.errorLight,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: Colors.text.primary,
    textAlign: 'center',
    lineHeight: 20,
  },
  addressCard: {
    backgroundColor: Colors.background.secondary,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    fontFamily: 'monospace',
  },
  copyButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  copyButtonText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  mnemonicCard: {
    backgroundColor: Colors.background.secondary,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  hiddenMnemonic: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  hiddenIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  hiddenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  hiddenDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  revealButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  revealButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  mnemonicVisible: {},
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  wordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    width: '48%',
  },
  wordNumber: {
    fontSize: 12,
    color: Colors.primary.main,
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 16,
  },
  wordText: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  mnemonicActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  copyAction: {
    backgroundColor: Colors.primary.main,
  },
  shareAction: {
    backgroundColor: Colors.status.success,
  },
  actionButtonText: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  hideButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  hideButtonText: {
    color: Colors.primary.main,
    fontSize: 14,
  },
  instructionsCard: {
    backgroundColor: Colors.background.secondary,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  instructionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary.main,
    marginRight: 12,
    minWidth: 20,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  recoveryCard: {
    backgroundColor: Colors.background.secondary,
    padding: 20,
    borderRadius: 12,
    marginBottom: 40,
  },
  recoveryStep: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 8,
  },
});
