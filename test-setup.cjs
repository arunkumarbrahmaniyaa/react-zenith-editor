const crypto = require('crypto');

const polyfillGetRandomValues = (array) => {
  const bytes = crypto.randomBytes(array.byteLength);
  array.set(bytes);
  return array;
};

const polyfillRandomUUID = () => {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const randomValue = crypto.randomBytes(1)[0] % 16;
    const value = char === 'x' ? randomValue : (randomValue & 0x3) | 0x8;
    return value.toString(16);
  });
};

if (typeof crypto.getRandomValues !== 'function') {
  crypto.getRandomValues = polyfillGetRandomValues;
}

if (typeof crypto.randomUUID !== 'function') {
  crypto.randomUUID = polyfillRandomUUID;
}

if (typeof globalThis.crypto !== 'object' || globalThis.crypto === null) {
  globalThis.crypto = crypto;
} else {
  if (typeof globalThis.crypto.getRandomValues !== 'function') {
    globalThis.crypto.getRandomValues = polyfillGetRandomValues;
  }

  if (typeof globalThis.crypto.randomUUID !== 'function') {
    globalThis.crypto.randomUUID = polyfillRandomUUID;
  }
}
