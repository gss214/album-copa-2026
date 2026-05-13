from __future__ import annotations

from typing import List, Tuple
from sqlalchemy.orm import Session
import models

# (section_code, section_name, group_name, sticker_numbers)
ALBUM_STRUCTURE: List[Tuple[str, str, str, List[str]]] = [
    ("FWC", "Página Inicial", "FWC", ["00", "01", "02", "03", "04", "05", "06", "07", "08"]),
    # Grupo A
    ("MEX", "México", "Grupo A", [str(i) for i in range(1, 21)]),
    ("RSA", "África do Sul", "Grupo A", [str(i) for i in range(1, 21)]),
    ("KOR", "Coreia do Sul", "Grupo A", [str(i) for i in range(1, 21)]),
    ("CZE", "Rep. Tcheca", "Grupo A", [str(i) for i in range(1, 21)]),
    # Grupo B
    ("CAN", "Canadá", "Grupo B", [str(i) for i in range(1, 21)]),
    ("BIH", "Bósnia", "Grupo B", [str(i) for i in range(1, 21)]),
    ("QAT", "Catar", "Grupo B", [str(i) for i in range(1, 21)]),
    ("SUI", "Suíça", "Grupo B", [str(i) for i in range(1, 21)]),
    # Grupo C
    ("BRA", "Brasil", "Grupo C", [str(i) for i in range(1, 21)]),
    ("MAR", "Marrocos", "Grupo C", [str(i) for i in range(1, 21)]),
    ("HAI", "Haiti", "Grupo C", [str(i) for i in range(1, 21)]),
    ("SCO", "Escócia", "Grupo C", [str(i) for i in range(1, 21)]),
    # Grupo D
    ("USA", "Estados Unidos", "Grupo D", [str(i) for i in range(1, 21)]),
    ("PAR", "Paraguai", "Grupo D", [str(i) for i in range(1, 21)]),
    ("AUS", "Austrália", "Grupo D", [str(i) for i in range(1, 21)]),
    ("TUR", "Turquia", "Grupo D", [str(i) for i in range(1, 21)]),
    # Grupo E
    ("GER", "Alemanha", "Grupo E", [str(i) for i in range(1, 21)]),
    ("CUW", "Curaçao", "Grupo E", [str(i) for i in range(1, 21)]),
    ("CIV", "Costa do Marfim", "Grupo E", [str(i) for i in range(1, 21)]),
    ("ECU", "Equador", "Grupo E", [str(i) for i in range(1, 21)]),
    # Grupo F
    ("NED", "Holanda", "Grupo F", [str(i) for i in range(1, 21)]),
    ("JPN", "Japão", "Grupo F", [str(i) for i in range(1, 21)]),
    ("SWE", "Suécia", "Grupo F", [str(i) for i in range(1, 21)]),
    ("TUN", "Tunísia", "Grupo F", [str(i) for i in range(1, 21)]),
    # Grupo G
    ("BEL", "Bélgica", "Grupo G", [str(i) for i in range(1, 21)]),
    ("EGY", "Egito", "Grupo G", [str(i) for i in range(1, 21)]),
    ("IRN", "Irã", "Grupo G", [str(i) for i in range(1, 21)]),
    ("NZL", "Nova Zelândia", "Grupo G", [str(i) for i in range(1, 21)]),
    # Grupo H
    ("ESP", "Espanha", "Grupo H", [str(i) for i in range(1, 21)]),
    ("CPV", "Cabo Verde", "Grupo H", [str(i) for i in range(1, 21)]),
    ("KSA", "Arábia Saudita", "Grupo H", [str(i) for i in range(1, 21)]),
    ("URU", "Uruguai", "Grupo H", [str(i) for i in range(1, 21)]),
    # Grupo I
    ("FRA", "França", "Grupo I", [str(i) for i in range(1, 21)]),
    ("SEN", "Senegal", "Grupo I", [str(i) for i in range(1, 21)]),
    ("IRQ", "Iraque", "Grupo I", [str(i) for i in range(1, 21)]),
    ("NOR", "Noruega", "Grupo I", [str(i) for i in range(1, 21)]),
    # Grupo J
    ("ARG", "Argentina", "Grupo J", [str(i) for i in range(1, 21)]),
    ("ALG", "Argélia", "Grupo J", [str(i) for i in range(1, 21)]),
    ("AUT", "Áustria", "Grupo J", [str(i) for i in range(1, 21)]),
    ("JOR", "Jordânia", "Grupo J", [str(i) for i in range(1, 21)]),
    # Grupo K
    ("POR", "Portugal", "Grupo K", [str(i) for i in range(1, 21)]),
    ("COD", "Congo", "Grupo K", [str(i) for i in range(1, 21)]),
    ("UZB", "Uzbequistão", "Grupo K", [str(i) for i in range(1, 21)]),
    ("COL", "Colômbia", "Grupo K", [str(i) for i in range(1, 21)]),
    # Grupo L
    ("ENG", "Inglaterra", "Grupo L", [str(i) for i in range(1, 21)]),
    ("CRO", "Croácia", "Grupo L", [str(i) for i in range(1, 21)]),
    ("GHA", "Gana", "Grupo L", [str(i) for i in range(1, 21)]),
    ("PAN", "Panamá", "Grupo L", [str(i) for i in range(1, 21)]),
    # FIFA World Cup History
    ("FWC", "FIFA World Cup History", "FWC", ["09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"]),
    # Coca-Cola
    ("CC", "Coca-Cola", "Coca-Cola", [str(i) for i in range(1, 15)]),
]


def seed_stickers(db: Session) -> None:
    if db.query(models.Sticker).first():
        return

    sort_order = 0
    for section_code, section_name, group_name, numbers in ALBUM_STRUCTURE:
        for number in numbers:
            if section_code == "FWC":
                code = f"FWC{number}"
            elif section_code == "CC":
                code = f"CC{number}"
            else:
                code = f"{section_code}{number}"

            sticker = models.Sticker(
                code=code,
                section_code=section_code,
                section_name=section_name,
                group_name=group_name,
                number=number,
                quantity=0,
                sort_order=sort_order,
            )
            db.add(sticker)
            sort_order += 1

    db.commit()
