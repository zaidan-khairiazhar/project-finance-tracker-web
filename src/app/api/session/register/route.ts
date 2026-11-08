import { authenticate } from '@/lib/session';

export async function POST(request: Request) {
  return authenticate('register', request);
}
