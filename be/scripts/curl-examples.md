# Проверка API через curl и Postman

Базовый URL: `http://localhost:3000/api` (сервер должен быть запущен: `npm run dev`).

---

## Postman

1. **Импорт коллекции:** в Postman → Import → загрузи файл `scripts/postman-collection.json`.
2. В коллекции появятся папки **Auth** (Register, Login, Refresh, Logout) и **Users** (Profile, Dashboard).
3. **Register** и **Login** — отправляй как есть (при необходимости поменяй `username`/`password` в Body).
4. После **Login** скопируй из ответа `accessToken` и `refreshToken` и вставь в переменные коллекции: в коллекции "Auth API" открой вкладку **Variables**, впиши значения в `accessToken` и `refreshToken` (или сохрани через Tests скрипт — см. ниже).
5. Запросы **Profile**, **Dashboard**, **Refresh**, **Logout** используют переменные `{{accessToken}}` и `{{refreshToken}}`.

### Регистрация (как в твоём curl)

| Поле                  | Значение                                        |
| --------------------- | ----------------------------------------------- |
| **Method**            | POST                                            |
| **URL**               | `http://localhost:3000/api/auth/register`       |
| **Headers**           | `Content-Type: application/json`                |
| **Body** → raw → JSON | `{"username":"testuser","password":"pass1234"}` |

### Автосохранение токенов после Login

В запросе **Login** во вкладке **Tests** добавь:

```javascript
const res = pm.response.json();
if (res.accessToken) pm.collectionVariables.set("accessToken", res.accessToken);
if (res.refreshToken)
  pm.collectionVariables.set("refreshToken", res.refreshToken);
```

Тогда после каждого Login токены сами подставятся в остальные запросы.

---

---

## Linux / macOS (bash, zsh)

### 1. Регистрация

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"pass1234"}'
```

### 2. Вход (получить accessToken и refreshToken)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"pass1234"}'
```

Скопируй из ответа `accessToken` и `refreshToken`.

### 3. Профиль (нужен accessToken)

```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer ТВОЙ_ACCESS_TOKEN"
```

С переменной:

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
curl -X GET http://localhost:3000/api/users/profile -H "Authorization: Bearer $TOKEN"
```

### 4. Dashboard

```bash
curl -X GET http://localhost:3000/api/users/dashboard \
  -H "Authorization: Bearer ТВОЙ_ACCESS_TOKEN"
```

### 5. Обновление токенов (refresh)

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"ТВОЙ_REFRESH_TOKEN"}'
```

### 6. Выход (logout)

Чтобы доступ по access-токену прекратился сразу, передай оба токена:

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"ТВОЙ_REFRESH_TOKEN","accessToken":"ТВОЙ_ACCESS_TOKEN"}'
```

### 6a. Запрос сброса пароля (forgot-password)

Отправляет письмо со ссылкой на сброс. Ответ всегда одинаковый — существование email не раскрывается.

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com"}'
```

### 6b. Сброс пароля (reset-password)

`token` — из ссылки в письме (`?token=...`). После смены пароля все сессии инвалидируются.

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"ТОКЕН_ИЗ_ПИСЬМА","password":"newpass1234"}'
```

### 7. Информация об API

```bash
curl http://localhost:3000/api/
```

---

## Windows (PowerShell)

- Вызывай именно **`curl.exe`** (не `curl`).
- JSON в теле запроса обязан быть **валидным**: ключи и значения в **двойных кавычках** `"username"`, `"pass1234"`.
- Вариант 1 — внешние **одинарные** кавычки, внутри двойные:
  `-d '{"username":"testuser","password":"pass1234"}'`
- Вариант 2 — если не сработало, экранируй внутренние кавычки обратным слэшем:
  `-d "{\"username\":\"testuser\",\"password\":\"pass1234\"}"`

### 1. Регистрация

```powershell
curl.exe -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d "{\"username\":\"testuser\",\"password\":\"pass1234\"}"
```

---

### 2. Вход (получить accessToken и refreshToken)

```powershell
curl.exe -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"testuser\",\"password\":\"pass1234\"}"
```

Скопируй из ответа `accessToken` и `refreshToken` — они понадобятся ниже.

---

### 3. Профиль (нужен accessToken)

Подставь свой токен вместо `ТВОЙ_ACCESS_TOKEN`:

```powershell
curl.exe -X GET http://localhost:3000/api/users/profile -H "Authorization: Bearer ТВОЙ_ACCESS_TOKEN"
```

Пример с переменной в PowerShell (вставь токен в `$token`):

```powershell
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
curl.exe -X GET http://localhost:3000/api/users/profile -H "Authorization: Bearer $token"
```

---

### 4. Dashboard (нужен accessToken)

```powershell
curl.exe -X GET http://localhost:3000/api/users/dashboard -H "Authorization: Bearer ТВОЙ_ACCESS_TOKEN"
```

---

### 5. Обновление токенов (refresh)

Подставь свой refreshToken вместо `ТВОЙ_REFRESH_TOKEN`:

```powershell
curl.exe -X POST http://localhost:3000/api/auth/refresh -H "Content-Type: application/json" -d "{\"refreshToken\":\"ТВОЙ_REFRESH_TOKEN\"}"
```

В ответе будут новые `accessToken` и `refreshToken`.

---

### 6. Выход (logout)

Чтобы доступ по access-токену прекратился сразу, передай оба токена:

```powershell
curl.exe -X POST http://localhost:3000/api/auth/logout -H "Content-Type: application/json" -d "{\"refreshToken\":\"ТВОЙ_REFRESH_TOKEN\",\"accessToken\":\"ТВОЙ_ACCESS_TOKEN\"}"
```

---

### 7. Информация об API (без авторизации)

```powershell
curl.exe http://localhost:3000/api/
```

---

## Если нет curl (PowerShell)

В PowerShell можно использовать `Invoke-RestMethod`:

```powershell
# Вход
$body = @{ username = "testuser"; password = "pass1234" } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method POST -Body $body -ContentType "application/json"

# Профиль (подставь токен)
$token = "ТВОЙ_ACCESS_TOKEN"
Invoke-RestMethod -Uri http://localhost:3000/api/users/profile -Headers @{ Authorization = "Bearer $token" }
```
