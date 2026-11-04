# Econt Demo — отчет за имплементация

## 1. Модули

- **Товарителници** — `/admin/shipments` (поръчки, чернови, валидация, създаване, податели)
- **Проследи пратки** — `/admin/shipment-tracking` (статуси, COD, избор, CSV, sync)

## 2. SQL

Ръчно изпълнете [`database/migrations/migration-add-econt-demo-shipping.sql`](../database/migrations/migration-add-econt-demo-shipping.sql) в Supabase SQL Editor.

## 3. Environment variables (сървър)

```env
ECONT_ENV=demo
ECONT_API_URL=https://demo.econt.com/ee/services
ECONT_USERNAME=...
ECONT_PASSWORD=...
CRON_SECRET=...   # за POST /api/admin/econt/shipments/sync с header x-cron-secret
```

Официални Demo credentials: виж [Econt developers](https://www.econt.com/developers/soap-json-api.html). **Не commit-вайте пароли.**

## 4. API endpoints

| Endpoint | Описание |
|----------|----------|
| `GET/POST /api/admin/econt/senders` | Профили податели |
| `PATCH/DELETE /api/admin/econt/senders/[id]` | Редакция / деактивиране |
| `GET /api/admin/econt/cities` | Градове (Demo) |
| `GET /api/admin/econt/offices?cityId=` | Офиси |
| `POST /api/admin/econt/address/validate` | Валидация адрес |
| `GET/POST /api/admin/econt/shipments` | Списък поръчки + чернова |
| `POST /api/admin/econt/shipments/validate` | Econt `mode: validate` |
| `POST /api/admin/econt/shipments/create` | Econt `mode: create` |
| `GET/PATCH/POST /api/admin/econt/shipments/[id]` | Детайли / sync единична |
| `POST /api/admin/econt/shipments/sync` | Batch tracking sync |
| `GET /api/admin/econt/tracking` | Списък пратки |
| `GET/POST /api/admin/econt/payments/sync` | PaymentReport |
| `POST /api/admin/econt/reports/selected` | Финансови суми / CSV |

Всички изискват `Authorization: Bearer` + `profiles.role = admin`.

## 5. Econt mappings

- `LabelService.createLabel` — `mode: validate|create`, `shipmentType: pack`, `sizeUnder60cm`, `payAfterAccept`, `payAfterTest`, return instructions, `services.cdAmount/cdType/cdCurrency`
- `ShipmentService.getShipmentStatuses` — batch по `shipmentNumbers`
- `PaymentReportService.PaymentReport` — `dateFrom` / `dateTo`
- Nomenclatures — `getCities`, `getOffices`, `AddressService.validateAddress`

## 6. Ръчна конфигурация

1. Run SQL migration  
2. Добавете env vars на Vercel  
3. В **Данни за подател** създайте профил (Lovech office lookup)  
4. **Validate → Create** от модала на поръчка (create не се пуска автоматично от агента)

## 7. Cron (проследяване на пратки)

Автоматично обновяване на статуси от Econt за до **100** пратки с номер (без избрани ids).

### Vercel

1. Генерирайте секрет (напр. `openssl rand -hex 32`).
2. В **Vercel → Settings → Environment Variables** добавете **`CRON_SECRET`** (Production; по желание Preview) — без кавички и нови редове.
3. В репото има **`vercel.json`**: cron **на всеки час** (`0 * * * *`) → **`GET /api/admin/econt/shipments/sync`**.
4. Vercel изпраща **`Authorization: Bearer <CRON_SECRET>`** (официален начин).
5. **Redeploy** след промяна на env или `vercel.json`.

Локално тест:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/admin/econt/shipments/sync
```

Алтернатива: **`POST`** с header **`x-cron-secret: YOUR_CRON_SECRET`** или като **админ** (Bearer session) от **Проследи пратки → Обнови статусите**.

Плановете на Vercel ограничават броя/честотата на cron — при нужда променете `schedule` в `vercel.json`.

## 8. Тестове

`npm test` — Vitest в `lib/econt/__tests__/econt-core.test.ts` (COD, статуси, selected totals).

## 9. Demo vs mocks

- **Реално Demo (read-only / validate):** nomenclatures, validate label — след конфигурирани credentials  
- **Create / payout:** изисква ваш ръчен тест след подател; PaymentReport Demo често връща `PaymentReportRows: null` — UI показва „Няма налични тестови данни“

## 10. Ограничения

- Само `demo.econt.com` (проверка в `lib/econt/config.ts`)
- `cdPayOptions` office payout — зависи от Demo акаунт; при блокировка — ясна грешка от Econt validate
- Checkout/office free-text — изисква ръчен избор на офис при неоднозначност

## 11. Security

- Credentials само server-side  
- Admin Bearer на всички `/api/admin/econt/*`  
- Cron secret за автоматичен sync
