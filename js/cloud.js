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
  // Neon Auth exposes the Data API JWT through getJWTToken(), not token().
  const token = await auth.getJWTToken?.();
  if (typeof token !== "string" || !token.trim()) {
    throw new Error("Sessiya tasdiqlanmadi. Qayta kiring.");
  }
  return token.trim();
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
    const error = new Error(message || `Server xatosi: ${response.status}`);
    error.status = response.status;
    error.code = (() => { try { return JSON.parse(raw).code; } catch (_) { return null; } })();
    throw error;
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
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const row = await rpc("get_my_profile");
      if (row) return row;
    } catch (error) {
      const retryable = error?.status === 503 || error?.status === 502 || error?.status === 504 ||
        error?.code === "42501" || /42501|jwt claim|session identity/i.test(error?.message || "");
      if (!retryable) throw error;
      if (attempt === 2) throw new Error(
        "Akkaunt sessiyasi vaqtincha tasdiqlanmadi. Bir necha soniyadan keyin «Kirish» orqali qayta urinib ko‘ring."
      );
    }
    if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
  }
  return null;
}

export async function ensureProfile({ username, displayName, avatar = "🚀", characterClass = "navigator" }) {
  return completeProfile(username, displayName || username, avatar, characterClass);
}

async function completeProfile(username, displayName, avatar = "🚀", characterClass = "navigator") {
  const args = {
    p_username: String(username).trim().toLowerCase(),
    p_display_name: String(displayName || username).trim().slice(0, 24),
    p_avatar: avatar,
    p_character_class: characterClass
  };
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const row = await rpc("create_my_profile", args);
      if (row) return row;
      lastError = new Error("Profil serverdan bo‘sh javob oldi.");
    } catch (error) {
      lastError = error;
      const retryable = error?.status === 503 || error?.status === 502 || error?.status === 504 ||
        error?.code === "42501" || /42501|jwt claim|session identity/i.test(error?.message || "");
      if (!retryable) throw error;
    }
    if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
  }
  throw new Error(
    "Akkaunt yaratildi, lekin profilni saqlash vaqtincha amalga oshmadi. Endi shu username bilan «Kirish» bo‘limidan kiring — profilingizni tiklashga urinadi." +
    (lastError?.message ? " (" + lastError.message.slice(0, 180) + ")" : "")
  );
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
  let registrationError = null;
  try {
    const result = await auth.signUp.email({
      email: usernameEmail(clean),
      password,
      name: shownName
    });
    normalizeResult(result, "Ro‘yxatdan o‘tish muvaffaqiyatsiz.");
  } catch (error) {
    registrationError = error;
    const alreadyExists = /already exists|already registered|user exists|email.*taken|duplicate|USER_ALREADY_EXISTS/i
      .test([error?.message, error?.code].filter(Boolean).join(" "));
    if (!alreadyExists) throw error;
    try {
      const login = await auth.signIn.email({ email: usernameEmail(clean), password });
      normalizeResult(login, "Username yoki parol noto‘g‘ri.");
    } catch (_) {
      throw new Error("Bu username avval ro‘yxatdan o‘tgan. «Kirish» bo‘limini tanlab, shu username va parol bilan kiring.");
    }
  }

  await createSessionIfNeeded(clean, password);
  const user = await currentUser();
  let profile = await getMyProfile();
  if (!profile) {
    profile = await completeProfile(clean, shownName, avatar, characterClass);
  }
  if (!profile && registrationError) throw registrationError;
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
