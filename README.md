# Drivio

Модерна уеб платформа за автошколи, инструктори, курсисти и администратори. Проектът обединява управление на обучения, роли, комуникация в реално време и централизирана административна логика в една система.

Продукционен адрес: [drivio-bg.com](https://drivio-bg.com)

## Основни акценти

- Многостепенна роля и достъп според типа потребител
- React frontend с Vite, TypeScript, Tailwind и Zustand
- Node.js backend с Express, TypeScript и Drizzle ORM
- PostgreSQL база данни и Redis интеграция
- Socket.IO за функционалности в реално време
- PWA поддръжка и оптимизация за модерни браузъри

## Технологичен стек

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- DaisyUI
- React Router
- Zustand
- Vitest

### Backend

- Node.js 22
- Express 5
- TypeScript
- Drizzle ORM
- PostgreSQL
- Redis
- Socket.IO
- Vitest

## Структура на проекта

```text
Drivio/
|- frontend/   # Клиентска част
|- backend/    # API, бизнес логика и база данни
|- README.md
```

## Локално стартиране

### 1. Инсталиране на зависимости

```bash
cd frontend
npm install

cd ../backend
npm install
```

### 2. Стартиране на frontend

```bash
cd frontend
npm run dev
```

### 3. Стартиране на backend

```bash
cd backend
npm run dev
```

## Полезни команди

### Frontend

```bash
npm run build
npm run lint
npm run test
```

### Backend

```bash
npm run build
npm run typecheck
npm run test
```

### База данни

```bash
npm run db:generate
npm run db:migrate
npm run db:refresh
```

## Вход с роли

Използвайте следните акаунти за вход според ролята:

| Роля | Потребителско име | Парола |
|---|---|---|
| Instructor | `instructor` | `123456` |
| Admin | `bogopetrov07@gmail.com` | `SAdmin` |
| Student | `student` | `123456` |
| School Admin | `schooladmin` | `123456` |

## Бележки за средата

- Frontend и backend използват отделни `.env` файлове
- Препоръчителна версия на Node.js: `22.x`
- За backend са нужни работещи PostgreSQL и Redis услуги

## Статус

Проектът е структуриран като full-stack приложение с отделени клиентска и сървърна част, готово за локална разработка и деплой.
