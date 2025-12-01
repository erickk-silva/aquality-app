// Importações de bibliotecas e hooks do React e React Native
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  RefreshControl, // Componente para Pull-to-Refresh
  Animated,
} from 'react-native';
// Importação de ícones para navegação, status e tendências
import { ArrowLeft, Activity, Clock, TrendingUp, TrendingDown } from 'lucide-react-native';
// Hooks para acesso à navegação e parâmetros de rota
import { useNavigation, useRoute } from '@react-navigation/native';
// Componente de cabeçalho fixo
import { MobileHeader } from '../components/MobileHeader';
// Utilitários de estilo
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
// Hook para obter o estado de autenticação e dados do usuário
import { useAuth } from '../contexts/AuthContext';
// Serviço de API para operações de dispositivos (como buscar leituras)
import { deviceService } from '../services/deviceService';

// Obtém a largura da janela
const { width } = Dimensions.get('window');

/**
 * Interface de dados MOCK para referência, mostrando a estrutura esperada (não usada na lógica real de fetch).
 */
interface SensorData {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline';
  battery: number;
  lastUpdate: string;
  currentData: {
    ph: number;
    turbidity: number;
    conductivity: number;
    temperature: number;
  };
  history: {
    id: string;
    timestamp: string;
    ph: number;
    turbidity: number;
    conductivity: number;
    temperature: number;
  }[];
}

// Dados MOCK de exemplo (atualmente não utilizados na busca real da API, mas mantidos para referência de estrutura)
const mockSensorData: SensorData = {
  id: '1',
  name: 'Aquality01',
  location: 'Casa Principal',
  status: 'online',
  battery: 85,
  lastUpdate: '2 min atrás',
  currentData: {
    ph: 6.8,
    turbidity: 8,
    conductivity: 2.21,
    temperature: 20,
  },
  history: [
    {
      id: '1',
      timestamp: '15:47 - Hoje',
      ph: 6.8,
      turbidity: 8,
      conductivity: 2.21,
      temperature: 20,
    },
    // ... (restante do histórico mockado)
  ],
};

/**
 * Componente principal para a tela de Detalhes do Sensor.
 * Exibe dados em tempo real e um histórico de leituras.
 */
export const SensorDetails: React.FC = () => {
  // Inicialização de hooks
  const navigation = useNavigation(); // Objeto de navegação
  const route = useRoute(); // Objeto de rota (para acessar parâmetros)
  const { user } = useAuth(); // Dados do usuário logado
  
  // ==================== Estados Locais ====================
  // Indica se a tela está carregando dados da API
  const [loading, setLoading] = useState(true);
  // Indica se o pull-to-refresh está ativo
  const [refreshing, setRefreshing] = useState(false);
  // Armazena os dados do dispositivo (metadados)
  const [deviceData, setDeviceData] = useState<any>(null);
  // Armazena a lista de leituras de sensores (histórico)
  const [leituras, setLeituras] = useState<any[]>([]);
  // Armazena a mensagem de erro, se houver
  const [error, setError] = useState<string | null>(null);
  // Variável animada para o indicador de pull-to-refresh
  const pullProgress = useState(new Animated.Value(0))[0];
  // ==================== Fim dos Estados Locais ====================
  
  // Obtém o objeto 'device' passado como parâmetro na navegação
  const device = (route.params as any)?.device;

  /**
   * Hook de efeito que inicia o carregamento dos dados quando o componente é montado
   * ou quando o ID do dispositivo muda.
   */
  useEffect(() => {
    if (device?.id) {
      carregarDadosDispositivo();
    } else {
      // Caso o dispositivo não seja encontrado nos parâmetros
      setError('Dispositivo não encontrado');
      setLoading(false);
    }
  }, [device?.id]);

  /**
   * Função assíncrona para buscar as leituras do dispositivo na API.
   */
  const carregarDadosDispositivo = async () => {
    if (!device?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Carregando dados do dispositivo:', device.id);
      // Busca as últimas 10 leituras do dispositivo
      const response = await deviceService.buscarLeituras(device.id, 10);
      
      if (response.status === 'sucesso' && response.dados) {
        setDeviceData(response.dados.dispositivo);
        setLeituras(response.dados.leituras || []); // Armazena o histórico de leituras
        console.log('✅ Dados carregados:', response.dados);
      } else {
        throw new Error(response.mensagem || 'Erro ao carregar dados');
      }
    } catch (err) {
      console.error('❌ Erro ao carregar dispositivo:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Função de callback para o Pull-to-Refresh.
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await carregarDadosDispositivo(); // Recarrega os dados
    setRefreshing(false);
  };

  // ==================== Processamento de Dados para Exibição ====================

  // Usa dados reais se existirem, senão usa os metadados passados na rota
  const displayData = deviceData || {
    nome: device?.nome || 'Dispositivo',
    localizacao: device?.localizacao || 'Localização não informada'
  };
  
  // A leitura mais recente é o primeiro item do array
  const currentReading = leituras.length > 0 ? leituras[0] : null;
  // A leitura anterior é o segundo item (usada para calcular tendências)
  const previousReading = leituras.length > 1 ? leituras[1] : null;
  
  // Objeto simplificado dos dados atuais para o grid de exibição
  const currentData = currentReading ? {
    ph: currentReading.ph,
    turbidity: currentReading.turbidez,
    conductivity: currentReading.condutividade,
    temperature: currentReading.temperatura
  } : {
    ph: null,
    turbidity: null,
    conductivity: null,
    temperature: null
  };
  
  // ==================== Renderização Condicional (Loading/Error) ====================
  
  // 1. Tela de Carregamento
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <MobileHeader userName={user?.name} />
        <ActivityIndicator size="large" color={colors.water.primary} />
        <Text style={styles.loadingText}>Carregando dados do sensor...</Text>
      </View>
    );
  }
  
  // 2. Tela de Erro
  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <MobileHeader userName={user?.name} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={carregarDadosDispositivo}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ==================== Funções Utilitárias ====================

  /**
   * Retorna o ícone de tendência (subindo/descendo) comparando a leitura atual com a anterior.
   */
  const getTrendIcon = (current: number, previous: number) => {
    // Retorna ícone de subida se o valor atual for maior que o anterior
    return current > previous ? (
      <TrendingUp size={16} color={colors.success} />
    ) : (
      // Senão, retorna ícone de descida
      <TrendingDown size={16} color={colors.danger} />
    );
  };

  /**
   * Retorna a cor de tendência (verde/vermelho).
   */
  const getTrendColor = (current: number, previous: number) => {
    return current > previous ? colors.success : colors.danger;
  };

  /**
   * Formata o valor do sensor, adicionando a unidade ou "NULL" se não houver valor.
   */
  const formatValue = (value: number | null, unit: string) => {
    return value !== null ? `${value}${unit}` : 'NULL';
  };

  /**
   * Determina o status de qualidade da água (Normal, Atenção, Crítico) com base em faixas fixas.
   */
  const getParameterStatus = (value: number | null, parameter: string) => {
    if (value === null) return { status: 'unknown', text: 'NULL' };
    
    switch (parameter) {
      case 'ph':
        if (value < 6.5 || value > 8.5) return { status: 'danger', text: 'Crítico' }; // Faixa Crítica
        if (value < 7.0 || value > 8.0) return { status: 'warning', text: 'Atenção' }; // Faixa de Aviso
        return { status: 'normal', text: 'Normal' }; // Faixa Normal
      case 'turbidity':
        if (value > 50) return { status: 'danger', text: 'Crítico' };
        if (value > 25) return { status: 'warning', text: 'Atenção' };
        return { status: 'normal', text: 'Normal' };
      case 'conductivity':
        if (value > 2.5) return { status: 'danger', text: 'Crítico' };
        if (value > 2.0) return { status: 'warning', text: 'Atenção' };
        return { status: 'normal', text: 'Normal' };
      case 'temperature':
        if (value < 15 || value > 30) return { status: 'danger', text: 'Crítico' };
        if (value < 18 || value > 25) return { status: 'warning', text: 'Atenção' };
        return { status: 'normal', text: 'Normal' };
      default:
        return { status: 'normal', text: 'Normal' };
    }
  };

  // ==================== Renderização Principal ====================

  return (
    <View style={styles.container}>
      <MobileHeader userName={user?.name} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} // Dispara o recarregamento
            colors={[colors.water.primary]}
            tintColor={colors.water.primary}
            title="Atualizando dados do sensor..."
            titleColor={colors.mutedForeground}
          />
        }
      >
        <View style={styles.content}>
          {/* Cabeçalho da Seção de Detalhes */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()} // Botão Voltar
            >
              <ArrowLeft size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={styles.title}>Detalhes do Sensor</Text>
          </View>

          {/* Cartão de Informações do Sensor */}
          <View style={styles.sensorInfo}>
            <View style={styles.sensorHeader}>
              <View style={styles.sensorIcon}>
                <Activity size={32} color={colors.water.primary} />
              </View>
              <View style={styles.sensorDetails}>
                <Text style={styles.sensorName}>{displayData.nome}</Text>
                <Text style={styles.sensorLocation}>{displayData.localizacao}</Text>
                {/* Indicador de Status (Online/Offline) */}
                <View style={styles.statusContainer}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: leituras.length > 0 ? colors.success : colors.mutedForeground }
                  ]} />
                  <Text style={[
                    styles.statusText,
                    { color: leituras.length > 0 ? colors.success : colors.mutedForeground }
                  ]}>
                    {leituras.length > 0 ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Estatísticas Chave */}
            <View style={styles.sensorStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total de Leituras</Text>
                <Text style={styles.statValue}>{leituras.length}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Última atualização</Text>
                <Text style={styles.statValue}>
                  {currentReading ? new Date(currentReading.data_hora).toLocaleString('pt-BR') : 'Nunca'}
                </Text>
              </View>
            </View>
          </View>

          {/* Seção de Dados Atuais */}
          <View style={styles.currentDataSection}>
            <Text style={styles.sectionTitle}>Dados Atuais</Text>
            {/* Grid com os 4 Parâmetros */}
            <View style={styles.currentDataGrid}>
              {/* Card de PH */}
              <View style={styles.dataCard}>
                <Text style={styles.dataLabel}>PH</Text>
                <Text style={styles.dataValue}>{formatValue(currentData.ph, '')}</Text>
                {/* Exibe o status de qualidade (Crítico, Atenção, Normal) */}
                <Text style={[
                  styles.dataStatus,
                  { color: getParameterStatus(currentData.ph, 'ph').status === 'danger' ? colors.danger : 
                           getParameterStatus(currentData.ph, 'ph').status === 'warning' ? colors.warning : colors.success }
                ]}>
                  {getParameterStatus(currentData.ph, 'ph').text}
                </Text>
              </View>
              {/* Outros Cards de Dados (Turbidez, Condutividade, Temperatura) */}
              <View style={styles.dataCard}>
                <Text style={styles.dataLabel}>Turbidez</Text>
                <Text style={styles.dataValue}>{formatValue(currentData.turbidity, '%')}</Text>
                <Text style={[
                  styles.dataStatus,
                  { color: getParameterStatus(currentData.turbidity, 'turbidity').status === 'danger' ? colors.danger : 
                           getParameterStatus(currentData.turbidity, 'turbidity').status === 'warning' ? colors.warning : colors.success }
                ]}>
                  {getParameterStatus(currentData.turbidity, 'turbidity').text}
                </Text>
              </View>
              <View style={styles.dataCard}>
                <Text style={styles.dataLabel}>Condutividade</Text>
                <Text style={styles.dataValue}>{formatValue(currentData.conductivity, '')}</Text>
                <Text style={[
                  styles.dataStatus,
                  { color: getParameterStatus(currentData.conductivity, 'conductivity').status === 'danger' ? colors.danger : 
                           getParameterStatus(currentData.conductivity, 'conductivity').status === 'warning' ? colors.warning : colors.success }
                ]}>
                  {getParameterStatus(currentData.conductivity, 'conductivity').text}
                </Text>
              </View>
              <View style={styles.dataCard}>
                <Text style={styles.dataLabel}>Temperatura</Text>
                <Text style={styles.dataValue}>{formatValue(currentData.temperature, '°C')}</Text>
                <Text style={[
                  styles.dataStatus,
                  { color: getParameterStatus(currentData.temperature, 'temperature').status === 'danger' ? colors.danger : 
                           getParameterStatus(currentData.temperature, 'temperature').status === 'warning' ? colors.warning : colors.success }
                ]}>
                  {getParameterStatus(currentData.temperature, 'temperature').text}
                </Text>
              </View>
            </View>
          </View>

          {/* Seção de Histórico de Leituras */}
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Histórico de Dados</Text>
            <View style={styles.historyList}>
              {leituras.length > 0 ? leituras.map((record, index) => (
                // Mapeia e exibe cada registro de leitura
                <View key={record.id || index} style={styles.historyItem}>
                  <View style={styles.historyHeader}>
                    {/* Horário da leitura */}
                    <View style={styles.timeContainer}>
                      <Clock size={14} color={colors.mutedForeground} />
                      <Text style={styles.timeText}>
                        {new Date(record.data_hora).toLocaleString('pt-BR')}
                      </Text>
                    </View>
                    {/* Indicador de Tendência (visível a partir do segundo registro) */}
                    {index > 0 && (
                      <View style={styles.trendContainer}>
                        {getTrendIcon(record.ph, leituras[index - 1].ph)}
                        <Text style={[
                          styles.trendText,
                          { color: getTrendColor(record.ph, leituras[index - 1].ph) }
                        ]}>
                          PH
                        </Text>
                      </View>
                    )}
                  </View>
                  {/* Detalhes de todos os parâmetros para aquele registro */}
                  <View style={styles.historyData}>
                    <View style={styles.historyDataItem}>
                      <Text style={styles.historyLabel}>PH</Text>
                      <Text style={styles.historyValue}>{record.ph !== null ? record.ph : 'NULL'}</Text>
                    </View>
                    <View style={styles.historyDataItem}>
                      <Text style={styles.historyLabel}>Turbidez</Text>
                      <Text style={styles.historyValue}>{record.turbidez !== null ? `${record.turbidez}%` : 'NULL'}</Text>
                    </View>
                    <View style={styles.historyDataItem}>
                      <Text style={styles.historyLabel}>Condutividade</Text>
                      <Text style={styles.historyValue}>{record.condutividade !== null ? record.condutividade : 'NULL'}</Text>
                    </View>
                    <View style={styles.historyDataItem}>
                      <Text style={styles.historyLabel}>Temperatura</Text>
                      <Text style={styles.historyValue}>{record.temperatura !== null ? `${record.temperatura}°C` : 'NULL'}</Text>
                    </View>
                  </View>
                </View>
              )) : (
                // Estado de histórico vazio
                <View style={styles.emptyHistory}>
                  <Text style={styles.emptyHistoryText}>Nenhuma leitura encontrada</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Estilos do componente SensorDetails (mantidos no final para não interromper a lógica)
const styles = StyleSheet.create({
  // ... (definição de todos os estilos)
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
    marginBottom: spacing.lg,
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.foreground,
  },
  sensorInfo: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    ...shadows.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sensorIcon: {
    width: 60,
    height: 60,
    backgroundColor: `${colors.water.primary}10`,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  sensorDetails: {
    flex: 1,
  },
  sensorName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  sensorLocation: {
    fontSize: typography.sizes.md,
    color: colors.mutedForeground,
    marginBottom: spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  sensorStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    color: colors.mutedForeground,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.foreground,
  },
  currentDataSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  currentDataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dataCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: '48%',
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  dataLabel: {
    fontSize: typography.sizes.sm,
    color: colors.mutedForeground,
    marginBottom: spacing.xs,
  },
  dataValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  dataStatus: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  historySection: {
    marginBottom: spacing.lg,
  },
  historyList: {
    gap: spacing.sm,
  },
  historyItem: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: typography.sizes.sm,
    color: colors.mutedForeground,
    marginLeft: spacing.xs,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    marginLeft: spacing.xs,
  },
  historyData: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  historyDataItem: {
    width: '48%',
    marginBottom: spacing.xs,
  },
  historyLabel: {
    fontSize: typography.sizes.xs,
    color: colors.mutedForeground,
    marginBottom: spacing.xs,
  },
  historyValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.foreground,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.sizes.md,
    color: colors.mutedForeground,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  errorText: {
    fontSize: typography.sizes.md,
    color: colors.danger,
    textAlign: 'center',
    marginHorizontal: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.water.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  retryButtonText: {
    color: colors.primaryForeground,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  emptyHistory: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: typography.sizes.md,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
});