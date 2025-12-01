// Importações de bibliotecas e hooks do React e React Native
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
// Importação de utilitários de estilo e constantes de design
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
// Hook para obter o estado de autenticação e a função de login
import { useAuth } from '../contexts/AuthContext';
// Hook para navegação entre telas
import { useNavigation } from '@react-navigation/native';

// Obtém a largura da janela para dimensionamento responsivo
const { width } = Dimensions.get('window');

/**
 * Componente principal para a tela de Login.
 * Permite ao usuário inserir credenciais e autenticar-se.
 */
export const Login: React.FC = () => {
  // Inicializa o hook de navegação
  const navigation = useNavigation();
  // Estado para armazenar o email digitado pelo usuário
  const [email, setEmail] = useState('');
  // Estado para armazenar a senha digitada pelo usuário
  const [password, setPassword] = useState('');
  // Obtém a função de login e o estado de carregamento do contexto de autenticação
  const { login, isLoading } = useAuth();

  /**
   * Função para lidar com a tentativa de login.
   * Realiza validação básica e chama o serviço de autenticação.
   */
  const handleLogin = async () => {
    // 1. Validação de campos vazios
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    try {
      // 2. Chama a função de login do contexto, que interage com a API
      const success = await login(email.trim(), password);
      
      if (success) {
        // 3. Sucesso: A navegação é tratada pelo AuthContext para a tela principal (MainTabs)
        Alert.alert('Sucesso', 'Login realizado com sucesso!');
      } else {
        // 4. Falha de credenciais: Exibe mensagem de erro da API
        Alert.alert('Erro de Login', 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.');
      }
    } catch (error) {
      // 5. Erro de conexão: Trata falhas na comunicação com o servidor
      console.error('Erro no login:', error);
      Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
    }
  };

  /**
   * Função para navegar para a tela de Cadastro (Signup).
   */
  const navigateToSignup = () => {
    navigation.navigate('Signup' as never);
  };

  // ==================== Estrutura de Renderização (JSX) ====================
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Título e Subtítulo da tela */}
        <Text style={styles.title}>Bem-vindo de volta!</Text>
        <Text style={styles.subtitle}>Faça login para continuar</Text>
        
        <View style={styles.form}>
          {/* Campo de Email */}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          {/* Campo de Senha */}
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry // Esconde a senha
            value={password}
            onChangeText={setPassword}
          />
          
          {/* Botão de Login */}
          <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} // Estilo de desabilitado se estiver carregando
            onPress={handleLogin} // Chama a função de login
            disabled={isLoading} // Desabilita o botão durante o carregamento
          >
            {/* Indicador de atividade (loading) ou texto "Entrar" */}
            {isLoading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={styles.loginButtonText}>Entrar</Text>
            )}
          </TouchableOpacity>
          
          {/* Botão Esqueci minha Senha (funcionalidade mockada) */}
          <TouchableOpacity 
            style={styles.forgotPasswordButton}
            onPress={() => Alert.alert('Esqueci minha senha', 'Funcionalidade em desenvolvimento')}
          >
            <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
          </TouchableOpacity>
          
          {/* Link para a tela de Cadastro */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Não tem uma conta? </Text>
            <TouchableOpacity onPress={navigateToSignup}>
              <Text style={styles.signupLink}>Cadastre-se aqui</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

// Definição dos estilos da tela de Login
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    maxWidth: width,
    alignSelf: 'center',
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.foreground,
    ...shadows.card,
  },
  loginButton: {
    backgroundColor: colors.water.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.button,
  },
  loginButtonText: {
    color: colors.primaryForeground,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  forgotPasswordText: {
    color: colors.water.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  signupText: {
    fontSize: typography.sizes.sm,
    color: colors.mutedForeground,
  },
  signupLink: {
    fontSize: typography.sizes.sm,
    color: colors.water.primary,
    fontWeight: typography.weights.semibold,
  },
});