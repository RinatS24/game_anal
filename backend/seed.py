"""Наполнение базы данных демонстрационными данными."""
import random
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from database import SessionLocal, engine, Base
import models, auth

PLATFORMS = ["Steam", "PlayStation 5", "Xbox Series X", "Nintendo Switch", "Epic Games Store", "PC", "GOG"]
GENRES = ["Шутер", "RPG", "Стратегия", "Симулятор", "Гонки", "Приключения", "Файтинг", "Спорт", "Хоррор", "MMO", "Платформер", "MOBA"]

GAMES_DATA = [
    ("Cyberpunk 2077", "CD Projekt Red", "CD Projekt", 2020, "RPG", "PC", 2999, 8.1, 86, 25.0, 65000),
    ("The Witcher 3: Wild Hunt", "CD Projekt Red", "CD Projekt", 2015, "RPG", "PC", 1499, 9.4, 93, 50.0, 35000),
    ("Counter-Strike 2", "Valve", "Valve", 2023, "Шутер", "Steam", 0, 8.0, 81, 75.0, 1200000),
    ("Dota 2", "Valve", "Valve", 2013, "MOBA", "Steam", 0, 8.5, 90, 0.0, 800000),
    ("PUBG: Battlegrounds", "PUBG Studios", "Krafton", 2017, "Шутер", "Steam", 0, 7.2, 86, 75.0, 450000),
    ("Grand Theft Auto V", "Rockstar North", "Rockstar Games", 2013, "Приключения", "PC", 1999, 9.0, 96, 200.0, 150000),
    ("Red Dead Redemption 2", "Rockstar Studios", "Rockstar Games", 2018, "Приключения", "PlayStation 5", 3999, 9.5, 97, 65.0, 50000),
    ("Elden Ring", "FromSoftware", "Bandai Namco", 2022, "RPG", "PC", 3999, 9.6, 96, 25.0, 120000),
    ("FIFA 24", "EA Sports", "Electronic Arts", 2023, "Спорт", "PlayStation 5", 4999, 7.3, 80, 18.0, 80000),
    ("Call of Duty: Modern Warfare III", "Sledgehammer Games", "Activision", 2023, "Шутер", "PC", 4999, 6.5, 56, 23.0, 200000),
    ("Hogwarts Legacy", "Avalanche Software", "Warner Bros.", 2023, "RPG", "PC", 3999, 8.4, 84, 22.0, 60000),
    ("Baldur's Gate 3", "Larian Studios", "Larian Studios", 2023, "RPG", "Steam", 3999, 9.7, 96, 15.0, 350000),
    ("The Legend of Zelda: TOTK", "Nintendo EPD", "Nintendo", 2023, "Приключения", "Nintendo Switch", 5999, 9.8, 96, 20.0, 0),
    ("Diablo IV", "Blizzard", "Blizzard", 2023, "RPG", "PC", 4999, 7.8, 86, 12.0, 90000),
    ("Apex Legends", "Respawn", "EA", 2019, "Шутер", "Steam", 0, 8.0, 89, 0.0, 250000),
    ("Valorant", "Riot Games", "Riot Games", 2020, "Шутер", "PC", 0, 7.9, 80, 0.0, 700000),
    ("League of Legends", "Riot Games", "Riot Games", 2009, "MOBA", "PC", 0, 8.3, 78, 0.0, 1500000),
    ("Minecraft", "Mojang", "Microsoft", 2011, "Симулятор", "PC", 1999, 9.0, 93, 300.0, 110000),
    ("Stardew Valley", "ConcernedApe", "ConcernedApe", 2016, "Симулятор", "Steam", 599, 9.3, 89, 30.0, 25000),
    ("Hades", "Supergiant Games", "Supergiant", 2020, "RPG", "Steam", 999, 9.1, 93, 5.0, 8000),
    ("Hollow Knight", "Team Cherry", "Team Cherry", 2017, "Платформер", "Steam", 599, 9.4, 90, 6.0, 9000),
    ("Doom Eternal", "id Software", "Bethesda", 2020, "Шутер", "PC", 1999, 8.7, 88, 10.0, 12000),
    ("Resident Evil 4 Remake", "Capcom", "Capcom", 2023, "Хоррор", "PlayStation 5", 3999, 9.0, 93, 8.0, 35000),
    ("Forza Horizon 5", "Playground Games", "Microsoft", 2021, "Гонки", "Xbox Series X", 3499, 9.0, 92, 22.0, 30000),
    ("Mortal Kombat 1", "NetherRealm", "Warner Bros.", 2023, "Файтинг", "PlayStation 5", 4999, 7.6, 84, 6.0, 15000),
    ("Starfield", "Bethesda", "Bethesda", 2023, "RPG", "PC", 4999, 7.0, 83, 12.0, 70000),
    ("Civilization VI", "Firaxis Games", "2K", 2016, "Стратегия", "PC", 2499, 8.4, 88, 11.0, 28000),
    ("Total War: Warhammer III", "Creative Assembly", "Sega", 2022, "Стратегия", "Steam", 3499, 7.7, 86, 4.0, 18000),
    ("Sekiro: Shadows Die Twice", "FromSoftware", "Activision", 2019, "RPG", "PC", 2999, 9.0, 90, 10.0, 14000),
    ("Genshin Impact", "miHoYo", "HoYoverse", 2020, "RPG", "PC", 0, 8.0, 84, 0.0, 320000),
    ("Final Fantasy XVI", "Square Enix", "Square Enix", 2023, "RPG", "PlayStation 5", 5999, 8.5, 87, 3.5, 22000),
    ("Spider-Man: Miles Morales", "Insomniac", "Sony", 2020, "Приключения", "PlayStation 5", 3999, 8.7, 85, 6.5, 18000),
    ("World of Warcraft", "Blizzard", "Blizzard", 2004, "MMO", "PC", 999, 8.5, 93, 100.0, 130000),
    ("Final Fantasy XIV", "Square Enix", "Square Enix", 2013, "MMO", "PC", 999, 8.7, 83, 27.0, 90000),
    ("Need for Speed Unbound", "Criterion", "EA", 2022, "Гонки", "PC", 3999, 7.0, 75, 2.5, 11000),
    ("Subnautica", "Unknown Worlds", "Unknown Worlds", 2018, "Приключения", "Steam", 1499, 9.1, 87, 8.0, 10000),
    ("Among Us", "Innersloth", "Innersloth", 2018, "Симулятор", "Steam", 199, 7.8, 85, 60.0, 40000),
    ("Fall Guys", "Mediatonic", "Epic Games", 2020, "Платформер", "Epic Games Store", 0, 7.5, 80, 0.0, 25000),
    ("Helldivers 2", "Arrowhead", "Sony", 2024, "Шутер", "PlayStation 5", 3999, 8.9, 82, 12.0, 200000),
    ("Palworld", "Pocketpair", "Pocketpair", 2024, "Симулятор", "Steam", 1999, 7.8, 78, 25.0, 350000),
    ("Tekken 8", "Bandai Namco", "Bandai Namco", 2024, "Файтинг", "PlayStation 5", 4999, 8.6, 89, 3.0, 14000),
    ("Persona 5 Royal", "Atlus", "Atlus", 2022, "RPG", "PC", 3499, 9.5, 95, 7.0, 9000),
    ("Dying Light 2", "Techland", "Techland", 2022, "Хоррор", "PC", 2999, 7.6, 75, 5.0, 20000),
    ("Tom Clancy's Rainbow Six Siege", "Ubisoft", "Ubisoft", 2015, "Шутер", "PC", 1499, 8.0, 79, 30.0, 80000),
    ("Assassin's Creed Valhalla", "Ubisoft", "Ubisoft", 2020, "Приключения", "PC", 2999, 7.9, 80, 18.0, 25000),
    ("Halo Infinite", "343 Industries", "Microsoft", 2021, "Шутер", "Xbox Series X", 3499, 8.1, 87, 8.0, 22000),
    ("Marvel's Spider-Man 2", "Insomniac", "Sony", 2023, "Приключения", "PlayStation 5", 5999, 9.1, 90, 11.0, 28000),
    ("Lies of P", "Round8 Studio", "Neowiz", 2023, "RPG", "PC", 3499, 8.4, 80, 1.5, 8000),
    ("Alan Wake 2", "Remedy", "Epic Games", 2023, "Хоррор", "Epic Games Store", 3999, 8.9, 89, 1.3, 6500),
    ("Armored Core VI", "FromSoftware", "Bandai Namco", 2023, "Шутер", "PC", 3999, 8.7, 86, 3.0, 15000),
    ("Dead Space Remake", "Motive Studio", "EA", 2023, "Хоррор", "PC", 3999, 8.8, 89, 2.5, 9000),
]

USERS_DATA = [
    ("admin", "admin@gameanal.example.com", "Admin12345!", "admin"),
    ("analyst", "analyst@gameanal.example.com", "Analyst123!", "analyst"),
    ("user", "user@gameanal.example.com", "User12345!", "user"),
]

REVIEW_TEMPLATES_POSITIVE = [
    "Великолепная игра, провёл десятки часов и не пожалел!",
    "Отличная графика и проработанный сюжет, рекомендую к покупке.",
    "Лучший проект студии за последние годы.",
    "Геймплей затягивает с первых минут, шедевр.",
    "Прекрасный саундтрек и атмосфера, сильно зацепило.",
]
REVIEW_TEMPLATES_NEUTRAL = [
    "Игра неплохая, но есть пара спорных моментов.",
    "В целом нормально, но ожидал большего от такого крупного релиза.",
    "Можно поиграть, если есть свободное время.",
    "Стандартный проект жанра, без особых открытий.",
]
REVIEW_TEMPLATES_NEGATIVE = [
    "Слабая оптимизация, постоянные вылеты, разочарование.",
    "Не оправдала ожидания, играть скучно.",
    "Сюжет провисает, баги повсюду.",
    "Слишком короткая для такой цены.",
]
AUTHORS = ["Игрок_42", "ProGamer", "RetroFan", "Никита", "CasualPlayer", "Аноним", "SteamUser_77", "Анастасия", "Pavel_RU", "GameJournalist"]


def seed():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        plat_objs = {}
        for name in PLATFORMS:
            p = models.Platform(name=name)
            db.add(p)
            plat_objs[name] = p
        genre_objs = {}
        for name in GENRES:
            g = models.Genre(name=name)
            db.add(g)
            genre_objs[name] = g
        db.commit()

        for username, email, password, role in USERS_DATA:
            u = models.User(
                username=username, email=email,
                hashed_password=auth.hash_password(password), role=role,
            )
            db.add(u)
        db.commit()

        random.seed(7)

        for title, dev, pub, year, genre, platform, price_kop, rating, metacritic, sales, online in GAMES_DATA:
            g = models.Game(
                title=title, developer=dev, publisher=pub, release_year=year,
                price=price_kop / 100.0,
                rating=rating, metacritic=metacritic, sales_millions=sales, online_players=online,
                platform_id=plat_objs[platform].id,
                genre_id=genre_objs[genre].id,
                reviews_count=0,
            )
            db.add(g)
        db.commit()

        games = db.query(models.Game).all()
        for game in games:
            n_reviews = random.randint(3, 8)
            review_objs = []
            for _ in range(n_reviews):
                if game.rating >= 8:
                    weights = (0.75, 0.18, 0.07)
                elif game.rating >= 6:
                    weights = (0.45, 0.35, 0.20)
                else:
                    weights = (0.20, 0.30, 0.50)
                r = random.random()
                if r < weights[0]:
                    score = round(random.uniform(7.5, 10), 1)
                    text = random.choice(REVIEW_TEMPLATES_POSITIVE)
                    sentiment = "positive"
                elif r < weights[0] + weights[1]:
                    score = round(random.uniform(5, 7.4), 1)
                    text = random.choice(REVIEW_TEMPLATES_NEUTRAL)
                    sentiment = "neutral"
                else:
                    score = round(random.uniform(1, 4.9), 1)
                    text = random.choice(REVIEW_TEMPLATES_NEGATIVE)
                    sentiment = "negative"
                review_objs.append(models.Review(
                    game_id=game.id, author=random.choice(AUTHORS),
                    score=score, text=text, sentiment=sentiment,
                    created_at=datetime.utcnow() - timedelta(days=random.randint(0, 365)),
                ))
            db.add_all(review_objs)
            game.reviews_count = n_reviews

            base_date = datetime.utcnow() - timedelta(days=365)
            base_online = max(game.online_players, 100)
            base_sales = game.sales_millions
            for month in range(13):
                date = base_date + timedelta(days=month * 30)
                noise = random.uniform(0.6, 1.2)
                trend = 0.92 + month * 0.012
                online = int(base_online * noise * trend)
                sales_progress = base_sales * (0.6 + month * 0.034)
                rating_noise = max(0, min(10, game.rating + random.uniform(-0.4, 0.4)))
                db.add(models.MarketSnapshot(
                    game_id=game.id, date=date,
                    online_players=online,
                    sales_millions=round(sales_progress, 2),
                    rating=round(rating_noise, 2),
                ))
        db.commit()

        print(f"Готово. Игр: {len(games)}, платформ: {len(PLATFORMS)}, жанров: {len(GENRES)}.")
        for u, e, p, r in USERS_DATA:
            print(f"  {r:8} | {u:8} | {p}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()