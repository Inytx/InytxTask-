
export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

// Changed from Enum to string type for dynamic capability
export type Category = string;

export const DEFAULT_CATEGORIES = ['Work', 'Personal', 'Health', 'Learning', 'Other'];

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export type FolderTheme = 'blue' | 'red' | 'amber' | 'green' | 'purple';

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
  theme?: FolderTheme;
  isFavorite?: boolean;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  folderId: string;
  title: string;
  description?: string;
  notes?: string;
  completed: boolean; // Kept for backward compatibility, syncs with status
  status: TaskStatus; // New field for Kanban
  priority: Priority;
  category: Category;
  dueDate: string | null; // ISO Date string
  createdAt: number;
  subTasks: SubTask[];
  pomodoroSessions: number;
  timeSpent: number;
}

export interface ParsedTaskData {
  title: string;
  priority: Priority;
  category: Category;
  dueDate: string | null;
  notes?: string;
}

export interface Note {
  id: string;
  folderId: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  isFavorite?: boolean;
}
