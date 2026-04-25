/**
 * engine.ts — Ядро умной тренировочной логики
 *
 * Содержит:
 * - Расчёт 1RM по формуле Бржики
 * - DUP параметры для типов дней (Сила / Гипертрофия / Мощность)
 * - Логику прогрессии (+2.5% к весу или +1 повторение)
 * - Расчёт нагрузки на мышечные группы
 * - Триггер Deload по RPE и динамике 1RM
 */

export type DayType = 'strength' | 'hypertrophy' | 'power';

export interface DUPTargets {
  repsMin: number;
  repsMax: number;
  intensityFactor: number; // от 1RM (0.0–1.0)
  restSeconds: number;
  sets: number;
  label: string;
  description: string;
  emoji: string;
}

export interface ProgressionSuggestion {
  targetWeight: number;
  targetReps: number;
  basis: 'history' | 'default';
  dayType: DayType;
}

export interface SetDataForCalc {
  weight: number;
  reps: number;
  rpe?: number | null;
}

export interface MuscleLoadResult {
  muscle: string;
  effectiveSets: number;
  percentOfMRV: number; // 0–100+ (MRV = 20 сетов/неделю)
}

// -----------------------------------------------
// 1. Расчёт одноповторного максимума (Бржика)
// 1RM = weight / (1.0278 - 0.0278 * reps)
// -----------------------------------------------
export function calcOneRM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  const oneRM = weight / (1.0278 - 0.0278 * reps);
  return Math.round(oneRM * 10) / 10;
}

// -----------------------------------------------
// 2. Параметры DUP по типу дня
// -----------------------------------------------
export const DUP_PARAMS: Record<DayType, DUPTargets> = {
  strength: {
    repsMin: 1,
    repsMax: 5,
    intensityFactor: 0.85, // 85% 1RM
    restSeconds: 180,       // 3 мин отдых
    sets: 4,
    label: 'Сила',
    description: 'Тяжело, малый объём',
    emoji: '💪',
  },
  hypertrophy: {
    repsMin: 8,
    repsMax: 12,
    intensityFactor: 0.68, // 68% 1RM
    restSeconds: 90,        // 1.5 мин отдых
    sets: 3,
    label: 'Гипертрофия',
    description: 'Умеренно, средний объём',
    emoji: '🏗️',
  },
  power: {
    repsMin: 3,
    repsMax: 5,
    intensityFactor: 0.55, // 55% 1RM (взрывные)
    restSeconds: 120,       // 2 мин отдых
    sets: 4,
    label: 'Мощность',
    description: 'Взрывная скорость',
    emoji: '⚡',
  },
};

// -----------------------------------------------
// 3. Расчёт целевого веса по типу дня и 1RM
// -----------------------------------------------
export function calcTargetFromOneRM(oneRM: number, dayType: DayType): {
  weight: number;
  reps: number;
} {
  const params = DUP_PARAMS[dayType];
  const rawWeight = oneRM * params.intensityFactor;
  // Округляем до 2.5 кг
  const weight = Math.round(rawWeight / 2.5) * 2.5;
  const reps = Math.round((params.repsMin + params.repsMax) / 2);
  return { weight, reps };
}

// -----------------------------------------------
// 4. Прогрессия: +2.5% веса или +1 повторение
// Если текущие reps >= repsMax → увеличить вес, сбросить reps к repsMin
// Если текущие reps < repsMax → +1 повторение
// -----------------------------------------------
export function calcNextTarget(
  lastWeight: number,
  lastReps: number,
  dayType: DayType,
  lastRPE?: number | null
): ProgressionSuggestion {
  const params = DUP_PARAMS[dayType];

  // Если нет истории
  if (!lastWeight || !lastReps) {
    return {
      targetWeight: 20,
      targetReps: params.repsMin,
      basis: 'default',
      dayType,
    };
  }

  let targetWeight = lastWeight;
  let targetReps = lastReps;

  // Если RPE был высоким (≥ 9) — не прогрессируем, повторяем
  if (lastRPE && lastRPE >= 9) {
    return {
      targetWeight: lastWeight,
      targetReps: lastReps,
      basis: 'history',
      dayType,
    };
  }

  if (lastReps >= params.repsMax) {
    // Увеличиваем вес на 2.5%, сбрасываем к минимуму повторений
    const newWeight = lastWeight * 1.025;
    targetWeight = Math.round(newWeight / 2.5) * 2.5;
    targetReps = params.repsMin;
  } else {
    // +1 повторение
    targetReps = lastReps + 1;
  }

  return {
    targetWeight,
    targetReps,
    basis: 'history',
    dayType,
  };
}

// -----------------------------------------------
// 5. Нагрузка на мышцу с коэффициентами
// effectiveSets = Σ(sets * коэффициент_мышцы)
// MRV = 20 эффективных сетов / неделю = 100%
// -----------------------------------------------
const MRV_SETS_PER_WEEK = 20;

export function calcMuscleLoad(
  completedSets: SetDataForCalc[],
  muscleWeights: Record<string, number>
): Record<string, MuscleLoadResult> {
  const results: Record<string, MuscleLoadResult> = {};

  for (const [muscle, coeff] of Object.entries(muscleWeights)) {
    const effectiveSets = completedSets.length * coeff;
    const percentOfMRV = (effectiveSets / MRV_SETS_PER_WEEK) * 100;
    results[muscle] = {
      muscle,
      effectiveSets: Math.round(effectiveSets * 10) / 10,
      percentOfMRV: Math.round(percentOfMRV),
    };
  }

  return results;
}

// -----------------------------------------------
// 6. Агрегация нагрузки по всем упражнениям за период
// -----------------------------------------------
export interface ExerciseSetsWithWeights {
  exerciseName: string;
  exerciseId: number;
  muscleWeights: Record<string, number>;
  doneSetsCount: number;
}

export function aggregateMuscleLoad(
  exercises: ExerciseSetsWithWeights[]
): Record<string, MuscleLoadResult> {
  const totals: Record<string, number> = {};

  for (const ex of exercises) {
    for (const [muscle, coeff] of Object.entries(ex.muscleWeights)) {
      totals[muscle] = (totals[muscle] || 0) + ex.doneSetsCount * coeff;
    }
  }

  const results: Record<string, MuscleLoadResult> = {};
  for (const [muscle, effectiveSets] of Object.entries(totals)) {
    results[muscle] = {
      muscle,
      effectiveSets: Math.round(effectiveSets * 10) / 10,
      percentOfMRV: Math.round((effectiveSets / MRV_SETS_PER_WEEK) * 100),
    };
  }

  return results;
}

// -----------------------------------------------
// 7. Triггер Deload
// Условия:
//   - Средний RPE за 2 недели > 8.5
//   - ИЛИ 1RM не растёт (delta < 1%) за 2 недели
// -----------------------------------------------
export interface DeloadAnalysis {
  shouldDeload: boolean;
  reason: string | null;
  avgRPE: number | null;
  oneRMDelta: number | null; // в процентах
}

export function analyzeDeloadNeed(
  recentSets: { rpe?: number | null; oneRM?: number | null; date: string }[]
): DeloadAnalysis {
  if (recentSets.length === 0) {
    return { shouldDeload: false, reason: null, avgRPE: null, oneRMDelta: null };
  }

  // RPE анализ
  const setsWithRPE = recentSets.filter(s => s.rpe != null && s.rpe > 0);
  const avgRPE = setsWithRPE.length > 0
    ? setsWithRPE.reduce((sum, s) => sum + (s.rpe || 0), 0) / setsWithRPE.length
    : null;

  // 1RM динамика
  const setsWithRM = recentSets
    .filter(s => s.oneRM != null && s.oneRM > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let oneRMDelta: number | null = null;
  if (setsWithRM.length >= 2) {
    const first = setsWithRM[0].oneRM!;
    const last = setsWithRM[setsWithRM.length - 1].oneRM!;
    oneRMDelta = first > 0 ? ((last - first) / first) * 100 : null;
  }

  const highRPE = avgRPE != null && avgRPE > 8.5;
  const stagnant = oneRMDelta != null && oneRMDelta < 1;

  let reason: string | null = null;
  if (highRPE && stagnant) {
    reason = `Средний RPE ${avgRPE!.toFixed(1)} и прогресс силы +${oneRMDelta!.toFixed(1)}%`;
  } else if (highRPE) {
    reason = `Средний RPE за 2 недели: ${avgRPE!.toFixed(1)} (норма ≤ 8.5)`;
  } else if (stagnant) {
    reason = `Прогресс 1RM за 2 недели: ${oneRMDelta!.toFixed(1)}% (стагнация)`;
  }

  return {
    shouldDeload: highRPE || stagnant,
    reason,
    avgRPE: avgRPE != null ? Math.round(avgRPE * 10) / 10 : null,
    oneRMDelta: oneRMDelta != null ? Math.round(oneRMDelta * 10) / 10 : null,
  };
}

// -----------------------------------------------
// 8. Цвет нагрузки по % MRV
// -----------------------------------------------
export function getMRVColor(percent: number): {
  bar: string;
  text: string;
  label: string;
  bg: string;
} {
  if (percent === 0) return { bar: '#374151', text: 'text-gray-500', label: 'Нет', bg: 'bg-gray-800' };
  if (percent < 30) return { bar: '#22c55e', text: 'text-green-400', label: 'Мало', bg: 'bg-green-900/30' };
  if (percent < 60) return { bar: '#4ade80', text: 'text-green-300', label: 'Хорошо', bg: 'bg-green-900/20' };
  if (percent < 80) return { bar: '#facc15', text: 'text-yellow-400', label: 'Оптим.', bg: 'bg-yellow-900/20' };
  if (percent < 100) return { bar: '#f97316', text: 'text-orange-400', label: 'Высок.', bg: 'bg-orange-900/20' };
  return { bar: '#ef4444', text: 'text-red-400', label: 'Перегруз', bg: 'bg-red-900/30' };
}

// -----------------------------------------------
// 9. Перевод ключей мышц на русский (расширенный)
// -----------------------------------------------
export const MUSCLE_LABELS_RU: Record<string, string> = {
  chest: 'Грудь',
  lats: 'Широчайшие',
  middle_back: 'Средняя спина',
  lower_back: 'Поясница',
  traps: 'Трапеции',
  rear_delt: 'Задняя дельта',
  front_delt: 'Передняя дельта',
  side_delt: 'Средняя дельта',
  shoulders: 'Плечи',
  biceps: 'Бицепс',
  triceps: 'Трицепс',
  forearms: 'Предплечья',
  quadriceps: 'Квадрицепс',
  hamstrings: 'Бицепс бедра',
  glutes: 'Ягодицы',
  calves: 'Икры',
  abdominals: 'Пресс',
  abductors: 'Отводящие',
  adductors: 'Приводящие',
};

export function muscleLabel(key: string): string {
  return MUSCLE_LABELS_RU[key] || key;
}
