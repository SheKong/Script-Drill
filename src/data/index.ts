import { ipaCourse } from './ipa';
import { thaiCourse } from './thai';
import type { Course, CourseId } from '../types';
import { prepareCourse } from './template';
import { addThaiPlaces } from './thai-places';
import { bengaliCourse } from './bengali';
import { hebrewCourse } from './hebrew';

export const courses: Record<CourseId, Course> = {
  ipa: prepareCourse(ipaCourse), thai: prepareCourse(addThaiPlaces(thaiCourse)), bengali: prepareCourse(bengaliCourse),
  hebrew: prepareCourse(hebrewCourse),
};
export const allItems = Object.values(courses).flatMap(course => course.items);
export const itemMap = Object.fromEntries(allItems.map(item => [item.id, item]));
export const kindNames: Record<string, string> = {
  consonant: '辅音', vowel: '元音', symbol: '符号', rule: '规则', word: '词汇', number: '数字',
};
