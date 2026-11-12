import { createAuthClient } from "https://esm.sh/@neondatabase/auth@0.7.0-beta?bundle";

const AUTH_URL = "https://ep-little-sea-bae80di9.neonauth.c-8.eu-central-1.aws.neon.tech/neondb/auth";
const DATA_API_URL = "https://ep-little-sea-bae80di9.apirest.c-8.eu-central-1.aws.neon.tech/neondb/rest/v1";
const INTERNAL_EMAIL_DOMAIN = "players.dataspace.academy";
const auth = createAuthClient(AUTH_URL);

function usernameEmail(username) {
  return `${String(username || "").trim().toLowerCase()}@${INTERNAL_EMAIL_DOMAIN}`;
}

function normalizeResult(result, label) {
  if (result?.error) {
    const message = result.error.message || result.error.statusText || label;
    throw new Error(message);
  }
  return result?.data ?? result ?? null;
}

async function getToken() {
  const result = await auth.token();
  const data = normalizeResult(result, "Sessiya tokenini olish imkoni bo‘lmadi.");
  const token = data?.token || data?.jwt || null;
  if (!token) throw new Error("Sessiya tasdiqlanmadi. Qayta kiring.");
  return token;
}

async function requestData(path, { method = "GET", body, authenticated = false } = {}) {
  const headers = new Headers({ Accept: "application/json" });
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (authenticated) headers.set("Authorization", `Bearer ${await getToken()}`);
  const response = await fetch(`${DATA_API_URL}/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store"
  });
  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    let message = raw;
    try {
      const parsed = JSON.parse(raw);
      message = parsed.message || parsed.details || parsed.hint || raw;
    } catch (_) {}
    if (response.status === 401) message = "Sessiya muddati tugagan. Qayta kiring.";
    if (response.status === 409) message = "Bu username band. Boshqasini tanlang.";
    throw new Error(message || `Server xatosi: ${response.status}`);
  }
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  const data = JSON.parse(text);
  return Array.isArray(data) ? (data.length === 1 ? data[0] : data) : data;
}

function unwrap(value) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

async function rpc(name, args = {}) {
  return unwrap(await requestData(`rpc/${name}`, {
    method: "POST",
    body: args,
    authenticated: true
  }));
}

export async function currentUser() {
  const result = await auth.getSession();
  const data = normalizeResult(result, "Akkaunt sessiyasini tekshirib bo‘lmadi.");
  return data?.user || null;
}

export async function getMyProfile() {
  return rpc("get_my_profile");
}

export async function ensureProfile({ username, displayName, avatar = "🚀", characterClass = "navigator" }) {
  return completeProfile(username, displayName || username, avatar, characterClass);
}

async function completeProfile(username, displayName, avatar = "🚀", characterClass = "navigator") {
  const row = await rpc("create_my_profile", {
    p_username: String(username).trim().toLowerCase(),
    p_display_name: String(displayName || username).trim().slice(0, 24),
    p_avatar: avatar,
    p_character_class: characterClass
  });
  if (!row) throw new Error("Bu username avval ro‘yxatdan o‘tgan yoki profilni yaratib bo‘lmadi.");
  return row;
}

async function createSessionIfNeeded(username, password) {
  try {
    await getToken();
  } catch (_) {
    const signIn = await auth.signIn.email({
      email: usernameEmail(username),
      password
    });
    normalizeResult(signIn, "Kirish muvaffaqiyatsiz.");
    await getToken();
  }
}

export async function signUp({ username, password, displayName, avatar, characterClass }) {
  const clean = String(username || "").trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
    throw new Error("Username 3–20 belgidan iborat bo‘lsin: faqat lotin harflari, raqam va _.");
  }
  if (String(password || "").length < 8) throw new Error("Parol kamida 8 belgidan iborat bo‘lishi kerak.");
  const shownName = String(displayName || clean).trim().slice(0, 24) || clean;
  const result = await auth.signUp.email({
    email: usernameEmail(clean),
    password,
    name: shownName
  });
  normalizeResult(result, "Ro‘yxatdan o‘tish muvaffaqiyatsiz.");
  await createSessionIfNeeded(clean, password);
  const user = await currentUser();
  const profile = await completeProfile(clean, shownName, avatar, characterClass);
  return { user, profile };
}

export async function signIn({ username, password }) {
  const clean = String(username || "").trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(clean)) throw new Error("Username formatini tekshiring.");
  const result = await auth.signIn.email({
    email: usernameEmail(clean),
    password
  });
  normalizeResult(result, "Username yoki parol noto‘g‘ri.");
  await getToken();
  const user = await currentUser();
  let profile = await getMyProfile();
  if (!profile) {
    profile = await completeProfile(clean, user?.name || clean);
  }
  return { user, profile };
}

export async function signOut() {
  const result = await auth.signOut();
  normalizeResult(result, "Akkauntdan chiqish muvaffaqiyatsiz.");
}

export async function updateProfile({ displayName, avatar, characterClass }) {
  return rpc("update_my_profile", {
    p_display_name: String(displayName || "").trim().slice(0, 24),
    p_avatar: avatar,
    p_character_class: characterClass
  });
}

export async function completeLesson(index) {
  return rpc("complete_lesson", { p_lesson_index: Number(index) });
}

export async function claimArcadeReward(score) {
  return rpc("claim_arcade_reward", { p_score: Number(score) });
}

export async function getLeaderboard() {
  const query = "dataspace_leaderboard?select=username,display_name,avatar,character_class,xp,streak,completed_count,created_at&order=xp.desc,created_at.asc&limit=1000";
  const result = await requestData(query);
  return Array.isArray(result) ? result : (result ? [result] : []);
}
