// Importações de bibliotecas e hooks do React e React Native
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Animated,
} from 'react-native';
// Importação de ícones da biblioteca lucide-react-native
import { Plus, Smartphone, Wifi, WifiOff, ChevronRight, X } from 'lucide-react-native';
// Hook para navegação entre telas
import { useNavigation } from '@react-navigation/native';
// Componente de cabeçalho customizado (topo da tela)
import { MobileHeader } from '../components/MobileHeader';
// Importação do PullToRefreshIndicator (componente visual, embora não usado diretamente com o `RefreshControl` aqui)
import { PullToRefreshIndicator } from '../components/PullToRefreshIndicator';
// Utilitários de estilo e constantes de design
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
// Hook para obter o estado de autenticação e dados do usuário
import { useAuth } from '../contexts/AuthContext';
// Serviço de API para operações de dispositivos (listar, conectar)
import { deviceService, Dispositivo } from '../services/deviceService';
// Função para tratar e formatar erros de API de forma consistente
import { handleApiError } from '../services/api';

// Obtém a largura da tela para dimensionamento responsivo (usado no modal)
const { width } = Dimensions.get('window');

/**
 * Componente funcional principal para a tela de gerenciamento de Dispositivos.
 */
export const Devices: React.FC = () => {
  // Inicializa o hook de navegação
  const navigation = useNavigation();
  // Obtém o objeto de usuário do contexto de autenticação
  const { user } = useAuth();
  
  // ==================== Estados Locais ====================
  // Armazena a lista de dispositivos do usuário
  const [devices, setDevices] = useState<Dispositivo[]>([]);
  // Indica se a tela está carregando os dados pela primeira vez
  const [isLoading, setIsLoading] = useState(true);
  // Indica se a tela está em processo de atualização (pull-to-refresh)
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Controla a visibilidade do modal de adicionar dispositivo
  const [showAddModal, setShowAddModal] = useState(false);
  // Armazena o código de verificação digitado no modal
  const [codigoDispositivo, setCodigoDispositivo] = useState('');
  // Indica se a requisição de conexão de dispositivo está em andamento
  const [conectandoDispositivo, setConectandoDispositivo] = useState(false);
  // Variável animada para controle visual do pull-to-refresh (embora o `RefreshControl` nativo seja usado abaixo)
  const pullProgress = useState(new Animated.Value(0))[0];
  // ==================== Fim dos Estados Locais ====================

  /**
   * Hook de efeito que é executado uma vez (ou quando o usuário muda)
   * para iniciar o carregamento dos dispositivos.
   */
  useEffect(() => {
    if (user) {
      carregarDispositivos();
    }
  }, [user]);

  /**
   * Função assíncrona para buscar a lista de dispositivos do usuário na API.
   */
  const carregarDispositivos = async () => {
    if (!user) return; // Não carrega se não houver usuário

    try {
      // Chama o serviço de API para obter a lista
      const response = await deviceService.listarDispositivos(user.id);
      
      if (response.status === 'sucesso' && response.dados) {
        setDevices(response.dados); // Atualiza o estado com os dispositivos
      } else {
        // Trata erros de resposta da API
        console.error('Erro ao carregar dispositivos:', response.mensagem);
        Alert.alert('Erro', 'Não foi possível carregar os dispositivos.');
      }
    } catch (error) {
      // Trata erros de conexão ou inesperados
      console.error('Erro ao carregar dispositivos:', handleApiError(error));
      Alert.alert('Erro', 'Não foi possível carregar os dispositivos. Tente novamente.');
    } finally {
      setIsLoading(false); // Finaliza o estado de carregamento inicial
    }
  };

  /**
   * Função chamada quando o usuário aciona o Pull-to-Refresh.
   */
  const onRefresh = async () => {
    setIsRefreshing(true); // Inicia o indicador de refresh
    await carregarDispositivos(); // Recarrega os dados
    setIsRefreshing(false); // Para o indicador de refresh
  };

  /**
   * Função utilitária para retornar o ícone de status (Wi-Fi on/off).
   */
  const getStatusIcon = (status: string) => {
    return status === 'online' ? (
      <Wifi size={16} color={colors.success} /> // Ícone de Wi-Fi verde para Online
    ) : (
      <WifiOff size={16} color={colors.mutedForeground} /> // Ícone de Wi-Fi riscado para Offline
    );
  };

  /**
   * Função utilitária para retornar a cor de status.
   */
  const getStatusColor = (status: string) => {
    return status === 'online' ? colors.success : colors.mutedForeground;
  };

  /**
   * Função para navegar para a tela de detalhes de um dispositivo.
   */
  const handleDevicePress = (device: Dispositivo) => {
    // Navega para a tela 'SensorDetails', passando o objeto do dispositivo como parâmetro
    (navigation as any).navigate('SensorDetails', { device });
  };

  /**
   * Função para abrir o modal de adição de dispositivo e resetar o campo de código.
   */
  const handleAddDevice = () => {
    setShowAddModal(true);
    setCodigoDispositivo('');
  };

  /**
   * Função assíncrona para conectar um novo dispositivo à conta do usuário.
   * Envolve validação e chamada direta à API de conexão.
   */
  const conectarDispositivo = async () => {
    if (!user?.id || !codigoDispositivo.trim()) {
      Alert.alert('Erro', 'Digite o código do dispositivo.');
      return;
    }

    try {
      setConectandoDispositivo(true); // Ativa o loading
      
      // Faz a chamada POST direta para a API de conexão
      const response = await fetch('http://tcc3eetecgrupo5t1.hospedagemdesites.ws/app/api_mobile/dispositivos/conectar.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario_id: user.id,
          codigo_verificacao: codigoDispositivo.trim()
        })
      });

      const data = await response.json();
      
      if (data.status === 'sucesso') {
        // Mostra alerta de sucesso e recarrega a lista
        Alert.alert(
          'Sucesso!', 
          `Dispositivo "${data.dados.dispositivo.nome}" conectado com sucesso!`,
          [
            {
              text: 'OK',
              onPress: () => {
                setShowAddModal(false);
                carregarDispositivos(); 
              }
            }
          ]
        );
      } else {
        // Mostra alerta de erro retornado pela API
        Alert.alert('Erro', data.mensagem || 'Erro ao conectar dispositivo.');
      }
    } catch (error) {
      // Mostra alerta de erro de rede/servidor
      console.error('Erro ao conectar dispositivo:', error);
      Alert.alert('Erro', 'Erro interno. Tente novamente.');
    } finally {
      setConectandoDispositivo(false); // Desativa o loading
    }
  };

  // ==================== Renderização Condicional de Carregamento ====================
  // Se a tela estiver carregando, exibe um indicador de loading no centro
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <MobileHeader userName={user?.name || 'Usuário'} />
        <Text style={styles.loadingText}>Carregando dispositivos...</Text>
      </View>
    );
  }

  // ==================== Estrutura de Renderização Principal ====================
  return (
    <View style={styles.container}>
      {/* Cabeçalho do aplicativo, com nome do usuário */}
      <MobileHeader userName={user?.name || 'Usuário'} />
      
      {/* ScrollView principal com funcionalidade Pull-to-Refresh */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh} // Chama a função de recarregar
            colors={[colors.water.primary]}
            tintColor={colors.water.primary}
            title="Atualizando dispositivos..."
            titleColor={colors.mutedForeground}
          />
        }
      >
        <View style={styles.content}>
          {/* Cabeçalho da página (Título e Botão de Adicionar) */}
          <View style={styles.header}>
            <Text style={styles.title}>Meus Dispositivos</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddDevice}>
              <Plus size={20} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Gerencie seus sensores de qualidade da água
          </Text>

          {/* Renderização condicional da lista de dispositivos */}
          {devices.length === 0 ? (
            // Exibe estado vazio se não houver dispositivos
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nenhum dispositivo encontrado</Text>
              <Text style={styles.emptyStateSubtext}>Adicione um dispositivo A-Quality para começar</Text>
            </View>
          ) : (
            // Lista os cartões de cada dispositivo
            <View style={styles.devicesList}>
              {devices.map((device) => (
                <TouchableOpacity
                  key={device.id}
                  style={styles.deviceCard}
                  onPress={() => handleDevicePress(device)} // Navega para detalhes
                  activeOpacity={0.7}
                >
                  <View style={styles.deviceHeader}>
                    <View style={styles.deviceInfo}>
                      <View style={styles.deviceIcon}>
                        <Smartphone size={24} color={colors.water.primary} />
                      </View>
                      <View style={styles.deviceDetails}>
                        <Text style={styles.deviceName}>{device.nome}</Text>
                        <Text style={styles.deviceLocation}>{device.localizacao}</Text>
                      </View>
                    </View>
                    {/* Exibe o status (Online/Offline) */}
                    <View style={styles.statusContainer}>
                      {getStatusIcon(device.status)}
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(device.status) }
                      ]}>
                        {device.status === 'online' ? 'Online' : 'Offline'}
                      </Text>
                    </View>
                  </View>

                  {/* Estatísticas resumidas (Última Atualização e Bateria) */}
                  <View style={styles.deviceStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Última atualização</Text>
                      <Text style={styles.statValue}>{device.estatisticas.tempo_offline || 'Nunca'}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Bateria</Text>
                      <Text style={[
                        styles.statValue,
                        { color: 94 > 20 ? colors.success : colors.danger } // Condicional de cor
                      ]}>
                        94% {/* Valor Fixo (mockado) */}
                      </Text>
                    </View>
                  </View>

                  {/* Barra visual de Bateria */}
                  <View style={styles.batteryBar}>
                    <View 
                      style={[
                        styles.batteryFill,
                        { 
                          width: `94%`,
                          backgroundColor: 94 > 20 ? colors.success : colors.danger
                        }
                      ]} 
                    />
                  </View>

                  {/* Rodapé do cartão com link para detalhes */}
                  <View style={styles.deviceFooter}>
                    <Text style={styles.viewDetailsText}>Ver detalhes</Text>
                    <ChevronRight size={16} color={colors.water.primary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* ==================== Modal para Adicionar Dispositivo ==================== */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Dispositivo</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowAddModal(false)}
              >
                <X size={24} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              Digite o código de verificação do seu dispositivo A-Quality:
            </Text>
            
            {/* Campo de input para o código */}
            <TextInput
              style={styles.codeInput}
              value={codigoDispositivo}
              onChangeText={setCodigoDispositivo}
              placeholder="Ex: ESP-AQUALITY-01"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            
            <View style={styles.modalButtons}>
              {/* Botão Cancelar */}
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              {/* Botão Conectar (com loading e desabilitado durante a conexão) */}
              <TouchableOpacity 
                style={[styles.connectButton, conectandoDispositivo && styles.disabledButton]}
                onPress={conectarDispositivo} // Chama a função de conexão
                disabled={conectandoDispositivo}
              >
                {conectandoDispositivo ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Text style={styles.connectButtonText}>Conectar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Fim do Modal */}
    </View>
  );
};

// ==================== Definição de Estilos ====================
const styles = StyleSheet.create({
  // Estilos detalhados para o layout, cartões de dispositivo, e o modal de adição.
  // Utiliza as constantes de design importadas (colors, typography, spacing, etc.).
  // ... (restante dos estilos)
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 120,
    paddingBottom: 100,
    paddingHorizontal: spacing.md,
  },
  content: {
    maxWidth: width,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.foreground,
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.water.primary,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.mutedForeground,
    marginBottom: spacing.lg,
  },
  devicesList: {
    gap: spacing.md,
  },
  deviceCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    ...shadows.card,
    padding: spacing.md,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    backgroundColor: `${colors.water.primary}10`,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  deviceLocation: {
    fontSize: typography.sizes.sm,
    color: colors.mutedForeground,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginLeft: spacing.xs,
  },
  deviceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.mutedForeground,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.foreground,
  },
  batteryBar: {
    height: 4,
    backgroundColor: colors.muted,
    borderRadius: 2,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
    borderRadius: 2,
  },
  deviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  viewDetailsText: {
    fontSize: typography.sizes.sm,
    color: colors.water.primary,
    fontWeight: typography.weights.medium,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.sizes.md,
    color: colors.mutedForeground,
    marginTop: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyStateText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: typography.sizes.md,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    ...shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.foreground,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalDescription: {
    fontSize: typography.sizes.md,
    color: colors.mutedForeground,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.foreground,
    backgroundColor: colors.background,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    backgroundColor: colors.muted,
  },
  cancelButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.mutedForeground,
  },
  connectButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    backgroundColor: colors.water.primary,
    ...shadows.button,
  },
  connectButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.primaryForeground,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
// ==================== Fim da Definição de Estilos ====================