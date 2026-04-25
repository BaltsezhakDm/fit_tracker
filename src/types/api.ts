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
  biomechanics_tags: string[];
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

export interface TrainingPlanCreate {
  name: string;
  program_id: number;
  day_of_week?: number | null;
}

export interface TrainingPlanRead extends TrainingPlan {}

export interface PlanExerciseRead extends PlanExercise {}

export interface PlanExercise {
  plan_id: number;
  exercise_id: number;
  target_sets: number;
  target_reps: number;
}

export interface PlanExerciseCreate {
  exercise_id: number;
  target_sets: number;
  target_reps: number;
}

export type WorkoutStatus = 'active' | 'completed';

export interface WorkoutSession {
  id: string; // UUID
  user_id: number;
  plan_id: number | null;
  start_time: string;
  end_time: string | null;
  status: WorkoutStatus;
}

export interface WorkoutExercise {
  id: string; // UUID
  session_id: string; // UUID
  exercise_id: number;
  order: number;
}

export interface WorkoutSet {
  id: string; // UUID
  workout_exercise_id: string; // UUID
  reps: number;
  weight: number;
  time_spent_seconds: number | null;
  rest_time_seconds: number | null;
  is_warmup: boolean;
  rpe: number | null;
  rir: number | null;
}

export interface ProgressionData {
  date: string;
  max_weight: number;
  total_volume: number;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export type PageExerciseRead = PaginatedResponse<Exercise>;
export type PageWorkoutSessionRead = PaginatedResponse<WorkoutSession>;

export interface AnalyticsSummary {
  total_volume: number;
  workouts_count: number;
  last_week_volume_change_percent: number;
  records_count: number;
}

export interface WorkloadData {
  date: string;
  volume: number;
}

export interface PersonalRecord {
  exercise_id: number;
  exercise_name: string;
  weight: number;
  date: string;
}

export interface MuscleWorkload {
  muscle: string;
  volume: number;
  sets_count: number;
}
