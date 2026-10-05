'use client';

import { useEffect, useState } from 'react';
import { ArrowDownToLine, Truck, Ban } from 'lucide-react';
import api from '../../../src/services/api';
import { formatBloodType, speakBloodType } from '../../../src/lib/blood-types';
import type { StockMovement, MovementKind } from '../../../src/lib/stock-movements';

const KIND_INFO: Record<MovementKind, { label: string; icon: typeof Truck; className: string }> = {
  ENTRADA: { label: 'Entrada', icon: ArrowDownToLine, className: 'movement-in' },
  DESPACHADA: { label: 'Despacho', icon: Truck, className: 'movement-out' },
  DESCARTADA: { label: 'Descarte', icon: Ban, className: 'movement-discard' },
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

interface Props {
  limite?: number;
  /** Mude o valor para recarregar a lista (ex.: depois de registrar uma saída). */
  refreshKey?: number;
}

/** Últimas entradas e saídas de bolsas (TP4 — Funcionalidade 1). */
export default function MovementsList({ limite = 6, refreshKey = 0 }: Props) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    setStatus('loading');
    api.get(`/inventory/movimentacoes?limite=${limite}`)
      .then(res => { if (active) { setMovements(res.data); setStatus('ok'); } })
      .catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [limite, refreshKey]);

  if (status === 'loading') return <p className="movements-empty" role="status">Carregando movimentações...</p>;
  if (status === 'error') return <p className="movements-empty field-error" role="alert">Não foi possível carregar as movimentações.</p>;
  if (movements.length === 0) return <p className="movements-empty">Nenhuma movimentação registrada ainda.</p>;

  return (
    <ul className="movements-list">
      {movements.map(m => {
        const info = KIND_INFO[m.tipo];
        const plural = m.quantidade === 1 ? 'bolsa' : 'bolsas';
        return (
          <li key={`${m.tipo}-${m.tipo_sangue}-${m.data}-${m.observacoes ?? ''}`} className={`movement-item ${info.className}`}>
            <span className="movement-icon" aria-hidden="true"><info.icon size={18} /></span>
            <div className="movement-body">
              <p>
                <strong>{info.label}</strong>
                {' de '}{m.quantidade} {plural}{' de '}
                <span aria-hidden="true">{formatBloodType(m.tipo_sangue)}</span>
                <span className="sr-only">{speakBloodType(m.tipo_sangue)}</span>
              </p>
              {m.observacoes && <p className="movement-note">{m.observacoes}</p>}
            </div>
            <time className="movement-time" dateTime={m.data}>{formatDateTime(m.data)}</time>
          </li>
        );
      })}
    </ul>
  );
}
