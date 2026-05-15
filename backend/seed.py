from __future__ import annotations

from typing import List, Tuple
from sqlalchemy import func
from sqlalchemy.orm import Session
import models

# 18 player names per team, in album order (stickers 2-12 then 14-20).
# Empty string = no player (used for missing data).
PLAYER_NAMES: dict[str, List[str]] = {
    "MEX": ["Luis Malagón", "Johan Vásquez", "Jorge Sánchez", "César Montes", "Jesús Gallardo", "Israel Reyes", "Diego Lainez", "Carlos Rodríguez", "Edson Álvarez", "Orbelín Pineda", "Marcel Ruiz", "Érick Sánchez", "Hirving Lozano", "Santiago Giménez", "Raúl Jiménez", "Alexis Vega", "Roberto Alvarado", "César Huerta"],
    "RSA": ["Ronwen Williams", "Sipho Chaine", "Aubrey Modiba", "Samukele Kabini", "Mbekezeli Mbokazi", "Khulumani Ndamane", "Siyabonga Ngezana", "Khuliso Mudau", "Nkosinathi Sibisi", "Teboho Mokoena", "Thalente Mbatha", "Bathuisi Aubaas", "Yaya Sithole", "Sipho Mbule", "Lyle Foster", "Ioraam Rayners", "Mohau Nkota", "Oswin Appolis"],
    "KOR": ["Hyeon-woo Jo", "Seung-Gyu Kim", "Min-jae Kim", "Yu-min Cho", "Young-woo Seol", "Han-beom Lee", "Tae-seok Lee", "Myung-jae Lee", "Jae-sung Lee", "In-beom Hwang", "Kang-in Lee", "Seung-ho Paik", "Jens Castrop", "Dong-gyeong Lee", "Gue-sung Cho", "Heung-min Son", "Hee-chan Hwang", "Hyeon-Gyu Oh"],
    "CZE": ["Matěj Kovář", "Jindřich Staněk", "Ladislav Krejčí", "Vladimír Coufal", "Jaroslav Zelený", "Tomáš Holeš", "David Zima", "Michal Sadílek", "Lukáš Provod", "Lukáš Červ", "Tomáš Souček", "Pavel Šulc", "Matěj Vydra", "Vasil Kušej", "Tomáš Chorý", "Václav Černý", "Adam Hložek", "Patrik Schick"],
    "CAN": ["Dayne St. Clair", "Alphonso Davies", "Alistair Johnston", "Samuel Adekugbe", "Richie Laryea", "Derek Cornelius", "Moïse Bombito", "Kamal Miller", "Stephen Eustáquio", "Ismaël Koné", "Jonathan Osorio", "Jacob Shaffelburg", "Mathieu Choinière", "Niko Sigur", "Tajon Buchanan", "Liam Millar", "Cyle Larin", "Jonathan David"],
    "BIH": ["Nikola Vasilj", "Amar Dedić", "Sead Kolašinac", "Tarik Muharemović", "Nihad Mujakić", "Nikola Katić", "Amir Hadžiahmetović", "Benjamin Tahirović", "Armin Gigović", "Ivan Šunjić", "Ivan Bašić", "Dženis Burnić", "Esmir Bajraktarević", "Amar Memić", "Ermedin Demirović", "Edin Džeko", "Samed Baždar", "Haris Tabaković"],
    "QAT": ["Meshaal Barsham", "Sultan Albrake", "Lucas Mendes", "Homam Ahmed", "Boualem Khoukhi", "Pedro Miguel", "Tarek Salman", "Mohamed Al-Mannai", "Karim Boudiaf", "Assim Madibo", "Ahmed Fatehi", "Mohammed Waad", "Abdulaziz Hatem", "Hassan Al-Haydos", "Edmilson Junior", "Akram Hassan Afif", "Ahmed Al Ganehi", "Almoez Ali"],
    "SUI": ["Gregor Kobel", "Yvon Mvogo", "Manuel Akanji", "Ricardo Rodriguez", "Nico Elvedi", "Aurèle Amenda", "Silvan Widmer", "Granit Xhaka", "Denis Zakaria", "Remo Freuler", "Fabian Rieder", "Ardon Jashari", "Johan Manzambi", "Michel Aebischer", "Breel Embolo", "Ruben Vargas", "Dan Ndoye", "Zeki Amdouni"],
    "BRA": ["Alisson", "Bento", "Marquinhos", "Éder Militão", "Gabriel Magalhães", "Danilo", "Wesley", "Lucas Paquetá", "Casemiro", "Bruno Guimarães", "Luiz Henrique", "Vinícius Júnior", "Rodrygo", "João Pedro", "Matheus Cunha", "Gabriel Martinelli", "Raphinha", "Estêvão"],
    "MAR": ["Yassine Bounou", "Munir El Kajoui", "Achraf Hakimi", "Noussair Mazraoui", "Nayef Aguerd", "Romain Saïss", "Jawad El Yamiq", "Adam Masina", "Sofyan Amrabat", "Azzedine Ounahi", "Eliesse Ben Seghir", "Bilal El Khannouss", "Ismael Saibari", "Youssef En-Nesyri", "Abde Ezzalzouli", "Soufiane Rahimi", "Brahim Díaz", "Ayoub El Kaabi"],
    "HAI": ["Johny Placide", "Carlens Arcus", "Martin Expérience", "Jean-Kevin Duverne", "Ricardo Adé", "Duke Lacroix", "Garven Metusala", "Hannes Delcroix", "Leverton Pierre", "Danley Jean Jacques", "Jean-Ricner Bellegarde", "Christopher Attys", "Derrick Etienne Jr.", "Josué Casimir", "Ruben Providence", "Duckens Nazon", "Louicius Deedson", "Frantzdy Pierrot"],
    "SCO": ["Angus Gunn", "Jack Hendry", "Kieran Tierney", "Aaron Hickey", "Andrew Robertson", "Scott McKenna", "John Souttar", "Anthony Ralston", "Grant Hanley", "Scott McTominay", "Billy Gilmour", "Lewis Ferguson", "Ryan Christie", "Kenny McLean", "John McGinn", "Lyndon Dykes", "Che Adams", "Ben Gannon-Doak"],
    "USA": ["Math Freese", "Chris Richards", "Tim Ream", "Mark McKenzie", "Alex Freeman", "Antonee Robinson", "Tyler Adams", "Tanner Tessmann", "Weston McKenny", "Christian Roldan", "Timothy Weah", "Diego Luna", "Malim Tillman", "Christian Pulisic", "Brenden Aaronson", "Ricardo Pepi", "Haji Wright", "Folarin Balogun"],
    "PAR": ["Roberto Fernández", "Orlando Gill", "Gustavo Gómez", "Fabián Balbuena", "Juan José Cáceres", "Omar Alderete", "Junior Alonso", "Mathías Villasanti", "Diego Gómez", "Damián Bobadilla", "Andrés Cubas", "Matías Galarza Fonda", "Julio Enciso", "Alejandro Romero Gamarra", "Miguel Almirón", "Ramón Sosa", "Angel Romero", "Antonio Sanabria"],
    "AUS": ["Mathew Ryan", "Joe Gauci", "Harry Souttar", "Alessandro Circati", "Jordan Bos", "Aziz Behich", "Cameron Burgess", "Lewis Miller", "Milos Degenek", "Jackson Irvine", "Riley McGree", "Aiden O'Neill", "Connor Metcalfe", "Patrick Yazbek", "Craig Goodwin", "Kusini Yengi", "Nestory Irankunda", "Mohamed Touré"],
    "TUR": ["Ugurcan Cakir", "Mert Muldur", "Zeki Celik", "Abdulkerim Bardakci", "Caglar Soyunku", "Merih Demiral", "Ferdi Kadioglu", "Kaan Ayhan", "Ismail Yuksek", "Hakan Calhanoglu", "Orkun Kokcu", "Arda Güler", "Irfan Can Kahvecu", "Yunus Akgun", "Can Uzun", "Baris Alper Yilmaz", "Kerem Akturkoglu", "Kenan Yildiz"],
    "GER": ["Marc-André ter Stegen", "Jonathan Tah", "David Raum", "Nico Schlotterbeck", "Antonio Rüdiger", "Waldemar Anton", "Ridle Baku", "Maximilian Mittelstädt", "Joshua Kimmich", "Florian Wirtz", "Felix Nmecha", "Leon Goretzka", "Jamal Musiala", "Serge Gnabry", "Kai Havertz", "Leroy Sané", "Karim Adeyemi", "Nick Woltemade"],
    "CUW": ["Eloy Room", "Armando Obispo", "Sherel Floranus", "Jurien Gaari", "Joshua Brenet", "Roshon Van Eijma", "Shurandy Sambo", "Livano Comenencia", "Godfried Roemeratoe", "Juninho Bacuna", "Leandro Bacuna", "Tahith Chong", "Kenji Gorré", "Jearl Margaritha", "Jurgen Locadia", "Jeremy Antonisse", "Gervane Kastaneer", "Sontje Hansen"],
    "CIV": ["Yahia Fofana", "Ghislain Konan", "Wilfried Singo", "Odilon Kossounou", "Evan Ndicka", "Willy Boly", "Emmanuel Agbadou", "Ousmane Diomande", "Franck Kessié", "Seko Fofana", "Ibrahim Sangaré", "Jean-Philippe Gbamin", "Amad Diallo", "Sébastien Haller", "Simon Adingra", "Yan Diomande", "Evann Guessand", "Oumar Diakité"],
    "ECU": ["Hernán Galíndez", "Gonzalo Valle", "Piero Hincapié", "Pervis Estupiñán", "Willian Pacho", "Ángelo Preciado", "Joel Ordóñez", "Moisés Caicedo", "Alan Franco", "Kendry Páez", "Pedro Vite", "John Veboah", "Leonardo Campana", "Gonzalo Plata", "Nilson Angulo", "Alan Minda", "Kevin Rodríguez", "Enner Valencia"],
    "NED": ["Bart Verbruggen", "Virgil van Dijk", "Micky van de Ven", "Jurriën Timber", "Denzel Dumfries", "Nathan Aké", "Jeremie Frimpong", "Jan Paul van Hecke", "Tijjani Reijnders", "Ryan Gravenberch", "Teun Koopmeiners", "Frenkie de Jong", "Xavi Simons", "Justin Kluivert", "Memphis Depay", "Donyell Malen", "Wout Weghorst", "Cody Gakpo"],
    "JPN": ["Zion Suzuki", "Henry Heroki Mochizuki", "Ayumu Seko", "Junnosuke Suzuki", "Shogo Taniguchi", "Tsuyoshi Watanabe", "Kaishu Sano", "Yuki Soma", "Ao Tanaka", "Daichi Kamada", "Takefusa Kubo", "Ritsu Doan", "Keito Nakamura", "Takumi Minamino", "Shuto Machino", "Junya Ito", "Koki Ogawa", "Ayase Ueda"],
    "SWE": ["Victor Johansson", "Isak Hien", "Gabriel Gudmundsson", "Emil Holm", "Victor Nilsson Lindelöf", "Gustaf Lagerbielke", "Lucas Bergvall", "Hugo Larsson", "Jesper Karlström", "Yasin Ayari", "Mattias Svanberg", "Daniel Svensson", "Ken Sema", "Roony Bardghji", "Dejan Kulusevski", "Anthony Elanga", "Alexander Isak", "Viktor Gyökeres"],
    "TUN": ["Bechir Ben Said", "Aymen Dahmen", "Van Valery", "Montassar Talbi", "Yassine Meriah", "Ali Abdi", "Dylan Bronn", "Ellyes Skhiri", "Aissa Laidouni", "Ferjani Sassi", "Mohamed Ali Ben Romdhane", "Hannibal Mejbri", "Elias Achouri", "Elias Saad", "Hazem Mastouri", "Ismael Gharbi", "Sayfallah Ltaief", "Naim Sliti"],
    "BEL": ["Thibaut Courtois", "Arthur Theate", "Timothy Castagne", "Zeno Debast", "Brandon Mechele", "Maxim De Cuyper", "Thomas Meunier", "Youri Tielemans", "Amadou Onana", "Nicolas Raskin", "Alexis Saelemaekers", "Hans Vanaken", "Kevin De Bruyne", "Jérémy Doku", "Charles De Ketelaere", "Leandro Trossard", "Loïs Openda", "Romelu Lukaku"],
    "EGY": ["Mohamed El Shenawy", "Mohamed Hany", "Mohamed Hamdy", "Yasser Ibrahim", "Khaled Sobhi", "Ramy Rabia", "Hossam Abdelmaguid", "Ahmed Fatouh", "Marwan Attia", "Zizo", "Hamdy Fathy", "Mohamed Lasheen", "Emam Ashour", "Osama Faisal", "Mohamed Salah", "Mostafa Mohamed", "Trezeguet", "Omar Marmoush"],
    "IRN": ["Alireza Beiranvand", "Morteza Pouraliganji", "Ehsan Hajsafi", "Milad Mohammadi", "Shoja Khalilzadeh", "Ramin Rezaeian", "Hossein Kanaani", "Sadegh Moharrami", "Saleh Hardani", "Saeed Ezatolahi", "Saman Ghoddos", "Omid Noorafkan", "Roozbeh Cheshmi", "Mohammad Mohebi", "Sardar Azmoun", "Mehdi Taremi", "Alireza Jahanbakhsh", "Ali Gholizadeh"],
    "NZL": ["Max Crocombe-Payne", "Alex Paulsen", "Michael Boxall", "Liberato Cacace", "Tim Payne", "Tyler Bindon", "Francis de Vries", "Finn Surman", "Joe Bell", "Sarpreet Singh", "Ryan Thomas", "Matthew Garbett", "Marko Stamenić", "Ben Old", "Chris Wood", "Elijah Just", "Callum McCowatt", "Kosta Barbarouses"],
    "ESP": ["Unai Simón", "Robin Le Normand", "Aymeric Laporte", "Dean Huijsen", "Pedro Porro", "Dani Carvajal", "Marc Cucurella", "Martín Zubimendi", "Rodri", "Pedri", "Fabián Ruiz", "Mikel Merino", "Lamine Yamal", "Dani Olmo", "Nico Williams", "Ferran Torres", "Álvaro Morata", "Mikel Oyarzabal"],
    "CPV": ["Vozinha", "Logan Costa", "Pico", "Diney", "Steven Moreira", "Wagner Pina", "João Paulo", "Yannick Semedo", "Kevin Pina", "Patrick Andrade", "Jamiro Monteiro", "Deroy Duarte", "Garry Rodrigues", "Jovane Cabral", "Ryan Mendes", "Dailon Livramento", "Willy Semedo", "Bebé"],
    "KSA": ["Nawaf Alaqidi", "Abdulrahman Al-Sanbi", "Saud Abdulhamid", "Nawaf Boushal", "Jihad Thakri", "Moteb Al-Harbi", "Hassan Altambakti", "Musab Aljuwayr", "Ziyad Aljohani", "Abdullah Alkhaibari", "Nasser Aldawsari", "Saleh Abu Alshamat", "Marwan Alsahafi", "Salem Aldawsari", "Abdulrahman Al-Aboud", "Feras Albrikan", "Saleh Alshehri", "Abdullah Al-Hamdan"],
    "URU": ["Sergio Rochet", "Santiago Mele", "Ronald Araujo", "José María Giménez", "Sebastian Caceres", "Mathias Olivera", "Guillermo Varela", "Nahitan Nandez", "Federico Valverde", "Giorgian De Arrascaeta", "Rodrigo Bentancur", "Manuel Ugarte", "Nicolás de la Cruz", "Maxi Araujo", "Darwin Núñez", "Federico Viñas", "Rodrigo Aguirre", "Facundo Pellistri"],
    "FRA": ["Mike Maignan", "Theo Hernández", "William Saliba", "Jules Koundé", "Ibrahima Konaté", "Dayot Upamecano", "Lucas Digne", "Aurélien Tchouaméni", "Eduardo Camavinga", "Manu Koné", "Adrien Rabiot", "Michael Olise", "Ousmane Dembélé", "Bradley Barcola", "Désiré Doué", "Kingsley Coman", "Hugo Ekitike", "Kylian Mbappé"],
    "SEN": ["Eduardo Mendy", "Yehvann Diouf", "Moussa Niakhaté", "Abdoulaye Seck", "Ismail Jakobs", "El Hadji Malick Diouf", "Kalidou Koulibaly", "Idrissa Gana Gueye", "Pape Matar Sarr", "Pape Gueye", "Habib Diarra", "Lamine Camara", "Sadio Mane", "Ismaïla Sarr", "Boulaye Dia", "Iliman Ndiaye", "Nicolas Jackson", "Krepin Diatta"],
    "IRQ": ["Jalal Hassan", "Rebin Sulaka", "Hussein Ali", "Akam Hashem", "Merchas Doski", "Zaid Tahseen", "Manaf Younis", "Zidane Iqbal", "Amir Al-Ammari", "Ibrahim Bayesh", "Ali Jasim", "Youssef Amyn", "Aimar Sher", "Marko Farji", "Osama Rashid", "Ali Al-Hamadi", "Aymen Hussein", "Mohanad Ali"],
    "NOR": ["Ørjan Nyland", "Julian Ryerson", "Leo Østigård", "Kristoffer Ajer", "Marcus Holmgren Pedersen", "David Møller Wolfe", "Torbjørn Heggem", "Morten Thorsby", "Martin Ødegaard", "Sander Berge", "Andreas Schjelderup", "Patrick Berg", "Erling Haaland", "Alexander Sørloth", "Aron Dønnum", "Jørgen Strand Larsen", "Antonio Nusa", "Oscar Bobb"],
    "ARG": ["Emiliano Martínez", "Nahuel Molina", "Cristian Romero", "Nicolás Otamendi", "Nicolás Tagliafico", "Leonardo Balerdi", "Enzo Fernández", "Alexis Mac Allister", "Rodrigo De Paul", "Exequiel Palacios", "Leandro Paredes", "Nico Paz", "Franco Mastantuono", "Nico González", "Lionel Messi", "Lautaro Martínez", "Julián Álvarez", "Giuliano Simeone"],
    "ALG": ["Alexis Guendouz", "Ramy Bensebaini", "Youcef Atal", "Rayan Aït-Nouri", "Mohamed Amine Tougai", "Aïssa Mandi", "Ismael Bennacer", "Houssem Aouar", "Hicham Boudaoui", "Ramiz Zerrouki", "Nabil Bentaleb", "Farés Chaibi", "Riyad Mahrez", "Said Benrahma", "Anis Hadj Moussa", "Amine Gouiri", "Baghdad Bounedjah", "Mohammed Amoura"],
    "AUT": ["Alexander Schlager", "Patrick Pentz", "David Alaba", "Kevin Danso", "Philipp Lienhart", "Stefan Posch", "Phillipp Mwene", "Alexander Prass", "Xaver Schlager", "Marcel Sabitzer", "Konrad Laimer", "Florian Grillitsch", "Nicolas Seiwald", "Romano Schmid", "Patrick Wimmer", "Christoph Baumgartner", "Michael Gregoritsch", "Marko Arnautović"],
    "JOR": ["Yazeed Abulaila", "Ihsan Haddad", "Mohammad Abu Hashish", "Yazan Al-Arab", "Abdallah Nasib", "Saleem Obaid", "Mohammad Abualnadi", "Ibrahim Saadeh", "Nizar Al-Rashdan", "Noor Al-Rawabdeh", "Mohannad Abu Taha", "Amer Jamous", "Musa Al-Taamari", "Yazan Al-Naimat", "Mahmoud Al-Mardi", "Ali Olwan", "Mohammad Abu Zrayq", "Ibrahim Sabra"],
    "POR": ["Diogo Costa", "Jose Sa", "Ruben Dias", "João Cancelo", "Diogo Dalot", "Nuno Mendes", "Gonçalo Inácio", "Bernardo Silva", "Bruno Fernandes", "Ruben Neves", "Vitinha", "João Neves", "Cristiano Ronaldo", "Francisco Trincão", "João Felix", "Gonçalo Ramos", "Pedro Neto", "Rafael Leão"],
    "COD": ["Lionel Mpasi", "Aaron Wan-Bissaka", "Axel Tuanzebe", "Arthur Masuaku", "Chancel Mbemba", "Joris Kayembe", "Charles Pickel", "Ngal'ayel Mukau", "Edo Kayembe", "Samuel Moutoussamy", "Noah Sadiki", "Théo Bongonda", "Meschack Elia", "Yoane Wissa", "Brian Cipenga", "Fiston Mayele", "Cédric Bakambu", "Nathanaël Mbuku"],
    "UZB": ["Utkir Yusupov", "Farrukh Savfiev", "Sherzod Nasrullaev", "Umar Eshmurodov", "Husniddin Aliqulov", "Rustamjon Ashurmatov", "Khojiakbar Alijonov", "Abdukodir Khusanov", "Odiljon Hamrobekov", "Otabek Shukurov", "Jamshid Iskanderov", "Azizbek Turgunboev", "Khojimat Erkinov", "Eldor Shomurodov", "Oston Urunov", "Jaloliddin Masharipov", "Igor Sergeev", "Abbosbek Fayzullaev"],
    "COL": ["Camilo Vargas", "David Ospina", "Dávinson Sánchez", "Yerry Mina", "Daniel Muñoz", "Johan Mojica", "Jhon Lucumí", "Santiago Arias", "Jefferson Lerma", "Kevin Castaño", "Richard Ríos", "James Rodríguez", "Juan Fernando Quintero", "Jorge Carrascal", "Jhon Arias", "Jhon Córdoba", "Luis Suárez", "Luis Díaz"],
    "ENG": ["Jordan Pickford", "John Stones", "Marc Guéhi", "Ezri Konsa", "Trent Alexander-Arnold", "Reece James", "Dan Burn", "Jordan Henderson", "Declan Rice", "Jude Bellingham", "Cole Palmer", "Morgan Rogers", "Anthony Gordon", "Phil Foden", "Bukayo Saka", "Harry Kane", "Marcus Rashford", "Ollie Watkins"],
    "CRO": ["Dominik Livaković", "Duje Ćaleta-Car", "Joško Gvardiol", "Josip Stanišić", "Luka Vušković", "Josip Šutalo", "Kristijan Jakić", "Luka Modrić", "Mateo Kovačić", "Martin Baturina", "Lovro Majer", "Mario Pašalić", "Petar Sučić", "Ivan Perišić", "Marco Pašalić", "Ante Budimir", "Andrej Kramarić", "Franjo Ivanović"],
    "GHA": ["Lawrence Ati Zigi", "Tariq Lamptey", "Mohammed Salisu", "Alidu Seidu", "Alexander Djiku", "Gideon Mensah", "Caleb Yirenkyi", "Abdul Fatawu Issahaku", "Thomas Partey", "Salis Abdul Samed", "Kamaldeen Sulemana", "Mohammed Kudus", "Iñaki Williams", "Jordan Ayew", "André Ayew", "Joseph Paintsil", "Osman Bukari", "Antoine Semenyo"],
    "PAN": ["Orlando Mosquera", "Luis Mejía", "Fidel Escobar", "Andrés Andrade", "Michael Amir Murillo", "Eric Davis", "José Córdoba", "César Blackman", "Cristian Martínez", "Aníbal Godoy", "Adalberto Carrasquilla", "Édgar Bárcenas", "Carlos Harvey", "Ismael Díaz", "José Fajardo", "Cecilio Waterman", "José Luis Rodríguez", "Alberto Quintero"],
}


def _player_name_for_number(number: str, section_code: str) -> str:
    """Map sticker number (1-20) to player name. 1=shield, 13=team photo."""
    players = PLAYER_NAMES.get(section_code)
    if not players:
        return ""
    try:
        n = int(number)
    except ValueError:
        return ""
    if n == 1 or n == 13:
        return ""
    idx = (n - 2) if n <= 12 else (n - 3)
    return players[idx] if idx < len(players) else ""

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
                player_name=_player_name_for_number(number, section_code),
            )
            db.add(sticker)
            sort_order += 1

    db.commit()


def seed_player_names(db: Session) -> None:
    """Backfill player_name for stickers that don't have one yet."""
    from sqlalchemy import or_
    stickers = (
        db.query(models.Sticker)
        .filter(
            models.Sticker.group_name != "Raras",
            or_(
                models.Sticker.player_name == None,  # noqa: E711
                models.Sticker.player_name == "",
            ),
        )
        .all()
    )
    if not stickers:
        return
    for s in stickers:
        s.player_name = _player_name_for_number(s.number, s.section_code)
    db.commit()


# (prefix, player_name, country_code)
RARE_PLAYERS: List[Tuple[str, str, str]] = [
    ("R01", "Achraf Hakimi", "MAR"),
    ("R02", "Erling Haaland", "NOR"),
    ("R03", "Alphonso Davies", "CAN"),
    ("R04", "Jude Bellingham", "ENG"),
    ("R05", "Moisés Caicedo", "ECU"),
    ("R06", "Cristiano Ronaldo", "POR"),
    ("R07", "Jérémy Doku", "BEL"),
    ("R08", "Luis Díaz", "COL"),
    ("R09", "Cody Gakpo", "NED"),
    ("R10", "Raúl Jiménez", "MEX"),
    ("R11", "Lamine Yamal", "ESP"),
    ("R12", "Kylian Mbappé", "FRA"),
    ("R13", "Lionel Messi", "ARG"),
    ("R14", "Luka Modrić", "CRO"),
    ("R15", "Christian Pulisic", "USA"),
    ("R16", "Mohamed Salah", "EGY"),
    ("R17", "Son Heung-min", "KOR"),
    ("R18", "Federico Valverde", "URU"),
    ("R19", "Vinícius Júnior", "BRA"),
    ("R20", "Florian Wirtz", "GER"),
]

RARE_VARIANTS: List[Tuple[str, str]] = [
    ("O", "Ouro"),
    ("P", "Prata"),
    ("B", "Bronze"),
    ("L", "Lilás"),
]


def seed_rare_stickers(db: Session) -> None:
    if db.query(models.Sticker).filter(models.Sticker.code == "R01O").first():
        return

    max_order = db.query(func.max(models.Sticker.sort_order)).scalar() or 0
    sort_order = max_order + 1

    for prefix, player_name, country_code in RARE_PLAYERS:
        for variant_code, variant_name in RARE_VARIANTS:
            code = f"{prefix}{variant_code}"
            sticker = models.Sticker(
                code=code,
                section_code=prefix,
                section_name=player_name,
                group_name="Raras",
                number=variant_name,
                quantity=0,
                sort_order=sort_order,
            )
            db.add(sticker)
            sort_order += 1

    db.commit()
