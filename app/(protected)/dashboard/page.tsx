'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Droplet, AlertTriangle, Calendar, Package, CheckCircle2 } from 'lucide-react';
import api from '../../../src/services/api';
import { useToast } from '../../../src/contexts/ToastContext';
import { formatBloodType } from '../../../src/lib/blood-types';
import { INVENTORY_POLICY, isSupplyLow, summarizeStock, type StockSummary } from '../../../src/lib/inventory-policy';
import MovementsList from '../_components/MovementsList';

interface DashboardData {
  doadores: number;
  estoque: StockSummary;
  insumosBaixos: number;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  useEffect(() => {
    async function loadStats() {
      try {
        const [resDoadores, resBolsas, resInsumos] = await Promise.all([
          api.get('/donors/'),
          api.get('/inventory/bolsas'),
          api.get('/inventory/insumos'),
        ]);

        setData({
          doadores: resDoadores.data.length,
          // A API devolve uma linha por tipo sanguíneo; o total é a soma das quantidades
          // (antes o painel contava as linhas e mostrava o número de tipos).
          estoque: summarizeStock(resBolsas.data),
          insumosBaixos: resInsumos.data.filter((i: { quantidade: number }) => isSupplyLow(i.quantidade)).length,
        });
      } catch {
        error('Não foi possível carregar as estatísticas do painel.');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [error]);

  const estoque = data?.estoque;
  const temTipoCritico = !!estoque && estoque.belowMinimum.length > 0;
  const valor = (v: string | number | undefined) => (loading || v === undefined ? '—' : v);
  const plural = (n: number, um: string, varios: string) => (n === 1 ? um : varios);

  const cards = [
    {
      title: 'Total de Doadores', value: valor(data?.doadores), icon: Users, color: '#2563eb', bg: '#eff6ff',
      desc: 'Cadastrados no sistema', path: '/doadores', alerta: false,
    },
    {
      title: 'Bolsas em Estoque', value: valor(estoque?.totalBags), icon: Droplet, color: '#dc2626', bg: '#fef2f2',
      desc: 'Somando todos os tipos sanguíneos', path: '/estoque', alerta: false,
    },
    {
      title: 'Menor Estoque', value: valor(estoque && formatBloodType(estoque.lowest.tipo)), icon: AlertTriangle,
      color: '#d97706', bg: '#fffbeb', path: '/estoque', alerta: temTipoCritico,
      desc: estoque
        ? `${estoque.lowest.quantidade} ${plural(estoque.lowest.quantidade, 'bolsa disponível', 'bolsas disponíveis')}`
        : 'Tipo com menos bolsas',
    },
    {
      title: 'Insumos em Baixo Estoque', value: valor(data?.insumosBaixos), icon: Package, color: '#7c3aed', bg: '#f5f3ff',
      desc: `Itens com menos de ${INVENTORY_POLICY.lowSupplyThreshold} unidades`, path: '/insumos',
      alerta: !!data && data.insumosBaixos > 0,
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="text-h1" style={{ marginBottom: '0.5rem' }}>Painel de Controle</h1>
          <p className="text-muted">Visão geral do hemocentro</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--color-text-muted)' }}>
          <Calendar size={18} />
          <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      <div className="dashboard-stats">
        {cards.map((card) => (
          <Link key={card.title} href={card.path} className="stat-card-link">
            <div className="card stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div className="stat-icon" style={{ backgroundColor: card.bg, color: card.color }}>
                  <card.icon size={24} />
                </div>
                {card.alerta && <span className="badge badge-warning">Atenção</span>}
              </div>
              <p className="stat-title">{card.title}</p>
              <p className="stat-value">{card.value}</p>
              <p className="stat-desc">{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="dashboard-lower">
        <div className="card">
          <div className="panel-header">
            <h2 className="panel-title">Movimentações Recentes</h2>
            <Link href="/estoque" className="panel-link">Ver estoque</Link>
          </div>
          <MovementsList limite={6} />
        </div>

        {temTipoCritico ? (
          <div className="card notice-card notice-warning">
            <h2 className="panel-title">
              <AlertTriangle size={18} /> Avisos do Sistema
            </h2>
            <p>
              {estoque!.belowMinimum.length} {plural(estoque!.belowMinimum.length, 'tipo sanguíneo está', 'tipos sanguíneos estão')} abaixo
              do estoque mínimo de {INVENTORY_POLICY.minimumBagsPerType} bolsas:
            </p>
            <ul className="notice-list">
              {estoque!.belowMinimum.map(t => (
                <li key={t.tipo}>
                  <strong>{formatBloodType(t.tipo)}</strong>
                  <span>{t.quantidade === 0 ? 'sem estoque' : `${t.quantidade} ${plural(t.quantidade, 'bolsa', 'bolsas')}`}</span>
                </li>
              ))}
            </ul>
            <Link href="/doadores" className="btn btn-secondary notice-action">
              Ver Lista de Doadores
            </Link>
          </div>
        ) : (
          <div className="card notice-card notice-ok">
            <h2 className="panel-title">
              <CheckCircle2 size={18} /> Avisos do Sistema
            </h2>
            <p>
              {loading
                ? 'Verificando o estoque...'
                : `Todos os tipos sanguíneos estão com pelo menos ${INVENTORY_POLICY.minimumBagsPerType} bolsas em estoque.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
