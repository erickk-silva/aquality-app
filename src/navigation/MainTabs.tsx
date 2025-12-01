// Importações de bibliotecas React e de navegação
import React from 'react';
// Cria o navegador de abas inferiores (Bottom Tabs)
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// Cria o navegador em pilha (Stack Navigator)
import { createStackNavigator } from '@react-navigation/stack';
// Importação de ícones da biblioteca lucide-react-native
import { Home, Smartphone, Settings, BarChart, Bell } from 'lucide-react-native';
// Importação de cores customizadas
import { colors } from '../utils/colors';

// Importação das telas (páginas) do aplicativo
import { Home as HomePage } from '../pages/Home';
import { Devices } from '../pages/Devices';
import { Settings as SettingsPage } from '../pages/Settings';
import { Notifications } from '../pages/Notifications';
import { AlertRules } from '../pages/AlertRules';
import { Profile } from '../pages/Profile';
import { EditProfile } from '../pages/EditProfile';
import { SensorDetails } from '../pages/SensorDetails';
import { Help } from '../pages/Help';
import { Privacy } from '../pages/Privacy';
// Importação da nova página de Progresso (Gráficos)
import { Progress } from '../pages/Progress';

// Inicializa os objetos criadores de navegação
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

/**
 * Define a pilha de navegação para a aba 'Início' (HomeStack).
 * As telas nesta pilha não exibirão o cabeçalho padrão.
 */
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomePage} />
    <Stack.Screen name="Notifications" component={Notifications} />
    <Stack.Screen name="AlertRules" component={AlertRules} />
    <Stack.Screen name="Profile" component={Profile} />
    <Stack.Screen name="EditProfile" component={EditProfile} />
    <Stack.Screen name="SensorDetails" component={SensorDetails} />
  </Stack.Navigator>
);

/**
 * Define a pilha de navegação para a aba 'Dispositivos' (DevicesStack).
 * Inclui a tela principal de dispositivos e os detalhes do sensor.
 */
const DevicesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DevicesMain" component={Devices} />
    <Stack.Screen name="SensorDetails" component={SensorDetails} />
  </Stack.Navigator>
);

/**
 * Define a pilha de navegação para a nova aba 'Progresso' (ProgressStack).
 * Contém a tela de gráficos de evolução dos indicadores.
 */
const ProgressStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProgressMain" component={Progress} />
  </Stack.Navigator>
);

/**
 * Define a pilha de navegação para a aba 'Configurações' (SettingsStack).
 * Agrupa todas as telas de gestão e suporte.
 */
const SettingsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SettingsMain" component={SettingsPage} />
    <Stack.Screen name="Help" component={Help} />
    <Stack.Screen name="Privacy" component={Privacy} />
    <Stack.Screen name="Notifications" component={Notifications} />
    <Stack.Screen name="AlertRules" component={AlertRules} />
    <Stack.Screen name="Profile" component={Profile} />
    <Stack.Screen name="EditProfile" component={EditProfile} />
  </Stack.Navigator>
);

/**
 * Componente principal que define a navegação por abas inferiores (MainTabs).
 */
export const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      // Opções globais para o navegador de abas
      screenOptions={({ route }) => ({
        // Função que define o ícone de cada aba
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;

          // Seleciona o componente de ícone com base no nome da rota (aba)
          if (route.name === 'Home') {
            IconComponent = Home;
          } else if (route.name === 'Devices') {
            IconComponent = Smartphone;
          } else if (route.name === 'Settings') {
            IconComponent = Settings;
          } else if (route.name === 'Progress') {
            IconComponent = BarChart;
          }

          // Renderiza o ícone
          return IconComponent ? <IconComponent size={size} color={color} /> : null;
        },
        // Cores para ícones e rótulos (ativo e inativo)
        tabBarActiveTintColor: colors.water.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        // Estilos da barra de abas
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        // Estilos do rótulo de texto da aba
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        // Garante que o cabeçalho do navegador de abas está sempre oculto
        headerShown: false,
      })}
    >
      {/* Definição de cada aba, usando as Pilhas (Stacks) criadas */}
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{
          tabBarLabel: 'Início',
        }}
      />
      <Tab.Screen 
        name="Devices" 
        component={DevicesStack}
        options={{
          tabBarLabel: 'Dispositivos',
        }}
      />
      <Tab.Screen 
        name="Progress" 
        component={ProgressStack}
        options={{
          tabBarLabel: 'Progresso',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsStack}
        options={{
          tabBarLabel: 'Configurações',
        }}
      />
    </Tab.Navigator>
  );
};