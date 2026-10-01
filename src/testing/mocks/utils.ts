import { delay } from 'msw';

export const hash = (str: string) => {
  let hashValue = 5381;
  let i = str.length;

  while (i) {
    hashValue = (hashValue * 33) ^ str.charCodeAt(--i);
  }
  return String(hashValue >>> 0);
};

export const networkDelay = () => {
  const delayTime = import.meta.env.TEST
    ? 200
    : Math.floor(Math.random() * 700) + 300;
  return delay(delayTime);
};
