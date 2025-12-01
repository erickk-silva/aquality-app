// Importações de hooks e bibliotecas essenciais do React e React Native
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl, // Componente nativo para Pull-to-Refresh
  Alert,
} from 'react-native';
// Importação de ícones para representar diferentes tipos de alerta e ações
import { Bell, AlertTriangle, CheckCircle, XCircle, Clock, Settings, Plus } from 'lucide-react-native';
// Componente de cabeçalho customizado
import { MobileHeader } from '../components/MobileHeader';
// Utilitários de estilo e constantes de design
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
// Hooks de contexto
import { useThemeMode } from '../contexts/ThemeContext'; // Hook para obter o modo de tema
import { useAuth } from '../contexts/AuthContext'; // Hook para obter os dados do usuário logado
// Serviços de API para alertas
import { alertService, AlertasResponse } from '../services/alertService';
// Hook customizado para gerenciar notificações (simuladas no Expo Go)
import { useNotifications } from '../services/notificationService';

// Obtém a largura da tela para dimensionamento responsivo
const { width } = Dimensions.get('window');

/**
 * Interface que define a estrutura de dados de um Alerta retornado pela API.
 * Esta interface tipa o array de alertas no estado do componente.
 */
interface Alerta {
  id: number;
  tipo: string;
  nivel: 'info' | 'warning' | 'critical';
  titulo: string;
  mensagem: string;
  valores: {
    atual?: number;
    limite?: number;
  };
  dispositivo: {
    nome: string;
    localizacao: string;
  };
  status: {
    lido: boolean;
    resolvido: boolean;
  };
  datas: {
    criacao: string;
    resolucao?: string;
    tempo_decorrido: string;
  };
}

/**
 * Componente principal para a tela de Notificações/Alertas.
 * Exibe a lista de alertas e permite gerenciar seus status.
 */
export const Notifications: React.FC = () => {
  // Obtém o modo de tema (para memoizar estilos) e dados do usuário
  const { mode } = useThemeMode();
  const { user } = useAuth();
  // Obtém funções e estados do hook de notificações
  const { isInitialized, badgeCount, clearBadge } = useNotifications();
  
  // ==================== Definição de Estados ====================
  // Armazena a lista de alertas a serem exibidos
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  // Indica o estado de carregamento inicial
  const [loading, setLoading] = useState(true);
  // Indica se o pull-to-refresh está ativo
  const [refreshing, setRefreshing] = useState(false);
  // Armazena os contadores de alertas (total, não lidos, não resolvidos)
  const [contadores, setContadores] = useState({
    total: 0,
    nao_lidos: 0,
    nao_resolvidos: 0
  });
  // ==================== Fim da Definição de Estados ====================

  /**
   * Função assíncrona para buscar a lista de alertas e os contadores na API.
   */
  const carregarAlertas = async () => {
    if (!user?.id) return; // Garante que há um usuário logado
    
    try {
      setLoading(true);
      // Chama o serviço de API para listar os alertas
      const response = await alertService.listarAlertas({
        usuario_id: user.id,
        limit: 50 // Limite de alertas a serem buscados
      });
      
      if (response.status === 'sucesso' && response.dados) {
        // Atualiza a lista de alertas e os contadores
        setAlertas(response.dados.alertas);
        setContadores(response.dados.contadores);
      }
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
      Alert.alert('Erro', 'Não foi possível carregar os alertas');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Função de callback para o Pull-to-Refresh.
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await carregarAlertas();
    setRefreshing(false);
  };

  /**
   * Função para marcar um alerta específico como lido.
   */
  const marcarComoLido = async (alertaId: number) => {
    try {
      // Envia requisição para marcar como lido na API
      await alertService.marcarComoLido(alertaId);
      await carregarAlertas(); // Recarrega os dados para atualizar o status e contadores
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
    }
  };

  /**
   * Função para marcar todos os alertas não lidos como lidos.
   */
  const marcarTodosComoLidos = async () => {
    if (!user?.id) return;
    
    try {
      // Envia requisição para marcar todos como lidos na API
      await alertService.marcarTodosComoLidos(user.id);
      await carregarAlertas(); // Recarrega os dados
      await clearBadge(); // Limpa o contador visual de notificações (badge)
    } catch (error) {
      console.error('Erro ao marcar todos como lidos:', error);
    }
  };

  /**
   * Função para simular o recebimento de um novo alerta (usado para testes).
   */
  const simularAlerta = async () => {
    if (!user?.id) return;
    
    try {
      // Chama o serviço para criar um alerta de exemplo (na API ou localmente como fallback)
      await alertService.simularNovoAlerta(user.id);
      await carregarAlertas(); // Recarrega os dados para exibir o novo alerta
    } catch (error) {
      console.error('Erro ao simular alerta:', error);
    }
  };

  /**
   * Hook de efeito que carrega os alertas na montagem do componente.
   */
  useEffect(() => {
    carregarAlertas();
  }, [user?.id]);

  /**
   * Função utilitária para retornar o ícone com base no nível de gravidade do alerta.
   */
  const getNotificationIcon = (nivel: string) => {
    const iconProps = { size: 20 };
    
    switch (nivel) {
      case 'critical':
        return <XCircle {...iconProps} color={colors.danger} />; // Crítico (Vermelho)
      case 'warning':
        return <AlertTriangle {...iconProps} color={colors.warning} />; // Aviso (Amarelo)
      case 'info':
      default:
        return <Bell {...iconProps} color={colors.water.primary} />; // Informativo (Azul)
    }
  };

  /**
   * Função utilitária para retornar estilos visuais (cor de fundo e borda)
   * com base no nível de gravidade do alerta.
   */
  const getNotificationStyle = (nivel: string) => {
    switch (nivel) {
      case 'critical':
        return { backgroundColor: `${colors.danger}10`, borderLeftColor: colors.danger };
      case 'warning':
        return { backgroundColor: `${colors.warning}10`, borderLeftColor: colors.warning };
      case 'info':
      default:
        return { backgroundColor: `${colors.water.primary}10`, borderLeftColor: colors.water.primary };
    }
  };

  // Definição dos estilos da tela (memoizados)
  const styles = React.useMemo(() => StyleSheet.create({
    // Estilos gerais do container e scroll
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: 120, // Espaço para o cabeçalho
      paddingBottom: 100, // Espaço para a navegação inferior
      paddingHorizontal: spacing.md,
    },
    content: {
      maxWidth: width,
      alignSelf: 'center',
    },
    // Estilos do cabeçalho da página (título + ações)
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
    // Estilos para o badge (não utilizado diretamente no JSX atual)
    badge: {
      backgroundColor: colors.danger,
      borderRadius: 12,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      minWidth: 24,
      alignItems: 'center',
    },
    badgeText: {
      color: colors.primaryForeground,
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.bold,
    },
    subtitle: {
      fontSize: typography.sizes.md,
      color: colors.mutedForeground,
      marginBottom: spacing.lg,
    },
    // Estilos da lista de alertas
    notificationsList: {
      gap: spacing.sm,
    },
    notificationCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderLeftWidth: 4, // Borda lateral para indicar nível de alerta
      ...shadows.card,
      position: 'relative',
    },
    // Estilo extra para destacar alertas não lidos
    unreadCard: {
      borderWidth: 1,
      borderColor: colors.water.primary,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    notificationIcon: {
      marginRight: spacing.sm,
      marginTop: 2,
    },
    notificationContent: {
      flex: 1,
    },
    notificationTitle: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
      color: colors.foreground,
      marginBottom: spacing.xs,
      flexWrap: 'wrap',
    },
    unreadTitle: {
      fontWeight: typography.weights.bold,
    },
    notificationMessage: {
      fontSize: typography.sizes.sm,
      color: colors.mutedForeground,
      lineHeight: 20,
      flexWrap: 'wrap',
    },
    // Estilos para o tempo decorrido e nome do dispositivo
    notificationTime: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    timeText: {
      fontSize: typography.sizes.xs,
      color: colors.mutedForeground,
      marginLeft: spacing.xs,
    },
    // Ponto indicador de alerta não lido
    unreadDot: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.water.primary,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    // Estilos para os botões de ação do cabeçalho
    actionButton: {
      backgroundColor: colors.water.primary + '20',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    actionButtonText: {
      fontSize: typography.sizes.sm,
      color: colors.water.primary,
      fontWeight: typography.weights.medium,
    },
    // Estilos do container de estatísticas (contadores)
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
      ...shadows.card,
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
      color: colors.foreground,
    },
    statLabel: {
      fontSize: typography.sizes.sm,
      color: colors.mutedForeground,
      marginTop: spacing.xs,
    },
    // Estilos para estado de carregamento e lista vazia
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    loadingText: {
      fontSize: typography.sizes.md,
      color: colors.mutedForeground,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    emptyTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.semibold,
      color: colors.foreground,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    emptyMessage: {
      fontSize: typography.sizes.md,
      color: colors.mutedForeground,
      textAlign: 'center',
      lineHeight: 24,
    },
    // Estilos para a exibição dos valores do alerta (atual/limite)
    valoresText: {
      fontSize: typography.sizes.sm,
      color: colors.mutedForeground,
      marginTop: spacing.xs,
      fontStyle: 'italic',
    },
    dispositivoText: {
      fontSize: typography.sizes.xs,
      color: colors.mutedForeground,
      marginLeft: spacing.xs,
    },
  }), [mode]);

  // ==================== Estrutura de Renderização (JSX) ====================
  return (
    <View style={styles.container}>
      {/* Cabeçalho Fixo */}
      <MobileHeader userName={user?.name} />
      
      {/* ScrollView principal com Pull-to-Refresh */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl // Componente que implementa o Pull-to-Refresh
            refreshing={refreshing}
            onRefresh={onRefresh} // Chama a função de recarregar
            colors={[colors.water.primary]}
            tintColor={colors.water.primary}
          />
        }
      >
        <View style={styles.content}>
          {/* Cabeçalho da página */}
          <View style={styles.header}>
            <Text style={styles.title}>Alertas</Text>
            <View style={styles.headerActions}>
              {/* Botão para marcar todos como lidos (visível apenas se houver não lidos) */}
              {contadores.nao_lidos > 0 && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={marcarTodosComoLidos}
                >
                  <Text style={styles.actionButtonText}>Marcar todos como lidos</Text>
                </TouchableOpacity>
              )}
              {/* Botão para simular novo alerta (para testes/demonstração) */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={simularAlerta}
              >
                <Plus size={16} color={colors.water.primary} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Cartão de Estatísticas (Contadores) */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{contadores.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.warning }]}>{contadores.nao_lidos}</Text>
              <Text style={styles.statLabel}>Não lidos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.danger }]}>{contadores.nao_resolvidos}</Text>
              <Text style={styles.statLabel}>Não resolvidos</Text>
            </View>
          </View>

          {/* Renderização Condicional da Lista */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Carregando alertas...</Text>
            </View>
          ) : alertas.length === 0 ? (
            // Estado de lista vazia
            <View style={styles.emptyContainer}>
              <Bell size={48} color={colors.mutedForeground} />
              <Text style={styles.emptyTitle}>Nenhum alerta</Text>
              <Text style={styles.emptyMessage}>
                Você não possui alertas no momento. Configure regras de alerta para receber notificações.
              </Text>
            </View>
          ) : (
            // Lista de Alertas Mapeados
            <View style={styles.notificationsList}>
              {alertas.map((alerta) => (
                <TouchableOpacity
                  key={alerta.id}
                  onPress={() => marcarComoLido(alerta.id)} // Marca como lido ao ser tocado
                  style={[
                    styles.notificationCard,
                    getNotificationStyle(alerta.nivel), // Estilo de cor baseado no nível
                    !alerta.status.lido && styles.unreadCard, // Estilo para não lidos
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.notificationHeader}>
                    <View style={styles.notificationIcon}>
                      {getNotificationIcon(alerta.nivel)} {/* Ícone do alerta */}
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={[
                        styles.notificationTitle,
                        !alerta.status.lido && styles.unreadTitle // Título em negrito se não lido
                      ]}>
                        {alerta.titulo}
                      </Text>
                      <Text style={styles.notificationMessage}>
                        {alerta.mensagem}
                      </Text>
                      {/* Exibe valores atual e limite se existirem */}
                      {alerta.valores.atual && (
                        <Text style={styles.valoresText}>
                          Valor atual: {alerta.valores.atual} | Limite: {alerta.valores.limite}
                        </Text>
                      )}
                      <View style={styles.notificationTime}>
                        <Clock size={12} color={colors.mutedForeground} />
                        <Text style={styles.timeText}>{alerta.datas.tempo_decorrido}</Text>
                        <Text style={styles.dispositivoText}>• {alerta.dispositivo.nome}</Text>
                      </View>
                    </View>
                  </View>
                  {/* Ponto indicador visual de não lido */}
                  {!alerta.status.lido && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};