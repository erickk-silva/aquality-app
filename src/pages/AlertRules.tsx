// Importações de bibliotecas e hooks do React e React Native
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
// Importação de ícones da biblioteca lucide-react-native
import { 
  ArrowLeft, 
  Plus, 
  Settings, 
  AlertTriangle, 
  Thermometer, 
  Droplets, 
  Zap,
  Trash2,
  Edit
} from 'lucide-react-native';
// Importação de componentes e utilitários locais
import { MobileHeader } from '../components/MobileHeader';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors'; // Utilitários de estilo
import { useThemeMode } from '../contexts/ThemeContext'; // Hook para contexto de tema
import { useAuth } from '../contexts/AuthContext'; // Hook para contexto de autenticação (usuário logado)
// Serviços de API para gerenciar regras e dispositivos
import { regraAlertaService, RegraAlerta, Parametro, Condicao } from '../services/regraAlertaService';
import { deviceService } from '../services/deviceService';

// Obtém a largura da tela para dimensionamento do modal
const { width } = Dimensions.get('window');

/**
 * Componente principal para a tela de Regras de Alerta.
 * Permite ao usuário visualizar, criar, editar e remover regras de monitoramento.
 */
export const AlertRules: React.FC = () => {
  // Hooks para obter contexto do usuário e tema
  const { mode } = useThemeMode();
  const { user } = useAuth();
  
  // ==================== Definição de Estados ====================
  // Armazena a lista de regras de alerta cadastradas pelo usuário
  const [regras, setRegras] = useState<RegraAlerta[]>([]);
  // Armazena a lista de dispositivos do usuário para seleção na regra
  const [dispositivos, setDispositivos] = useState<any[]>([]);
  // Armazena os parâmetros de sensor disponíveis (pH, Temperatura, etc.)
  const [parametros, setParametros] = useState<Parametro[]>([]);
  // Armazena as condições de comparação disponíveis (> , <, =, etc.)
  const [condicoes, setCondicoes] = useState<Condicao[]>([]);
  // Indicador de carregamento inicial
  const [loading, setLoading] = useState(true);
  // Controla a visibilidade do modal de criação/edição
  const [showModal, setShowModal] = useState(false);
  // Armazena a regra que está sendo editada (null se for nova)
  const [editingRegra, setEditingRegra] = useState<RegraAlerta | null>(null);
  
  // Estado para armazenar os dados do formulário (ID do dispositivo, parâmetro, condição, valor)
  const [formData, setFormData] = useState({
    dispositivo_id: '',
    parametro: '',
    condicao: '',
    valor: '',
  });
  // ==================== Fim da Definição de Estados ====================

  /**
   * Função assíncrona para carregar todos os dados necessários da API
   * (Regras existentes, dispositivos, parâmetros e condições).
   */
  const carregarDados = async () => {
    if (!user?.id) return; // Garante que há um usuário logado
    
    try {
      setLoading(true);
      
      // Executa todas as chamadas de API em paralelo para otimizar o tempo de carregamento
      const [regrasResponse, dispositivosResponse, parametrosResponse, condicoesResponse] = await Promise.all([
        regraAlertaService.listarRegras(user.id),
        deviceService.listarDispositivos(user.id),
        regraAlertaService.listarParametros(),
        regraAlertaService.listarCondicoes(),
      ]);
      
      // Atualiza o estado com as regras de alerta
      if (regrasResponse.status === 'sucesso' && regrasResponse.dados) {
        setRegras(regrasResponse.dados);
      }
      
      // Atualiza o estado com a lista de dispositivos
      if (dispositivosResponse.status === 'sucesso' && dispositivosResponse.dados) {
        setDispositivos(dispositivosResponse.dados);
      }
      
      // Atualiza o estado com os parâmetros disponíveis
      if (parametrosResponse.status === 'sucesso' && parametrosResponse.dados) {
        setParametros(parametrosResponse.dados);
      }
      
      // Atualiza o estado com as condições disponíveis
      if (condicoesResponse.status === 'sucesso' && condicoesResponse.dados) {
        setCondicoes(condicoesResponse.dados);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Função para lidar com a criação ou edição de uma regra de alerta.
   * Envolve validação e chamada ao serviço de API.
   */
  const salvarRegra = async () => {
    if (!user?.id) return;
    
    try {
      // Prepara os dados do formulário para envio, convertendo strings para números
      const dados = {
        usuario_id: user.id,
        dispositivo_id: parseInt(formData.dispositivo_id),
        parametro: formData.parametro,
        condicao: formData.condicao,
        valor: parseFloat(formData.valor),
      };
      
      // Valida os dados antes de enviar para a API (lógica de validação no service)
      const validacao = regraAlertaService.validarRegra(dados);
      if (!validacao.valido) {
        Alert.alert('Erro', validacao.erros.join('\n'));
        return;
      }
      
      let response;
      // Determina se deve criar ou atualizar a regra
      if (editingRegra) {
        // Atualiza a regra existente
        response = await regraAlertaService.atualizarRegra(editingRegra.id, {
          parametro: dados.parametro,
          condicao: dados.condicao,
          valor: dados.valor,
        });
      } else {
        // Cria uma nova regra
        response = await regraAlertaService.criarRegra(dados);
      }
      
      // Se a operação for bem-sucedida, fecha o modal, limpa o formulário e recarrega os dados
      if (response.status === 'sucesso') {
        Alert.alert('Sucesso', 'Regra salva com sucesso');
        setShowModal(false);
        setEditingRegra(null);
        resetForm();
        carregarDados();
      } else {
        Alert.alert('Erro', response.mensagem);
      }
    } catch (error) {
      console.error('Erro ao salvar regra:', error);
      Alert.alert('Erro', 'Não foi possível salvar a regra');
    }
  };

  /**
   * Função para confirmar e remover uma regra de alerta.
   */
  const removerRegra = async (regraId: number) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja remover esta regra?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              // Chama o serviço de API para remover a regra
              const response = await regraAlertaService.removerRegra(regraId);
              if (response.status === 'sucesso') {
                Alert.alert('Sucesso', 'Regra removida com sucesso');
                carregarDados(); // Recarrega a lista após a remoção
              } else {
                Alert.alert('Erro', response.mensagem);
              }
            } catch (error) {
              console.error('Erro ao remover regra:', error);
              Alert.alert('Erro', 'Não foi possível remover a regra');
            }
          },
        },
      ]
    );
  };

  /**
   * Prepara o formulário para edição de uma regra existente.
   */
  const editarRegra = (regra: RegraAlerta) => {
    setEditingRegra(regra);
    // Popula o formulário com os dados da regra selecionada
    setFormData({
      dispositivo_id: regra.dispositivo_id.toString(),
      parametro: regra.parametro,
      condicao: regra.condicao,
      valor: regra.valor.toString(),
    });
    setShowModal(true); // Abre o modal
  };

  /**
   * Função utilitária para limpar os campos do formulário.
   */
  const resetForm = () => {
    setFormData({
      dispositivo_id: '',
      parametro: '',
      condicao: '',
      valor: '',
    });
  };

  /**
   * Prepara a interface para criação de uma nova regra.
   */
  const novaRegra = () => {
    setEditingRegra(null); // Define que não estamos editando
    resetForm(); // Limpa o formulário
    setShowModal(true); // Abre o modal
  };

  /**
   * Retorna o ícone visualmente representativo para o parâmetro do sensor.
   */
  const getParametroIcon = (parametro: string) => {
    const iconProps = { size: 20, color: colors.water.primary };
    
    switch (parametro) {
      case 'temperatura':
        return <Thermometer {...iconProps} />; // Ícone de termômetro
      case 'ph':
        return <Droplets {...iconProps} />; // Ícone de gotas (para pH/acidez)
      case 'turbidez':
        return <AlertTriangle {...iconProps} />; // Ícone de alerta (para turbidez/sujeira)
      case 'condutividade':
        return <Zap {...iconProps} />; // Ícone de raio (para condutividade/eletricidade)
      default:
        return <Settings {...iconProps} />; // Ícone padrão
    }
  };

  // Hook que executa a função carregarDados quando o componente é montado ou o ID do usuário muda
  useEffect(() => {
    carregarDados();
  }, [user?.id]);

  // ==================== Definição de Estilos (memoizados) ====================
  const styles = React.useMemo(() => StyleSheet.create({
    // Estilos detalhados para o layout, cartões de regra, botões e o modal.
    // Utiliza as constantes de design (colors, typography, spacing, etc.)
    // para garantir consistência visual em todo o aplicativo.
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
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
      color: colors.foreground,
    },
    addButton: {
      backgroundColor: colors.water.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    addButtonText: {
      color: colors.primaryForeground,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
    regrasList: {
      gap: spacing.sm,
    },
    regraCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      ...shadows.card,
    },
    regraHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    regraInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    regraIcon: {
      marginRight: spacing.sm,
    },
    regraTitle: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
      color: colors.foreground,
      flex: 1,
    },
    regraActions: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    actionButton: {
      padding: spacing.xs,
      borderRadius: borderRadius.sm,
    },
    regraDescription: {
      fontSize: typography.sizes.sm,
      color: colors.mutedForeground,
      marginBottom: spacing.xs,
    },
    regraDetails: {
      fontSize: typography.sizes.xs,
      color: colors.mutedForeground,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      width: width * 0.9,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    modalTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.foreground,
    },
    formGroup: {
      marginBottom: spacing.md,
    },
    formLabel: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      color: colors.foreground,
      marginBottom: spacing.xs,
    },
    formInput: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: typography.sizes.md,
      color: colors.foreground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    formSelect: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    formButtons: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: colors.muted,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: colors.mutedForeground,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.medium,
    },
    saveButton: {
      flex: 1,
      backgroundColor: colors.water.primary,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    saveButtonText: {
      color: colors.primaryForeground,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.medium,
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
  }), [mode]);
  // ==================== Fim da Definição de Estilos ====================

  // ==================== Estrutura de Renderização (JSX) ====================
  return (
    <View style={styles.container}>
      {/* Componente de cabeçalho fixo do aplicativo */}
      <MobileHeader userName={user?.name} />
      
      {/* Container de rolagem para o conteúdo da página */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Cabeçalho da página de Regras e botão Adicionar */}
          <View style={styles.header}>
            <Text style={styles.title}>Regras de Alerta</Text>
            {/* Botão para adicionar uma nova regra, que abre o modal */}
            <TouchableOpacity style={styles.addButton} onPress={novaRegra}>
              <Plus size={16} color={colors.primaryForeground} />
              <Text style={styles.addButtonText}>Nova Regra</Text>
            </TouchableOpacity>
          </View>

          {/* Renderização condicional baseada no estado de carregamento */}
          {loading ? (
            // Exibe indicador de carregamento
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyMessage}>Carregando regras...</Text>
            </View>
          ) : regras.length === 0 ? (
            // Exibe estado vazio se não houver regras
            <View style={styles.emptyContainer}>
              <Settings size={48} color={colors.mutedForeground} />
              <Text style={styles.emptyTitle}>Nenhuma regra configurada</Text>
              <Text style={styles.emptyMessage}>
                Configure regras de alerta para monitorar a qualidade da água e receber notificações automáticas.
              </Text>
            </View>
          ) : (
            // Lista de regras existentes
            <View style={styles.regrasList}>
              {regras.map((regra) => (
                // Cartão individual de cada regra
                <View key={regra.id} style={styles.regraCard}>
                  <View style={styles.regraHeader}>
                    <View style={styles.regraInfo}>
                      {/* Ícone do parâmetro (chama a função getParametroIcon) */}
                      <View style={styles.regraIcon}>
                        {getParametroIcon(regra.parametro)}
                      </View>
                      {/* Título formatado da regra (ex: PH < 7.0) */}
                      <Text style={styles.regraTitle}>
                        {regraAlertaService.gerarDescricaoRegra(regra)}
                      </Text>
                    </View>
                    {/* Botões de Ação (Editar e Remover) */}
                    <View style={styles.regraActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => editarRegra(regra)}
                      >
                        <Edit size={16} color={colors.water.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => removerRegra(regra.id)}
                      >
                        <Trash2 size={16} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {/* Detalhes da regra */}
                  <Text style={styles.regraDescription}>
                    Dispositivo: {regra.dispositivo.nome}
                  </Text>
                  <Text style={styles.regraDetails}>
                    Criada em: {new Date(regra.data_criacao).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ==================== Modal de Criação/Edição ==================== */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingRegra ? 'Editar Regra' : 'Nova Regra'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                {/* Botão de fechar */}
                <Text style={{ fontSize: 24, color: colors.mutedForeground }}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Grupo de formulário para seleção de Dispositivo (atualmente estático no JSX) */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Dispositivo</Text>
              <View style={styles.formSelect}>
                <Text style={styles.formInput}>
                  {/* Exibe o nome do dispositivo selecionado */}
                  {dispositivos.find(d => d.id.toString() === formData.dispositivo_id)?.nome || 'Selecione um dispositivo'}
                </Text>
              </View>
            </View>

            {/* Grupo de formulário para seleção de Parâmetro (atualmente estático no JSX) */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Parâmetro</Text>
              <View style={styles.formSelect}>
                <Text style={styles.formInput}>
                  {/* Exibe o nome do parâmetro selecionado */}
                  {parametros.find(p => p.codigo === formData.parametro)?.nome || 'Selecione um parâmetro'}
                </Text>
              </View>
            </View>

            {/* Grupo de formulário para seleção de Condição (atualmente estático no JSX) */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Condição</Text>
              <View style={styles.formSelect}>
                <Text style={styles.formInput}>
                  {/* Exibe o nome da condição selecionada */}
                  {condicoes.find(c => c.codigo === formData.condicao)?.nome || 'Selecione uma condição'}
                </Text>
              </View>
            </View>

            {/* Grupo de formulário para o Valor Limite (campo de texto para entrada) */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Valor Limite</Text>
              <TextInput
                style={styles.formInput}
                value={formData.valor}
                onChangeText={(text) => setFormData({ ...formData, valor: text })}
                placeholder="Digite o valor limite"
                keyboardType="numeric" // Garante teclado numérico
              />
            </View>

            {/* Botões de Ação do Modal */}
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={salvarRegra} // Chama a função que valida e salva/atualiza a regra
              >
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};