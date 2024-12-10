import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Job, TaskDTO, TaskQuestion } from '../../api-docs';

interface TaskState {
  questions: TaskQuestion[]

  taskId?: number
  task?: TaskDTO

  jobs?: Job[]
  currentJob?: Job
}

const initialState: TaskState = {
  questions: []
};

export const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    setTaskId: (state, action: PayloadAction<number | undefined>) => {
      state.taskId = action.payload;
    },
    setTask: (state, action: PayloadAction<TaskDTO | undefined>) => {
      state.task = action.payload;
    },
    setJobs: (state, action: PayloadAction<Job[] | undefined>) => {
      state.jobs = action.payload;
    },
    setCurrentJob: (state, action: PayloadAction<Job | undefined>) => {
      state.currentJob = action.payload;
    },
    setQuestions: (state, action: PayloadAction<TaskQuestion[]>) => {
      state.questions = action.payload;
    },
  },
});

export const { setTaskId, setTask, setJobs, setCurrentJob, setQuestions } = taskSlice.actions;
export default taskSlice.reducer; 
