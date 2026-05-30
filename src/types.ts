export interface LifecycleTask {
  sequence: number;
  category: string;
  title: string;
  breakdown: string;
  completed: boolean;
}

export interface ProjectLifecycle {
  id: string;
  idea: string;
  createdAt: string;
  tasks: LifecycleTask[];
}
