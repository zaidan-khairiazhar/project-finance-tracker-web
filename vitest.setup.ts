import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest tanpa `globals` tidak membersihkan DOM otomatis antar test.
afterEach(() => cleanup());
