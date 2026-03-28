import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import * as db from '@/lib/db';
import { signToken, setAuthCookie, clearAuthCookie, getSession } from '@/lib/auth';

// Inicializa as tabelas no Neon na primeira requisição
let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await db.initDb();
    dbInitialized = true;
  }
}

export async function POST(req: NextRequest) {
  await ensureDb();

  const body = await req.json();
  const { action } = body;

  if (action === 'register') {
    const { name, email, password } = body;
    if (!name || !email || !password)
      return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 });
    if (password.length < 6)
      return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 });
    const existing = await db.getUserByEmail(email);
    if (existing)
      return NextResponse.json({ error: 'Este e-mail já está cadastrado' }, { status: 409 });
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = await db.createUser(name, email, passwordHash);
    const token = signToken({ userId, email });
    const res = NextResponse.json({ success: true, user: { id: userId, name, email, avatarUrl: null } });
    res.cookies.set(setAuthCookie(token));
    return res;
  }

  if (action === 'login') {
    const { email, password } = body;
    if (!email || !password)
      return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 });
    const user = await db.getUserByEmail(email);
    if (!user)
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 });
    const token = signToken({ userId: user.id, email: user.email });
    const res = NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatar_url ?? null } });
    res.cookies.set(setAuthCookie(token));
    return res;
  }

  if (action === 'logout') {
    const res = NextResponse.json({ success: true });
    res.cookies.set(clearAuthCookie());
    return res;
  }

  if (action === 'me') {
    const session = await getSession();
    if (!session) return NextResponse.json({ user: null });
    const user = await db.getUserById(session.userId);
    if (!user) return NextResponse.json({ user: null });
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatar_url ?? null } });
  }

  if (action === 'update-avatar') {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const { avatarUrl } = body;
    // avatarUrl pode ser null (para remover) ou uma string base64/URL
    await db.updateUserAvatar(session.userId, avatarUrl ?? null);
    return NextResponse.json({ success: true, avatarUrl: avatarUrl ?? null });
  }

  if (action === 'update-name') {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const { name } = body;
    if (!name || name.trim().length < 2)
      return NextResponse.json({ error: 'Nome inválido' }, { status: 400 });
    await db.updateUserName(session.userId, name.trim());
    return NextResponse.json({ success: true });
  }

  if (action === 'change-password') {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const { currentPassword, newPassword } = body;
    if (!newPassword || newPassword.length < 6)
      return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 });
    const user = await db.getUserById(session.userId);
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 401 });
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.updateUserPassword(session.userId, passwordHash);
    return NextResponse.json({ success: true });
  }

  if (action === 'forgot-password') {
    const { email } = body;
    const user = await db.getUserByEmail(email);
    if (!user) return NextResponse.json({ success: true });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await db.saveResetCode(user.id, code, expiresAt);
    const isDev = process.env.NODE_ENV !== 'production';
    return NextResponse.json({ success: true, userId: user.id, ...(isDev && { devCode: code }) });
  }

  if (action === 'verify-reset-code') {
    const { userId, code } = body;
    const entry = await db.getResetCode(userId);
    if (!entry || entry.code !== code || new Date() > new Date(entry.expires_at))
      return NextResponse.json({ error: 'Código inválido ou expirado' }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  if (action === 'reset-password') {
    const { userId, code, newPassword } = body;
    if (!newPassword || newPassword.length < 6)
      return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 });
    const entry = await db.getResetCode(userId);
    if (!entry || entry.code !== code || new Date() > new Date(entry.expires_at))
      return NextResponse.json({ error: 'Código inválido ou expirado' }, { status: 400 });
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.updateUserPassword(userId, passwordHash);
    await db.deleteResetCode(userId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
}
