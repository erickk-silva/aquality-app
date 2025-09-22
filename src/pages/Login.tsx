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
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export const Login: React.FC = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    try {
      const success = await login(email.trim(), password);
      
      if (success) {
        Alert.alert('Sucesso', 'Login realizado com sucesso!');
      } else {
        Alert.alert('Erro de Login', 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
    }
  };

  const fillDefaultCredentials = () => {
    setEmail('aquality@tcc.com');
    setPassword('aqua@123');
  };

  const testApiConnection = async () => {
    try {
      // Test basic API connectivity
      const response = await fetch('https://tcc3eetecgrupo5t1.hospedagemdesites.ws/web/app/api_mobile/usuarios/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test', senha: 'test' })
      });
      
      const data = await response.json();
      
      Alert.alert(
        'Teste de Conectividade',
        `Status: ${response.status}\nResposta: ${JSON.stringify(data, null, 2)}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Erro de Conectividade',
        `Erro: ${error}\nVerifique sua conexão com a internet.`,
        [{ text: 'OK' }]
      );
    }
  };

  const navigateToSignup = () => {
    navigation.navigate('Signup' as never);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Bem-vindo de volta!</Text>
        <Text style={styles.subtitle}>Faça login para continuar</Text>
        
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          
          <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={styles.loginButtonText}>Entrar</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.forgotPasswordButton}
            onPress={() => Alert.alert('Esqueci minha senha', 'Funcionalidade em desenvolvimento')}
          >
            <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.fillCredentialsButton}
            onPress={fillDefaultCredentials}
          >
            <Text style={styles.fillCredentialsText}>
              Usar credenciais de teste
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.testApiButton}
            onPress={testApiConnection}
          >
            <Text style={styles.testApiText}>
              Testar Conexão API
            </Text>
          </TouchableOpacity>
          
          {/* Botão para criar nova conta */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Não tem uma conta? </Text>
            <TouchableOpacity onPress={navigateToSignup}>
              <Text style={styles.signupLink}>Cadastre-se aqui</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.credentialsInfo}>
            <Text style={styles.credentialsTitle}>Credenciais de teste:</Text>
            <Text style={styles.credentialsText}>Email: aquality@tcc.com</Text>
            <Text style={styles.credentialsText}>Senha: aqua@123</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

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
  fillCredentialsButton: {
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: `${colors.water.primary}10`,
    borderRadius: borderRadius.lg,
  },
  fillCredentialsText: {
    color: colors.water.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  testApiButton: {
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: `${colors.warning}20`,
    borderRadius: borderRadius.lg,
  },
  testApiText: {
    color: colors.warning,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  credentialsInfo: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.muted,
    borderRadius: borderRadius.lg,
  },
  credentialsTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  credentialsText: {
    fontSize: typography.sizes.sm,
    color: colors.mutedForeground,
    marginBottom: spacing.xs,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
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
