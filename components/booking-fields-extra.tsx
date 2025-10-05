// Componentes adicionales para los nuevos campos de booking
"use client";

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare } from 'lucide-react';
import type { PeriodoTipo } from '@/lib/types/booking-types';

interface PeriodoSelectorProps {
  value?: PeriodoTipo;
  onChange: (periodo: PeriodoTipo) => void;
}

export function PeriodoSelector({ value, onChange }: PeriodoSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        Tipo de Período
      </Label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange('dia')}
          className={`flex-1 p-3 rounded-lg border text-center transition-all ${
            value === 'dia' 
              ? 'border-blue-500 bg-blue-50 text-blue-700' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="font-medium">Por Día</div>
          <div className="text-sm text-gray-500">Arriendo diario</div>
        </button>
        <button
          type="button"
          onClick={() => onChange('mes')}
          className={`flex-1 p-3 rounded-lg border text-center transition-all ${
            value === 'mes' 
              ? 'border-blue-500 bg-blue-50 text-blue-700' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="font-medium">Por Mes</div>
          <div className="text-sm text-gray-500">Arriendo mensual</div>
        </button>
      </div>
      {value && (
        <Badge variant="secondary" className="mt-2">
          Período seleccionado: {value === 'dia' ? 'Diario' : 'Mensual'}
        </Badge>
      )}
    </div>
  );
}

interface ComentariosFieldProps {
  value?: string;
  onChange: (comentarios: string) => void;
  placeholder?: string;
}

export function ComentariosField({ value = '', onChange, placeholder }: ComentariosFieldProps) {
  return (
    <Card className="border-muted">
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
          <MessageSquare className="h-3 w-3 sm:h-5 sm:w-5" />
          <span className="text-xs sm:text-base">Comentarios</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 sm:space-y-3">
          <Label htmlFor="comentarios" className="text-xs sm:text-base font-medium hidden sm:block">
            Observaciones adicionales (opcional)
          </Label>
          <Textarea
            id="comentarios"
            placeholder={placeholder || "Agregar información adicional..."}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            maxLength={1000}
            className="resize-none min-h-[60px] sm:min-h-[100px] text-sm sm:text-base leading-relaxed"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="hidden sm:inline">Máximo 1000 caracteres</span>
            <span className="sm:hidden">Max 1000</span>
            <span className="font-mono text-xs">{value.length}/1000</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}