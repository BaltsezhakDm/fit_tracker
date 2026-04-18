export interface User {
  id: number;
  telegram_id: number;
  username: string | null;
  created_at: string; // ISO 8601 datetime
}

export interface Exercise {
  id: number;
  name: string;
  primary_muscle_group: string;
  secondary_muscle_groups: string[];
  description: string | null;
  media_url: string | null;
  comment: string | null;
}

export interface TrainingProgram {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
}

export interface TrainingPlan {
  id: number;
  program_id: number;
  name: string;
  day_of_week: number | null; // 0-6
}

export interface PlanExercise {
  plan_id: number;
  exercise_id: number;
  target_sets: number;
  target_reps: number;
}

export type WorkoutStatus = 'active' | 'completed';

export interface WorkoutSession {
  id: number;
  user_id: number;
  plan_id: number | null;
  start_time: string;
  end_time: string | null;
  status: WorkoutStatus;
}

export interface WorkoutExercise {
  id: number;
  session_id: number;
  exercise_id: number;
  order: number;
}

export interface WorkoutSet {
  id: number;
  workout_exercise_id: number;
  reps: number;
  weight: number;
  time_spent_seconds: number | null;
  rest_time_seconds: number | null;
}

export interface ProgressionData {
  date: string;
  max_weight: number;
  total_volume: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}
