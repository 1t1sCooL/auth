const BASE = process.env.API_URL || "http://localhost:3000/api";
const username = `testuser_${Date.now()}`;
const password = "testpass123";

async function request(method, path, body = null, accessToken = null) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  if (accessToken) opts.headers.Authorization = `Bearer ${accessToken}`;
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

async function main() {
  console.log("BASE:", BASE);
  console.log("--- 1. Регистрация ---");
  const reg = await request("POST", "/auth/register", { username, password });
  console.log("Status:", reg.status, reg.data);
  if (reg.status !== 201) {
    console.error(
      "Регистрация не прошла. Убедись, что сервер запущен и MongoDB доступна.",
    );
    process.exit(1);
  }

  console.log("\n--- 2. Вход (login) ---");
  const login = await request("POST", "/auth/login", { username, password });
  console.log("Status:", login.status, login.data);
  if (login.status !== 200) {
    console.error("Вход не прошёл.");
    process.exit(1);
  }
  const { accessToken, refreshToken } = login.data;
  if (!accessToken || !refreshToken) {
    console.error("В ответе нет accessToken или refreshToken.");
    process.exit(1);
  }
  console.log("accessToken (начало):", accessToken.slice(0, 30) + "...");
  console.log("refreshToken (начало):", refreshToken.slice(0, 30) + "...");

  console.log("\n--- 3. Профиль с accessToken ---");
  const profile1 = await request("GET", "/users/profile", null, accessToken);
  console.log("Status:", profile1.status, profile1.data);

  console.log("\n--- 4. Refresh (новые токены) ---");
  const refresh = await request("POST", "/auth/refresh", { refreshToken });
  console.log("Status:", refresh.status, refresh.data);
  if (refresh.status !== 200) {
    console.error("Refresh не прошёл.");
    process.exit(1);
  }
  const newAccess = refresh.data.accessToken;
  const newRefresh = refresh.data.refreshToken;
  console.log("Новые токены получены.");

  console.log("\n--- 5. Профиль с новым accessToken ---");
  const profile2 = await request("GET", "/users/profile", null, newAccess);
  console.log("Status:", profile2.status, profile2.data);

  console.log("\n--- 5a. Смена пароля ---");
  const newPassword = "newpass456";
  const changePw = await request("PATCH", "/users/password", {
    currentPassword: password,
    newPassword,
  }, newAccess);
  console.log("Status:", changePw.status, changePw.data);
  if (changePw.status !== 200) {
    console.error("Смена пароля не прошла.");
    process.exit(1);
  }
  console.log("Пароль изменён. Дальше используем новый пароль для удаления в конце.");

  console.log(
    "\n--- 6. Старый refresh не должен работать (уже использован) ---",
  );
  const reuse = await request("POST", "/auth/refresh", { refreshToken });
  console.log("Status:", reuse.status, reuse.data);
  if (reuse.status === 200) {
    console.error("Ожидалось 401: старый refresh должен быть недействителен.");
  } else {
    console.log("OK: старый refresh отклонён.");
  }

  console.log("\n--- 7. Logout ---");
  const logout = await request("POST", "/auth/logout", {
    refreshToken: newRefresh,
  });
  console.log("Status:", logout.status, logout.data);

  console.log("\n--- 8. После logout refresh не должен работать ---");
  const afterLogout = await request("POST", "/auth/refresh", {
    refreshToken: newRefresh,
  });
  console.log("Status:", afterLogout.status, afterLogout.data);
  if (afterLogout.status === 200) {
    console.error("Ожидалось 401: после logout refresh недействителен.");
  } else {
    console.log("OK: после logout refresh отклонён.");
  }

  console.log("\n✅ Все шаги проверки выполнены.");
}

main().catch((err) => {
  console.error("Ошибка:", err.message);
  if (err.cause?.code === "ECONNREFUSED") {
    console.error("Сервер не запущен. Выполни: npm run dev");
  }
  process.exit(1);
});
