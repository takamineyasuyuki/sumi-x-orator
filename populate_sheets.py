"""
Populate Google Sheets with Guu Original Thurlow menu data (new schema).
Creates two sheets: "Menu" and "Staff".
Run once: python populate_sheets.py
"""

import gspread
from google.oauth2.service_account import Credentials

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

# --- Credentials ---
CREDS_FILE = "/Users/takamineyasuyuki/Downloads/guu2026-bf7c5f3119f8.json"
SHEET_ID = "1_f6FvqFl8DOVebscUNO8-fQwsEpiKYjQHHlOxJTaCdk"

creds = Credentials.from_service_account_file(CREDS_FILE, scopes=SCOPES)
client = gspread.authorize(creds)
spreadsheet = client.open_by_key(SHEET_ID)

# --- Menu Data ---
# Headers: 提供中 | メニュー名 | カテゴリー | 担当シェフ | 魅力・特徴 | アレルギー・注意 | 価格
MENU_HEADER = ["提供中", "メニュー名", "カテゴリー", "担当シェフ", "魅力・特徴", "アレルギー・注意", "価格"]

# TRUE = currently served, メニュー名 = English name, カテゴリー = レギュラー/ドリンク/etc, 担当シェフ = blank for now
MENU = [
    # ========== DINNER - ODEN ==========
    ["TRUE", "Assorted Oden", "レギュラー", "", "5pc chef's choice, Japanese hot pot with fish broth", "", 14],
    ["TRUE", "Daikon", "レギュラー", "", "Japanese radish in fish broth", "", 3.5],
    ["TRUE", "Egg", "レギュラー", "", "Soft boiled egg in fish broth", "", 3.5],
    ["TRUE", "Yam Noodles", "レギュラー", "", "Shirataki noodles in fish broth", "", 3.5],
    ["TRUE", "Deep-fried Tofu", "レギュラー", "", "Atsuage tofu in fish broth", "", 3.5],
    ["TRUE", "Sticky Rice Cake", "レギュラー", "", "Mochi kinchaku in fish broth", "", 3.5],
    ["TRUE", "Fish Cake", "レギュラー", "", "Chikuwa in fish broth", "", 3.5],

    # ========== DINNER - SALAD ==========
    ["TRUE", "Daikon Salad", "レギュラー", "", "Daikon radish & jellyfish salad w/ Guu dressing", "", 11],
    ["TRUE", "Sashimi Salad", "レギュラー", "", "Assorted sashimi salad w/ plum dressing & wasabi mayo", "fish", 17],

    # ========== DINNER - APPETIZER ==========
    ["TRUE", "Salmon Yukke", "レギュラー", "", "Chopped salmon sashimi w/ garlic teriyaki sauce", "fish", 12],
    ["TRUE", "Monkfish Liver", "レギュラー", "", "Monkfish liver w/ ponzu sauce", "fish", 11],
    ["TRUE", "Pumpkin Croquette", "レギュラー", "", "Pumpkin & boiled egg croquette", "egg, gluten", 10],
    ["TRUE", "Agedashi Tofu", "レギュラー", "", "Deep-fried tofu & spicy cod roe w/ dashi broth", "soy", 10],
    ["TRUE", "Baked Broccoli", "レギュラー", "", "Baked broccoli w/ teriyaki sauce & mayo", "egg", 9],
    ["TRUE", "Takoyaki", "レギュラー", "", "Deep-fried octopus balls w/ tonkatsu sauce & mustard mayo", "gluten, egg", 9],
    ["TRUE", "Takowasabi", "レギュラー", "", "Marinated chopped octopus w/ wasabi stem", "", 7],
    ["TRUE", "Fukahire", "レギュラー", "", "Marinated jellyfish w/ sesame", "", 7],
    ["TRUE", "Edamame", "レギュラー", "", "Boiled edamame beans w/ sea salt", "soy", 6.5],
    ["TRUE", "Miso Soup", "レギュラー", "", "w/ green onion, wakame seaweed", "soy", 3],

    # ========== DINNER - MEAT ==========
    ["TRUE", "Diced Beef Hanger Steak with Garlic", "レギュラー", "", "Pan-fried beef hanger steak, mushroom & garlic w/ spicy mayo", "", 26],
    ["TRUE", "Beef Hanger Steak with Chives", "レギュラー", "", "Pan-fried beef hanger steak, chives, onion & Chinese celery w/ oriental sauce", "", 18],
    ["TRUE", "Karaage", "レギュラー", "", "Deep-fried chicken w/ garlic mayo", "gluten, egg", 14],
    ["TRUE", "Tontoro", "レギュラー", "", "Grilled pork cheek w/ yuzu ponzu sauce", "", 11],
    ["TRUE", "Beef Tataki", "レギュラー", "", "Thinly sliced seared rare beef w/ green onion, garlic chips, ponzu sauce & wasabi mayo", "", 14],

    # ========== DINNER - SEAFOOD ==========
    ["TRUE", "Tuna & Salmon Tataki", "レギュラー", "", "w/ green onion, garlic chips, ponzu sauce", "fish", 18],
    ["TRUE", "Ebi Mayo", "レギュラー", "", "Deep fried prawn w/ chili mayo", "shellfish, egg", 15],
    ["TRUE", "Ikamaru", "レギュラー", "", "Grilled whole squid w/ garlic mayo", "", 15],
    ["TRUE", "Spicy Calamari", "レギュラー", "", "Deep-fried squid w/ spicy mayo", "gluten", 14],
    ["TRUE", "Negitoro", "レギュラー", "", "Chopped tuna sashimi w/ green onion", "fish", 12],
    ["TRUE", "Saba Mackerel", "レギュラー", "", "Grilled saba w/ salt", "fish", 13],

    # ========== DINNER - RICE & NOODLES ==========
    ["TRUE", "Yaki Udon", "レギュラー", "", "Pan-fried udon w/ beef, mushroom, green onion, fish broth, bonito, soy sauce & butter", "gluten, soy", 17.5],
    ["TRUE", "Kimchi Udon", "レギュラー", "", "Marinated udon w/ spicy cod roe, kimchi, green onion, soy sauce & butter", "gluten, soy", 17],
    ["TRUE", "Kimchi Fried Rice", "レギュラー", "", "w/ kimchi, green onion, bacon & egg", "egg", 17],
    ["TRUE", "Okonomi Yaki", "レギュラー", "", "Deep-fried Japanese pancake w/ tonkatsu sauce, mustard mayo", "gluten, egg", 16],
    ["TRUE", "Modern Yaki", "レギュラー", "", "Deep-fried Japanese pancake & yakisoba noodles w/ tonkatsu sauce, mustard mayo & cheese", "gluten, egg, dairy", 20],
    ["TRUE", "BBQ Eel Rice", "レギュラー", "", "BBQ eel & egg on rice", "fish, egg", 19],
    ["TRUE", "Rice", "レギュラー", "", "Steamed white rice", "", 3],

    # ========== DINNER - SWEET ==========
    ["TRUE", "Yuzu Cheese Cake w/ Green Tea Ice Cream", "レギュラー", "", "Yuzu cheesecake with matcha ice cream", "dairy, egg, gluten", 8],
    ["TRUE", "Cream Daifuku w/ Green Tea Ice Cream", "レギュラー", "", "Mochi daifuku with matcha ice cream. Ask your server about today's available flavors!", "dairy", 8],
    ["TRUE", "Green Tea Ice Cream", "レギュラー", "", "Matcha ice cream", "dairy", 5],

    # ========== LUNCH ONLY - TEISHOKU ==========
    ["TRUE", "BBQ Beef Tei", "レギュラー", "", "BBQ beef, onion, mushroom, sweet spicy soy sauce. Comes w/ rice, miso soup & side dish. [Lunch only 11:30-14:00]", "soy", 17.5],
    ["TRUE", "Saba Tei", "レギュラー", "", "Grilled saba mackerel w/ salt. Comes w/ rice, miso soup & side dish. [Lunch only 11:30-14:00]", "fish", 15.5],
    ["TRUE", "Sake Tei", "レギュラー", "", "Grilled Atlantic salmon w/ yuzu soy sauce. Comes w/ rice, miso soup & side dish. [Lunch only 11:30-14:00]", "fish, soy", 16.5],
    ["TRUE", "Age Tei", "レギュラー", "", "Chicken karaage, pork cutlet & creamy croquette. Comes w/ rice, miso soup & side dish. [Lunch only 11:30-14:00]", "gluten, egg", 16.5],
    ["TRUE", "Tuna & Salmon Tataki Tei", "レギュラー", "", "w/ green onion, garlic chips, ponzu sauce. Comes w/ rice, miso soup & side dish. [Lunch only 11:30-14:00]", "fish", 20],
    ["TRUE", "Sashi Tei", "レギュラー", "", "Assorted sashimi (albacore tuna, Atlantic salmon, scallop & spot prawn). Comes w/ rice, miso soup & side dish. [Lunch only 11:30-14:00]", "fish, shellfish", 24],

    # ========== LUNCH ONLY - YOSHOKU ==========
    ["TRUE", "Curry", "レギュラー", "", "Beef curry w/ rice. Comes w/ salad and side dish. [Lunch only 11:30-14:00]", "", 15],
    ["TRUE", "Katsu-Curry", "レギュラー", "", "Pork cutlet & beef curry w/ rice. Comes w/ salad and side dish. [Lunch only 11:30-14:00]", "gluten", 17.5],
    ["TRUE", "Doria", "レギュラー", "", "Rice gratin w/ cream sauce, corn, onion, chicken & cheese. Comes w/ salad and side dish. [Lunch only 11:30-14:00]", "dairy, gluten", 15],
    ["TRUE", "Curry Doria", "レギュラー", "", "Rice gratin w/ curry, cream sauce, corn, onion, chicken & cheese. Comes w/ salad and side dish. [Lunch only 11:30-14:00]", "dairy, gluten", 15.5],

    # ========== LUNCH ONLY - DONBURI ==========
    ["TRUE", "Yakitori Don", "レギュラー", "", "Grilled teriyaki chicken & onion on rice. Comes w/ miso soup and side dish. [Lunch only 11:30-14:00]", "soy", 15],
    ["TRUE", "Karaage Don", "レギュラー", "", "Chicken karaage on rice w/ fish broth. Comes w/ miso soup and side dish. [Lunch only 11:30-14:00]", "gluten", 15],
    ["TRUE", "Tamago Toji Don", "レギュラー", "", "Chicken karaage, egg & onion on rice w/ fish broth. Comes w/ miso soup and side dish. [Lunch only 11:30-14:00]", "gluten, egg", 16],
    ["TRUE", "Katsu Don", "レギュラー", "", "Pork cutlet, egg & onion on rice w/ fish broth. Comes w/ miso soup and side dish. [Lunch only 11:30-14:00]", "gluten, egg", 16],

    # ========== LUNCH ONLY - IZAKAYA ==========
    ["TRUE", "Pork Cutlet", "レギュラー", "", "Deep fried pork cutlet. [Lunch only 11:30-14:00]", "gluten", 13],
    ["TRUE", "Creamy Croquette", "レギュラー", "", "Cream chicken & corn croquette. [Lunch only 11:30-14:00]", "dairy, gluten, egg", 7],

    # ========== DRINKS - BEER ==========
    ["TRUE", "Sapporo Draft", "ドリンク", "", "16oz pint. Also: 5.5/10oz sleeve, 23/60oz pitcher", "", 8],
    ["TRUE", "Asahi", "ドリンク", "", "620ml bottle", "", 12.5],
    ["TRUE", "Happyness IPA", "ドリンク", "", "Superflux, 12oz", "", 8.5],
    ["TRUE", "Flagship Hazy IPA", "ドリンク", "", "Steam Works, 355ml can", "", 6],
    ["TRUE", "Mango Beer", "ドリンク", "", "16oz", "", 8],
    ["TRUE", "Lychee Beer", "ドリンク", "", "16oz", "", 8],

    # ========== DRINKS - HARD LIQUOR ==========
    ["TRUE", "Gin Bombay", "ドリンク", "", "1oz (12/2oz). Mix with coke/diet coke/ginger ale +$0.5", "", 7.5],
    ["TRUE", "Tequila Jose Cuervo", "ドリンク", "", "1oz (12/2oz). Mix with coke/diet coke/ginger ale +$0.5", "", 7.5],
    ["TRUE", "Whisky Crown Royal", "ドリンク", "", "1oz (12/2oz). Mix with coke/diet coke/ginger ale +$0.5", "", 7.5],
    ["TRUE", "Whisky Jameson", "ドリンク", "", "1oz (12/2oz). Mix with coke/diet coke/ginger ale +$0.5", "", 7.5],

    # ========== DRINKS - SHOCHU ==========
    ["TRUE", "Dan-Dan Shochu", "ドリンク", "", "Sweet potato shochu. 1oz (12/2oz, 95/720ml)", "", 7],
    ["TRUE", "Tan Taka Tan Shochu", "ドリンク", "", "Shiso herb shochu. 1oz (12/2oz, 95/720ml)", "", 7],
    ["TRUE", "Ichiko Shochu", "ドリンク", "", "Barley shochu. 1oz (12/2oz, 80/900ml)", "", 7],

    # ========== DRINKS - SANGRIA ==========
    ["TRUE", "Original Red Sangria", "ドリンク", "", "200ml (23/800ml pitcher)", "", 7.5],
    ["TRUE", "Citrus White Sangria", "ドリンク", "", "200ml (23/800ml pitcher)", "", 7.5],

    # ========== DRINKS - COCKTAIL ==========
    ["TRUE", "High Ball", "ドリンク", "", "Whisky, pop (soda/coke/ginger ale). 2oz +$4", "", 8],
    ["TRUE", "Sake Mojito", "ドリンク", "", "Sake, plum wine, mint, ramune", "", 9],
    ["TRUE", "Gin Yuzu Soda", "ドリンク", "", "Gin, yuzu, ginger ale", "", 9],
    ["TRUE", "Lychee Lychee", "ドリンク", "", "Soho, vodka, lychee juice", "", 9],
    ["TRUE", "Snow White", "ドリンク", "", "Soho, calpico, lemon, ramune", "", 9],
    ["TRUE", "Lemon Hi", "ドリンク", "", "Vodka, lemon juice, soda", "", 8],
    ["TRUE", "Oolong Hi", "ドリンク", "", "Vodka, oolong tea", "", 8],

    # ========== DRINKS - SOFT DRINK ==========
    ["TRUE", "GUUUD! Ramune", "ドリンク", "", "Japanese ramune soda bottle", "", 4.5],
    ["TRUE", "Sparkling Water", "ドリンク", "", "Bottle", "", 3.5],

    # ========== HAPPY HOUR SPECIALS ==========
    ["TRUE", "Van Go Funk! Junmai Sake", "共通スペシャル", "", "250ml. Happy Hour: everyday 11:30am-2pm & 9pm-close", "", 23],
    ["TRUE", "3 Kinds of Sashimi Chef's Choice", "共通スペシャル", "", "February - May only. Happy Hour: everyday 11:30am-2pm & 9pm-close", "fish", 28],
]

# --- Staff Data ---
STAFF_HEADER = ["出勤", "名前", "リスペクト要素"]

STAFF = [
    ["TRUE", "しんたろう (Shintaro)", "店長。Guuを愛する男。全メニューを知り尽くしている"],
    ["TRUE", "サンプル太郎 (Sample)", "ここにスタッフ情報を入力してください"],
]

# --- Write Menu Sheet ---
print("Setting up Menu sheet...")

# Rename sheet1 to "Menu" if needed
try:
    menu_sheet = spreadsheet.worksheet("Menu")
except gspread.WorksheetNotFound:
    # Rename the first sheet
    sheet1 = spreadsheet.sheet1
    sheet1.update_title("Menu")
    menu_sheet = sheet1

menu_sheet.clear()
menu_sheet.append_row(MENU_HEADER)
menu_sheet.append_rows(MENU)
print(f"Menu sheet: {len(MENU)} items written.")

# --- Write Staff Sheet ---
print("Setting up Staff sheet...")

try:
    staff_sheet = spreadsheet.worksheet("Staff")
except gspread.WorksheetNotFound:
    staff_sheet = spreadsheet.add_worksheet("Staff", rows=50, cols=3)

staff_sheet.clear()
staff_sheet.append_row(STAFF_HEADER)
staff_sheet.append_rows(STAFF)
print(f"Staff sheet: {len(STAFF)} entries written.")

print(f"\nDone! https://docs.google.com/spreadsheets/d/{SHEET_ID}")
