import React, { useState, useEffect } from 'react';
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
import { useSimple } from '../../src/contexts/SimpleContext';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function SettingsScreen() {
  const { getCurrentIdentity, updateProfile, getSyncStatus } = useSimple();
  const [identity, setIdentity] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<any>({ isConnected: false, connectedPeers: 0, lastSync: new Date() });
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  useEffect(() => {
    loadUserData();
    loadP2PStatus();
    
    // Atualizar status P2P a cada 10 segundos
    const interval = setInterval(loadP2PStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadUserData = async () => {
    try {
      const userIdentity = getCurrentIdentity();
      if (userIdentity) {
        setIdentity(userIdentity);
        setEditName(userIdentity.profile?.name || '');
        setEditEmail(userIdentity.profile?.email || '');
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  const loadP2PStatus = async () => {
    try {
      const status = getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Erro ao carregar status P2P:', error);
    }
  };

  const handleEditProfile = () => {
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    try {
      if (!identity) return;
      
      const updatedProfile = {
        ...identity.profile,
        name: editName.trim(),
        email: editEmail.trim(),
      };
      
      await updateProfile(updatedProfile);
      await loadUserData(); // Recarrega os dados
      setIsEditModalVisible(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      Alert.alert('Erro', 'Falha ao atualizar perfil');
    }
  };
  
  const clearIdentity = async () => {
    Alert.alert('Demo', 'Identidade limpa (simulado)');
    router.replace('/onboarding');
  };

  const handleLogout = async () => {
    await clearIdentity();
    router.replace('/onboarding');
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Configurações</Text>

        {/* Perfil */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Perfil</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>Nome:</Text>
              <Text style={styles.profileValue}>
                {identity?.profile?.name || 'Não definido'}
              </Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>Email:</Text>
              <Text style={styles.profileValue}>
                {identity?.profile?.email || 'Não definido'}
              </Text>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Text style={styles.editButtonText}>Editar Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Segurança */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Segurança</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/backup')}
          >
            <Text style={styles.menuIcon}>🔑</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Backup & Recuperação</Text>
              <Text style={styles.menuSubtitle}>
                Ver palavras de recuperação
              </Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/devices')}
          >
            <Text style={styles.menuIcon}>📱</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Dispositivos</Text>
              <Text style={styles.menuSubtitle}>
                Gerenciar dispositivos conectados
              </Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Rede */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rede P2P</Text>
          <View style={styles.networkCard}>
            <View style={styles.networkItem}>
              <Text style={styles.networkLabel}>Status:</Text>
              <Text style={[
                styles.networkValue,
                { color: syncStatus.isConnected ? Colors.status.successLight : Colors.status.errorLight }
              ]}>
                {syncStatus.isConnected ? 'Conectado' : 'Desconectado'}
              </Text>
            </View>
            <View style={styles.networkItem}>
              <Text style={styles.networkLabel}>Peers:</Text>
              <Text style={styles.networkValue}>{syncStatus.connectedPeers}</Text>
            </View>
            <View style={styles.networkItem}>
              <Text style={styles.networkLabel}>Última Sync:</Text>
              <Text style={styles.networkValue}>
                {formatDate(syncStatus.lastSync)}
              </Text>
            </View>
          </View>
        </View>

        {/* Sobre */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>VaultZero</Text>
            <Text style={styles.aboutVersion}>Versão 1.0.0</Text>
            <Text style={styles.aboutDescription}>
              Sistema de autenticação sem senhas baseado em blockchain P2P 
              que implementa Self-Sovereign Identity (SSI).
            </Text>
          </View>
        </View>

        {/* Ações */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de Edição de Perfil */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
              <Text style={styles.modalCancelButton}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <TouchableOpacity onPress={handleSaveProfile}>
              <Text style={styles.modalSaveButton}>Salvar</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nome</Text>
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Digite seu nome"
                autoCapitalize="words"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Digite seu email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  profileCard: {
    backgroundColor: Colors.background.secondary,
    padding: 20,
    borderRadius: 12,
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  profileLabel: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  profileValue: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: Colors.primary.main,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  editButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  menuArrow: {
    fontSize: 20,
    color: Colors.text.muted,
  },
  networkCard: {
    backgroundColor: Colors.background.secondary,
    padding: 20,
    borderRadius: 12,
  },
  networkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  networkLabel: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  networkValue: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  aboutCard: {
    backgroundColor: Colors.background.secondary,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 14,
    color: Colors.primary.main,
    marginBottom: 16,
  },
  aboutDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  logoutButton: {
    backgroundColor: Colors.status.errorLight,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.secondary,
  },
  modalCancelButton: {
    color: Colors.text.muted,
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  modalSaveButton: {
    color: Colors.primary.main,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.background.secondary,
  },
});
