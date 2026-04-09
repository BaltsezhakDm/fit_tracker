import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const INITIAL_WORKOUTS = [
  { id: '1', date: '2026-04-01', exercise: 'Жим лежа', sets: [{ reps: 10, weight: 60 }, { reps: 8, weight: 65 }, { reps: 6, weight: 70 }] },
  { id: '2', date: '2026-04-01', exercise: 'Приседания со штангой', sets: [{ reps: 10, weight: 80 }, { reps: 8, weight: 90 }] },
  { id: '3', date: '2026-04-03', exercise: 'Жим лежа', sets: [{ reps: 10, weight: 65 }, { reps: 8, weight: 70 }, { reps: 5, weight: 75 }] },
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

export function useAppData() {
  const [workouts, setWorkouts] = useState(() => {
    const saved = localStorage.getItem('workouts');
    return saved ? JSON.parse(saved) : INITIAL_WORKOUTS;
  });
  const [programs, setPrograms] = useState(() => {
    const saved = localStorage.getItem('programs');
    return saved ? JSON.parse(saved) : INITIAL_PROGRAMS;
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
        const [workoutsRes, programsRes] = await Promise.all([
          supabase.from('workouts').select('*').eq('user_id', userId),
          supabase.from('programs').select('*').eq('user_id', userId)
        ]);

        if (workoutsRes.error) throw workoutsRes.error;
        if (programsRes.error) throw programsRes.error;

        if (workoutsRes.data && workoutsRes.data.length > 0) {
          // Supabase returns stringified jsonb sometimes depending on client, usually it parses it.
          setWorkouts(workoutsRes.data);
          localStorage.setItem('workouts', JSON.stringify(workoutsRes.data));
        }

        if (programsRes.data && programsRes.data.length > 0) {
          setPrograms(programsRes.data);
          localStorage.setItem('programs', JSON.stringify(programsRes.data));
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
      images: ex.images
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

  return {
    workouts,
    programs,
    isDbLoading,
    saveWorkoutSession,
    saveProgram,
    deleteWorkout,
    deleteProgram
  };
}
