import { describe, it, expect } from 'vitest';
import { getAcademicYear, getYouTubeEmbedUrl } from './helpers';

describe('getAcademicYear', () => {
  it('9 月之後屬新學年', () => expect(getAcademicYear('2026-09-01')).toBe('2026-27'));
  it('8 月仍屬上一學年', () => expect(getAcademicYear('2026-08-31')).toBe('2025-26'));
  it('1 月屬上一學年', () => expect(getAcademicYear('2026-01-15')).toBe('2025-26'));
  it('12 月屬新學年', () => expect(getAcademicYear('2026-12-31')).toBe('2026-27'));
});

describe('getYouTubeEmbedUrl', () => {
  it('解析標準 watch 連結', () =>
    expect(getYouTubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ'));
  it('解析短連結', () =>
    expect(getYouTubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ'));
  it('非影片連結回傳 null', () => expect(getYouTubeEmbedUrl('https://example.com')).toBeNull());
});
