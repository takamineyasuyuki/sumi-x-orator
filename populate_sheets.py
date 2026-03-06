"""
Populate Google Sheets with Guu Original Thurlow menu data (v2 schema).
Creates sheets: レギュラーメニュー / スペシャルメニュー / 店舗情報
Keeps existing: Staff / Ratings
Run once: python populate_sheets.py
"""

import gspread
from google.oauth2.service_account import Credentials

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

# --- Credentials ---
CREDS_FILE = "/Users/takamineyasuyuki/Downloads/sumi-x-brand/guu/guu2026-bf7c5f3119f8.json"
SHEET_ID = "1_f6FvqFl8DOVebscUNO8-fQwsEpiKYjQHHlOxJTaCdk"

creds = Credentials.from_service_account_file(CREDS_FILE, scopes=SCOPES)
client = gspread.authorize(creds)
spreadsheet = client.open_by_key(SHEET_ID)

# =====================================================================
# Sheet 1: レギュラーメニュー
# カテゴリ | メニュー名(日) | メニュー名(英) | メニュー説明(英) | 値段
# | 写真URL | 味・特徴 | 量感 | アレルギー情報 | おすすめ組み合わせ | 備考
# =====================================================================
REGULAR_HEADER = [
    "提供中", "カテゴリ", "メニュー名(日)", "メニュー名(英)", "メニュー説明(英)", "値段",
    "写真URL", "味・特徴", "量感", "アレルギー情報", "おすすめ組み合わせ", "備考",
]

# 提供中 = TRUE (default for all items, staff toggles to FALSE when sold out)
REGULAR_MENU = [
    # ========== ODEN ==========
    [True, "おでん", "おでん盛り合わせ", "Assorted Oden", "5pc chef's choice, Japanese hot pot with fish broth", 14,
     "", "", "シェアにちょうどいい", "", "日本酒に合う", ""],
    [True, "おでん", "大根", "Daikon", "Japanese radish in fish broth", 3.5,
     "", "じっくり煮込んだ大根、出汁が染みて柔らかい", "おでんの追加1品に", "", "", ""],
    [True, "おでん", "たまご", "Egg", "Soft boiled egg in fish broth", 3.5,
     "", "半熟卵にお出汁がしみしみ", "おでんの追加1品に", "egg", "", ""],
    [True, "おでん", "しらたき", "Yam Noodles", "Shirataki noodles in fish broth", 3.5,
     "", "つるっとした食感、ヘルシー", "おでんの追加1品に", "", "", ""],
    [True, "おでん", "厚揚げ", "Deep-fried Tofu", "Atsuage tofu in fish broth", 3.5,
     "", "外はカリッと中はふわっと、出汁を吸った豆腐", "おでんの追加1品に", "soy", "", ""],
    [True, "おでん", "もちきんちゃく", "Sticky Rice Cake", "Mochi kinchaku in fish broth", 3.5,
     "", "油揚げの中にもちもちのお餅", "おでんの追加1品に", "", "", ""],
    [True, "おでん", "ちくわ", "Fish Cake", "Chikuwa in fish broth", 3.5,
     "", "定番の練り物、出汁との相性抜群", "おでんの追加1品に", "fish", "", ""],

    # ========== SALAD ==========
    [True, "サラダ", "大根サラダ", "Daikon Salad", "Daikon radish & jellyfish salad w/ Guu dressing", 11,
     "", "さっぱりシャキシャキ、Guuオリジナルドレッシング", "2人でシェアにちょうどいい", "jellyfish", "", ""],
    [True, "サラダ", "刺身サラダ", "Sashimi Salad", "Assorted sashimi salad w/ plum dressing & wasabi mayo", 17,
     "", "新鮮な刺身と梅ドレッシングの爽やかな組み合わせ", "2人でシェアにちょうどいい", "fish, egg", "", ""],

    # ========== APPETIZER ==========
    [True, "前菜", "サーモンユッケ", "Salmon Yukke", "Chopped salmon sashimi w/ garlic teriyaki sauce", 12,
     "", "ガーリックテリヤキソースが効いたGuuの定番", "1-2人前", "fish", "ビールに合う", "Guuクラシック"],
    [True, "前菜", "あん肝", "Monkfish Liver", "Monkfish liver w/ ponzu sauce", 11,
     "", "クリーミーで濃厚、ポン酢でさっぱり", "1-2人前", "fish", "日本酒に合う", ""],
    [True, "前菜", "かぼちゃコロッケ", "Pumpkin Croquette", "Pumpkin & boiled egg croquette", 10,
     "", "甘いかぼちゃとゆで卵、外はサクサク", "1-2人前", "egg, gluten", "", ""],
    [True, "前菜", "揚げ出し豆腐", "Agedashi Tofu", "Deep-fried tofu & spicy cod roe w/ dashi broth", 10,
     "", "明太子入りの揚げ出し豆腐、出汁が美味しい", "1-2人前", "soy", "", ""],
    [True, "前菜", "焼きブロッコリー", "Baked Broccoli", "Baked broccoli w/ teriyaki sauce & mayo", 9,
     "", "テリヤキソースとマヨの香ばしい組み合わせ", "1-2人前", "egg", "", ""],
    [True, "前菜", "たこ焼き", "Takoyaki", "Deep-fried octopus balls w/ tonkatsu sauce & mustard mayo", 9,
     "", "揚げたてアツアツ、マスタードマヨがアクセント", "2-3人でシェア向き", "gluten, egg", "ビールに合う", ""],
    [True, "前菜", "たこわさび", "Takowasabi", "Marinated chopped octopus w/ wasabi stem", 7,
     "", "コリコリ食感にわさびのピリッとした刺激", "おつまみに最適", "", "日本酒・ビールに合う", ""],
    [True, "前菜", "くらげ", "Fukahire", "Marinated jellyfish w/ sesame", 7,
     "", "コリコリ食感、ごま油の香り", "おつまみに最適", "jellyfish", "", ""],
    [True, "前菜", "枝豆", "Edamame", "Boiled edamame beans w/ sea salt", 6.5,
     "", "シンプルに塩茹で、ビールのお供に", "軽いおつまみ", "soy", "ビールに合う", ""],
    [True, "汁物", "味噌汁", "Miso Soup", "w/ green onion, wakame seaweed", 3,
     "", "ネギとわかめのシンプルな味噌汁", "1人前", "soy, fish", "", ""],

    # ========== MEAT ==========
    [True, "肉料理", "サイコロステーキ ガーリック", "Diced Beef Hanger Steak with Garlic", "Pan-fried beef hanger steak, mushroom & garlic w/ spicy mayo", 26,
     "", "ガーリックとスパイシーマヨの豪快な一皿", "1-2人でシェア", "", "赤ワイン・ビールに合う", ""],
    [True, "肉料理", "ハンガーステーキ ニラ", "Beef Hanger Steak with Chives", "Pan-fried beef hanger steak, chives, onion & Chinese celery w/ oriental sauce", 18,
     "", "ニラとセロリのオリエンタルソースが食欲をそそる", "1-2人前", "", "", ""],
    [True, "肉料理", "唐揚げ", "Karaage", "Deep-fried chicken w/ garlic mayo", 14,
     "", "Guuの看板メニュー！ガーリックマヨが最高", "2-3人でシェア向き", "gluten, egg", "ビールに合う", "Guuの名物"],
    [True, "肉料理", "トントロ", "Tontoro", "Grilled pork cheek w/ yuzu ponzu sauce", 11,
     "", "脂がジューシー、柚子ポン酢でさっぱり", "1-2人前", "", "焼酎に合う", ""],
    [True, "肉料理", "ビーフタタキ", "Beef Tataki", "Thinly sliced seared rare beef w/ green onion, garlic chips, ponzu sauce & wasabi mayo", 14,
     "", "レアに焼いた牛肉、ガーリックチップスとわさびマヨ", "1-2人前", "", "", ""],

    # ========== SEAFOOD ==========
    [True, "海鮮", "ツナ＆サーモンタタキ", "Tuna & Salmon Tataki", "w/ green onion, garlic chips, ponzu sauce", 18,
     "", "2種の魚を炙って、ポン酢とガーリックチップスで", "2人でシェアにちょうどいい", "fish", "日本酒に合う", ""],
    [True, "海鮮", "エビマヨ", "Ebi Mayo", "Deep fried prawn w/ chili mayo", 15,
     "", "プリプリ海老にGuuのチリマヨソース", "2人でシェア向き", "shellfish, egg", "", ""],
    [True, "海鮮", "イカ丸焼き", "Ikamaru", "Grilled whole squid w/ garlic mayo", 15,
     "", "丸ごと1杯焼いたイカ、ガーリックマヨで", "2人でシェア向き", "squid", "ビール・ハイボールに合う", ""],
    [True, "海鮮", "スパイシーカラマリ", "Spicy Calamari", "Deep-fried squid w/ spicy mayo", 14,
     "", "カリッと揚げたイカリング、スパイシーマヨ", "2-3人でシェア向き", "squid, gluten", "ビールに合う", ""],
    [True, "海鮮", "ネギトロ", "Negitoro", "Chopped tuna sashimi w/ green onion", 12,
     "", "たたきマグロとネギのシンプルな美味しさ", "1-2人前", "fish", "日本酒に合う", ""],
    [True, "海鮮", "鯖", "Saba Mackerel", "Grilled saba w/ salt", 13,
     "", "脂がのった鯖を塩焼きで", "1人前", "fish", "日本酒・焼酎に合う", ""],

    # ========== RICE & NOODLES ==========
    [True, "ご飯・麺", "焼きうどん", "Yaki Udon", "Pan-fried udon w/ beef, mushroom, green onion, fish broth, bonito, soy sauce & butter", 17.5,
     "", "バター醤油の香ばしさ、鰹節たっぷり", "1人前（シェアも可）", "gluten, soy", "", ""],
    [True, "ご飯・麺", "キムチうどん", "Kimchi Udon", "Marinated udon w/ spicy cod roe, kimchi, green onion, soy sauce & butter", 17,
     "", "明太子とキムチのピリ辛、バターでコク", "1人前（シェアも可）", "gluten, soy", "", ""],
    [True, "ご飯・麺", "キムチチャーハン", "Kimchi Fried Rice", "w/ kimchi, green onion, bacon & egg", 17,
     "", "パラパラチャーハンにキムチの辛さ", "1人前", "egg", "", ""],
    [True, "ご飯・麺", "お好み焼き", "Okonomi Yaki", "Deep-fried Japanese pancake w/ tonkatsu sauce, mustard mayo", 16,
     "", "ふわふわの生地にソースとマヨ", "2人でシェアにちょうどいい", "gluten, egg", "ビールに合う", ""],
    [True, "ご飯・麺", "モダン焼き", "Modern Yaki", "Deep-fried Japanese pancake & yakisoba noodles w/ tonkatsu sauce, mustard mayo & cheese", 20,
     "", "お好み焼き+焼きそば+チーズの豪華版", "2-3人でシェア向き", "gluten, egg, dairy", "ビールに合う", ""],
    [True, "ご飯・麺", "うなぎ丼", "BBQ Eel Rice", "BBQ eel & egg on rice", 19,
     "", "甘辛いタレで焼いたうなぎ、卵のせ", "1人前", "fish, egg", "日本酒に合う", ""],
    [True, "ご飯・麺", "ライス", "Rice", "Steamed white rice", 3,
     "", "", "1人前", "", "", ""],

    # ========== SWEET ==========
    [True, "デザート", "柚子チーズケーキ", "Yuzu Cheese Cake w/ Green Tea Ice Cream", "Yuzu cheesecake with matcha ice cream", 8,
     "", "柚子の爽やかさと抹茶アイスの組み合わせ", "1人前", "dairy, egg, gluten", "", ""],
    [True, "デザート", "クリーム大福", "Cream Daifuku w/ Green Tea Ice Cream", "Mochi daifuku with matcha ice cream", 8,
     "", "もちもち大福と抹茶アイス。フレーバーはスタッフに聞いてね！", "1人前", "dairy", "", ""],
    [True, "デザート", "抹茶アイス", "Green Tea Ice Cream", "Matcha ice cream", 5,
     "", "濃厚な抹茶の味わい", "1人前", "dairy", "", ""],

    # ========== LUNCH TEISHOKU ==========
    [True, "ランチ定食", "BBQビーフ定食", "BBQ Beef Tei", "BBQ beef, onion, mushroom, sweet spicy soy sauce. Comes w/ rice, miso soup & side dish", 17.5,
     "", "甘辛い醤油ダレのBBQビーフ", "1人前セット", "soy", "", "Lunch only 11:30-14:00"],
    [True, "ランチ定食", "鯖定食", "Saba Tei", "Grilled saba mackerel w/ salt. Comes w/ rice, miso soup & side dish", 15.5,
     "", "脂がのった鯖の塩焼き定食", "1人前セット", "fish", "", "Lunch only 11:30-14:00"],
    [True, "ランチ定食", "鮭定食", "Sake Tei", "Grilled Atlantic salmon w/ yuzu soy sauce. Comes w/ rice, miso soup & side dish", 16.5,
     "", "柚子醤油で焼いたサーモン", "1人前セット", "fish, soy", "", "Lunch only 11:30-14:00"],
    [True, "ランチ定食", "揚げ物定食", "Age Tei", "Chicken karaage, pork cutlet & creamy croquette. Comes w/ rice, miso soup & side dish", 16.5,
     "", "唐揚げ・とんかつ・クリームコロッケの3種盛り", "1人前セット", "gluten, egg", "", "Lunch only 11:30-14:00"],
    [True, "ランチ定食", "タタキ定食", "Tuna & Salmon Tataki Tei", "w/ green onion, garlic chips, ponzu sauce. Comes w/ rice, miso soup & side dish", 20,
     "", "ツナ＆サーモンタタキの定食", "1人前セット", "fish", "", "Lunch only 11:30-14:00"],
    [True, "ランチ定食", "刺身定食", "Sashi Tei", "Assorted sashimi (albacore tuna, Atlantic salmon, scallop & spot prawn). Comes w/ rice, miso soup & side dish", 24,
     "", "4種の刺身盛り合わせ", "1人前セット", "fish, shellfish", "", "Lunch only 11:30-14:00"],

    # ========== LUNCH YOSHOKU ==========
    [True, "ランチ洋食", "カレー", "Curry", "Beef curry w/ rice. Comes w/ salad and side dish", 15,
     "", "じっくり煮込んだビーフカレー", "1人前セット", "", "", "Lunch only 11:30-14:00"],
    [True, "ランチ洋食", "カツカレー", "Katsu-Curry", "Pork cutlet & beef curry w/ rice. Comes w/ salad and side dish", 17.5,
     "", "サクサクとんかつ＋ビーフカレー", "1人前セット", "gluten", "", "Lunch only 11:30-14:00"],
    [True, "ランチ洋食", "ドリア", "Doria", "Rice gratin w/ cream sauce, corn, onion, chicken & cheese. Comes w/ salad and side dish", 15,
     "", "アツアツクリームソースのライスグラタン", "1人前セット", "dairy, gluten", "", "Lunch only 11:30-14:00"],
    [True, "ランチ洋食", "カレードリア", "Curry Doria", "Rice gratin w/ curry, cream sauce, corn, onion, chicken & cheese. Comes w/ salad and side dish", 15.5,
     "", "カレー＋クリームソースのグラタン", "1人前セット", "dairy, gluten", "", "Lunch only 11:30-14:00"],

    # ========== LUNCH DONBURI ==========
    [True, "ランチ丼", "焼き鳥丼", "Yakitori Don", "Grilled teriyaki chicken & onion on rice. Comes w/ miso soup and side dish", 15,
     "", "甘辛テリヤキチキンの丼", "1人前セット", "soy", "", "Lunch only 11:30-14:00"],
    [True, "ランチ丼", "唐揚げ丼", "Karaage Don", "Chicken karaage on rice w/ fish broth. Comes w/ miso soup and side dish", 15,
     "", "唐揚げを出汁で食べる丼", "1人前セット", "gluten", "", "Lunch only 11:30-14:00"],
    [True, "ランチ丼", "たまごとじ丼", "Tamago Toji Don", "Chicken karaage, egg & onion on rice w/ fish broth. Comes w/ miso soup and side dish", 16,
     "", "唐揚げを卵でとじた丼", "1人前セット", "gluten, egg", "", "Lunch only 11:30-14:00"],
    [True, "ランチ丼", "カツ丼", "Katsu Don", "Pork cutlet, egg & onion on rice w/ fish broth. Comes w/ miso soup and side dish", 16,
     "", "サクサクとんかつを卵でとじた丼", "1人前セット", "gluten, egg", "", "Lunch only 11:30-14:00"],

    # ========== LUNCH IZAKAYA ==========
    [True, "ランチ一品", "とんかつ", "Pork Cutlet", "Deep fried pork cutlet", 13,
     "", "サクサクジューシーなとんかつ", "1人前", "gluten", "", "Lunch only 11:30-14:00"],
    [True, "ランチ一品", "クリームコロッケ", "Creamy Croquette", "Cream chicken & corn croquette", 7,
     "", "クリーミーなチキン＆コーンコロッケ", "1-2個", "dairy, gluten, egg", "", "Lunch only 11:30-14:00"],

    # ========== BEER ==========
    [True, "ビール", "サッポロ生", "Sapporo Draft", "16oz pint. Also: 5.5/10oz sleeve, 23/60oz pitcher", 8,
     "", "", "", "", "", ""],
    [True, "ビール", "アサヒ", "Asahi", "620ml bottle", 12.5,
     "", "", "", "", "", ""],
    [True, "ビール", "ハッピネスIPA", "Happyness IPA", "Superflux, 12oz", 8.5,
     "", "", "", "", "", ""],
    [True, "ビール", "フラッグシップ ヘイジーIPA", "Flagship Hazy IPA", "Steam Works, 355ml can", 6,
     "", "", "", "", "", ""],
    [True, "ビール", "マンゴービール", "Mango Beer", "16oz", 8,
     "", "フルーティーで飲みやすい", "", "", "", ""],
    [True, "ビール", "ライチビール", "Lychee Beer", "16oz", 8,
     "", "甘くてフルーティー", "", "", "", ""],

    # ========== HARD LIQUOR ==========
    [True, "ハードリカー", "ジン ボンベイ", "Gin Bombay", "1oz (12/2oz). Mix with coke/diet coke/ginger ale +$0.5", 7.5,
     "", "", "", "", "", ""],
    [True, "ハードリカー", "テキーラ ホセ・クエルボ", "Tequila Jose Cuervo", "1oz (12/2oz). Mix with coke/diet coke/ginger ale +$0.5", 7.5,
     "", "", "", "", "", ""],
    [True, "ハードリカー", "ウイスキー クラウンロイヤル", "Whisky Crown Royal", "1oz (12/2oz). Mix with coke/diet coke/ginger ale +$0.5", 7.5,
     "", "", "", "", "", ""],
    [True, "ハードリカー", "ウイスキー ジェムソン", "Whisky Jameson", "1oz (12/2oz). Mix with coke/diet coke/ginger ale +$0.5", 7.5,
     "", "", "", "", "", ""],

    # ========== SHOCHU ==========
    [True, "焼酎", "だんだん", "Dan-Dan Shochu", "Sweet potato shochu. 1oz (12/2oz, 95/720ml)", 7,
     "", "芋焼酎。甘くてまろやか", "", "", "", ""],
    [True, "焼酎", "たんたかたん", "Tan Taka Tan Shochu", "Shiso herb shochu. 1oz (12/2oz, 95/720ml)", 7,
     "", "しそ焼酎。爽やかな香り", "", "", "", ""],
    [True, "焼酎", "いいちこ", "Ichiko Shochu", "Barley shochu. 1oz (12/2oz, 80/900ml)", 7,
     "", "麦焼酎。すっきり飲みやすい", "", "", "", ""],

    # ========== SANGRIA ==========
    [True, "サングリア", "オリジナル赤サングリア", "Original Red Sangria", "200ml (23/800ml pitcher)", 7.5,
     "", "", "", "", "", ""],
    [True, "サングリア", "シトラス白サングリア", "Citrus White Sangria", "200ml (23/800ml pitcher)", 7.5,
     "", "", "", "", "", ""],

    # ========== COCKTAIL ==========
    [True, "カクテル", "ハイボール", "High Ball", "Whisky, pop (soda/coke/ginger ale). 2oz +$4", 8,
     "", "", "", "", "", ""],
    [True, "カクテル", "酒モヒート", "Sake Mojito", "Sake, plum wine, mint, ramune", 9,
     "", "日本酒ベースのモヒート、ラムネのシュワシュワ感", "", "", "", ""],
    [True, "カクテル", "ジン柚子ソーダ", "Gin Yuzu Soda", "Gin, yuzu, ginger ale", 9,
     "", "柚子の爽やかさとジンの香り", "", "", "", ""],
    [True, "カクテル", "ライチライチ", "Lychee Lychee", "Soho, vodka, lychee juice", 9,
     "", "ライチたっぷり、甘くて飲みやすい", "", "", "", ""],
    [True, "カクテル", "スノーホワイト", "Snow White", "Soho, calpico, lemon, ramune", 9,
     "", "カルピス＋ラムネ、甘酸っぱい", "", "", "", ""],
    [True, "カクテル", "レモンハイ", "Lemon Hi", "Vodka, lemon juice, soda", 8,
     "", "すっきりレモン、定番の居酒屋ドリンク", "", "", "", ""],
    [True, "カクテル", "ウーロンハイ", "Oolong Hi", "Vodka, oolong tea", 8,
     "", "さっぱりウーロン茶割り", "", "", "", ""],

    # ========== SOFT DRINK ==========
    [True, "ソフトドリンク", "GUUUD! ラムネ", "GUUUD! Ramune", "Japanese ramune soda bottle", 4.5,
     "", "日本のラムネソーダ、ビー玉で栓を開けるのが楽しい", "", "", "", ""],
    [True, "ソフトドリンク", "スパークリングウォーター", "Sparkling Water", "Bottle", 3.5,
     "", "", "", "", "", ""],
]

# =====================================================================
# Sheet 2: スペシャルメニュー
# 担当シェフ名 | カテゴリ | メニュー名(日) | メニュー名(英) | メニュー説明(英)
# | 値段 | 写真URL | 味・特徴 | 量感 | おすすめフラグ | 常駐フラグ | 備考
# =====================================================================
SPECIAL_HEADER = [
    "担当シェフ名", "カテゴリ", "メニュー名(日)", "メニュー名(英)", "メニュー説明(英)",
    "値段", "写真URL", "味・特徴", "量感", "おすすめフラグ", "常駐フラグ", "備考",
]

SPECIAL_MENU = [
    ["", "Happy Hour", "Van Go Funk! 純米酒", "Van Go Funk! Junmai Sake", "250ml", 23,
     "", "フルーティーな純米酒", "", True, False,
     "Happy Hour: everyday 11:30am-2pm & 9pm-close"],
    ["", "Happy Hour", "刺身3種盛り シェフおまかせ", "3 Kinds of Sashimi Chef's Choice", "Chef's selection of 3 kinds of sashimi", 28,
     "", "シェフが選ぶ本日の刺身3種", "2人でシェアにちょうどいい", True, False,
     "February - May only. Happy Hour: everyday 11:30am-2pm & 9pm-close"],
]

# =====================================================================
# Sheet 5: 店舗情報
# 項目名 | 内容
# =====================================================================
STORE_HEADER = ["項目名", "内容"]

STORE_INFO = [
    ["店名", "Guu Original"],
    ["住所", "838 Thurlow St, Vancouver, BC V6E 1W2, Canada"],
    ["電話番号", "+1 604-685-8817"],
    ["営業時間(ランチ)", "Mon-Fri 11:30am - 2:00pm"],
    ["営業時間(ディナー)", "Mon-Sat 5:30pm - 11:00pm, Sun 5:30pm - 10:00pm"],
    ["定休日", "ランチは土日休み"],
    ["OpenTable URL", ""],
    ["Instagram", ""],
    ["Google Maps URL", ""],
    ["talk_theme", "人生最高の失敗談 / Your Greatest Failure Story"],
]


# =====================================================================
# Write sheets
# =====================================================================

def get_or_create_sheet(title: str, rows: int = 1000, cols: int = 12):
    try:
        return spreadsheet.worksheet(title)
    except gspread.WorksheetNotFound:
        return spreadsheet.add_worksheet(title, rows=rows, cols=cols)


def setup_checkboxes(sheet, col_letter: str, data_rows: int):
    """Set checkbox data validation on a column (rows 2 to data_rows+1)."""
    range_str = f"{col_letter}2:{col_letter}{data_rows + 1}"
    body = {
        "requests": [{
            "setDataValidation": {
                "range": {
                    "sheetId": sheet.id,
                    "startRowIndex": 1,
                    "endRowIndex": data_rows + 1,
                    "startColumnIndex": ord(col_letter) - ord("A"),
                    "endColumnIndex": ord(col_letter) - ord("A") + 1,
                },
                "rule": {
                    "condition": {"type": "BOOLEAN"},
                    "showCustomUi": True,
                },
            }
        }]
    }
    spreadsheet.batch_update(body)


# --- レギュラーメニュー ---
print("Setting up レギュラーメニュー sheet...")
regular_sheet = get_or_create_sheet("レギュラーメニュー", rows=1000, cols=12)
regular_sheet.clear()
regular_sheet.append_row(REGULAR_HEADER)
regular_sheet.append_rows(REGULAR_MENU)
# Set checkboxes on A (提供中)
setup_checkboxes(regular_sheet, "A", len(REGULAR_MENU))
print(f"  {len(REGULAR_MENU)} items written (with checkbox on A).")

# --- スペシャルメニュー ---
print("Setting up スペシャルメニュー sheet...")
special_sheet = get_or_create_sheet("スペシャルメニュー", rows=200, cols=12)
special_sheet.clear()
special_sheet.append_row(SPECIAL_HEADER)
special_sheet.append_rows(SPECIAL_MENU)
# Set checkboxes on J (おすすめフラグ) and K (常駐フラグ)
setup_checkboxes(special_sheet, "J", len(SPECIAL_MENU))
setup_checkboxes(special_sheet, "K", len(SPECIAL_MENU))
print(f"  {len(SPECIAL_MENU)} items written (with checkboxes on J & K).")

# --- 店舗情報 ---
print("Setting up 店舗情報 sheet...")
store_sheet = get_or_create_sheet("店舗情報", rows=50, cols=2)
store_sheet.clear()
store_sheet.append_row(STORE_HEADER)
store_sheet.append_rows(STORE_INFO)
print(f"  {len(STORE_INFO)} entries written.")

# --- Delete old sheets (Menu, Config) if they exist ---
for old_name in ["Menu", "Config"]:
    try:
        old_sheet = spreadsheet.worksheet(old_name)
        print(f"Deleting old '{old_name}' sheet...")
        spreadsheet.del_worksheet(old_sheet)
    except gspread.WorksheetNotFound:
        pass

print(f"\nDone! https://docs.google.com/spreadsheets/d/{SHEET_ID}")
