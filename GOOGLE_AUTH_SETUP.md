# Подключение входа через Google

## 1. Создание проекта в Google Cloud Console

1. Перейдите на [console.cloud.google.com](https://console.cloud.google.com/)
2. Нажмите на выпадающее меню проектов вверху → **"Новый проект"**
3. Введите название (например, `FindMe`) → **"Создать"**

---

## 2. Включение Google OAuth API

1. В левом меню выберите **APIs & Services → Library**
2. Найдите **"Google+ API"** или **"Google Identity"** → нажмите **"Enable"**

---

## 3. Настройка экрана согласия (OAuth Consent Screen)

1. Перейдите в **APIs & Services → OAuth consent screen**
2. Выберите тип **"External"** → **"Create"**
3. Заполните обязательные поля:
   - **App name**: `FindMe`
   - **User support email**: ваш email
   - **Developer contact information**: ваш email
4. Нажмите **"Save and Continue"** на всех шагах
5. На последнем шаге нажмите **"Back to Dashboard"**

---

## 4. Создание OAuth 2.0 Client ID

1. Перейдите в **APIs & Services → Credentials**
2. Нажмите **"+ Create Credentials" → "OAuth client ID"**
3. Тип приложения: **"Web application"**
4. Название: `FindMe Web`
5. В разделе **"Authorized redirect URIs"** добавьте:
   ```
   http://localhost:3000/auth/google/callback
   ```
   > Для продакшена добавьте также: `https://ваш-домен.com/auth/google/callback`
6. Нажмите **"Create"**
7. Скопируйте **Client ID** и **Client Secret** из появившегося окна

---

## 5. Добавление ключей в .env

Откройте файл `backend/.env` и замените placeholder-значения:

```env
GOOGLE_CLIENT_ID=ваш_client_id_здесь
GOOGLE_CLIENT_SECRET=ваш_client_secret_здесь
```

---

## 6. Перезапуск бэкенда

После сохранения `.env` перезапустите бэкенд:

```bash
# В папке backend
npm run dev
```

---

## Проверка

1. Откройте [http://localhost:5173/login](http://localhost:5173/login)
2. Нажмите кнопку **"Войти через Google"**
3. Выберите Google аккаунт
4. После успешного входа вы будете перенаправлены на главную страницу

---

## Примечания

- Пользователи, зарегистрированные через Google, не имеют пароля — вход через email/пароль для них недоступен
- Если пользователь с таким email уже существует, его аккаунт автоматически привяжется к Google
- Email из Google считается подтверждённым автоматически
