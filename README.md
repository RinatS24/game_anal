# GameAnalysis — ИС анализа рынка компьютерных игр

Веб-приложение для сбора, хранения, анализа и визуализации данных о рынке компьютерных игр.
Реализовано согласно техническому заданию на ИС «GameAnalysis».

## Стек

- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, SQLite (для простого локального запуска; легко переключается на PostgreSQL)
- **Frontend**: React 18, Vite, React Router, Recharts (графики)
- **Аутентификация**: JWT, роли *user / analyst / admin*
- **Экспорт**: CSV, Excel (openpyxl)

## Запуск

### Backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend (новый терминал)
```bash
cd frontend
npm install
npm run dev
```

Открыть http://localhost:5173

### Демо-учётки
- admin / Admin12345!
- analyst / Analyst123!
- user / User12345!