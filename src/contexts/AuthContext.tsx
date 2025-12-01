// Importações de bibliotecas e hooks do React e React Native
import React, { createContext, useContext, useState, useEffect } from 'react';
// Biblioteca para armazenamento local assíncrono (usada para persistir o usuário)
import AsyncStorage from '@react-native-async-storage/async-storage';
// Importação do serviço de autenticação e interfaces de dados
import { authService, LoginCredentials, SignupData } from '../services/authService';
// Função utilitária para tratar erros de API
import { handleApiError } from '../services/api';

/**
 * Interface que define a estrutura de dados do usuário armazenada no contexto.
 */
interface User {
  id: number;
  email: string;
  name: string;
  sobrenome: string;
}

/**
 * Interface que define a estrutura de dados e funções fornecidas pelo Contexto de Autenticação.
 */
interface AuthContextData {
  user: User | null; // Objeto do usuário logado ou null
  isLoading: boolean; // Indica se está carregando (ex: verificando usuário armazenado)
  login: (email: string, password: string) => Promise<boolean>; // Função para realizar o login
  signup: (userData: SignupData) => Promise<boolean>; // Função para realizar o cadastro
  logout: () => Promise<void>; // Função para realizar o logout
}

// Cria o Contexto de Autenticação com um valor inicial vazio.
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

/**
 * Hook customizado para facilitar o acesso aos dados do contexto de autenticação.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  // Garante que o hook está sendo usado dentro do componente AuthProvider
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Interface que define as propriedades do componente AuthProvider.
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Componente Provedor (Provider) de Autenticação.
 * É responsável por gerenciar o estado global de autenticação e expor as funções de controle.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Estado para armazenar o usuário logado
  const [user, setUser] = useState<User | null>(null);
  // Estado para controlar o carregamento inicial (verificando sessão persistente)
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Hook de efeito para carregar o usuário armazenado localmente na inicialização do app.
   */
  useEffect(() => {
    loadStoredUser();
  }, []);

  /**
   * Função assíncrona para buscar o usuário no AsyncStorage (armazenamento local).
   */
  const loadStoredUser = async () => {
    try {
      // Tenta recuperar o usuário pelo AsyncStorage
      const storedUser = await AsyncStorage.getItem('@water-sense:user');
      if (storedUser) {
        setUser(JSON.parse(storedUser)); // Define o usuário se encontrado
      }
    } catch (error) {
      console.log('Erro ao carregar usuário:', error);
    } finally {
      setIsLoading(false); // Finaliza o carregamento inicial, permitindo a renderização do app
    }
  };

  /**
   * Função para realizar o login do usuário.
   * Envia as credenciais para o serviço de autenticação e persiste o usuário em caso de sucesso.
   */
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log('🔐 Tentando login com:', { email, senha: '***' });
      
      const credentials: LoginCredentials = {
        email,
        senha: password
      };
      
      // Chama a API de login
      const response = await authService.login(credentials);
      
      console.log('📡 Resposta do login:', response);
      
      if (response.status === 'sucesso' && response.dados) {
        // Mapeia os dados da resposta para o formato local da interface User
        const userData: User = {
          id: response.dados.id,
          email: response.dados.email,
          name: response.dados.nome,
          sobrenome: response.dados.sobrenome
        };
        
        console.log('✅ Login bem-sucedido:', userData);
        setUser(userData);
        // Armazena o usuário localmente para persistência de sessão
        await AsyncStorage.setItem('@water-sense:user', JSON.stringify(userData));
        return true;
      } else {
        console.error('❌ Login falhou:', response.mensagem);
        return false;
      }
    } catch (error) {
      console.error('💥 Erro no login:', handleApiError(error));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Função para realizar o cadastro de um novo usuário.
   * Após o cadastro, tenta realizar o login automático.
   */
  const signup = async (userData: SignupData): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log('📝 Tentando cadastro com:', { ...userData, senha: '***' });
      
      // Chama a API de cadastro
      const response = await authService.signup(userData);
      
      console.log('📡 Resposta do cadastro:', response);
      
      if (response.status === 'sucesso') {
        console.log('✅ Cadastro bem-sucedido, fazendo login automático...');
        // Após cadastro bem-sucedido, faz login automaticamente com as credenciais fornecidas
        return await login(userData.email, userData.senha);
      } else {
        console.error('❌ Cadastro falhou:', response.mensagem);
        return false;
      }
    } catch (error) {
      console.error('💥 Erro no cadastro:', handleApiError(error));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Função para realizar o logout do usuário.
   * Remove o usuário do estado e do armazenamento local.
   */
  const logout = async () => {
    try {
      setUser(null); // Limpa o estado do usuário
      // Remove a sessão do armazenamento local
      await AsyncStorage.removeItem('@water-sense:user');
    } catch (error) {
      console.log('Erro no logout:', error);
    }
  };

  // Retorna o provedor de contexto, expondo os estados e funções.
  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children} {/* Renderiza os componentes filhos (o restante do aplicativo) */}
    </AuthContext.Provider>
  );
};