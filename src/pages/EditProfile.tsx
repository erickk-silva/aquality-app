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
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
// Importação de ícones para navegação e ações
import { ArrowLeft, Save, Camera, Eye, EyeOff } from 'lucide-react-native';
// Hook para navegação entre telas
import { useNavigation } from '@react-navigation/native';
// Biblioteca para seleção e manipulação de imagens (usada para foto de perfil)
import * as ImagePicker from 'expo-image-picker';
// Componente de cabeçalho customizado (topo da tela)
import { MobileHeader } from '../components/MobileHeader';
// Hook para obter o estado de autenticação e dados do usuário
import { useAuth } from '../contexts/AuthContext';
// Utilitários de estilo e constantes de design
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
// Serviço de API para operações de perfil (buscar, atualizar, upload de foto)
import { profileService, UpdateProfileData } from '../services/profileService';

// Obtém a largura da tela para dimensionamento responsivo
const { width } = Dimensions.get('window');

// Interface para as propriedades de navegação (parâmetros da rota)
interface EditProfileProps {
  route?: {
    params?: {
      profileData?: any; // Dados do perfil passados da tela anterior
    };
  };
}

/**
 * Componente principal para a tela de Edição de Perfil.
 * Permite ao usuário atualizar informações pessoais, email, senha e foto de perfil.
 */
export const EditProfile: React.FC<EditProfileProps> = ({ route }) => {
  // Inicializa o hook de navegação
  const navigation = useNavigation();
  // Obtém dados do usuário logado e a função de login (para possível reautenticação)
  const { user, login } = useAuth();
  // Estado para controlar o loading ao salvar alterações no perfil
  const [loading, setLoading] = useState(false);
  // Estado para controlar o loading específico do upload da foto
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Estado que armazena os dados do formulário a serem editados
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    senha_atual: '',
    nova_senha: '',
    confirmar_senha: '',
    foto_perfil: '',
  });
  
  // Estado para armazenar erros de validação específicos de cada campo
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Estados para alternar a visibilidade das senhas (mostrar/esconder)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  /**
   * Hook de efeito que carrega os dados iniciais do usuário no formulário
   * quando o componente é montado ou quando os dados do usuário/rota mudam.
   */
  useEffect(() => {
    if (user) {
      // Preenche o formulário com os dados atuais do usuário e a foto do perfil (se disponível na rota)
      setFormData(prev => ({
        ...prev,
        nome: user.name || '',
        sobrenome: user.sobrenome || '',
        email: user.email || '',
        foto_perfil: route?.params?.profileData?.usuario.foto_perfil || '',
      }));
    }
  }, [user, route?.params]);

  /**
   * Valida todos os campos do formulário localmente antes de enviar para a API.
   * Retorna `true` se o formulário for válido.
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Valida o campo nome usando o serviço de perfil
    const nameValidation = profileService.validateName(formData.nome);
    if (!nameValidation.isValid) {
      newErrors.nome = nameValidation.message;
    }
    
    // Valida o campo sobrenome
    const surnameValidation = profileService.validateName(formData.sobrenome);
    if (!surnameValidation.isValid) {
      newErrors.sobrenome = surnameValidation.message;
    }
    
    // Valida o formato do email
    const emailValidation = profileService.validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.message;
    }
    
    // Lógica de validação específica para alteração de senha
    if (formData.nova_senha) {
      // A senha atual é obrigatória se uma nova senha for fornecida
      if (!formData.senha_atual) {
        newErrors.senha_atual = 'Senha atual é obrigatória para alterar a senha';
      }
      
      // Valida a força/tamanho da nova senha
      const passwordValidation = profileService.validatePassword(formData.nova_senha);
      if (!passwordValidation.isValid) {
        newErrors.nova_senha = passwordValidation.message;
      }
      
      // Verifica se a confirmação de senha corresponde à nova senha
      if (formData.nova_senha !== formData.confirmar_senha) {
        newErrors.confirmar_senha = 'Senhas não coincidem';
      }
    }
    
    setErrors(newErrors); // Atualiza os erros no estado para exibição na tela
    return Object.keys(newErrors).length === 0; // Retorna true se não houver erros
  };

  /**
   * Função para processar o salvamento das alterações do perfil.
   */
  const handleSave = async () => {
    // 1. Validação local
    if (!validateForm()) {
      Alert.alert('Erro', 'Por favor, corrija os erros antes de continuar.');
      return;
    }
    
    if (!user?.id) return;
    
    try {
      setLoading(true); // Inicia o loading
      
      // Monta o objeto de dados a ser enviado para a API
      const updateData: UpdateProfileData = {
        nome: formData.nome,
        sobrenome: formData.sobrenome,
        email: formData.email,
      };
      
      // Inclui os campos de senha apenas se o usuário optou por alterá-la
      if (formData.nova_senha) {
        updateData.senha_atual = formData.senha_atual;
        updateData.nova_senha = formData.nova_senha;
      }
      
      // Chama o serviço de API para atualizar o perfil
      const response = await profileService.updateUserProfile(user.id, updateData);
      
      if (response.status === 'sucesso') {
        // Mostra alerta de sucesso
        Alert.alert(
          'Sucesso!',
          'Perfil atualizado com sucesso.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Se a senha foi alterada, o usuário precisa fazer login novamente (por questões de segurança de sessão)
                if (formData.nova_senha) {
                  Alert.alert(
                    'Senha Alterada',
                    'Sua senha foi alterada. Por favor, faça login novamente.',
                    [
                      {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                      },
                    ]
                  );
                } else {
                  navigation.goBack(); // Volta para a tela anterior
                }
              },
            },
          ]
        );
      } else {
        // Mostra alerta de erro retornado pela API
        Alert.alert('Erro', response.mensagem || 'Erro ao atualizar perfil.');
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      Alert.alert('Erro', 'Erro interno. Tente novamente.');
    } finally {
      setLoading(false); // Finaliza o loading
    }
  };

  /**
   * Função para lidar com a seleção e upload da nova foto de perfil.
   */
  const handlePhotoUpload = async () => {
    try {
      // 1. Solicita permissão para acessar a galeria
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permissão Necessária', 'É necessário permitir acesso à galeria de fotos.');
        return;
      }
      
      // 2. Abre a galeria para seleção de imagem
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Permite cortar a imagem
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });
      
      // 3. Processa a imagem selecionada
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        if (!user?.id) return;
        
        setUploadingPhoto(true); // Inicia o loading de upload
        
        try {
          // Chama o serviço de API para fazer upload da foto
          const uploadResponse = await profileService.uploadProfilePhoto(user.id, asset.uri);
          
          if (uploadResponse.status === 'sucesso' && uploadResponse.dados) {
            // Atualiza o formulário com a nova URL da foto (para exibição imediata)
            setFormData(prev => ({
              ...prev,
              foto_perfil: uploadResponse.dados!.foto_perfil,
            }));
            
            Alert.alert('Sucesso!', 'Foto atualizada com sucesso.');
          } else {
            Alert.alert('Erro', uploadResponse.mensagem || 'Erro ao fazer upload da foto.');
          }
        } catch (error) {
          console.error('Erro ao fazer upload da foto:', error);
          Alert.alert('Erro', 'Erro ao fazer upload da foto.');
        } finally {
          setUploadingPhoto(false); // Finaliza o loading de upload
        }
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Erro ao selecionar imagem.');
    }
  };

  /**
   * Retorna o objeto de origem da imagem para o componente <Image>,
   * convertendo o caminho relativo da API para a URL completa.
   */
  const getAvatarSource = () => {
    if (formData.foto_perfil) {
      const url = profileService.getAvatarUrl(formData.foto_perfil);
      if (url) {
        return { uri: url };
      }
    }
    return null;
  };

  // Definição dos estilos da tela
  const styles = StyleSheet.create({
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
      padding: spacing.sm,
      marginRight: spacing.md,
    },
    title: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
      color: colors.foreground,
      flex: 1,
    },
    // Seção da foto de perfil
    photoSection: {
      alignItems: 'center',
      marginBottom: spacing.xl,
      backgroundColor: colors.card,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      ...shadows.card,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: spacing.md,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
    },
    // Placeholder para avatar (iniciais do nome)
    avatarPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.water.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarInitials: {
      fontSize: typography.sizes.xxl,
      fontWeight: typography.weights.bold,
      color: colors.primaryForeground,
    },
    // Botão flutuante da câmera para upload
    cameraButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: colors.water.primary,
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.button,
    },
    photoText: {
      fontSize: typography.sizes.md,
      color: colors.mutedForeground,
      textAlign: 'center',
    },
    // Seção do formulário
    formSection: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      ...shadows.card,
    },
    sectionTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.semibold,
      color: colors.foreground,
      marginBottom: spacing.md,
    },
    inputGroup: {
      marginBottom: spacing.md,
    },
    label: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.medium,
      color: colors.foreground,
      marginBottom: spacing.xs,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      fontSize: typography.sizes.md,
      color: colors.foreground,
      backgroundColor: colors.background,
    },
    // Estilo para destacar campos com erro
    inputError: {
      borderColor: colors.danger,
    },
    errorText: {
      fontSize: typography.sizes.sm,
      color: colors.danger,
      marginTop: spacing.xs,
    },
    // Container para inputs de senha com botão de toggle
    passwordInputContainer: {
      position: 'relative',
    },
    passwordToggle: {
      position: 'absolute',
      right: spacing.md,
      top: spacing.md,
      padding: spacing.xs,
    },
    // Botão Salvar
    saveButton: {
      backgroundColor: colors.water.primary,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.button,
    },
    saveButtonDisabled: {
      backgroundColor: colors.mutedForeground,
    },
    saveButtonText: {
      color: colors.primaryForeground,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
      marginLeft: spacing.xs,
    },
    // Overlay de carregamento (tela escura)
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
  });

  return (
    <View style={styles.container}>
      {/* Cabeçalho do aplicativo */}
      <MobileHeader userName={user?.name} />
      
      {/* ScrollView principal do formulário */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            {/* Botão para voltar à tela anterior */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <ArrowLeft size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={styles.title}>Editar Perfil</Text>
          </View>

          {/* Seção da Foto de Perfil */}
          <View style={styles.photoSection}>
            <View style={styles.avatarContainer}>
              {/* Exibe a imagem ou o placeholder com as iniciais */}
              {getAvatarSource() ? (
                <Image source={getAvatarSource()!} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {profileService.getInitials(`${formData.nome} ${formData.sobrenome}`)}
                  </Text>
                </View>
              )}
              
              {/* Botão de Câmera para Upload */}
              <TouchableOpacity style={styles.cameraButton} onPress={handlePhotoUpload}>
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Camera size={20} color={colors.primaryForeground} />
                )}
              </TouchableOpacity>
            </View>
            
            <Text style={styles.photoText}>
              Toque no ícone da câmera para alterar sua foto
            </Text>
          </View>

          {/* Seção de Informações Pessoais */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Informações Pessoais</Text>
            
            {/* Campo Nome */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={[styles.input, errors.nome && styles.inputError]}
                value={formData.nome}
                onChangeText={(text) => setFormData(prev => ({ ...prev, nome: text }))}
                placeholder="Digite seu nome"
                placeholderTextColor={colors.mutedForeground}
              />
              {errors.nome && <Text style={styles.errorText}>{errors.nome}</Text>}
            </View>
            
            {/* Campo Sobrenome */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sobrenome</Text>
              <TextInput
                style={[styles.input, errors.sobrenome && styles.inputError]}
                value={formData.sobrenome}
                onChangeText={(text) => setFormData(prev => ({ ...prev, sobrenome: text }))}
                placeholder="Digite seu sobrenome"
                placeholderTextColor={colors.mutedForeground}
              />
              {errors.sobrenome && <Text style={styles.errorText}>{errors.sobrenome}</Text>}
            </View>
            
            {/* Campo Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text.toLowerCase() }))}
                placeholder="Digite seu email"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>
          </View>

          {/* Seção de Alteração de Senha */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Alterar Senha</Text>
            
            {/* Campo Senha Atual */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha Atual</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.input, errors.senha_atual && styles.inputError]}
                  value={formData.senha_atual}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, senha_atual: text }))}
                  placeholder="Digite sua senha atual"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showCurrentPassword}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff size={20} color={colors.mutedForeground} />
                  ) : (
                    <Eye size={20} color={colors.mutedForeground} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.senha_atual && <Text style={styles.errorText}>{errors.senha_atual}</Text>}
            </View>
            
            {/* Campo Nova Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nova Senha</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.input, errors.nova_senha && styles.inputError]}
                  value={formData.nova_senha}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, nova_senha: text }))}
                  placeholder="Digite a nova senha (mínimo 6 caracteres)"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff size={20} color={colors.mutedForeground} />
                  ) : (
                    <Eye size={20} color={colors.mutedForeground} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.nova_senha && <Text style={styles.errorText}>{errors.nova_senha}</Text>}
            </View>
            
            {/* Campo Confirmar Nova Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar Nova Senha</Text>
              <TextInput
                style={[styles.input, errors.confirmar_senha && styles.inputError]}
                value={formData.confirmar_senha}
                onChangeText={(text) => setFormData(prev => ({ ...prev, confirmar_senha: text }))}
                placeholder="Confirme a nova senha"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={true}
              />
              {errors.confirmar_senha && <Text style={styles.errorText}>{errors.confirmar_senha}</Text>}
            </View>
          </View>

          {/* Botão Salvar Alterações */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <>
                <Save size={20} color={colors.primaryForeground} />
                <Text style={styles.saveButtonText}>Salvar Alterações</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Overlay de carregamento que cobre toda a tela durante salvamento ou upload */}
      {(loading || uploadingPhoto) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.water.primary} />
        </View>
      )}
    </View>
  );
};