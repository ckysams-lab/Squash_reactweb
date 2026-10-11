// src/utils/logger.js — 只在開發環境輸出，避免正式站洩漏租戶資訊與雜訊
const isDev = import.meta.env.DEV;

export const log = (...args) => {
  // eslint-disable-next-line no-console
  if (isDev) console.log(...args);
};

export const warn = (...args) => {
  // eslint-disable-next-line no-console
  if (isDev) console.warn(...args);
};
