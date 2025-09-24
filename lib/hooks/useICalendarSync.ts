// lib/hooks/useICalendarSync.ts
import { useState, useEffect, useCallback } from 'react';
import { ICalendarService } from '@/lib/services/icalendar.service';
import { useArriendoOperaciones } from './useFirestore';

interface SyncConfig {
  urls: string[];
  interval: number; // en minutos
  enabled: boolean;
}

interface SyncStatus {
  lastSync: Date | null;
  nextSync: Date | null;
  syncing: boolean;
  error: string | null;
  totalSynced: number;
}

const DEFAULT_CONFIG: SyncConfig = {
  urls: [],
  interval: 60, // 1 hora
  enabled: false
};

const STORAGE_KEY = 'icalendar-sync-config';
const STATUS_KEY = 'icalendar-sync-status';

export function useICalendarAutoSync() {
  const [config, setConfig] = useState<SyncConfig>(DEFAULT_CONFIG);
  const [status, setStatus] = useState<SyncStatus>({
    lastSync: null,
    nextSync: null,
    syncing: false,
    error: null,
    totalSynced: 0
  });

  const { crear } = useArriendoOperaciones();

  // Cargar configuración del localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem(STORAGE_KEY);
    const savedStatus = localStorage.getItem(STATUS_KEY);
    
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (error) {
        console.error('Error loading sync config:', error);
      }
    }

    if (savedStatus) {
      try {
        const parsed = JSON.parse(savedStatus);
        setStatus({
          ...parsed,
          lastSync: parsed.lastSync ? new Date(parsed.lastSync) : null,
          nextSync: parsed.nextSync ? new Date(parsed.nextSync) : null,
        });
      } catch (error) {
        console.error('Error loading sync status:', error);
      }
    }
  }, []);

  // Guardar configuración en localStorage
  const updateConfig = useCallback((newConfig: Partial<SyncConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfig));
  }, [config]);

  // Guardar status en localStorage
  const updateStatus = useCallback((newStatus: Partial<SyncStatus>) => {
    const updatedStatus = { ...status, ...newStatus };
    setStatus(updatedStatus);
    localStorage.setItem(STATUS_KEY, JSON.stringify({
      ...updatedStatus,
      lastSync: updatedStatus.lastSync?.toISOString(),
      nextSync: updatedStatus.nextSync?.toISOString(),
    }));
  }, [status]);

  // Función principal de sincronización
  const performSync = useCallback(async () => {
    if (config.urls.length === 0 || status.syncing) return;

    updateStatus({ syncing: true, error: null });

    try {
      let totalSynced = 0;

      for (const url of config.urls) {
        try {
          // Sincronizar desde cada URL
          const reservations = await ICalendarService.syncFromUrl(url);
          
          // Convertir y crear reservas
          for (const reservation of reservations) {
            try {
              const booking = ICalendarService.convertAirbnbToBooking(reservation);
              await crear(booking);
              totalSynced++;
            } catch (error) {
              console.error('Error creating booking from reservation:', error);
            }
          }
        } catch (error) {
          console.error(`Error syncing from URL ${url}:`, error);
        }
      }

      const now = new Date();
      const nextSync = new Date(now.getTime() + config.interval * 60 * 1000);

      updateStatus({
        syncing: false,
        lastSync: now,
        nextSync: nextSync,
        totalSynced,
        error: null
      });

    } catch (error) {
      updateStatus({
        syncing: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }, [config.urls, config.interval, status.syncing, crear, updateStatus]);

  // Configurar intervalo automático
  useEffect(() => {
    if (!config.enabled || config.urls.length === 0) return;

    const intervalMs = config.interval * 60 * 1000;
    const intervalId = window.setInterval(performSync, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [config.enabled, config.interval, config.urls.length, performSync]);

  // Sincronización manual
  const syncNow = useCallback(() => {
    performSync();
  }, [performSync]);

  // Agregar URL de sincronización
  const addSyncUrl = useCallback((url: string) => {
    if (!config.urls.includes(url)) {
      updateConfig({ urls: [...config.urls, url] });
    }
  }, [config.urls, updateConfig]);

  // Remover URL de sincronización
  const removeSyncUrl = useCallback((url: string) => {
    updateConfig({ urls: config.urls.filter(u => u !== url) });
  }, [config.urls, updateConfig]);

  // Habilitar/deshabilitar sincronización automática
  const toggleAutoSync = useCallback((enabled: boolean) => {
    updateConfig({ enabled });
    
    if (enabled) {
      // Programar próxima sincronización
      const nextSync = new Date(Date.now() + config.interval * 60 * 1000);
      updateStatus({ nextSync });
    } else {
      updateStatus({ nextSync: null });
    }
  }, [config.interval, updateConfig, updateStatus]);

  // Cambiar intervalo de sincronización
  const setSyncInterval = useCallback((interval: number) => {
    updateConfig({ interval });
    
    if (config.enabled) {
      const nextSync = new Date(Date.now() + interval * 60 * 1000);
      updateStatus({ nextSync });
    }
  }, [config.enabled, updateConfig, updateStatus]);

  return {
    config,
    status,
    syncNow,
    addSyncUrl,
    removeSyncUrl,
    toggleAutoSync,
    setSyncInterval,
  };
}