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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
          Comentarios y Notas
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <Label htmlFor="comentarios" className="text-sm sm:text-base font-medium">
            Observaciones adicionales (opcional)
          </Label>
          <Textarea
            id="comentarios"
            placeholder={placeholder || "Agregar cualquier información adicional sobre el arriendo..."}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            maxLength={1000}
            className="resize-none min-h-[100px] text-base leading-relaxed"
          />
          <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
            <span>Máximo 1000 caracteres</span>
            <span className="font-mono">{value.length}/1000</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}