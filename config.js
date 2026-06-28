/* ================================================================================
   THE MASTER ARCHITECT'S MANUAL: config.js (ATOMIC PRECISION)
   --------------------------------------------------------------------------------
   This file represents the "Static Memory Bank" (Constants & Configuration). 
   It initializes read-only data structures into the browser's RAM immediately 
   upon load, acting as a high-speed dictionary for the main engine (app.js).
   
   ATOMIC LEGEND:
   - [MACRO]: The architecture / business logic of the block.
   - [MICRO]: Step-by-step roadmap of the function's physical execution.
   - [ATOMIC]: Pinpoint translation of browser engine mechanics, memory allocation, 
               data types, and strict syntax behaviors.
   - [LIVE WIRE]: Critical database column names or HTML IDs that will crash the app.
================================================================================ */


/* ==========================================================
   SECTION 1: GEOLOCATION & CURRENCY HASH MAP
   [MACRO]: Provides localized currency formatting for the Budget Meal system.
========================================================== */

// [ATOMIC]: 'const' locks the memory pointer. 'currencyMap' is assigned an Object Literal `{}`. 
// In memory, this operates as a "Hash Map" providing O(1) time complexity. 
// This means looking up `currencyMap["Japan"]` happens instantly without searching the whole list.
// The values contain Unicode string characters (like ৳ or ﷼) which the browser natively renders.
const currencyMap = { "Afghanistan": "؋", "Albania": "L", "Algeria": "دج", "Andorra": "€", "Angola": "Kz", "Antigua and Barbuda": "$", "Argentina": "$", "Armenia": "֏", "Australia": "A$", "Austria": "€", "Azerbaijan": "₼", "Bahamas": "$", "Bahrain": "BD", "Bangladesh": "৳", "Barbados": "$", "Belarus": "Br", "Belgium": "€", "Belize": "$", "Benin": "CFA", "Bhutan": "Nu", "Bolivia": "Bs", "Bosnia and Herzegovina": "KM", "Botswana": "P", "Brazil": "R$", "Brunei": "$", "Bulgaria": "лв", "Burkina Faso": "CFA", "Burundi": "FBu", "Cabo Verde": "Esc", "Cambodia": "៛", "Cameroon": "CFA", "Canada": "CA$", "Central African Republic": "CFA", "Chad": "CFA", "Chile": "$", "China": "¥", "Colombia": "$", "Comoros": "CF", "Congo": "CFA", "Costa Rica": "₡", "Croatia": "€", "Cuba": "$", "Cyprus": "€", "Czech Republic": "Kč", "Denmark": "kr", "Djibouti": "Fdj", "Dominica": "$", "Dominican Republic": "$", "Ecuador": "$", "Egypt": "£", "El Salvador": "$", "Equatorial Guinea": "CFA", "Eritrea": "Nfa", "Estonia": "€", "Eswatini": "E", "Ethiopia": "Br", "Fiji": "$", "Finland": "€", "France": "€", "Gabon": "CFA", "Gambia": "D", "Georgia": "₾", "Germany": "€", "Ghana": "₵", "Greece": "€", "Grenada": "$", "Guatemala": "Q", "Guinea": "FG", "Guinea-Bissau": "CFA", "Guyana": "$", "Haiti": "G", "Honduras": "L", "Hungary": "Ft", "Iceland": "kr", "India": "₹", "Indonesia": "Rp", "Iran": "﷼", "Iraq": "ع.د", "Ireland": "€", "Israel": "₪", "Italy": "€", "Jamaica": "$", "Japan": "¥", "Jordan": "JD", "Kazakhstan": "₸", "Kenya": "KSh", "Kiribati": "$", "Kuwait": "KD", "Kyrgyzstan": "som", "Laos": "₭", "Latvia": "€", "Lebanon": "£", "Lesotho": "L", "Liberia": "$", "Libya": "LD", "Liechtenstein": "CHF", "Lithuania": "€", "Luxembourg": "€", "Madagascar": "Ar", "Malawi": "MK", "Malaysia": "RM", "Maldives": "Rf", "Mali": "CFA", "Malta": "€", "Marshall Islands": "$", "Mauritania": "UM", "Mauritius": "₨", "Mexico": "$", "Micronesia": "$", "Moldova": "L", "Monaco": "€", "Mongolia": "₮", "Montenegro": "€", "Morocco": "DH", "Mozambique": "MT", "Myanmar": "Ks", "Namibia": "N$", "Nauru": "$", "Nepal": "₨", "Netherlands": "€", "New Zealand": "NZ$", "Nicaragua": "C$", "Niger": "CFA", "Nigeria": "₦", "North Macedonia": "ден", "Norway": "kr", "Oman": "ر.ع.", "Pakistan": "₨", "Palau": "$", "Palestine": "₪", "Panama": "B/.", "Papua New Guinea": "K", "Paraguay": "₲", "Peru": "S/", "Philippines": "₱", "Poland": "zł", "Portugal": "€", "Qatar": "QR", "Romania": "lei", "Russia": "₽", "Rwanda": "FRw", "Saint Kitts and Nevis": "$", "Saint Lucia": "$", "Saint Vincent and the Grenadines": "$", "Samoa": "WS$", "San Marino": "€", "Sao Tome and Principe": "Db", "Saudi Arabia": "﷼", "Senegal": "CFA", "Serbia": "дин", "Seychelles": "₨", "Sierra Leone": "Le", "Singapore": "S$", "Slovakia": "€", "Slovenia": "€", "Solomon Islands": "$", "Somalia": "Sh", "South Africa": "R", "South Sudan": "£", "Spain": "€", "Sri Lanka": "₨", "Sudan": "£", "Suriname": "$", "Sweden": "kr", "Switzerland": "CHF", "Syria": "£", "Taiwan": "NT$", "Tajikistan": "SM", "Tanzania": "TSh", "Thailand": "฿", "Timor-Leste": "$", "Togo": "CFA", "Tonga": "T$", "Trinidad and Tobago": "TT$", "Tunisia": "DT", "Turkey": "₺", "Turkmenistan": "m", "Tuvalu": "$", "Uganda": "USh", "Ukraine": "₴", "United Arab Emirates": "AED", "UK": "£", "USA": "$", "Uruguay": "$", "Uzbekistan": "so'm", "Vanuatu": "VT", "Vatican City": "€", "Venezuela": "Bs", "Vietnam": "₫", "Yemen": "﷼", "Zambia": "ZK", "Zimbabwe": "Z$" };

// [ATOMIC]: Method Chaining Pipeline. 
// Step 1: Object.keys(currencyMap) reads the RAM block above and extracts ONLY the country names into a 1-dimensional Array `["Afghanistan", "Albania", ...]`.
// Step 2: .sort() invokes the browser engine's native lexicographical (alphabetical) sorting algorithm. 
// It mutates the array into absolute A-Z order and assigns that final array strictly to the `countries` constant.
const countries = Object.keys(currencyMap).sort();


/* ==========================================================
   SECTION 2: TOPOLOGICAL DATABASE (CATEGORIES)
   [MACRO]: Defines the exact parent-child hierarchy of the entire application.
========================================================== */

// [LIVE WIRE]: The strings in this object dictate EVERYTHING. If a string here ("Pork dishes") does not EXACTLY match the string saved in Supabase, your filters and search engine will completely break.
// [ATOMIC]: 2-Dimensional Structural Map. A Dictionary where the Key is a String ("Main Meals"), and the Value is a dynamically allocated Array `[]` containing localized memory blocks (Subcategories).
const categories = {
    "Breakfast": ["Hot breakfasts", "Cold breakfasts", "Cereals & oats", "Breakfast sandwiches", "Pancakes, waffles & French toast"],
    "Lunch": ["Light meals", "Sandwiches & wraps", "Salads", "Soups"],
    "Main Meals": ["Beef dishes", "Chicken dishes", "Pork dishes", "Lamb dishes", "Seafood dishes", "Vegetarian meals", "Pasta dishes", "Rice dishes", "Casseroles & bakes", "Curries", "Stews"],
    "Side Dishes": ["Vegetables", "Potatoes", "Rice sides", "Pasta sides", "Bread sides", "Salads"],
    "Snacks & Finger Foods": ["Chips & crisps", "Dips", "Finger foods", "Party snacks", "Savoury snacks"],
    "Fast Food & Takeaway Style": ["Burgers", "Pizza", "Hot dogs", "Wraps", "Fried foods"],
    "Bread & Baking": ["Breads", "Rolls & buns", "Scones", "Muffins", "Savoury baked goods"],
    "Desserts": ["Cakes", "Pies & tarts", "Puddings", "Custards", "Ice cream & frozen desserts", "Sweet pastries"],
    "Biscuits, Cookies & Sweets": ["Cookies", "Biscuits", "Fudge", "Candy", "Chocolate treats"],
    "Drinks": ["Hot drinks", "Cold drinks", "Smoothies", "Milkshakes", "Cocktails", "Mocktails"],
    "Sauces, Condiments & Spreads": ["Sauces", "Gravies", "Marinades", "Dressings", "Jams & preserves"],
    "Preserves & Fermented Foods": ["Pickles", "Chutneys", "Relishes", "Fermented foods"],
    "Special Occasion Foods": ["Braai recipes", "Christmas recipes", "Birthday recipes", "Easter recipes", "Party foods"],
    "Cuisine Types": ["South African", "Italian", "Mexican", "Indian", "Chinese", "American", "Greek", "French", "Middle Eastern", "Thai"],
    "Dietary Categories": ["Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Low-carb", "Keto", "High-protein"],
    "Specialized Plans": ["7-Day Meal Plans"],
    "Pet Food & Treats": ["Dogs", "Cats", "Birds", "Small Pets", "Other Pets"]
};


/* ==========================================================
   SECTION 3: METADATA & UI DECORATIONS
   [MACRO]: Binds visual emojis and descriptive helper text to the raw category strings.
========================================================== */

// [ATOMIC]: Nested Object Declaration. Maps a Root Key ("Breakfast") to a Child Object containing multiple typed properties (`icon`: String, `desc`: String). 
// By structuring data this way, your renderCategoryList() in app.js can instantly extract `meta.icon` and `meta.desc` to paint the screen safely.
const categoryMeta = {
    "Breakfast": { icon: "🍳", desc: "Start your morning right with hot meals, oats, and bakes." },
    "Lunch": { icon: "🥪", desc: "Midday fuel from quick sandwiches to light salads and soups." },
    "Main Meals": { icon: "🍲", desc: "Hearty dinners including stews, curries, and roasted dishes." },
    "Side Dishes": { icon: "🥗", desc: "The perfect companions: rice, potatoes, veggies, and more." },
    "Snacks & Finger Foods": { icon: "🥨", desc: "Bite-sized treats, party snacks, and savory dips." },
    "Fast Food & Takeaway Style": { icon: "🍔", desc: "Recreate your favorite takeout meals right at home." },
    "Bread & Baking": { icon: "🥖", desc: "Fresh from the oven: loaves, rolls, scones, and muffins." },
    "Desserts": { icon: "🍰", desc: "Sweet endings: cakes, puddings, pies, and ice cream." },
    "Biscuits, Cookies & Sweets": { icon: "🍪", desc: "Baked treats, fudge, candies, and chocolate delights." },
    "Drinks": { icon: "🥤", desc: "Refreshing smoothies, hot beverages, and fun mocktails." },
    "Sauces, Condiments & Spreads": { icon: "🍯", desc: "Elevate your meals with homemade marinades and gravies." },
    "Preserves & Fermented Foods": { icon: "🥒", desc: "Pickles, chutneys, and relishes to store and enjoy." },
    "Special Occasion Foods": { icon: "🎉", desc: "Festive dishes for holidays, birthdays, and braais." },
    "Cuisine Types": { icon: "🌍", desc: "Explore authentic global flavors from around the world." },
    "Dietary Categories": { icon: "🌱", desc: "Specialized meals: Vegan, Keto, Gluten-free, and more." },
    "Specialized Plans": { icon: "📅", desc: "Full 7-day meal plans to keep you on budget." },
    "Pet Food & Treats": { icon: "🐾", desc: "Homemade, cost-effective nutrition for our furry friends." }
};

const subcategoryMeta = {
    "Hot breakfasts": { icon: "🍳", desc: "Warm and hearty morning meals." },
    "Cold breakfasts": { icon: "🥣", desc: "Quick, refreshing, and no-cook morning fuel." },
    "Cereals & oats": { icon: "🌾", desc: "Oatmeal, muesli, and crunchy cereals." },
    "Breakfast sandwiches": { icon: "🥪", desc: "Eggs, bacon, and cheese stacked to go." },
    "Pancakes, waffles & French toast": { icon: "🥞", desc: "Sweet, fluffy weekend favorites." },
    "Light meals": { icon: "🥗", desc: "Healthy, easy portions for the midday slump." },
    "Sandwiches & wraps": { icon: "🌯", desc: "Portable and packed with flavor." },
    "Salads": { icon: "🥬", desc: "Fresh, crisp, and nutrient-dense greens." },
    "Soups": { icon: "🥣", desc: "Comforting bowls for a chilly afternoon." },
    "Beef dishes": { icon: "🥩", desc: "Hearty roasts, steaks, and mince meals." },
    "Chicken dishes": { icon: "🍗", desc: "Versatile, affordable poultry dinners." },
    "Pork dishes": { icon: "🥓", desc: "Chops, ribs, and slow-cooked pulled pork." },
    "Lamb dishes": { icon: "🍖", desc: "Rich and tender lamb roasts and stews." },
    "Seafood dishes": { icon: "🐟", desc: "Fresh fish, prawns, and savory bakes." },
    "Vegetarian meals": { icon: "🍆", desc: "Meat-free mains that pack a punch." },
    "Pasta dishes": { icon: "🍝", desc: "Classic Italian-style noodles and sauces." },
    "Rice dishes": { icon: "🍚", desc: "Fried rice, risottos, and savory grains." },
    "Casseroles & bakes": { icon: "🥘", desc: "One-pan wonders baked to perfection." },
    "Curries": { icon: "🍛", desc: "Spicy, warming, and deeply flavorful." },
    "Stews": { icon: "🍲", desc: "Slow-cooked, melt-in-your-mouth comfort." },
    "Vegetables": { icon: "🥦", desc: "Roasted, steamed, or sautéed veggies." },
    "Potatoes": { icon: "🥔", desc: "Mash, roasties, and creamy potato bakes." },
    "Rice sides": { icon: "🍙", desc: "Simple grains to soak up the sauce." },
    "Pasta sides": { icon: "🧀", desc: "Mac and cheese and cold pasta salads." },
    "Bread sides": { icon: "🥖", desc: "Garlic bread, rolls, and flatbreads." },
    "Chips & crisps": { icon: "🍟", desc: "Crunchy, salty, and perfect for dipping." },
    "Dips": { icon: "🥣", desc: "Hummus, guacamole, and cheesy spreads." },
    "Finger foods": { icon: "🍢", desc: "Easy to eat with one hand." },
    "Party snacks": { icon: "🎉", desc: "Crowd-pleasers for your next gathering." },
    "Savoury snacks": { icon: "🧀", desc: "Cheese bites, nuts, and salty treats." },
    "Burgers": { icon: "🍔", desc: "Juicy patties with all the trimmings." },
    "Pizza": { icon: "🍕", desc: "Homemade dough and endless toppings." },
    "Hot dogs": { icon: "🌭", desc: "Classic franks, buns, and mustard." },
    "Wraps": { icon: "🌯", desc: "Folded flatbreads stuffed with goodness." },
    "Fried foods": { icon: "🍤", desc: "Crispy, golden, deep-fried indulgence." },
    "Breads": { icon: "🍞", desc: "Classic loaves, sourdough, and rye." },
    "Rolls & buns": { icon: "🥐", desc: "Soft, buttery, and perfect for sliders." },
    "Scones": { icon: "🧁", desc: "Tea-time classics with jam and cream." },
    "Muffins": { icon: "🫐", desc: "Sweet and savory on-the-go bakes." },
    "Savoury baked goods": { icon: "🥧", desc: "Meat pies, sausage rolls, and quiches." },
    "Cakes": { icon: "🎂", desc: "Sponges, layered treats, and cupcakes." },
    "Pies & tarts": { icon: "🥧", desc: "Fruity, creamy, with a buttery crust." },
    "Puddings": { icon: "🍮", desc: "Warm, gooey, and comforting desserts." },
    "Custards": { icon: "🥄", desc: "Smooth, vanilla-rich sweet sauces." },
    "Ice cream & frozen desserts": { icon: "🍦", desc: "Cool treats for a hot day." },
    "Sweet pastries": { icon: "🥐", desc: "Flaky, sugar-dusted baker delights." },
    "Cookies": { icon: "🍪", desc: "Chocolate chip, oatmeal, and chewy bites." },
    "Biscuits": { icon: "☕", desc: "Crunchy dunkers for your tea or coffee." },
    "Fudge": { icon: "🍬", desc: "Rich, dense, and melt-in-your-mouth." },
    "Candy": { icon: "🍭", desc: "Homemade sweets and sugar crafts." },
    "Chocolate treats": { icon: "🍫", desc: "Truffles, brownies, and cocoa heaven." },
    "Hot drinks": { icon: "☕", desc: "Coffee, tea, and rich hot chocolate." },
    "Cold drinks": { icon: "🥤", desc: "Iced teas, lemonades, and coolers." },
    "Smoothies": { icon: "🍹", desc: "Blended fruits and healthy greens." },
    "Milkshakes": { icon: "🥛", desc: "Thick, creamy, and ice-cream based." },
    "Cocktails": { icon: "🍸", desc: "Adult beverages mixed to perfection." },
    "Mocktails": { icon: "🍹", desc: "Alcohol-free fun with all the flavor." },
    "Sauces": { icon: "🍅", desc: "Pasta sauces, dipping sauces, and more." },
    "Gravies": { icon: "🥣", desc: "Rich meat and veggie drippings." },
    "Marinades": { icon: "🥩", desc: "Flavor baths for tenderizing meats." },
    "Dressings": { icon: "🥗", desc: "Vinaigrettes and creamy salad toppers." },
    "Jams & preserves": { icon: "🍓", desc: "Boiled fruits set for toast and baking." },
    "Pickles": { icon: "🥒", desc: "Crunchy veggies brined in vinegar." },
    "Chutneys": { icon: "🥭", desc: "Sweet and spicy Indian-style relishes." },
    "Relishes": { icon: "🧅", desc: "Tangy condiments for burgers and hotdogs." },
    "Fermented foods": { icon: "🥬", desc: "Kimchi, kraut, and gut-friendly eats." },
    "Braai recipes": { icon: "🔥", desc: "South African barbecue classics." },
    "Christmas recipes": { icon: "🎄", desc: "Festive roasts, bakes, and treats." },
    "Birthday recipes": { icon: "🎁", desc: "Party food and celebration cakes." },
    "Easter recipes": { icon: "🐰", desc: "Hot cross buns and pickled fish." },
    "Party foods": { icon: "🎈", desc: "Platters and snacks for a big crowd." },
    "South African": { icon: "🇿🇦", desc: "Bobotie, potjiekos, and local favorites." },
    "Italian": { icon: "🇮🇹", desc: "Pasta, pizza, and Mediterranean flair." },
    "Mexican": { icon: "🇲🇽", desc: "Tacos, burritos, and spicy salsas." },
    "Indian": { icon: "🇮🇳", desc: "Curries, naan, and aromatic spices." },
    "Chinese": { icon: "🇨🇳", desc: "Stir-fries, dumplings, and noodles." },
    "American": { icon: "🇺🇸", desc: "Burgers, BBQ, and diner classics." },
    "Greek": { icon: "🇬🇷", desc: "Gyros, feta, and fresh olive oil dishes." },
    "French": { icon: "🇫🇷", desc: "Rich butter, pastries, and rustic stews." },
    "Middle Eastern": { icon: "🥙", desc: "Falafel, hummus, and spiced meats." },
    "Thai": { icon: "🇹🇭", desc: "Sweet, sour, spicy, and fragrant bowls." },
    "Vegetarian": { icon: "🥑", desc: "Plant-based goodness with dairy/eggs." },
    "Vegan": { icon: "🌱", desc: "100% animal-product-free meals." },
    "Gluten-free": { icon: "🚫", desc: "Wheat-free bakes and dinners." },
    "Dairy-free": { icon: "🥥", desc: "No milk, cheese, or butter used." },
    "Low-carb": { icon: "🥓", desc: "Minimal sugars and starches." },
    "Keto": { icon: "🥩", desc: "High fat, moderate protein, very low carb." },
    "High-protein": { icon: "💪", desc: "Muscle-building, filling portions." },
    "7-Day Meal Plans": { icon: "📅", desc: "Full 7-day meal plans to keep you on budget." },
    "Dogs": { icon: "🐶", desc: "Meals, biscuits, and healthy treats for dogs." },
    "Cats": { icon: "🐱", desc: "Feline favorites, from wet food to crunchy snacks." },
    "Birds": { icon: "🦜", desc: "Seed mixes and fresh fruit treats for pet birds." },
    "Small Pets": { icon: "🐹", desc: "Nibbles for rabbits, hamsters, and guinea pigs." },
    "Other Pets": { icon: "🦎", desc: "Specialty food for reptiles, fish, and exotic pals." }
};


/* ==========================================================
   SECTION 4: SMART CONVERTER MATHEMATICAL PARAMETERS
   [MACRO]: The rules engine ensuring measurements are calculated accurately.
========================================================== */

// [ATOMIC]: Lexical structural grouping Array. This provides safety isolation preventing logical boundary breaches.
// Example: It forces the app.js updateConverter() function to ONLY allow "weight" items to be converted to other "weight" items.
const convFamilies = { 
    weight: ['g', 'kg', 'oz', 'lb'], 
    volume: ['ml', 'l', 'tsp', 'tbsp', 'cup', 'fl oz'], 
    temp: ['c', 'f'] 
};

// [ATOMIC]: Absolute Mathematical Index Map. 
// Uses floating-point numeric constants (like 28.3495) structured to a strict 'Base-1' logic algorithm.
// For weight, Grams ('g') is Base 1. For volume, Milliliters ('ml') is Base 1. 
// The app.js engine multiplies user input by the Origin rate to standardize it to Base-1, then divides by the Destination rate to get the final output.
const convRates = { 
    'g': 1, 
    'kg': 1000, 
    'oz': 28.3495, 
    'lb': 453.592, 
    'ml': 1, 
    'l': 1000, 
    'tsp': 4.9289, 
    'tbsp': 14.7868, 
    'cup': 250, 
    'fl oz': 29.5735 
};
