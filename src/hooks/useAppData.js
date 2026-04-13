import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const INITIAL_WORKOUTS = [
  { id: '1', date: '2026-04-01', exercise: 'Жим лежа', primaryMuscles: ['chest'], sets: [{ reps: 10, weight: 60 }, { reps: 8, weight: 65 }, { reps: 6, weight: 70 }] },
  { id: '2', date: '2026-04-01', exercise: 'Приседания со штангой', primaryMuscles: ['quadriceps'], sets: [{ reps: 10, weight: 80 }, { reps: 8, weight: 90 }] },
  { id: '3', date: '2026-04-03', exercise: 'Жим лежа', primaryMuscles: ['chest'], sets: [{ reps: 10, weight: 65 }, { reps: 8, weight: 70 }, { reps: 5, weight: 75 }] },
];

const INITIAL_PROGRAMS = [
  {
    id: '1',
    name: 'Фуллбоди база',
    exercises: [
      { name: 'Приседания со штангой', targetSets: 3, targetReps: 10, images: ['Barbell_Full_Squat/0.jpg', 'Barbell_Full_Squat/1.jpg'] },
      { name: 'Жим лежа', targetSets: 3, targetReps: 10, images: ['Barbell_Bench_Press/0.jpg', 'Barbell_Bench_Press/1.jpg'] },
      { name: 'Подтягивания', targetSets: 3, targetReps: 8, images: ['Pullup/0.jpg', 'Pullup/1.jpg'] },
    ]
  }
];

import { MUSCLE_TRANSLATIONS } from '../constants';

export function useAppData() {
  const [workouts, setWorkouts] = useState(() => {
    const saved = localStorage.getItem('workouts');
    return saved ? JSON.parse(saved) : INITIAL_WORKOUTS;
  });
  const [programs, setPrograms] = useState(() => {
    const saved = localStorage.getItem('programs');
    return saved ? JSON.parse(saved) : INITIAL_PROGRAMS;
  });
  const [customExercises, setCustomExercises] = useState(() => {
    const saved = localStorage.getItem('customExercises');
    return saved ? JSON.parse(saved) : [];
  });
  const [isDbLoading, setIsDbLoading] = useState(true);

  const getUserId = useCallback(() => {
    const tgUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    return tgUserId ? `tg-${tgUserId}` : 'anonymous-user';
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      const userId = getUserId();
      setIsDbLoading(true);

      try {
        const [workoutsRes, programsRes, customExRes] = await Promise.all([
          supabase.from('workouts').select('*').eq('user_id', userId),
          supabase.from('programs').select('*').eq('user_id', userId),
          supabase.from('custom_exercises').select('*').eq('user_id', userId)
        ]);

        if (workoutsRes.error) throw workoutsRes.error;
        if (programsRes.error) throw programsRes.error;
        if (customExRes.error) throw customExRes.error;

        if (workoutsRes.data && workoutsRes.data.length > 0) {
          setWorkouts(workoutsRes.data);
          localStorage.setItem('workouts', JSON.stringify(workoutsRes.data));
        }

        if (programsRes.data && programsRes.data.length > 0) {
          setPrograms(programsRes.data);
          localStorage.setItem('programs', JSON.stringify(programsRes.data));
        }

        if (customExRes.data && customExRes.data.length > 0) {
          setCustomExercises(customExRes.data);
          localStorage.setItem('customExercises', JSON.stringify(customExRes.data));
        }
      } catch (error) {
        console.error("Ошибка загрузки данных из Supabase:", error);
      } finally {
        setIsDbLoading(false);
      }
    };

    fetchInitialData();
  }, [getUserId]);

  const saveWorkoutSession = async (sessionExercises, date, duration) => {
    const userId = getUserId();
    const newWorkouts = sessionExercises.map((ex, index) => ({
      id: Date.now().toString() + '-' + index,
      user_id: userId,
      date: date,
      exercise: ex.name,
      sets: ex.sets,
      duration: duration,
      images: ex.images,
      primaryMuscles: ex.primaryMuscles
    }));

    const updatedWorkouts = [...newWorkouts, ...workouts];
    setWorkouts(updatedWorkouts);
    localStorage.setItem('workouts', JSON.stringify(updatedWorkouts));

    try {
      const { error } = await supabase.from('workouts').insert(newWorkouts);
      if (error) throw error;
    } catch (error) {
      console.error("Ошибка сохранения тренировки:", error);
    }
  };

  const saveProgram = async (newProgram) => {
    const userId = getUserId();
    const progToSave = {
      ...newProgram,
      id: Date.now().toString(),
      user_id: userId
    };

    const updatedPrograms = [...programs, progToSave];
    setPrograms(updatedPrograms);
    localStorage.setItem('programs', JSON.stringify(updatedPrograms));

    try {
      const { error } = await supabase.from('programs').insert([progToSave]);
      if (error) throw error;
    } catch (error) {
      console.error("Ошибка сохранения программы:", error);
    }
  };

  const deleteWorkout = async (id) => {
    const updatedWorkouts = workouts.filter(w => w.id !== id);
    setWorkouts(updatedWorkouts);
    localStorage.setItem('workouts', JSON.stringify(updatedWorkouts));

    try {
      const { error } = await supabase.from('workouts').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error("Ошибка удаления тренировки:", error);
    }
  };

  const deleteProgram = async (id) => {
    const updatedPrograms = programs.filter(p => p.id !== id);
    setPrograms(updatedPrograms);
    localStorage.setItem('programs', JSON.stringify(updatedPrograms));

    try {
      const { error } = await supabase.from('programs').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error("Ошибка удаления программы:", error);
    }
  };

  const saveCustomExercise = async (exercise) => {
    const userId = getUserId();
    const newEx = {
      ...exercise,
      id: exercise.id || Date.now().toString(),
      user_id: userId,
      is_custom: true
    };

    // If it's an update
    const index = customExercises.findIndex(ex => ex.id === newEx.id || (ex.api_id && ex.api_id === newEx.api_id));
    let updatedCustom;
    if (index >= 0) {
      updatedCustom = [...customExercises];
      updatedCustom[index] = newEx;
    } else {
      updatedCustom = [newEx, ...customExercises];
    }

    setCustomExercises(updatedCustom);
    localStorage.setItem('customExercises', JSON.stringify(updatedCustom));

    try {
      const { error } = await supabase.from('custom_exercises').upsert([newEx]);
      if (error) throw error;
    } catch (error) {
      console.error("Ошибка сохранения упражнения:", error);
    }
    return newEx;
  };

  const deleteCustomExercise = async (id) => {
    const updated = customExercises.filter(ex => ex.id !== id);
    setCustomExercises(updated);
    localStorage.setItem('customExercises', JSON.stringify(updated));

    try {
      const { error } = await supabase.from('custom_exercises').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error("Ошибка удаления упражнения:", error);
    }
  };

  return {
    workouts,
    programs,
    customExercises,
    isDbLoading,
    saveWorkoutSession,
    saveProgram,
    saveCustomExercise,
    deleteWorkout,
    deleteProgram,
    deleteCustomExercise,
    getProgressionAlerts: (sessionExercises) => {
      const alerts = [];
      sessionExercises.forEach(ex => {
        const history = workouts
          .filter(w => w.exercise === ex.name)
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 2);

        if (history.length === 2) {
          const allTargetMet = history.every(h =>
            h.sets.every(s => s.reps >= 10) // Simplified logic: if reps >= 10 in all sets for 2 sessions
          );
          if (allTargetMet) {
            alerts.push(`В упражнении "${ex.name}" пора увеличить вес на 2.5 кг!`);
          }
        }
      });
      return alerts;
    },
    getGapAnalysis: () => {
      const lastSevenDays = new Date();
      lastSevenDays.setDate(lastSevenDays.getDate() - 7);

      const recentWorkouts = workouts.filter(w => new Date(w.date) >= lastSevenDays);
      const trainedMuscles = new Set();
      recentWorkouts.forEach(w => {
        if (w.primaryMuscles) w.primaryMuscles.forEach(m => trainedMuscles.add(m));
      });

      const allMuscles = Object.keys(MUSCLE_TRANSLATIONS);
      const missingMuscles = allMuscles.filter(m => !trainedMuscles.has(m));

      if (missingMuscles.length > 0) {
        // Suggest one from missing
        const suggested = missingMuscles[0];
        return {
          muscle: suggested,
          translated: MUSCLE_TRANSLATIONS[suggested],
          message: `Вы давно не тренировали ${MUSCLE_TRANSLATIONS[suggested]}. Рекомендуем добавить упражнение на эту группу.`
        };
      }
      return null;
    },
    getMergedExercises: useCallback((apiExercises) => {
      if (!apiExercises) return [];
      const merged = [...apiExercises];
      customExercises.forEach(custom => {
        if (custom.api_id) {
          const index = merged.findIndex(ex => ex.id === custom.api_id);
          if (index >= 0) {
            merged[index] = { ...merged[index], ...custom };
          }
        } else {
          // If it's a completely new exercise (no api_id)
          // Avoid duplicates if already in list by name/id
          if (!merged.find(ex => ex.id === custom.id)) {
            merged.push(custom);
          }
        }
      });
      return merged;
    }, [customExercises])
  };
}
