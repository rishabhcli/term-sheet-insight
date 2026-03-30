import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { z } from 'zod';
import { useSimulatorStore } from '../state/simulator-store';
import type { ScenarioDefinition, BaseShareholder } from '../domain/types';
import { formatCurrency } from '../domain/formatting';
import { Plus, Trash2, Wand2, AlertCircle } from 'lucide-react';

// ── Validation Schema ──

const shareholderSchema = z.object({
  id: z.string(),
  label: z.string().trim().min(1, 'Name required').max(50, 'Max 50 chars'),
  shares: z.number().int().min(1, 'Must be at least 1'),
  classType: z.enum(['common', 'preferred', 'pool', 'advisor']),
  displayOrder: z.number(),
});

const scenarioFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60, 'Max 60 characters'),
  roundLabel: z.string().trim().min(1, 'Round label required').max(30, 'Max 30 chars'),
  description: z.string().trim().max(300, 'Max 300 characters').optional(),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  preMoneyValuation: z.number().min(100_000, 'Min $100K').max(10_000_000_000, 'Max $10B'),
  investmentAmount: z.number().min(10_000, 'Min $10K').max(5_000_000_000, 'Max $5B'),
  baseShareholders: z.array(shareholderSchema).min(1, 'At least one shareholder required').max(10, 'Max 10 shareholders'),
  exitRangeMin: z.number().min(0, 'Min exit must be ≥ 0'),
  exitRangeMax: z.number().min(1, 'Max exit must be > 0'),
  exitRangeStep: z.number().min(1, 'Step must be > 0'),
}).refine(d => d.investmentAmount < d.preMoneyValuation, {
  message: 'Investment should be less than pre-money valuation',
  path: ['investmentAmount'],
}).refine(d => d.exitRangeMax > d.exitRangeMin, {
  message: 'Max exit must be greater than min exit',
  path: ['exitRangeMax'],
});

type FormData = z.infer<typeof scenarioFormSchema>;

// ── Helpers ──

const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };

function makeId(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'custom';
}

const defaultShareholders: BaseShareholder[] = [
  { id: 'founders', label: 'Founders', shares: 8_000_000, classType: 'common', displayOrder: 1 },
  { id: 'pool', label: 'Employee Pool', shares: 1_000_000, classType: 'pool', displayOrder: 2 },
  { id: 'advisors', label: 'Advisors', shares: 500_000, classType: 'advisor', displayOrder: 3 },
];

// ── Component ──

export function ScenarioBuilderForm() {
  const navigate = useNavigate();
  const loadScenario = useSimulatorStore(s => s.loadScenario);
  const reducedMotion = useReducedMotion();

  const [name, setName] = useState('');
  const [roundLabel, setRoundLabel] = useState('Series A');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');
  const [preMoneyValuation, setPreMoneyValuation] = useState(20_000_000);
  const [investmentAmount, setInvestmentAmount] = useState(5_000_000);
  const [shareholders, setShareholders] = useState<BaseShareholder[]>(defaultShareholders);
  const [exitMin, setExitMin] = useState(10_000_000);
  const [exitMax, setExitMax] = useState(100_000_000);
  const [exitStep, setExitStep] = useState(5_000_000);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addShareholder = () => {
    if (shareholders.length >= 10) return;
    setShareholders(prev => [
      ...prev,
      {
        id: `holder-${Date.now()}`,
        label: '',
        shares: 500_000,
        classType: 'common',
        displayOrder: prev.length + 1,
      },
    ]);
  };

  const removeShareholder = (idx: number) => {
    if (shareholders.length <= 1) return;
    setShareholders(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, displayOrder: i + 1 })));
  };

  const updateShareholder = (idx: number, patch: Partial<BaseShareholder>) => {
    setShareholders(prev =>
      prev.map((s, i) => {
        if (i !== idx) return s;
        const updated = { ...s, ...patch };
        if (patch.label !== undefined) {
          updated.id = makeId(patch.label) || s.id;
        }
        return updated;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formData: FormData = {
      name,
      roundLabel,
      description: description || undefined,
      currency,
      preMoneyValuation,
      investmentAmount,
      baseShareholders: shareholders,
      exitRangeMin: exitMin,
      exitRangeMax: exitMax,
      exitRangeStep: exitStep,
    };

    const result = scenarioFormSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        const key = issue.path.join('.');
        fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const now = new Date().toISOString();
    const scenario: ScenarioDefinition = {
      id: `custom-${makeId(name)}-${Date.now()}`,
      name: result.data.name,
      roundLabel: result.data.roundLabel,
      description: result.data.description || '',
      currency: result.data.currency,
      preMoneyValuation: result.data.preMoneyValuation,
      investmentAmount: result.data.investmentAmount,
      baseShareholders: result.data.baseShareholders,
      cleanTerms: {
        liquidationPreferenceMultiple: 1,
        participationMode: 'non-participating',
        optionPoolTargetPostMoneyPct: 0,
        optionPoolTiming: 'none',
        board: { founderSeats: 2, investorSeats: 1, independentSeats: 0 },
        vetoRights: [],
      },
      exitRange: {
        min: result.data.exitRangeMin,
        max: result.data.exitRangeMax,
        step: result.data.exitRangeStep,
        default: Math.round((result.data.exitRangeMin + result.data.exitRangeMax) / 2 / result.data.exitRangeStep) * result.data.exitRangeStep,
      },
      isPreset: false,
      createdAt: now,
      updatedAt: now,
    };

    loadScenario(scenario);
    navigate('/');
  };

  const fadeIn = reducedMotion ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25 } };

  const inputClass = 'w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm text-foreground font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors';
  const labelClass = 'block text-xs font-display uppercase tracking-wider text-muted-foreground mb-1.5';
  const errorClass = 'text-xs text-clause-control mt-1 flex items-center gap-1';

  const FieldError = ({ field }: { field: string }) => {
    const msg = errors[field];
    if (!msg) return null;
    return (
      <motion.p className={errorClass} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
        <AlertCircle className="w-3 h-3" /> {msg}
      </motion.p>
    );
  };

  return (
    <motion.form onSubmit={handleSubmit} className="space-y-8" {...fadeIn}>
      {/* ── Basic Info ── */}
      <section className="space-y-4">
        <h2 className="font-display text-sm uppercase tracking-wider text-primary">Deal Basics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="name">Company Name</label>
            <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Acme Corp" className={inputClass} maxLength={60} />
            <FieldError field="name" />
          </div>
          <div>
            <label className={labelClass} htmlFor="roundLabel">Round</label>
            <select id="roundLabel" value={roundLabel} onChange={e => setRoundLabel(e.target.value)} className={inputClass}>
              <option>Pre-Seed</option>
              <option>Seed</option>
              <option>Series A</option>
              <option>Series B</option>
              <option>Series C</option>
              <option>Bridge</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="description">Description (optional)</label>
          <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief deal context..." className={`${inputClass} resize-none h-20`} maxLength={300} />
          <FieldError field="description" />
        </div>
      </section>

      {/* ── Financials ── */}
      <section className="space-y-4">
        <h2 className="font-display text-sm uppercase tracking-wider text-primary">Financials</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass} htmlFor="currency">Currency</label>
            <select id="currency" value={currency} onChange={e => setCurrency(e.target.value as 'USD' | 'EUR' | 'GBP')} className={inputClass}>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="preMoney">Pre-Money Valuation</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{CURRENCY_SYMBOLS[currency]}</span>
              <input id="preMoney" type="number" value={preMoneyValuation} onChange={e => setPreMoneyValuation(Number(e.target.value))} className={`${inputClass} pl-7`} min={100_000} max={10_000_000_000} step={100_000} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(preMoneyValuation)}</p>
            <FieldError field="preMoneyValuation" />
          </div>
          <div>
            <label className={labelClass} htmlFor="investment">Investment Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{CURRENCY_SYMBOLS[currency]}</span>
              <input id="investment" type="number" value={investmentAmount} onChange={e => setInvestmentAmount(Number(e.target.value))} className={`${inputClass} pl-7`} min={10_000} max={5_000_000_000} step={10_000} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(investmentAmount)}</p>
            <FieldError field="investmentAmount" />
          </div>
        </div>
      </section>

      {/* ── Shareholders ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm uppercase tracking-wider text-primary">Cap Table</h2>
          <button
            type="button"
            onClick={addShareholder}
            disabled={shareholders.length >= 10}
            className="flex items-center gap-1 text-xs font-display text-primary hover:text-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add holder
          </button>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {shareholders.map((sh, idx) => (
              <motion.div
                key={sh.id + idx}
                layout
                initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="grid grid-cols-[1fr_120px_120px_32px] gap-2 items-end bg-card/50 border border-border rounded-md p-3"
              >
                <div>
                  <label className={labelClass}>Name</label>
                  <input
                    type="text"
                    value={sh.label}
                    onChange={e => updateShareholder(idx, { label: e.target.value })}
                    placeholder="e.g. Founders"
                    className={inputClass}
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className={labelClass}>Shares</label>
                  <input
                    type="number"
                    value={sh.shares}
                    onChange={e => updateShareholder(idx, { shares: Number(e.target.value) })}
                    className={inputClass}
                    min={1}
                    step={1000}
                  />
                </div>
                <div>
                  <label className={labelClass}>Class</label>
                  <select
                    value={sh.classType}
                    onChange={e => updateShareholder(idx, { classType: e.target.value as BaseShareholder['classType'] })}
                    className={inputClass}
                  >
                    <option value="common">Common</option>
                    <option value="preferred">Preferred</option>
                    <option value="pool">Pool</option>
                    <option value="advisor">Advisor</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeShareholder(idx)}
                  disabled={shareholders.length <= 1}
                  className="p-1.5 text-muted-foreground hover:text-clause-control disabled:opacity-30 transition-colors self-end mb-0.5"
                  aria-label={`Remove ${sh.label || 'shareholder'}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <FieldError field="baseShareholders" />
      </section>

      {/* ── Exit Range ── */}
      <section className="space-y-4">
        <h2 className="font-display text-sm uppercase tracking-wider text-primary">Exit Range</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Min Exit</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{CURRENCY_SYMBOLS[currency]}</span>
              <input type="number" value={exitMin} onChange={e => setExitMin(Number(e.target.value))} className={`${inputClass} pl-7`} min={0} step={1_000_000} />
            </div>
            <FieldError field="exitRangeMin" />
          </div>
          <div>
            <label className={labelClass}>Max Exit</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{CURRENCY_SYMBOLS[currency]}</span>
              <input type="number" value={exitMax} onChange={e => setExitMax(Number(e.target.value))} className={`${inputClass} pl-7`} min={1} step={1_000_000} />
            </div>
            <FieldError field="exitRangeMax" />
          </div>
          <div>
            <label className={labelClass}>Step</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{CURRENCY_SYMBOLS[currency]}</span>
              <input type="number" value={exitStep} onChange={e => setExitStep(Number(e.target.value))} className={`${inputClass} pl-7`} min={1} step={100_000} />
            </div>
            <FieldError field="exitRangeStep" />
          </div>
        </div>
      </section>

      {/* ── Submit ── */}
      <div className="flex gap-3 pt-2">
        <motion.button
          type="submit"
          whileHover={reducedMotion ? {} : { scale: 1.02 }}
          whileTap={reducedMotion ? {} : { scale: 0.98 }}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-display text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors shadow-glow"
        >
          <Wand2 className="w-4 h-4" />
          Launch Simulator
        </motion.button>
        <button
          type="button"
          onClick={() => navigate('/scenarios')}
          className="px-5 py-2.5 border border-border text-muted-foreground font-display text-sm rounded-md hover:bg-secondary/50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.form>
  );
}
