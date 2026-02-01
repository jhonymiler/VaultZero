import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSimple } from '../contexts/SimpleContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import * as Clipboard from 'expo-clipboard';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [step, setStep] = useState<'welcome' | 'create' | 'restore'>('welcome');
  const [name, setName] = useState('');
  const [recoveryWords, setRecoveryWords] = useState<string[]>(Array(12).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [hasClipboardWords, setHasClipboardWords] = useState(false);

  const { createIdentity, restoreIdentity } = useSimple();

  // Verificar clipboard quando estiver na tela de restauração
  useEffect(() => {
    if (step === 'restore') {
      const checkClipboard = async () => {
        const hasWords = await checkClipboardForWords();
        setHasClipboardWords(hasWords);
      };
      
      checkClipboard();
      
      // Verificar clipboard a cada 2 segundos se ainda não tiver palavras preenchidas
      const interval = setInterval(() => {
        if (recoveryWords.filter(w => w.trim().length > 0).length < 12) {
          checkClipboard();
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [step, recoveryWords]);

  const handleCreateIdentity = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Por favor, digite seu nome');
      return;
    }

    try {
      setIsLoading(true);
      // Gerar automaticamente o nome do dispositivo
      const autoDeviceName = `${Platform.OS === 'ios' ? 'iPhone' : 'Android'} - ${name.split(' ')[0]}`;
      await createIdentity(name.trim(), autoDeviceName);
      Alert.alert('Sucesso', 'Identidade criada com sucesso!');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error creating identity:', error);
      Alert.alert('Erro', 'Falha ao criar identidade. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreIdentity = async () => {
    const filledWords = recoveryWords.filter(word => word.trim().length > 0);
    
    if (filledWords.length !== 12) {
      Alert.alert('Erro', 'É necessário inserir todas as 12 palavras de recuperação');
      return;
    }

    const mnemonic = recoveryWords.join(' ').trim();

    try {
      setIsLoading(true);
      
      // Gerar nome temporário do dispositivo (será usado apenas se necessário)
      const autoDeviceName = `${Platform.OS === 'ios' ? 'iPhone' : 'Android'} - Restaurado`;
      
      // Buscar automaticamente os dados da blockchain/DHT
      // O sistema tentará recuperar o nome e outros dados automaticamente
      await restoreIdentity(mnemonic, '', autoDeviceName);
      
      Alert.alert('Sucesso', 'Identidade restaurada com sucesso!');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Error restoring identity:', error);
      Alert.alert('Erro', 'Falha ao restaurar identidade. Verifique as palavras de recuperação.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateRecoveryWord = (index: number, word: string) => {
    const newWords = [...recoveryWords];
    newWords[index] = word;
    setRecoveryWords(newWords);
  };

  // Função para detectar se o clipboard tem palavras válidas
  const checkClipboardForWords = async () => {
    try {
      const clipboardText = await Clipboard.getStringAsync();
      if (!clipboardText) return false;

      // Tentar detectar separação por vírgula ou espaço
      const words = clipboardText
        .replace(/,/g, ' ') // Substitui vírgulas por espaços
        .split(/\s+/) // Divide por espaços
        .map(word => word.trim().toLowerCase())
        .filter(word => word.length > 0);

      // Verificar se tem exatamente 12 palavras
      return words.length === 12;
    } catch (error) {
      console.error('Error checking clipboard:', error);
      return false;
    }
  };

  // Função para colar palavras do clipboard
  const pasteWordsFromClipboard = async () => {
    try {
      const clipboardText = await Clipboard.getStringAsync();
      if (!clipboardText) {
        Alert.alert('Erro', 'A área de transferência está vazia');
        return;
      }

      // Processar texto do clipboard
      const words = clipboardText
        .replace(/,/g, ' ') // Substitui vírgulas por espaços
        .split(/\s+/) // Divide por espaços
        .map(word => word.trim().toLowerCase())
        .filter(word => word.length > 0);

      if (words.length !== 12) {
        Alert.alert(
          'Formato Inválido', 
          `Encontradas ${words.length} palavras. São necessárias exatamente 12 palavras separadas por vírgula ou espaço.`
        );
        return;
      }

      // Preencher os campos com as palavras
      setRecoveryWords(words);
      Alert.alert('Sucesso', 'Palavras coladas com sucesso!');
    } catch (error) {
      console.error('Error pasting words:', error);
      Alert.alert('Erro', 'Não foi possível colar as palavras da área de transferência');
    }
  };

  const renderWelcomeStep = () => (
    <LinearGradient
      colors={['#1a1a1a', Colors.background.secondary, '#1a1a1a']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.welcomeContent}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>🔐</Text>
          </View>
          <Text style={styles.title}>VaultZero</Text>
          <Text style={styles.subtitle}>
            Sistema de autenticação sem senhas baseado em blockchain
          </Text>
        </View>
        
        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featureTitle}>🚀 Revolucione sua Segurança</Text>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="finger-print" size={24} color={Colors.primary.main} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureItemTitle}>Biometria Avançada</Text>
              <Text style={styles.featureDescription}>
                Login seguro em 2 segundos com impressão digital ou Face ID
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="globe-outline" size={24} color={Colors.primary.main} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureItemTitle}>Rede Descentralizada</Text>
              <Text style={styles.featureDescription}>
                Seus dados ficam seguros na blockchain P2P
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="shield-checkmark-outline" size={24} color={Colors.primary.main} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureItemTitle}>Self-Sovereign Identity</Text>
              <Text style={styles.featureDescription}>
                Você tem controle total sobre sua identidade digital
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="flash-outline" size={24} color={Colors.primary.main} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureItemTitle}>Login Instantâneo</Text>
              <Text style={styles.featureDescription}>
                Acesse qualquer site em segundos sem senhas
              </Text>
            </View>
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => setStep('create')}
          >
            <LinearGradient
              colors={Colors.gradient.primary}
              style={styles.gradientButton}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Criar Nova Identidade</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setStep('restore')}
          >
            <Ionicons name="refresh-circle-outline" size={20} color={Colors.primary.main} />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Restaurar Identidade
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );

  const renderCreateStep = () => (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('welcome')}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.primary.main} />
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.stepTitle}>Criar Identidade</Text>
        </View>

        {/* Visual Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <LinearGradient
              colors={Colors.gradient.primary}
              style={styles.iconGradient}
            >
              <Ionicons name="person-add" size={40} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.heroTitle}>Bem-vindo ao Futuro!</Text>
          <Text style={styles.heroDescription}>
            Sua identidade será criada localmente e sincronizada com a rede P2P.
            Você receberá 12 palavras de recuperação para backup seguro.
          </Text>
        </View>

        {/* Benefits Cards */}
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitCard}>
            <Ionicons name="shield-checkmark-outline" size={24} color={Colors.status.success} />
            <Text style={styles.benefitText}>100% Seguro</Text>
          </View>
          <View style={styles.benefitCard}>
            <Ionicons name="flash-outline" size={24} color={Colors.status.warning} />
            <Text style={styles.benefitText}>Login Rápido</Text>
          </View>
          <View style={styles.benefitCard}>
            <Ionicons name="lock-closed-outline" size={24} color={Colors.primary.main} />
            <Text style={styles.benefitText}>Sem Senhas</Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              <Ionicons name="person-outline" size={16} color={Colors.primary.main} /> Seu Nome
            </Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Digite seu nome completo"
              placeholderTextColor={Colors.text.muted}
              autoCapitalize="words"
              autoComplete="name"
            />
            <Text style={styles.inputHint}>
              Este nome será usado para identificar sua identidade
            </Text>
          </View>

          {/* Steps Preview */}
          <View style={styles.stepsContainer}>
            <Text style={styles.stepsTitle}>O que acontece depois:</Text>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Identidade criada localmente</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>12 palavras de recuperação geradas</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>Sincronização com rede P2P</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleCreateIdentity}
            disabled={isLoading}
          >
            <LinearGradient
              colors={Colors.gradient.primary}
              style={styles.gradientButton}
            >
              {isLoading ? (
                <>
                  <Ionicons name="hourglass" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Criando...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="rocket" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Criar Minha Identidade</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderRestoreStep = () => (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('welcome')}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.primary.main} />
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.stepTitle}>Restaurar Identidade</Text>
        </View>

        {/* Visual Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <LinearGradient
              colors={Colors.gradient.success}
              style={styles.iconGradient}
            >
              <Ionicons name="refresh" size={40} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.heroTitle}>Restaurar Identidade</Text>
          <Text style={styles.heroDescription}>
            Digite suas 12 palavras de recuperação. Seus dados pessoais (nome, perfil) 
            serão automaticamente recuperados da blockchain descentralizada.
          </Text>
        </View>

        {/* Warning Card */}
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={20} color={Colors.status.warning} />
          <Text style={styles.warningText}>
            Mantenha suas palavras seguras. Nunca as compartilhe com terceiros.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="key" size={16} color={Colors.primary.main} /> Palavras de Recuperação
          </Text>
          
          {/* Botão para colar palavras se detectadas no clipboard */}
          {hasClipboardWords && recoveryWords.filter(w => w.trim().length > 0).length < 12 && (
            <TouchableOpacity
              style={styles.pasteButton}
              onPress={pasteWordsFromClipboard}
            >
              <Ionicons name="clipboard-outline" size={20} color={Colors.primary.main} />
              <Text style={styles.pasteButtonText}>Colar Palavras</Text>
              <Text style={styles.pasteButtonSubtext}>12 palavras detectadas na área de transferência</Text>
            </TouchableOpacity>
          )}
          
          {/* Grid de 12 campos para palavras */}
          <View style={styles.wordsGrid}>
            {recoveryWords.map((word, index) => (
              <View key={index} style={styles.wordInputContainer}>
                <Text style={styles.wordNumber}>{index + 1}</Text>
                <TextInput
                  style={styles.wordInput}
                  value={word}
                  onChangeText={(text) => updateRecoveryWord(index, text.toLowerCase().trim())}
                  placeholder={`Palavra ${index + 1}`}
                  placeholderTextColor={Colors.text.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                />
              </View>
            ))}
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(recoveryWords.filter(w => w.trim().length > 0).length / 12) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {recoveryWords.filter(w => w.trim().length > 0).length} de 12 palavras inseridas
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleRestoreIdentity}
            disabled={isLoading || recoveryWords.filter(w => w.trim().length > 0).length < 12}
          >
            <LinearGradient
              colors={Colors.gradient.success}
              style={styles.gradientButton}
            >
              {isLoading ? (
                <>
                  <Ionicons name="hourglass" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Restaurando...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Restaurar Identidade</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {step === 'welcome' && renderWelcomeStep()}
      {step === 'create' && renderCreateStep()}
      {step === 'restore' && renderRestoreStep()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  // Welcome Screen Styles
  welcomeContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.05,
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: Colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  logoText: {
    fontSize: 48,
    color: Colors.text.primary,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  featuresContainer: {
    marginVertical: 30,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.main,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary.main,
    marginLeft: 4,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },

  // Hero Section Styles
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  heroIcon: {
    marginBottom: 16,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Benefits Section
  benefitsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  benefitCard: {
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  benefitText: {
    fontSize: 12,
    color: Colors.text.primary,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Form Styles
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text.primary,
    minHeight: 50,
  },
  inputHint: {
    fontSize: 14,
    color: '#999',
    marginTop: 6,
    fontStyle: 'italic',
  },

  // Steps Preview
  stepsContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  stepText: {
    fontSize: 14,
    color: Colors.text.secondary,
    flex: 1,
  },

  // Warning Card
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a1f0a',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.status.warning,
  },
  warningText: {
    fontSize: 14,
    color: '#ffcc66',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },

  // Words Grid for Restore
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  wordInputContainer: {
    width: (width - 64) / 3 - 8, // 3 columns with gaps
    marginBottom: 8,
  },
  wordNumber: {
    fontSize: 12,
    color: Colors.primary.main,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  wordInput: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text.primary,
    textAlign: 'center',
    minHeight: 40,
  },

  // Paste Button Styles
  pasteButton: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 2,
    borderColor: Colors.primary.main,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    flexDirection: 'column',
  },
  pasteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.main,
    marginTop: 8,
  },
  pasteButtonSubtext: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },

  // Progress Indicator
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.main,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },

  // Button Styles
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 34,
    marginTop: 'auto',
  },
  button: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  primaryButton: {
    backgroundColor: Colors.primary.main,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary.main,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  secondaryButtonText: {
    color: Colors.primary.main,
    marginLeft: 8,
  },
});
