// Importações de bibliotecas e hooks do React e React Native
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert, // Usado para diálogos de confirmação de saída
} from 'react-native';
// Importação de ícones para as opções de configuração
import { 
  User, // Perfil
  Bell, // Notificações
  Shield, // Privacidade
  HelpCircle, // Ajuda
  LogOut, // Sair
  ChevronRight, // Seta indicadora
  Wifi, // Status de conexão (exemplo)
  Moon, // Tema Escuro (exemplo)
  Sun, // Tema Claro (exemplo)
  Settings as SettingsIcon // Ícone geral de Configurações/Regras
} from 'lucide-react-native';
// Componentes customizados e hooks
import { MobileHeader } from '../components/MobileHeader'; // Cabeçalho fixo
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors'; // Utilitários de estilo
import { useAuth } from '../contexts/AuthContext'; // Hook para obter o usuário e a função de logout
import { useNavigation } from '@react-navigation/native'; // Hook de navegação

// Obtém a largura da janela para dimensionamento responsivo
const { width } = Dimensions.get('window');

/**
 * Estrutura de dados que define todas as seções e itens da tela de Configurações.
 * Cada item possui título, subtítulo, ícone e a rota/ação associada.
 */
const settingsSections = [
  {
    title: 'Conta', // Título da seção: Conta
    items: [
      {
        icon: 'User',
        title: 'Perfil',
        subtitle: 'Editar informações pessoais',
        route: 'Profile', // Rota para navegação
      },
      {
        icon: 'Bell',
        title: 'Notificações',
        subtitle: 'Ver alertas recebidos',
        route: 'Notifications', // Rota para a lista de alertas
      },
      {
        icon: 'Settings',
        title: 'Regras de Alerta',
        subtitle: 'Configurar alertas automáticos',
        route: 'AlertRules', // Rota para o gerenciamento de regras
      },
    ],
  },
  {
    title: 'Suporte', // Título da seção: Suporte
    items: [
      {
        icon: 'HelpCircle',
        title: 'Ajuda',
        subtitle: 'Central de ajuda',
        route: 'Help', // Rota para a página de Ajuda
      },
      {
        icon: 'Shield',
        title: 'Privacidade',
        subtitle: 'Política de privacidade',
        route: 'Privacy', // Rota para a página de Privacidade
      },
    ],
  },
  {
    title: 'Sistema', // Título da seção: Sistema
    items: [
      {
        icon: 'LogOut',
        title: 'Sair',
        subtitle: 'Fazer logout da conta',
        type: 'action', // Indica que é uma ação, e não uma navegação simples
        action: 'logout', // Ação específica a ser executada
      },
    ],
  },
];

/**
 * Componente principal para a tela de Configurações.
 */
export const Settings: React.FC = () => {
  // Inicializa o hook de navegação (com tipagem 'any' para flexibilidade)
  const navigation = useNavigation<any>();
  // Obtém a função de logout e dados do usuário do AuthContext
  const { logout, user } = useAuth();

  // Definição dos estilos usando StyleSheet.create (não memoizados, mas definidos aqui)
  const styles = StyleSheet.create({
    // Estilos para layout base (container, scroll, conteúdo centralizado)
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: 120, // Espaço para o cabeçalho fixo
      paddingBottom: 100, // Espaço para a navegação inferior
      paddingHorizontal: spacing.md,
    },
    content: {
      maxWidth: width,
      alignSelf: 'center',
    },
    title: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
      color: colors.foreground,
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontSize: typography.sizes.md,
      color: colors.mutedForeground,
      marginBottom: spacing.xl,
    },
    // Estilos para cada seção (ex: Conta, Suporte)
    section: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
      color: colors.foreground,
      marginBottom: spacing.sm,
    },
    // Container para os itens dentro de cada seção
    sectionContent: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.xl,
      ...shadows.card,
      overflow: 'hidden',
    },
    // Estilo para cada linha de configuração (item)
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    lastItem: {
      borderBottomWidth: 0, // Remove a borda inferior do último item da seção
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    // Container colorido ao redor do ícone
    iconContainer: {
      width: 40,
      height: 40,
      backgroundColor: `${colors.water.primary}10`,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    textContainer: {
      flex: 1,
    },
    settingTitle: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.medium,
      color: colors.foreground,
      marginBottom: spacing.xs,
    },
    settingSubtitle: {
      fontSize: typography.sizes.sm,
      color: colors.mutedForeground,
    },
    settingRight: {
      marginLeft: spacing.sm,
    },
  });

  /**
   * Função utilitária para mapear o nome do ícone para o componente Lucide-React-Native.
   */
  const getIcon = (iconName: string) => {
    const iconProps = {
      size: 20,
      color: colors.water.primary,
    };

    switch (iconName) {
      case 'User':
        return <User {...iconProps} />;
      case 'Bell':
        return <Bell {...iconProps} />;
      case 'Shield':
        return <Shield {...iconProps} />;
      case 'HelpCircle':
        return <HelpCircle {...iconProps} />;
      case 'LogOut':
        return <LogOut {...iconProps} />;
      case 'Moon':
        return <Moon {...iconProps} />;
      case 'Sun':
        return <Sun {...iconProps} />;
      case 'Wifi':
        return <Wifi {...iconProps} />;
      case 'Settings':
        return <SettingsIcon {...iconProps} />;
      default:
        return <User {...iconProps} />;
    }
  };

  /**
   * Função que lida com o toque em um item da lista (navegação ou ação de logout).
   */
  const handleItemPress = (item: any) => {
    if (item.route) {
      // Se tiver uma rota definida, navega para a tela
      navigation.navigate(item.route);
    } else if (item.action === 'logout') {
      // Se a ação for 'logout', exibe um alerta de confirmação
      Alert.alert(
        'Sair',
        'Tem certeza que deseja sair da sua conta?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Sair',
            style: 'destructive',
            onPress: () => {
              logout(); // Executa o logout
            },
          },
        ]
      );
    }
  };

  // ==================== Estrutura de Renderização (JSX) ====================
  return (
    <View style={styles.container}>
      {/* Cabeçalho do aplicativo */}
      <MobileHeader userName={user?.name} />
      
      {/* Conteúdo principal com rolagem */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Configurações</Text>
          <Text style={styles.subtitle}>
            Gerencie suas preferências e configurações
          </Text>

          {/* Mapeamento das Seções de Configuração */}
          {settingsSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionContent}>
                {/* Mapeamento dos Itens de cada Seção */}
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={itemIndex}
                    style={[
                      styles.settingItem,
                      // Aplica o estilo de último item condicionalmente
                      itemIndex === section.items.length - 1 && styles.lastItem,
                    ]}
                    onPress={() => handleItemPress(item)} // Lida com o toque
                    activeOpacity={0.7}
                  >
                    <View style={styles.settingLeft}>
                      {/* Container do Ícone */}
                      <View style={styles.iconContainer}>
                        {getIcon(item.icon)}
                      </View>
                      {/* Título e Subtítulo */}
                      <View style={styles.textContainer}>
                        <Text style={styles.settingTitle}>{item.title}</Text>
                        <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                      </View>
                    </View>
                    {/* Indicador de Navegação (Seta) */}
                    <View style={styles.settingRight}>
                      <ChevronRight size={20} color={colors.mutedForeground} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};