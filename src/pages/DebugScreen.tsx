import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../utils/colors';
import { authService } from '../services/authService';
import { deviceService } from '../services/deviceService';
import { handleApiError } from '../services/api';

export const DebugScreen: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (test: string, success: boolean, details: any) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      details: JSON.stringify(details, null, 2),
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testLogin = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testando login...');
      const result = await authService.login({
        email: 'aquality@tcc.com',
        senha: 'aqua@123'
      });
      
      addResult('Login Test', result.status === 'sucesso', result);
    } catch (error) {
      addResult('Login Test', false, { error: handleApiError(error) });
    }
    setIsLoading(false);
  };

  const testSignup = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testando cadastro...');
      const result = await authService.signup({
        nome: 'Teste',
        sobrenome: 'Mobile',
        email: `teste${Date.now()}@aquality.com`,
        senha: 'teste123'
      });
      
      addResult('Signup Test', result.status === 'sucesso', result);
    } catch (error) {
      addResult('Signup Test', false, { error: handleApiError(error) });
    }
    setIsLoading(false);
  };

  const testDevices = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testando dispositivos...');
      const result = await deviceService.listarDispositivos(1);
      
      addResult('Devices Test', result.status === 'sucesso', result);
    } catch (error) {
      addResult('Devices Test', false, { error: handleApiError(error) });
    }
    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>🧪 Debug & Test APIs</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.loginButton]} 
            onPress={testLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Test Login</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.signupButton]} 
            onPress={testSignup}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Test Signup</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.devicesButton]} 
            onPress={testDevices}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Test Devices</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.clearButton]} 
            onPress={clearResults}
          >
            <Text style={styles.buttonText}>Clear Results</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.resultsTitle}>📊 Test Results:</Text>
        
        {testResults.map((result, index) => (
          <View key={index} style={[
            styles.resultCard,
            result.success ? styles.successCard : styles.errorCard
          ]}>
            <Text style={styles.resultHeader}>
              {result.success ? '✅' : '❌'} {result.test} - {result.timestamp}
            </Text>
            <Text style={styles.resultDetails}>{result.details}</Text>
          </View>
        ))}
        
        {testResults.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Click the buttons above to test the APIs
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 50,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  buttonContainer: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  button: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: colors.water.primary,
  },
  signupButton: {
    backgroundColor: colors.success,
  },
  devicesButton: {
    backgroundColor: colors.warning,
  },
  clearButton: {
    backgroundColor: colors.mutedForeground,
  },
  buttonText: {
    color: colors.primaryForeground,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  resultsTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  resultCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  successCard: {
    backgroundColor: colors.success + '10',
    borderColor: colors.success,
  },
  errorCard: {
    backgroundColor: colors.danger + '10',
    borderColor: colors.danger,
  },
  resultHeader: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  resultDetails: {
    fontSize: typography.sizes.xs,
    color: colors.mutedForeground,
    fontFamily: 'monospace',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
});