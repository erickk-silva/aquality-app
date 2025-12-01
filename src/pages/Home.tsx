// Importações de hooks e bibliotecas essenciais do React e React Native
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
// Hook para navegação entre telas
import { useNavigation } from '@react-navigation/native';
// Componentes customizados
import { MobileHeader } from '../components/MobileHeader'; // Cabeçalho da aplicação
import { AnalysisCard } from '../components/AnalysisCard'; // Cartão de resumo da última análise
import { LocationCard } from '../components/LocationCard'; // Cartão de dispositivos conectados
import { QuickActionsGrid } from '../components/QuickActionsGrid'; // Grid de atalhos rápidos
import { DeviceSwitchCard } from '../components/DeviceSwitchCard'; // Cartão para troca de dispositivo
import { PullToRefreshIndicator } from '../components/PullToRefreshIndicator'; // Indicador visual de refresh
// Hook customizado para exibir notificações/toasts
import { useToast } from '../hooks/useToast';
// Utilitários de estilo
import { colors, typography, spacing } from '../utils/colors';
// Hooks de contexto
import { useThemeMode } from '../contexts/ThemeContext'; // Contexto de tema (embora use apenas o `mode` para estilos)
import { useAuth } from '../contexts/AuthContext'; // Contexto de autenticação (dados do usuário)
// Serviços de API
import { deviceService } from '../services/deviceService'; // Serviço para interagir com a API de dispositivos
// Tipos de dados (Dispositivo, AnalysisItem)
import { Dispositivo, AnalysisItem } from '../types';
import { handleApiError } from '../services/api'; // Função para tratamento de erros da API

// Obtém a largura da janela para cálculos de layout
const { width } = Dimensions.get('window');

/**
 * Componente principal da tela Home (Dashboard).
 */
export const Home: React.FC = () => {
  // Inicialização de hooks
  const navigation = useNavigation();
  const { mode } = useThemeMode(); // Modo de tema (para memoizar estilos, embora seja 'light' fixo)
  const { toast } = useToast(); // Função para exibir toasts
  const { user } = useAuth(); // Dados do usuário logado
  
  // ==================== Estados Locais ====================
  // Armazena a lista de dispositivos com suas últimas leituras
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  // Indica o estado de carregamento inicial (primeiro acesso à tela)
  const [isLoading, setIsLoading] = useState(true);
  // Indica o estado de atualização (pull-to-refresh)
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Sinaliza se ocorreu um erro crítico no carregamento dos dados
  const [hasError, setHasError] = useState(false);
  // Armazena a mensagem de erro a ser exibida
  const [errorMessage, setErrorMessage] = useState('');
  // Variável animada para o indicador de pull-to-refresh (embora o RefreshControl nativo seja usado)
  const pullProgress = useState(new Animated.Value(0))[0];
  // ==================== Fim dos Estados Locais ====================

  /**
   * Hook de efeito que dispara o carregamento dos dados quando o componente é montado
   * ou quando o objeto 'user' é alterado (garantindo que o usuário está logado).
   */
  useEffect(() => {
    if (user) {
      carregarDados();
    }
  }, [user]);

  /**
   * Função assíncrona responsável por buscar e processar todos os dados do dashboard.
   */
  const carregarDados = async () => {
    // Se não há usuário, finaliza o carregamento
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('🏠 Carregando dados do dashboard para usuário:', user.id);
      setHasError(false); // Reseta o estado de erro
      setErrorMessage('');
      
      // 1. Chama o serviço para buscar dispositivos com as últimas leituras
      const response = await deviceService.buscarDispositivosComLeituras(user.id);
      console.log('🏠 Resposta da API:', response);
      
      if (response.status === 'sucesso' && Array.isArray(response.dados)) {
        console.log('🏠 Processando', response.dados.length, 'dispositivos');
        
        // 2. Mapeia e processa os dados da API para o formato de estado local (Dispositivo[])
        const dispositivosProcessados: Dispositivo[] = response.dados.map((dispositivo: any, index: number) => {
          try {
            console.log(`🏠 Processando dispositivo ${index + 1}:`, dispositivo);
            
            const statusCalculado = dispositivo?.status || 'offline';
            
            // Cria um objeto Dispositivo seguro com valores padrão
            const dispositivoSeguro: Dispositivo = {
              id: dispositivo?.id || index + 1,
              nome: dispositivo?.nome || `Dispositivo ${index + 1}`,
              codigo_dispositivo: dispositivo?.codigo_verificacao || '',
              localizacao: dispositivo?.localizacao || 'Localização não informada',
              descricao: '',
              coordenadas: {
                latitude: 0,
                longitude: 0
              },
              status: statusCalculado,
              nivel_bateria: 94, // Valor fixo ilustrativo (mockado na API PHP e aqui)
              versao_firmware: '1.0',
              leitura_atual: undefined,
              estatisticas: {
                total_leituras: dispositivo?.estatisticas?.total_leituras || 0,
                ultima_leitura: dispositivo?.estatisticas?.ultima_leitura,
                tempo_offline: '0 min'
              },
              datas: {
                criacao: dispositivo?.datas?.criacao || new Date().toISOString(),
                atualizacao: dispositivo?.datas?.atualizacao || new Date().toISOString(),
                ultima_comunicacao: dispositivo?.estatisticas?.ultima_leitura
              }
            };
            
            // Se houver dados de leitura na resposta, processa-os
            if (dispositivo?.leitura_atual) {
              const leitura = dispositivo.leitura_atual;
              
              // Função auxiliar para converter e validar valores de leitura
              const processarValor = (valor: any) => {
                if (valor === null || valor === undefined || valor === '') return null;
                const num = Number(valor);
                return isNaN(num) ? null : num;
              };
              
              // Mapeia os parâmetros de leitura (pH, turbidez, etc.)
              dispositivoSeguro.leitura_atual = {
                ph: {
                  valor: processarValor(leitura.ph?.valor),
                  status: leitura.ph?.status || 'unknown',
                  unidade: leitura.ph?.unidade || ''
                },
                turbidez: {
                  valor: processarValor(leitura.turbidez?.valor),
                  status: leitura.turbidez?.status || 'unknown',
                  unidade: leitura.turbidez?.unidade || '%'
                },
                condutividade: {
                  valor: processarValor(leitura.condutividade?.valor),
                  status: leitura.condutividade?.status || 'unknown',
                  unidade: leitura.condutividade?.unidade || ''
                },
                temperatura: {
                  valor: processarValor(leitura.temperatura?.valor),
                  status: leitura.temperatura?.status || 'unknown',
                  unidade: leitura.temperatura?.unidade || '°C'
                },
                timestamp: leitura.timestamp || new Date().toISOString(),
                qualidade_sinal: 100
              };
            }
            
            return dispositivoSeguro;
          } catch (deviceError) {
            console.error(`❌ Erro ao processar dispositivo ${index}:`, deviceError);
            // Retorna um objeto de dispositivo de fallback em caso de erro no mapeamento
            return {
              id: index + 1,
              nome: `Dispositivo ${index + 1} (Erro)`,
              // ... (outros campos de fallback)
              status: 'offline' as const,
              nivel_bateria: 0,
              estatisticas: { total_leituras: 0, ultima_leitura: undefined, tempo_offline: 'Erro' },
              datas: { criacao: new Date().toISOString(), atualizacao: new Date().toISOString() }
            };
          }
        });
        
        setDispositivos(dispositivosProcessados); // Atualiza o estado principal
      } else {
        console.warn('⚠️ Nenhum dispositivo encontrado ou resposta inválida');
        setDispositivos([]);
      }
    } catch (error) {
      // Captura erros críticos (ex: falha de rede)
      console.error('❌ Erro crítico ao carregar dados:', error);
      setHasError(true);
      setErrorMessage('Erro ao carregar dados. Tente novamente.');
      setDispositivos([]);
    } finally {
      setIsLoading(false); // Finaliza o loading inicial
    }
  };

  /**
   * Função de callback para o Pull-to-Refresh.
   */
  const onRefresh = async () => {
    setIsRefreshing(true);
    await carregarDados(); // Recarrega os dados
    setIsRefreshing(false);
  };

  // ==================== Funções de Formatação de Dados ====================

  /**
   * Prepara os dados da última leitura para exibição no AnalysisCard.
   */
  const getAnalysisData = (): AnalysisItem[] => {
    try {
      // Prioriza o primeiro dispositivo que está online, senão pega o primeiro da lista
      const dispositivoPrincipal = dispositivos.find(d => d.status === 'online') || dispositivos[0];
      
      // Retorna dados de "Sem dados" se não houver leituras válidas
      if (!dispositivoPrincipal?.leitura_atual) {
        return [
          { label: "PH", value: "--", change: "Sem dados", trend: "up" as const, status: "normal" as const },
          { label: "Turbidez", value: "-- NTU", change: "Sem dados", trend: "up" as const, status: "normal" as const },
          { label: "Condutividade", value: "--", change: "Sem dados", trend: "up" as const, status: "normal" as const },
          { label: "Temperatura", value: "--°C", change: "Sem dados", trend: "up" as const, status: "normal" as const },
        ];
      }

      const leitura = dispositivoPrincipal.leitura_atual;
      
      // Mapeia cada parâmetro para o formato AnalysisItem
      return [
        {
          label: "PH",
          value: (leitura.ph?.valor != null) ? leitura.ph.valor.toFixed(1) : "--",
          change: getChangeText(leitura.ph?.status || 'normal'),
          trend: (leitura.ph?.status === 'danger') ? "down" as const : "up" as const, // Exemplo de lógica de tendência
          status: (leitura.ph?.status as 'normal' | 'warning' | 'danger') || 'normal',
        },
        {
          label: "Turbidez",
          value: (leitura.turbidez?.valor != null) ? `${leitura.turbidez.valor} ${leitura.turbidez.unidade || 'NTU'}` : "-- NTU",
          change: getChangeText(leitura.turbidez?.status || 'normal'),
          trend: (leitura.turbidez?.status === 'danger') ? "up" as const : "down" as const,
          status: (leitura.turbidez?.status as 'normal' | 'warning' | 'danger') || 'normal',
        },
        {
          label: "Condutividade",
          value: (leitura.condutividade?.valor != null) ? leitura.condutividade.valor.toFixed(2) : "--",
          change: getChangeText(leitura.condutividade?.status || 'normal'),
          trend: (leitura.condutividade?.status === 'danger') ? "up" as const : "down" as const,
          status: (leitura.condutividade?.status as 'normal' | 'warning' | 'danger') || 'normal',
        },
        {
          label: "Temperatura",
          value: (leitura.temperatura?.valor != null) ? `${leitura.temperatura.valor}${leitura.temperatura.unidade || '°C'}` : "--°C",
          change: getChangeText(leitura.temperatura?.status || 'normal'),
          trend: (leitura.temperatura?.status === 'danger') ? "up" as const : "down" as const,
          status: (leitura.temperatura?.status as 'normal' | 'warning' | 'danger') || 'normal',
        },
      ];
    } catch (error) {
      console.error('❌ Erro ao obter dados de análise:', error);
      // Retorna fallback em caso de erro na formatação
      return [
        { label: "PH", value: "--", change: "Erro", trend: "up" as const, status: "normal" as const },
        { label: "Turbidez", value: "--", change: "Erro", trend: "up" as const, status: "normal" as const },
        { label: "Condutividade", value: "--", change: "Erro", trend: "up" as const, status: "normal" as const },
        { label: "Temperatura", value: "--°C", change: "Erro", trend: "up" as const, status: "normal" as const },
      ];
    }
  };

  /**
   * Converte o status do parâmetro em um texto de mudança amigável.
   */
  const getChangeText = (status: string): string => {
    try {
      switch (status) {
        case 'danger': return 'Crítico!';
        case 'warning': return 'Atenção';
        case 'normal': return 'Normal';
        case 'unknown': return 'Sem leitura';
        default: return 'Sem dados';
      }
    } catch (error) {
      console.error('❌ Erro ao obter texto de mudança:', error);
      return 'Erro';
    }
  };

  /**
   * Prepara os dados de localização para o LocationCard.
   */
  const getDevicesData = () => {
    try {
      return dispositivos.map(dispositivo => ({
        name: dispositivo.nome || 'Dispositivo',
        active: dispositivo.status === 'online' // Mapeia status para ativo/inativo
      }));
    } catch (error) {
      console.error('❌ Erro ao obter dados dos dispositivos:', error);
      return [];
    }
  };

  /**
   * Calcula e retorna o texto da última atualização em formato relativo (ex: "há 5 minutos").
   */
  const getLastUpdateText = (): string => {
    try {
      const dispositivoPrincipal = dispositivos.find(d => d.status === 'online') || dispositivos[0];
      
      // Retorna 'Nunca atualizado' se não houver timestamp
      if (!dispositivoPrincipal?.leitura_atual?.timestamp) {
        return 'Nunca atualizado';
      }

      const timestamp = new Date(dispositivoPrincipal.leitura_atual.timestamp);
      const agora = new Date();
      const diferencaMs = agora.getTime() - timestamp.getTime();
      const diferencaMin = Math.floor(diferencaMs / (1000 * 60));
      
      // Lógica de formatação de tempo relativo
      if (diferencaMin < 1) {
        return 'Atualizado agora';
      } else if (diferencaMin < 60) {
        return `Atualizado há ${diferencaMin} minutos`;
      } else if (diferencaMin < 1440) { // menos de 24h
        const horas = Math.floor(diferencaMin / 60);
        return `Atualizado há ${horas} horas`;
      } else {
        const dias = Math.floor(diferencaMin / 1440);
        return `Atualizado há ${dias} dias`;
      }
    } catch (error) {
      console.error('❌ Erro ao obter texto de última atualização:', error);
      return 'Erro ao obter horário';
    }
  };

  // ==================== Funções de Ação ====================

  /**
   * Função chamada ao pressionar o cartão de troca de dispositivo (apenas navega para a lista de dispositivos).
   */
  const handleDeviceSwitch = () => {
    try {
      toast({
        title: "Dispositivos",
        description: "Abrindo seleção de dispositivos...",
      });
      navigation.navigate('Devices' as never); // Navega para a tela de dispositivos
    } catch (error) {
      console.error('❌ Erro ao navegar para dispositivos:', error);
    }
  };

  /**
   * Função chamada ao pressionar uma ação na QuickActionsGrid (atalhos rápidos).
   */
  const handleActionPress = (action: string) => {
    try {
      // Navegação para a rota especificada (Devices, Notifications, etc.)
      navigation.navigate(action as never);
    } catch (error) {
      console.error('❌ Erro ao navegar para ação:', action, error);
    }
  };

  // ==================== Definição de Estilos (memoizados) ====================
  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: 120, // Espaço para o cabeçalho fixo
      paddingBottom: 100, // Espaço para a navegação inferior (se houver)
      paddingHorizontal: spacing.md,
    },
    content: {
      maxWidth: width,
      alignSelf: 'center',
    },
    title: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.semibold,
      color: colors.foreground,
      marginBottom: spacing.md,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1,
    },
    loadingText: {
      fontSize: typography.sizes.md,
      color: colors.mutedForeground,
      textAlign: 'center',
    },
    errorContainer: {
      padding: spacing.lg,
      margin: spacing.md,
      backgroundColor: colors.destructive,
      borderRadius: 8,
    },
    errorText: {
      color: colors.destructiveForeground,
      textAlign: 'center',
      fontSize: typography.sizes.md,
    },
  }), [mode]);
  // ==================== Fim da Definição de Estilos ====================

  // ==================== Renderização Condicional ====================
  
  // 1. Tela de Carregamento Inicial
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Carregando dados do dashboard...</Text>
      </View>
    );
  }

  // 2. Tela de Erro Crítico
  if (hasError) {
    return (
      <View style={styles.container}>
        <MobileHeader userName={user?.name || 'Usuário'} />
        <View style={styles.centered}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {errorMessage || 'Ocorreu um erro inesperado'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // 3. Renderização Principal (Dashboard)
  try {
    return (
      <View style={styles.container}>
        {/* Cabeçalho fixo */}
        <MobileHeader userName={user?.name || 'Usuário'} />
        
        {/* Conteúdo principal com rolagem e Pull-to-Refresh */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={onRefresh} // Dispara a recarga de dados
              colors={[colors.water.primary]}
              tintColor={colors.water.primary}
              title="Atualizando dados..."
              titleColor={colors.mutedForeground}
            />
          }
        >
          <View style={styles.content}>
            {/* Título da seção */}
            <Text style={styles.title}>Sistema de Monitoramento da Água</Text>
            
            {/* Cartão de Análise (exibe os 4 parâmetros da última leitura) */}
            <AnalysisCard 
              lastUpdate={getLastUpdateText()} // Tempo relativo da última atualização
              data={getAnalysisData()} // Dados processados dos parâmetros
            />
            
            {/* Cartão de Localização (exibe dispositivos conectados) */}
            <LocationCard devices={getDevicesData()} />
            
            {/* Grid de Ações Rápidas (atalhos para outras telas) */}
            <QuickActionsGrid onActionPress={handleActionPress} />
            
            {/* Cartão para trocar/gerenciar dispositivos */}
            <DeviceSwitchCard onSwitch={handleDeviceSwitch} />
          </View>
        </ScrollView>
      </View>
    );
  } catch (renderError) {
    // 4. Captura erros durante a renderização (fallback de segurança)
    console.error('❌ Erro crítico na renderização:', renderError);
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Erro de renderização. Reinicie o aplicativo.
          </Text>
        </View>
      </View>
    );
  }
};