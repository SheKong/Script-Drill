import { ipaCourse } from './ipa';
import { thaiCourse } from './thai';
import type { Course, CourseId } from '../types';

export const courses: Record<CourseId, Course> = { thai: thaiCourse, ipa: ipaCourse };
export const allItems = [...thaiCourse.items, ...ipaCourse.items];
export const itemMap = Object.fromEntries(allItems.map(item => [item.id, item]));
export const kindNames: Record<string, string> = {
  consonant: '辅音', vowel: '元音', symbol: '音标', rule: '规则', word: '词汇', number: '数字',
};
