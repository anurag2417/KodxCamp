import { api } from './api';

export type AchievementCategory =
  | 'learning'
  | 'practice'
  | 'projects'
  | 'classes'
  | 'streak'
  | 'milestones';

export interface ApiAchievement {
  _id: string;
  key: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  xpReward: number;
  secret: boolean;
  unlockedAt: string | null;
}

export const achievementsApi = {
  mine: async (): Promise<ApiAchievement[]> => {
    const { data } = await api.get('/achievements/mine');
    return data.data;
  },
};