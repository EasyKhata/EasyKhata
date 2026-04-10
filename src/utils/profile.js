export const DEFAULT_PHONE_COUNTRY_CODE = "+91";

export const MONTH_OPTIONS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" }
];

export const PHONE_COUNTRY_OPTIONS = [
  { value: "+91", label: "India (+91)", country: "India" },
  { value: "+1", label: "United States (+1)", country: "United States" },
  { value: "+1-CA", label: "Canada (+1)", country: "Canada", normalizedValue: "+1" },
  { value: "+44", label: "United Kingdom (+44)", country: "United Kingdom" },
  { value: "+33", label: "France (+33)", country: "France" },
  { value: "+49", label: "Germany (+49)", country: "Germany" },
  { value: "+39", label: "Italy (+39)", country: "Italy" },
  { value: "+34", label: "Spain (+34)", country: "Spain" },
  { value: "+31", label: "Netherlands (+31)", country: "Netherlands" },
  { value: "+32", label: "Belgium (+32)", country: "Belgium" },
  { value: "+41", label: "Switzerland (+41)", country: "Switzerland" },
  { value: "+43", label: "Austria (+43)", country: "Austria" },
  { value: "+353", label: "Ireland (+353)", country: "Ireland" },
  { value: "+351", label: "Portugal (+351)", country: "Portugal" },
  { value: "+46", label: "Sweden (+46)", country: "Sweden" },
  { value: "+45", label: "Denmark (+45)", country: "Denmark" },
  { value: "+358", label: "Finland (+358)", country: "Finland" },
  { value: "+47", label: "Norway (+47)", country: "Norway" },
  { value: "+48", label: "Poland (+48)", country: "Poland" },
  { value: "+420", label: "Czechia (+420)", country: "Czechia" },
  { value: "+36", label: "Hungary (+36)", country: "Hungary" },
  { value: "+40", label: "Romania (+40)", country: "Romania" },
  { value: "+30", label: "Greece (+30)", country: "Greece" },
  { value: "+86", label: "China (+86)", country: "China" },
  { value: "+852", label: "Hong Kong (+852)", country: "Hong Kong" },
  { value: "+853", label: "Macau (+853)", country: "Macau" },
  { value: "+880", label: "Bangladesh (+880)", country: "Bangladesh" },
  { value: "+973", label: "Bahrain (+973)", country: "Bahrain" },
  { value: "+673", label: "Brunei (+673)", country: "Brunei" },
  { value: "+855", label: "Cambodia (+855)", country: "Cambodia" },
  { value: "+62", label: "Indonesia (+62)", country: "Indonesia" },
  { value: "+98", label: "Iran (+98)", country: "Iran" },
  { value: "+65", label: "Singapore (+65)", country: "Singapore" },
  { value: "+81", label: "Japan (+81)", country: "Japan" },
  { value: "+7-KZ", label: "Kazakhstan (+7)", country: "Kazakhstan", normalizedValue: "+7" },
  { value: "+965", label: "Kuwait (+965)", country: "Kuwait" },
  { value: "+856", label: "Laos (+856)", country: "Laos" },
  { value: "+60", label: "Malaysia (+60)", country: "Malaysia" },
  { value: "+976", label: "Mongolia (+976)", country: "Mongolia" },
  { value: "+95", label: "Myanmar (+95)", country: "Myanmar" },
  { value: "+977", label: "Nepal (+977)", country: "Nepal" },
  { value: "+968", label: "Oman (+968)", country: "Oman" },
  { value: "+92", label: "Pakistan (+92)", country: "Pakistan" },
  { value: "+63", label: "Philippines (+63)", country: "Philippines" },
  { value: "+974", label: "Qatar (+974)", country: "Qatar" },
  { value: "+966", label: "Saudi Arabia (+966)", country: "Saudi Arabia" },
  { value: "+82", label: "South Korea (+82)", country: "South Korea" },
  { value: "+94", label: "Sri Lanka (+94)", country: "Sri Lanka" },
  { value: "+886", label: "Taiwan (+886)", country: "Taiwan" },
  { value: "+66", label: "Thailand (+66)", country: "Thailand" },
  { value: "+90", label: "Turkey (+90)", country: "Turkey" },
  { value: "+971", label: "United Arab Emirates (+971)", country: "United Arab Emirates" },
  { value: "+998", label: "Uzbekistan (+998)", country: "Uzbekistan" },
  { value: "+84", label: "Vietnam (+84)", country: "Vietnam" }
];

export const COUNTRY_OPTIONS = [
  "India",
  "United States",
  "Canada",
  "United Kingdom",
  "France",
  "Germany",
  "Italy",
  "Spain",
  "Netherlands",
  "Belgium",
  "Switzerland",
  "Austria",
  "Ireland",
  "Portugal",
  "Sweden",
  "Denmark",
  "Finland",
  "Norway",
  "Poland",
  "Czechia",
  "Hungary",
  "Romania",
  "Greece",
  "China",
  "Hong Kong",
  "Macau",
  "Bangladesh",
  "Bahrain",
  "Brunei",
  "Cambodia",
  "Indonesia",
  "Iran",
  "Japan",
  "Kazakhstan",
  "Kuwait",
  "Laos",
  "Singapore",
  "Malaysia",
  "Mongolia",
  "Myanmar",
  "Nepal",
  "Oman",
  "Pakistan",
  "Philippines",
  "Qatar",
  "Saudi Arabia",
  "South Korea",
  "Sri Lanka",
  "Taiwan",
  "Thailand",
  "Turkey",
  "United Arab Emirates",
  "Uzbekistan",
  "Vietnam"
];

export const STATE_PROVINCE_OPTIONS = {
  India: ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"],
  "United States": ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"],
  Canada: ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon"],
  "United Kingdom": ["England", "Northern Ireland", "Scotland", "Wales"],
  France: ["Auvergne-Rhone-Alpes", "Bourgogne-Franche-Comte", "Brittany", "Centre-Val de Loire", "Corsica", "Grand Est", "Guadeloupe", "French Guiana", "Hauts-de-France", "Ile-de-France", "La Reunion", "Martinique", "Mayotte", "Normandy", "Nouvelle-Aquitaine", "Occitanie", "Pays de la Loire", "Provence-Alpes-Cote d'Azur"],
  Germany: ["Baden-Wurttemberg", "Bavaria", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hesse", "Lower Saxony", "Mecklenburg-Vorpommern", "North Rhine-Westphalia", "Rhineland-Palatinate", "Saarland", "Saxony", "Saxony-Anhalt", "Schleswig-Holstein", "Thuringia"],
  Italy: ["Abruzzo", "Aosta Valley", "Apulia", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", "Friuli Venezia Giulia", "Lazio", "Liguria", "Lombardy", "Marche", "Molise", "Piedmont", "Sardinia", "Sicily", "Trentino-South Tyrol", "Tuscany", "Umbria", "Veneto"],
  Spain: ["Andalusia", "Aragon", "Asturias", "Balearic Islands", "Basque Country", "Canary Islands", "Cantabria", "Castile and Leon", "Castile-La Mancha", "Catalonia", "Ceuta", "Extremadura", "Galicia", "La Rioja", "Community of Madrid", "Melilla", "Region of Murcia", "Navarre", "Valencian Community"],
  Netherlands: ["Drenthe", "Flevoland", "Friesland", "Gelderland", "Groningen", "Limburg", "North Brabant", "North Holland", "Overijssel", "South Holland", "Utrecht", "Zeeland"],
  Belgium: ["Antwerp", "Brussels-Capital", "East Flanders", "Flemish Brabant", "Hainaut", "Liege", "Limburg", "Luxembourg", "Namur", "Walloon Brabant", "West Flanders"],
  Switzerland: ["Aargau", "Appenzell Ausserrhoden", "Appenzell Innerrhoden", "Basel-Landschaft", "Basel-Stadt", "Bern", "Fribourg", "Geneva", "Glarus", "Graubunden", "Jura", "Lucerne", "Neuchatel", "Nidwalden", "Obwalden", "Schaffhausen", "Schwyz", "Solothurn", "St. Gallen", "Thurgau", "Ticino", "Uri", "Valais", "Vaud", "Zug", "Zurich"],
  Austria: ["Burgenland", "Carinthia", "Lower Austria", "Upper Austria", "Salzburg", "Styria", "Tyrol", "Vorarlberg", "Vienna"],
  Ireland: ["Carlow", "Cavan", "Clare", "Cork", "Donegal", "Dublin", "Galway", "Kerry", "Kildare", "Kilkenny", "Laois", "Leitrim", "Limerick", "Longford", "Louth", "Mayo", "Meath", "Monaghan", "Offaly", "Roscommon", "Sligo", "Tipperary", "Waterford", "Westmeath", "Wexford", "Wicklow"],
  Portugal: ["Aveiro", "Azores", "Beja", "Braga", "Braganca", "Castelo Branco", "Coimbra", "Evora", "Faro", "Guarda", "Leiria", "Lisbon", "Madeira", "Portalegre", "Porto", "Santarem", "Setubal", "Viana do Castelo", "Vila Real", "Viseu"],
  Sweden: ["Blekinge", "Dalarna", "Gavleborg", "Gotland", "Halland", "Jamtland", "Jonkoping", "Kalmar", "Kronoberg", "Norrbotten", "Orebro", "Ostergotland", "Skane", "Sodermanland", "Stockholm", "Uppsala", "Varmland", "Vasterbotten", "Vasternorrland", "Vastmanland", "Vastra Gotaland"],
  Denmark: ["Capital Region of Denmark", "Central Denmark Region", "North Denmark Region", "Region Zealand", "Region of Southern Denmark"],
  Finland: ["Central Finland", "Central Ostrobothnia", "Kainuu", "Kanta-Hame", "Kymenlaakso", "Lapland", "North Karelia", "North Ostrobothnia", "Northern Savonia", "Ostrobothnia", "Paijat-Hame", "Pirkanmaa", "Satakunta", "South Karelia", "South Ostrobothnia", "Southern Savonia", "Southwest Finland", "Uusimaa", "Aland"],
  Norway: ["Agder", "Akershus", "Buskerud", "Finnmark", "Innlandet", "More og Romsdal", "Nordland", "Oslo", "Rogaland", "Telemark", "Troms", "Trondelag", "Vestfold", "Vestland", "Ostfold"],
  Poland: ["Greater Poland", "Kuyavian-Pomeranian", "Lesser Poland", "Lodz", "Lower Silesian", "Lublin", "Lubusz", "Masovian", "Opole", "Podkarpackie", "Podlaskie", "Pomeranian", "Silesian", "Swietokrzyskie", "Warmian-Masurian", "West Pomeranian"],
  Czechia: ["Central Bohemian", "Hradec Kralove", "Karlovy Vary", "Liberec", "Moravian-Silesian", "Olomouc", "Pardubice", "Plzen", "Prague", "South Bohemian", "South Moravian", "Usti nad Labem", "Vysocina", "Zlin"],
  Hungary: ["Bacs-Kiskun", "Baranya", "Bekes", "Borsod-Abauj-Zemplen", "Budapest", "Csongrad-Csanad", "Fejer", "Gyor-Moson-Sopron", "Hajdu-Bihar", "Heves", "Jasz-Nagykun-Szolnok", "Komarom-Esztergom", "Nograd", "Pest", "Somogy", "Szabolcs-Szatmar-Bereg", "Tolna", "Vas", "Veszprem", "Zala"],
  Romania: ["Alba", "Arad", "Arges", "Bacau", "Bihor", "Bistrita-Nasaud", "Botosani", "Braila", "Brasov", "Bucharest", "Buzau", "Calarasi", "Caras-Severin", "Cluj", "Constanta", "Covasna", "Dambovita", "Dolj", "Galati", "Giurgiu", "Gorj", "Harghita", "Hunedoara", "Ialomita", "Iasi", "Ilfov", "Maramures", "Mehedinti", "Mures", "Neamt", "Olt", "Prahova", "Salaj", "Satu Mare", "Sibiu", "Suceava", "Teleorman", "Timis", "Tulcea", "Valcea", "Vaslui", "Vrancea"],
  Greece: ["Attica", "Central Greece", "Central Macedonia", "Crete", "Eastern Macedonia and Thrace", "Epirus", "Ionian Islands", "North Aegean", "Peloponnese", "South Aegean", "Thessaly", "Western Greece", "Western Macedonia"],
  China: ["Anhui", "Beijing", "Chongqing", "Fujian", "Gansu", "Guangdong", "Guangxi", "Guizhou", "Hainan", "Hebei", "Heilongjiang", "Henan", "Hong Kong", "Hubei", "Hunan", "Inner Mongolia", "Jiangsu", "Jiangxi", "Jilin", "Liaoning", "Macau", "Ningxia", "Qinghai", "Shaanxi", "Shandong", "Shanghai", "Shanxi", "Sichuan", "Tianjin", "Tibet", "Xinjiang", "Yunnan", "Zhejiang"],
  "Hong Kong": ["Hong Kong Island", "Kowloon", "New Territories"],
  Macau: ["Macau Peninsula", "Taipa", "Coloane"],
  Bangladesh: ["Barisal", "Chattogram", "Dhaka", "Khulna", "Mymensingh", "Rajshahi", "Rangpur", "Sylhet"],
  Bahrain: ["Capital", "Muharraq", "Northern", "Southern"],
  Brunei: ["Belait", "Brunei-Muara", "Temburong", "Tutong"],
  Cambodia: ["Banteay Meanchey", "Battambang", "Kampong Cham", "Kampong Chhnang", "Kampong Speu", "Kampong Thom", "Kampot", "Kandal", "Kep", "Koh Kong", "Kratie", "Mondulkiri", "Oddar Meanchey", "Pailin", "Phnom Penh", "Preah Sihanouk", "Preah Vihear", "Prey Veng", "Pursat", "Ratanakiri", "Siem Reap", "Stung Treng", "Svay Rieng", "Takeo", "Tbong Khmum"],
  Indonesia: ["Aceh", "Bali", "Bangka Belitung Islands", "Banten", "Bengkulu", "Central Java", "Central Kalimantan", "Central Papua", "Central Sulawesi", "East Java", "East Kalimantan", "East Nusa Tenggara", "Gorontalo", "Highland Papua", "Jakarta", "Jambi", "Lampung", "Maluku", "North Kalimantan", "North Maluku", "North Sulawesi", "North Sumatra", "Papua", "Riau", "Riau Islands", "South Kalimantan", "South Papua", "South Sulawesi", "South Sumatra", "Southeast Sulawesi", "Southwest Papua", "West Java", "West Kalimantan", "West Nusa Tenggara", "West Papua", "West Sulawesi", "West Sumatra", "Special Region of Yogyakarta"],
  Iran: ["Alborz", "Ardabil", "Bushehr", "Chaharmahal and Bakhtiari", "East Azerbaijan", "Fars", "Gilan", "Golestan", "Hamadan", "Hormozgan", "Ilam", "Isfahan", "Kerman", "Kermanshah", "Khuzestan", "Kohgiluyeh and Boyer-Ahmad", "Kurdistan", "Lorestan", "Markazi", "Mazandaran", "North Khorasan", "Qazvin", "Qom", "Razavi Khorasan", "Semnan", "Sistan and Baluchestan", "South Khorasan", "Tehran", "West Azerbaijan", "Yazd", "Zanjan"],
  Japan: ["Aichi", "Akita", "Aomori", "Chiba", "Ehime", "Fukui", "Fukuoka", "Fukushima", "Gifu", "Gunma", "Hiroshima", "Hokkaido", "Hyogo", "Ibaraki", "Ishikawa", "Iwate", "Kagawa", "Kagoshima", "Kanagawa", "Kochi", "Kumamoto", "Kyoto", "Mie", "Miyagi", "Miyazaki", "Nagano", "Nagasaki", "Nara", "Niigata", "Oita", "Okayama", "Okinawa", "Osaka", "Saga", "Saitama", "Shiga", "Shimane", "Shizuoka", "Tochigi", "Tokushima", "Tokyo", "Tottori", "Toyama", "Wakayama", "Yamagata", "Yamaguchi", "Yamanashi"],
  Kazakhstan: ["Abai Region", "Akmola Region", "Aktobe Region", "Almaty", "Almaty Region", "Astana", "Atyrau Region", "East Kazakhstan Region", "Jetisu Region", "Karaganda Region", "Kostanay Region", "Kyzylorda Region", "Mangystau Region", "North Kazakhstan Region", "Pavlodar Region", "Shymkent", "Turkistan Region", "Ulytau Region", "West Kazakhstan Region", "Zhambyl Region"],
  Kuwait: ["Al Ahmadi", "Al Asimah", "Al Farwaniyah", "Al Jahra", "Hawalli", "Mubarak Al-Kabeer"],
  Laos: ["Attapeu", "Bokeo", "Bolikhamxai", "Champasak", "Houaphanh", "Khammouane", "Luang Namtha", "Luang Prabang", "Oudomxay", "Phongsaly", "Salavan", "Savannakhet", "Sekong", "Vientiane Prefecture", "Vientiane Province", "Xaisomboun", "Xayaboury", "Xiangkhouang"],
  Singapore: ["Central Region", "East Region", "North-East Region", "North Region", "West Region"],
  Malaysia: ["Johor", "Kedah", "Kelantan", "Kuala Lumpur", "Labuan", "Malacca", "Negeri Sembilan", "Pahang", "Penang", "Perak", "Perlis", "Putrajaya", "Sabah", "Sarawak", "Selangor", "Terengganu"],
  Mongolia: ["Arkhangai", "Bayan-Olgii", "Bayankhongor", "Bulgan", "Darkhan-Uul", "Dornod", "Dornogovi", "Dundgovi", "Govi-Altai", "Govisumber", "Khentii", "Khovd", "Khuvsgul", "Orkhon", "Omnogovi", "Ovorkhangai", "Selenge", "Sukhbaatar", "Tov", "Uvs", "Zavkhan", "Ulaanbaatar"],
  Myanmar: ["Ayeyarwady Region", "Bago Region", "Chin State", "Kachin State", "Kayah State", "Kayin State", "Magway Region", "Mandalay Region", "Mon State", "Naypyidaw Union Territory", "Rakhine State", "Sagaing Region", "Shan State", "Tanintharyi Region", "Yangon Region"],
  Nepal: ["Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim"],
  Oman: ["Ad Dakhiliyah", "Ad Dhahirah", "Al Batinah North", "Al Batinah South", "Al Buraimi", "Al Wusta", "Ash Sharqiyah North", "Ash Sharqiyah South", "Dhofar", "Musandam", "Muscat"],
  Pakistan: ["Azad Jammu and Kashmir", "Balochistan", "Gilgit-Baltistan", "Islamabad Capital Territory", "Khyber Pakhtunkhwa", "Punjab", "Sindh"],
  Philippines: ["Bangsamoro Autonomous Region in Muslim Mindanao", "Bicol Region", "Cagayan Valley", "Calabarzon", "Caraga", "Central Luzon", "Central Visayas", "Cordillera Administrative Region", "Davao Region", "Eastern Visayas", "Ilocos Region", "Mimaropa", "National Capital Region", "Negros Island Region", "Northern Mindanao", "Soccsksargen", "Western Visayas", "Zamboanga Peninsula"],
  Qatar: ["Al Daayen", "Al Khor", "Al Rayyan", "Al Shahaniya", "Al Shamal", "Al Wakrah", "Doha", "Umm Salal"],
  "Saudi Arabia": ["Al Bahah", "Al Jawf", "Al Madinah", "Al Qassim", "Asir", "Eastern Province", "Ha'il", "Jazan", "Makkah", "Najran", "Northern Borders", "Riyadh", "Tabuk"],
  "South Korea": ["Busan", "Chungcheongbuk-do", "Chungcheongnam-do", "Daegu", "Daejeon", "Gangwon-do", "Gwangju", "Gyeonggi-do", "Gyeongsangbuk-do", "Gyeongsangnam-do", "Incheon", "Jeju", "Jeollabuk-do", "Jeollanam-do", "Sejong", "Seoul", "Ulsan"],
  "Sri Lanka": ["Central", "Eastern", "North Central", "Northern", "North Western", "Sabaragamuwa", "Southern", "Uva", "Western"],
  Taiwan: ["Changhua County", "Chiayi City", "Chiayi County", "Hsinchu City", "Hsinchu County", "Hualien County", "Kaohsiung City", "Keelung City", "Kinmen County", "Lienchiang County", "Miaoli County", "Nantou County", "New Taipei City", "Penghu County", "Pingtung County", "Taichung City", "Tainan City", "Taipei City", "Taitung County", "Taoyuan City", "Yilan County", "Yunlin County"],
  Thailand: ["Amnat Charoen", "Ang Thong", "Bangkok", "Bueng Kan", "Buriram", "Chachoengsao", "Chai Nat", "Chaiyaphum", "Chanthaburi", "Chiang Mai", "Chiang Rai", "Chonburi", "Chumphon", "Kalasin", "Kamphaeng Phet", "Kanchanaburi", "Khon Kaen", "Krabi", "Lampang", "Lamphun", "Loei", "Lopburi", "Mae Hong Son", "Maha Sarakham", "Mukdahan", "Nakhon Nayok", "Nakhon Pathom", "Nakhon Phanom", "Nakhon Ratchasima", "Nakhon Sawan", "Nakhon Si Thammarat", "Nan", "Narathiwat", "Nong Bua Lamphu", "Nong Khai", "Nonthaburi", "Pathum Thani", "Pattani", "Phang Nga", "Phatthalung", "Phayao", "Phetchabun", "Phetchaburi", "Phichit", "Phitsanulok", "Phra Nakhon Si Ayutthaya", "Phrae", "Phuket", "Prachinburi", "Prachuap Khiri Khan", "Ranong", "Ratchaburi", "Rayong", "Roi Et", "Sa Kaeo", "Sakon Nakhon", "Samut Prakan", "Samut Sakhon", "Samut Songkhram", "Saraburi", "Satun", "Sing Buri", "Sisaket", "Songkhla", "Sukhothai", "Suphan Buri", "Surat Thani", "Surin", "Tak", "Trang", "Trat", "Ubon Ratchathani", "Udon Thani", "Uthai Thani", "Uttaradit", "Yala", "Yasothon"],
  Turkey: ["Adana", "Adiyaman", "Afyonkarahisar", "Agri", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydin", "Balikesir", "Bartin", "Batman", "Bayburt", "Bilecik", "Bingol", "Bitlis", "Bolu", "Burdur", "Bursa", "Canakkale", "Cankiri", "Corum", "Denizli", "Diyarbakir", "Duzce", "Edirne", "Elazig", "Erzincan", "Erzurum", "Eskisehir", "Gaziantep", "Giresun", "Gumushane", "Hakkari", "Hatay", "Igdir", "Isparta", "Istanbul", "Izmir", "Kahramanmaras", "Karabuk", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kilis", "Kirikkale", "Kirklareli", "Kirsehir", "Kocaeli", "Konya", "Kutahya", "Malatya", "Manisa", "Mardin", "Mersin", "Mugla", "Mus", "Nevsehir", "Nigde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Sanliurfa", "Siirt", "Sinop", "Sirnak", "Sivas", "Tekirdag", "Tokat", "Trabzon", "Tunceli", "Usak", "Van", "Yalova", "Yozgat", "Zonguldak"],
  "United Arab Emirates": ["Abu Dhabi", "Ajman", "Dubai", "Fujairah", "Ras Al Khaimah", "Sharjah", "Umm Al Quwain"],
  Uzbekistan: ["Andijan", "Bukhara", "Fergana", "Jizzakh", "Karakalpakstan", "Khorezm", "Namangan", "Navoiy", "Qashqadaryo", "Samarqand", "Sirdaryo", "Surxondaryo", "Tashkent", "Tashkent Region"],
  Vietnam: ["An Giang", "Ba Ria-Vung Tau", "Bac Giang", "Bac Kan", "Bac Lieu", "Bac Ninh", "Ben Tre", "Binh Dinh", "Binh Duong", "Binh Phuoc", "Binh Thuan", "Ca Mau", "Can Tho", "Cao Bang", "Da Nang", "Dak Lak", "Dak Nong", "Dien Bien", "Dong Nai", "Dong Thap", "Gia Lai", "Ha Giang", "Ha Nam", "Ha Noi", "Ha Tinh", "Hai Duong", "Hai Phong", "Hau Giang", "Hoa Binh", "Ho Chi Minh City", "Hung Yen", "Khanh Hoa", "Kien Giang", "Kon Tum", "Lai Chau", "Lam Dong", "Lang Son", "Lao Cai", "Long An", "Nam Dinh", "Nghe An", "Ninh Binh", "Ninh Thuan", "Phu Tho", "Phu Yen", "Quang Binh", "Quang Nam", "Quang Ngai", "Quang Ninh", "Quang Tri", "Soc Trang", "Son La", "Tay Ninh", "Thai Binh", "Thai Nguyen", "Thanh Hoa", "Thua Thien-Hue", "Tien Giang", "Tra Vinh", "Tuyen Quang", "Vinh Long", "Vinh Phuc", "Yen Bai"]
};

export function sanitizePhoneDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

export function normalizePhoneCountryCode(value) {
  const raw = String(value || "").trim();
  if (!raw) return DEFAULT_PHONE_COUNTRY_CODE;
  const normalized = raw.startsWith("+") ? raw : `+${sanitizePhoneDigits(raw)}`;
  const match = PHONE_COUNTRY_OPTIONS.find(option => (option.normalizedValue || option.value) === normalized || option.value === normalized);
  return match ? (match.normalizedValue || match.value) : normalized;
}

export function isValidUserPhoneNumber(phoneNumber) {
  const digits = sanitizePhoneDigits(phoneNumber);
  return digits.length >= 6 && digits.length <= 15;
}

export function buildPhoneNumber(phoneCountryCode, phoneNumber) {
  const normalizedCountryCode = normalizePhoneCountryCode(phoneCountryCode);
  const digits = sanitizePhoneDigits(phoneNumber);
  return digits ? `${normalizedCountryCode} ${digits}` : "";
}

export function splitPhoneNumber(phone, fallbackCountryCode = DEFAULT_PHONE_COUNTRY_CODE) {
  const raw = String(phone || "").trim();
  if (!raw) {
    return { phoneCountryCode: fallbackCountryCode, phoneNumber: "" };
  }

  if (!raw.startsWith("+")) {
    return { phoneCountryCode: fallbackCountryCode, phoneNumber: sanitizePhoneDigits(raw) };
  }

  const compact = raw.replace(/[\s()-]/g, "");
  const option = [...PHONE_COUNTRY_OPTIONS]
    .sort((a, b) => (b.normalizedValue || b.value).length - (a.normalizedValue || a.value).length)
    .find(entry => compact.startsWith(entry.normalizedValue || entry.value));

  if (!option) {
    const genericMatch = compact.match(/^\+\d{1,4}/);
    const phoneCountryCode = genericMatch ? genericMatch[0] : fallbackCountryCode;
    return {
      phoneCountryCode,
      phoneNumber: sanitizePhoneDigits(compact.slice(phoneCountryCode.length))
    };
  }

  const countryCode = option.normalizedValue || option.value;
  return {
    phoneCountryCode: countryCode,
    phoneNumber: sanitizePhoneDigits(compact.slice(countryCode.length))
  };
}

export function parseLocationFields(location) {
  const clean = String(location || "").trim();
  if (!clean) {
    return { addressLine: "", city: "", state: "", country: "" };
  }

  const parts = clean
    .split(",")
    .map(part => part.trim())
    .filter(Boolean);

  if (parts.length >= 4) {
    return {
      addressLine: parts.slice(0, -3).join(", "),
      city: parts[parts.length - 3],
      state: parts[parts.length - 2],
      country: parts[parts.length - 1]
    };
  }

  if (parts.length === 3) {
    return {
      addressLine: "",
      city: parts[0],
      state: parts[1],
      country: parts[2]
    };
  }

  if (parts.length === 2) {
    return {
      addressLine: "",
      city: parts[0],
      state: parts[1],
      country: ""
    };
  }

  return { addressLine: "", city: parts[0] || "", state: "", country: "" };
}

export function buildLocationLabel({ addressLine = "", city = "", state = "", country = "" } = {}) {
  return [addressLine, city, state, country]
    .map(value => String(value || "").trim())
    .filter(Boolean)
    .join(", ");
}

export function isValidDateOfBirth(dateOfBirth) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateOfBirth || ""))) return false;
  const parsed = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return false;
  const now = new Date();
  if (parsed > now) return false;
  const age = getAgeFromDateOfBirth(dateOfBirth, now);
  return age !== null && age >= 13 && age <= 120;
}

export function getAgeFromDateOfBirth(dateOfBirth, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateOfBirth || ""))) return null;
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birthDate.getTime()) || birthDate > now) return null;
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  const dayDiff = now.getDate() - birthDate.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age;
}

export function getAgeGroupFromDateOfBirth(dateOfBirth) {
  const age = getAgeFromDateOfBirth(dateOfBirth);
  if (age === null) return "";
  if (age < 18) return "Under 18";
  if (age <= 24) return "18-24";
  if (age <= 34) return "25-34";
  if (age <= 44) return "35-44";
  if (age <= 54) return "45-54";
  return "55+";
}

export function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(Number(ms || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${totalSeconds}s`;
}

export function getStateProvinceOptions(country) {
  return STATE_PROVINCE_OPTIONS[String(country || "").trim()] || [];
}

export function parseDateParts(value) {
  const clean = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return { day: "", month: "", year: "" };
  }
  const [year, month, day] = clean.split("-");
  return { day, month, year };
}

export function buildDateFromParts({ day = "", month = "", year = "" } = {}) {
  const cleanDay = String(day || "").padStart(2, "0");
  const cleanMonth = String(month || "").padStart(2, "0");
  const cleanYear = String(year || "").trim();
  if (!cleanDay || !cleanMonth || !cleanYear) return "";
  return `${cleanYear}-${cleanMonth}-${cleanDay}`;
}

export function parseMonthParts(value) {
  const clean = String(value || "").trim();
  if (!/^\d{4}-\d{2}$/.test(clean)) {
    return { month: "", year: "" };
  }
  const [year, month] = clean.split("-");
  return { month, year };
}

export function buildMonthValue({ month = "", year = "" } = {}) {
  const cleanMonth = String(month || "").padStart(2, "0");
  const cleanYear = String(year || "").trim();
  if (!cleanMonth || !cleanYear) return "";
  return `${cleanYear}-${cleanMonth}`;
}

export function getYearOptions({ startYear, endYear, descending = false } = {}) {
  const currentYear = new Date().getFullYear();
  const resolvedStartYear = Number.isFinite(Number(startYear)) ? Number(startYear) : currentYear - 20;
  const resolvedEndYear = Number.isFinite(Number(endYear)) ? Number(endYear) : currentYear + 10;
  const lower = Math.min(resolvedStartYear, resolvedEndYear);
  const upper = Math.max(resolvedStartYear, resolvedEndYear);
  const options = Array.from({ length: upper - lower + 1 }, (_, index) => String(lower + index));
  return descending ? options.reverse() : options;
}

export function getDayOptions(month, year) {
  const numericMonth = Number(month || 0);
  const numericYear = Number(year || 0);
  const daysInMonth = numericMonth && numericYear ? new Date(numericYear, numericMonth, 0).getDate() : 31;
  return Array.from({ length: daysInMonth }, (_, index) => String(index + 1).padStart(2, "0"));
}

export function normalizeSupportedCountry(country) {
  const clean = String(country || "").trim();
  return COUNTRY_OPTIONS.includes(clean) ? clean : "India";
}

export function getPhoneCountryCodeForCountry(country) {
  const cleanCountry = normalizeSupportedCountry(country);
  const match = PHONE_COUNTRY_OPTIONS.find(option => option.country === cleanCountry);
  return match ? (match.normalizedValue || match.value) : DEFAULT_PHONE_COUNTRY_CODE;
}

export function parseDateOfBirthParts(dateOfBirth) {
  const { day: birthDay, month: birthMonth, year: birthYear } = parseDateParts(dateOfBirth);
  return { birthDay, birthMonth, birthYear };
}

export function buildDateOfBirthFromParts({ birthDay = "", birthMonth = "", birthYear = "" } = {}) {
  return buildDateFromParts({ day: birthDay, month: birthMonth, year: birthYear });
}

export function getBirthYearOptions(maxYears = 100) {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: maxYears + 1 }, (_, index) => String(currentYear - 13 - index));
}

export function getBirthDayOptions(birthMonth, birthYear) {
  return getDayOptions(birthMonth, birthYear);
}