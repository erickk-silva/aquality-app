/**
 * Serviços para alertas e notificações
 */

import { apiService, ApiResponse, Alerta } from './api';

export interface ListarAlertasParams {
  usuario_id: number;
  apenas_nao_lidos?: boolean;
  limit?: number;
  offset?: number;
}

export interface AlertasResponse {
  alertas: Alerta[];
  contadores: {
    total: number;
    nao_lidos: number;
    nao_resolvidos: number;
  };
  paginacao: {
    limit: number;
    offset: number;
    tem_mais: boolean;
  };
}

export interface AtualizarAlertaData {
  lido?: boolean;
  resolvido?: boolean;
}

class AlertService {
  /**
   * Lista alertas do usuário
   */
  async listarAlertas(params: ListarAlertasParams): Promise<ApiResponse<AlertasResponse>> {
    return apiService.get<AlertasResponse>('/alertas/gerenciar.php', {
      ...params,
      apenas_nao_lidos: params.apenas_nao_lidos ? 'true' : 'false'
    });
  }

  /**
   * Marca alerta como lido
   */
  async marcarComoLido(alertaId: number): Promise<ApiResponse<void>> {
    return apiService.put<void>(`/alertas/gerenciar.php?id=${alertaId}`, {
      lido: true
    });
  }

  /**
   * Marca alerta como resolvido
   */
  async marcarComoResolvido(alertaId: number): Promise<ApiResponse<void>> {
    return apiService.put<void>(`/alertas/gerenciar.php?id=${alertaId}`, {
      resolvido: true
    });
  }

  /**
   * Atualiza status do alerta
   */
  async atualizarAlerta(alertaId: number, data: AtualizarAlertaData): Promise<ApiResponse<void>> {
    return apiService.put<void>(`/alertas/gerenciar.php?id=${alertaId}`, data);
  }

  /**
   * Busca apenas alertas não lidos
   */
  async buscarAlertasNaoLidos(usuarioId: number): Promise<ApiResponse<AlertasResponse>> {
    return this.listarAlertas({
      usuario_id: usuarioId,
      apenas_nao_lidos: true,
      limit: 50
    });
  }

  /**
   * Busca contadores de alertas
   */
  async buscarContadores(usuarioId: number): Promise<ApiResponse<{ total: number; nao_lidos: number; nao_resolvidos: number }>> {
    const response = await this.listarAlertas({
      usuario_id: usuarioId,
      limit: 1 // Só precisamos dos contadores
    });

    if (response.status === 'sucesso' && response.dados) {
      return {
        status: 'sucesso',
        mensagem: 'Contadores obtidos com sucesso',
        dados: response.dados.contadores,
        timestamp: response.timestamp
      };
    }

    return response as any;
  }

  /**
   * Marca todos os alertas como lidos
   */
  async marcarTodosComoLidos(usuarioId: number): Promise<void> {
    const alertasResponse = await this.buscarAlertasNaoLidos(usuarioId);
    
    if (alertasResponse.status === 'sucesso' && alertasResponse.dados) {
      const promises = alertasResponse.dados.alertas.map(alerta => 
        this.marcarComoLido(alerta.id)
      );
      
      await Promise.all(promises);
    }
  }
}

export const alertService = new AlertService();