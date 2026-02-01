import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IdentityService } from '../services/identity';
import { Colors } from '../../constants/Colors';

interface LoggedSite {
  siteUrl: string;
  grantedAt: string;
  lastUsed: string;
  fields: string[];
  siteName?: string;
  isActive?: boolean;
}

interface ExpandedState {
  [key: string]: boolean;
}

export default function LoggedSitesScreen() {
  const [sites, setSites] = useState<LoggedSite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedItems, setExpandedItems] = useState<ExpandedState>({});
  
  const identityService = IdentityService.getInstance();

  const loadSites = async () => {
    try {
      const loggedSites = identityService.getLoggedSites();
      console.log('📱 Sites carregados:', loggedSites);
      
      // Enriquecer com dados do site
      const enrichedSites = loggedSites.map(site => ({
        ...site,
        siteName: site.siteName || getSiteNameFromUrl(site.siteUrl),
        isActive: true // Por padrão, considerar ativo
      }));
      
      setSites(enrichedSites);
    } catch (error) {
      console.error('Erro ao carregar sites:', error);
      Alert.alert('Erro', 'Não foi possível carregar a lista de sites.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadSites();
  };

  const getSiteNameFromUrl = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      
      // Mapear domínios conhecidos para nomes amigáveis
      const siteNames: { [key: string]: string } = {
        'localhost': 'VaultZero Demo (Local)',
        '192.168.15.7': 'VaultZero Demo (Rede)',
        'vaultzero.com': 'VaultZero',
        'github.com': 'GitHub',
        'google.com': 'Google',
        'facebook.com': 'Facebook',
        'twitter.com': 'Twitter',
        'linkedin.com': 'LinkedIn',
      };
      
      // Verificar se é um domínio conhecido
      for (const [key, name] of Object.entries(siteNames)) {
        if (domain.includes(key)) {
          return name;
        }
      }
      
      // Extrair nome do domínio (remover subdomínios)
      const parts = domain.split('.');
      if (parts.length >= 2) {
        return parts[parts.length - 2].charAt(0).toUpperCase() + parts[parts.length - 2].slice(1);
      }
      
      return domain;
    } catch {
      return 'Site Desconhecido';
    }
  };

  const toggleExpanded = (siteUrl: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [siteUrl]: !prev[siteUrl]
    }));
  };

  const handleRevokeSite = (site: LoggedSite) => {
    Alert.alert(
      'Revogar Acesso',
      `Deseja revogar o acesso para ${site.siteName}?\n\nEsta ação irá deslogar você instantaneamente do site.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Revogar',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚫 Revogando acesso para:', site.siteUrl);
              const success = await identityService.revokePermission(site.siteUrl);
              
              if (success) {
                setSites(prev => prev.filter(s => s.siteUrl !== site.siteUrl));
              } else {
                Alert.alert('Erro', 'Não foi possível revogar o acesso.');
              }
            } catch (error) {
              console.error('Erro ao revogar acesso:', error);
              Alert.alert('Erro', 'Ocorreu um erro ao revogar o acesso.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Data inválida';
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Agora';
      if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h atrás`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} dias atrás`;
    } catch {
      return 'Tempo desconhecido';
    }
  };

  const getStatusColor = (lastUsed: string): string => {
    try {
      const date = new Date(lastUsed);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return '#00ff88'; // Verde - Ativo recentemente
      if (diffInHours < 24) return '#ffaa00'; // Amarelo - Ativo hoje
      return '#ff4444'; // Vermelho - Inativo há mais de 1 dia
    } catch {
      return '#666666'; // Cinza - Status desconhecido
    }
  };

  const renderSiteItem = ({ item }: { item: LoggedSite }) => {
    const isExpanded = expandedItems[item.siteUrl] || false;
    const statusColor = getStatusColor(item.lastUsed);
    
    return (
      <View style={styles.siteItem}>
        <TouchableOpacity 
          style={styles.siteHeader}
          onPress={() => toggleExpanded(item.siteUrl)}
          activeOpacity={0.7}
        >
          <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
          
          <View style={styles.siteIcon}>
            <Ionicons name="globe-outline" size={24} color={Colors.primary.main} />
          </View>
          
          <View style={styles.siteInfo}>
            <Text style={styles.siteName}>{item.siteName}</Text>
            <Text style={styles.siteUrl}>{new URL(item.siteUrl).hostname}</Text>
            <Text style={styles.lastUsed}>{formatTimeAgo(item.lastUsed)}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.revokeButton}
            onPress={(e) => {
              e.stopPropagation();
              handleRevokeSite(item);
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#ff4444" />
          </TouchableOpacity>
          
          <View style={styles.expandIcon}>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={Colors.text.secondary} 
            />
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Login realizado:</Text>
              <Text style={styles.detailValue}>{formatDate(item.grantedAt)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Último acesso:</Text>
              <Text style={styles.detailValue}>{formatDate(item.lastUsed)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Dados compartilhados:</Text>
              <View style={styles.fieldsContainer}>
                {item.fields.map((field, index) => (
                  <View key={index} style={styles.fieldChip}>
                    <Text style={styles.fieldText}>{field}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.primary.main} />
          </TouchableOpacity>
          <Text style={styles.title}>Sites Logados</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
          <Text style={styles.loadingText}>Carregando sites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary.main} />
        </TouchableOpacity>
        <Text style={styles.title}>Sites Logados</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color={Colors.primary.main} />
        </TouchableOpacity>
      </View>

      {sites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="globe-outline" size={64} color="#666" />
          <Text style={styles.emptyTitle}>Nenhum site logado</Text>
          <Text style={styles.emptyText}>
            Você ainda não fez login em nenhum site usando o VaultZero.
          </Text>
          <Text style={styles.emptyHint}>
            Escaneie um QR Code de login para começar!
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {sites.length} {sites.length === 1 ? 'site conectado' : 'sites conectados'}
            </Text>
          </View>
          
          <FlatList
            data={sites}
            renderItem={renderSiteItem}
            keyExtractor={(item) => item.siteUrl}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.primary.main}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.text.secondary,
    fontSize: 16,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    color: Colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: Colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  emptyHint: {
    color: Colors.primary.main,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statsText: {
    color: Colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  siteItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  siteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  siteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  siteUrl: {
    color: Colors.text.secondary,
    fontSize: 12,
    marginBottom: 2,
  },
  lastUsed: {
    color: Colors.primary.main,
    fontSize: 11,
    fontWeight: '500',
  },
  revokeButton: {
    padding: 8,
    marginRight: 8,
  },
  expandIcon: {
    padding: 4,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    color: Colors.text.secondary,
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  fieldsContainer: {
    flex: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 4,
  },
  fieldChip: {
    backgroundColor: Colors.primary.main + '20',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  fieldText: {
    color: Colors.primary.main,
    fontSize: 12,
    fontWeight: '500',
  },
});
