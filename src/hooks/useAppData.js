import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

const INITIAL_WORKOUTS = [
  { id: 1, date: '2026-04-01', exercise: 'Жим лежа', sets: [{ reps: 10, weight: 60 }, { reps: 8, weight: 65 }, { reps: 6, weight: 70 }] },
  { id: 2, date: '2026-04-01', exercise: 'Приседания со штангой', sets: [{ reps: 10, weight: 80 }, { reps: 8, weight: 90 }] },
  { id: 3, date: '2026-04-03', exercise: 'Жим лежа', sets: [{ reps: 10, weight: 65 }, { reps: 8, weight: 70 }, { reps: 5, weight: 75 }] },
];

const INITIAL_PROGRAMS = [
  {
    id: 1,
    name: 'Фуллбоди база',
    exercises: [
      { name: 'Приседания со штангой', targetSets: 3, targetReps: 10 },
      { name: 'Жим лежа', targetSets: 3, targetReps: 10 },
      { name: 'Подтягивания', targetSets: 3, targetReps: 8 },
    ]
  }
];

const firebaseConfig = typeof window !== 'undefined' && window.__firebase_config ? JSON.parse(window.__firebase_config) : null;
const app = firebaseConfig && Object.keys(firebaseConfig).length > 0 ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';

export function useAppData() {
  const [workouts, setWorkouts] = useState(() => {
    const saved = localStorage.getItem('workouts');
    return saved ? JSON.parse(saved) : INITIAL_WORKOUTS;
  });
  const [programs, setPrograms] = useState(() => {
    const saved = localStorage.getItem('programs');
    return saved ? JSON.parse(saved) : INITIAL_PROGRAMS;
  });
  const [user, setUser] = useState(null);
  const [isDbLoading, setIsDbLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setIsDbLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof window !== 'undefined' && window.__initial_auth_token) {
          await signInWithCustomToken(auth, window.__initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Ошибка авторизации Firebase:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setIsDbLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getUserId = () => {
    const tgUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    return tgUserId ? `tg-${tgUserId}` : user?.uid;
  };

  useEffect(() => {
    const userId = getUserId();
    if (!userId || !db) return;

    const workoutsRef = collection(db, 'artifacts', appId, 'users', userId, 'workouts');
    const programsRef = collection(db, 'artifacts', appId, 'users', userId, 'programs');

    let workoutsLoaded = false;
    let programsLoaded = false;
    const checkLoading = () => {
      if (workoutsLoaded && programsLoaded) setIsDbLoading(false);
    };

    const unsubWorkouts = onSnapshot(workoutsRef, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWorkouts(data);
        localStorage.setItem('workouts', JSON.stringify(data));
      }
      workoutsLoaded = true;
      checkLoading();
    }, (error) => {
      console.error("Ошибка загрузки тренировок:", error);
      workoutsLoaded = true;
      checkLoading();
    });

    const unsubPrograms = onSnapshot(programsRef, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPrograms(data);
        localStorage.setItem('programs', JSON.stringify(data));
      }
      programsLoaded = true;
      checkLoading();
    });

    return () => {
      unsubWorkouts();
      unsubPrograms();
    };
  }, [user]);

  const saveWorkoutSession = async (sessionExercises, date) => {
    const newWorkouts = sessionExercises.map((ex, index) => ({
      id: Date.now().toString() + '-' + index,
      date: date,
      exercise: ex.name,
      sets: ex.sets
    }));

    const updatedWorkouts = [...newWorkouts, ...workouts];
    setWorkouts(updatedWorkouts);
    localStorage.setItem('workouts', JSON.stringify(updatedWorkouts));

    const userId = getUserId();
    if (!userId || !db) return;

    const workoutsRef = collection(db, 'artifacts', appId, 'users', userId, 'workouts');
    try {
      for (const w of newWorkouts) {
        await setDoc(doc(workoutsRef, w.id), w);
      }
    } catch (error) {
      console.error("Ошибка сохранения тренировки:", error);
    }
  };

  const saveProgram = async (newProgram) => {
    const progToSave = { ...newProgram, id: Date.now().toString() };

    const updatedPrograms = [...programs, progToSave];
    setPrograms(updatedPrograms);
    localStorage.setItem('programs', JSON.stringify(updatedPrograms));

    const userId = getUserId();
    if (!userId || !db) return;

    const programsRef = collection(db, 'artifacts', appId, 'users', userId, 'programs');
    try {
      await setDoc(doc(programsRef, progToSave.id), progToSave);
    } catch (error) {
      console.error("Ошибка сохранения программы:", error);
    }
  };

  const deleteWorkout = async (id) => {
    const updatedWorkouts = workouts.filter(w => w.id !== id);
    setWorkouts(updatedWorkouts);
    localStorage.setItem('workouts', JSON.stringify(updatedWorkouts));

    const userId = getUserId();
    if (!userId || !db) return;

    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'workouts', id));
    } catch (error) {
      console.error("Ошибка удаления тренировки:", error);
    }
  };

  const deleteProgram = async (id) => {
    const updatedPrograms = programs.filter(p => p.id !== id);
    setPrograms(updatedPrograms);
    localStorage.setItem('programs', JSON.stringify(updatedPrograms));

    const userId = getUserId();
    if (!userId || !db) return;

    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'programs', id));
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