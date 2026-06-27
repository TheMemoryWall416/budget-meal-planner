const supabaseUrl = 'https://bvdgbodzrfhgpvxzuogs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2ZGdib2R6cmZoZ3B2eHp1b2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjYxMzIsImV4cCI6MjA5NzMwMjEzMn0.C6jFxQmFQYnRjVK8V30mG4qTH3PtEWmVThiiSvr1tEw';
const myDatabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let selectedCountry = "";
let selectedSubcategory = "";
let selectedParentCategory = ""; 
let totalApprovedRecipes = 0; 
let totalVisitors = 10000;
let teamPhotoUrl = localStorage.getItem('cached_team_photo') || 'https://via.placeholder.com/300';

const currencyMap = { "Afghanistan": "؋", "Albania": "L", "Algeria": "دج", "Andorra": "€", "Angola": "Kz", "Antigua and Barbuda": "$", "Argentina": "$", "Armenia": "֏", "Australia": "A$", "Austria": "€", "Azerbaijan": "₼", "Bahamas": "$", "Bahrain": "BD", "Bangladesh": "৳", "Barbados": "$", "Belarus": "Br", "Belgium": "€", "Belize": "$", "Benin": "CFA", "Bhutan": "Nu", "Bolivia": "Bs", "Bosnia and Herzegovina": "KM", "Botswana": "P", "Brazil": "R$", "Brunei": "$", "Bulgaria": "лв", "Burkina Faso": "CFA", "Burundi": "FBu", "Cabo Verde": "Esc", "Cambodia": "៛", "Cameroon": "CFA", "Canada": "CA$", "Central African Republic": "CFA", "Chad": "CFA", "Chile": "$", "China": "¥", "Colombia": "$", "Comoros": "CF", "Congo": "CFA", "Costa Rica": "₡", "Croatia": "€", "Cuba": "$", "Cyprus": "€", "Czech Republic": "Kč", "Denmark": "kr", "Djibouti": "Fdj", "Dominica": "$", "Dominican Republic": "$", "Ecuador": "$", "Egypt": "£", "El Salvador": "$", "Equatorial Guinea": "CFA", "Eritrea": "Nfa", "Estonia": "€", "Eswatini": "E", "Ethiopia": "Br", "Fiji": "$", "Finland": "€", "France": "€", "Gabon": "CFA", "Gambia": "D", "Georgia": "₾", "Germany": "€", "Ghana": "₵", "Greece": "€", "Grenada": "$", "Guatemala": "Q", "Guinea": "FG", "Guinea-Bissau": "CFA", "Guyana": "$", "Haiti": "G", "Honduras": "L", "Hungary": "Ft", "Iceland": "kr", "India": "₹", "Indonesia": "Rp", "Iran": "﷼", "Iraq": "ع.د", "Ireland": "€", "Israel": "₪", "Italy": "€", "Jamaica": "$", "Japan": "¥", "Jordan": "JD", "Kazakhstan": "₸", "Kenya": "KSh", "Kiribati": "$", "Kuwait": "KD", "Kyrgyzstan": "som", "Laos": "₭", "Latvia": "€", "Lebanon": "£", "Lesotho": "L", "Liberia": "$", "Libya": "LD", "Liechtenstein": "CHF", "Lithuania": "€", "Luxembourg": "€", "Madagascar": "Ar", "Malawi": "MK", "Malaysia": "RM", "Maldives": "Rf", "Mali": "CFA", "Malta": "€", "Marshall Islands": "$", "Mauritania": "UM", "Mauritius": "₨", "Mexico": "$", "Micronesia": "$", "Moldova": "L", "Monaco": "€", "Mongolia": "₮", "Montenegro": "€", "Morocco": "DH", "Mozambique": "MT", "Myanmar": "Ks", "Namibia": "N$", "Nauru": "$", "Nepal": "₨", "Netherlands": "€", "New Zealand": "NZ$", "Nicaragua": "C$", "Niger": "CFA", "Nigeria": "₦", "North Macedonia": "ден", "Norway": "kr", "Oman": "ر.ع.", "Pakistan": "₨", "Palau": "$", "Palestine": "₪", "Panama": "B/.", "Papua New Guinea": "K", "Paraguay": "₲", "Peru": "S/", "Philippines": "₱", "Poland": "zł", "Portugal": "€", "Qatar": "QR", "Romania": "lei", "Russia": "₽", "Rwanda": "FRw", "Saint Kitts and Nevis": "$", "Saint Lucia": "$", "Saint Vincent and the Grenadines": "$", "Samoa": "WS$", "San Marino": "€", "Sao Tome and Principe": "Db", "Saudi Arabia": "﷼", "Senegal": "CFA", "Serbia": "дин", "Seychelles": "₨", "Sierra Leone": "Le", "Singapore": "S$", "Slovakia": "€", "Slovenia": "€", "Solomon Islands": "$", "Somalia": "Sh", "South Africa": "R", "South Sudan": "£", "Spain": "€", "Sri Lanka": "₨", "Sudan": "£", "Suriname": "$", "Sweden": "kr", "Switzerland": "CHF", "Syria": "£", "Taiwan": "NT$", "Tajikistan": "SM", "Tanzania": "TSh", "Thailand": "฿", "Timor-Leste": "$", "Togo": "CFA", "Tonga": "T$", "Trinidad and Tobago": "TT$", "Tunisia": "DT", "Turkey": "₺", "Turkmenistan": "m", "Tuvalu": "$", "Uganda": "USh", "Ukraine": "₴", "United Arab Emirates": "AED", "UK": "£", "USA": "$", "Uruguay": "$", "Uzbekistan": "so'm", "Vanuatu": "VT", "Vatican City": "€", "Venezuela": "Bs", "Vietnam": "₫", "Yemen": "﷼", "Zambia": "ZK", "Zimbabwe": "Z$" };
const countries = Object.keys(currencyMap).sort();

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

// --- INITIALIZATION & SESSION TRACKING ---
async function handleVisitorSession() {
    const now = Date.now();
    const lastVisit = localStorage.getItem('last_visit_time');
    const cooldown = 30 * 60 * 1000; 

    if (!lastVisit || (now - parseInt(lastVisit)) > cooldown) {
        await myDatabase.rpc('increment_visitor_count');
        localStorage.setItem('last_visit_time', now.toString());
    }
    fetchStats();
}

async function fetchStats() {
    const { count, error: recipeError } = await myDatabase.from('meals').select('*', { count: 'exact', head: true });
    if (!recipeError && count !== null) { totalApprovedRecipes = count; }

    const { data: vData } = await myDatabase.from('site_stats').select('visitor_count').eq('id', 1).single();
    if (vData) { totalVisitors = vData.visitor_count; }

    const { data: configData } = await myDatabase.from('site_config').select('team_photo_url, main_background_url').eq('id', 1).single();
    
    if (configData) {
        if (configData.team_photo_url) {
            teamPhotoUrl = configData.team_photo_url;
            localStorage.setItem('cached_team_photo', teamPhotoUrl); 
            const homePhoto = document.getElementById('home-team-photo');
            if (homePhoto && homePhoto.src !== teamPhotoUrl) { homePhoto.src = teamPhotoUrl; }
        }
        
        if (configData.main_background_url) {
            document.body.style.backgroundImage = `url('${configData.main_background_url}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center center';
            document.body.style.backgroundAttachment = 'fixed';
            document.body.style.backgroundRepeat = 'no-repeat';
        }
    }

    const navCounter = document.getElementById('nav-counter');
    if (navCounter) {
        navCounter.innerHTML = `🌍 ${totalApprovedRecipes} Recipes Live<br><span style="font-size: 0.9em; color: #008080; display: inline-block; margin-top: 5px;">👀 ${totalVisitors.toLocaleString()} Total Visits</span>`;
    }

    const homeCounter = document.getElementById('home-visitor-counter');
    if (homeCounter) {
        homeCounter.innerHTML = `👀 ${totalVisitors.toLocaleString()} Total Visits to Website`;
    }
}

function previewTheme() {
    const color = document.getElementById('modal-color-select').value;
    const mc = document.getElementById('modal-content');
    const previews = { 'blue': '#add8e6', 'green': '#98fb98', 'darkgrey': '#808080', 'purple': '#4b0082', 'orange': '#d2691e', 'teal': '#008080', 'pink': '#ffb7c5' };
    mc.style.backgroundColor = previews[color] || '#ffb7c5';
}

function applyTheme(color) {
    const root = document.documentElement;
    const themes = {
        'blue': { nav: '#add8e6', bg: '#f0f8ff' },
        'green': { nav: '#98fb98', bg: '#f0fff0' },
        'darkgrey': { nav: '#808080', bg: '#d3d3d3' },
        'purple': { nav: '#4b0082', bg: '#e6e6fa' },
        'orange': { nav: '#d2691e', bg: '#fff5e6' },
        'teal': { nav: '#008080', bg: '#e0f7fa' },
        'pink': { nav: '#ffb7c5', bg: '#fff0f5' }
    };
    const selected = themes[color] || themes['pink'];
    root.style.setProperty('--nav-color', selected.nav);
    root.style.setProperty('--bg', selected.bg);
}

function confirmCountry() {
    const s = document.getElementById('modal-country-select').value;
    const color = document.getElementById('modal-color-select').value;
    if (!s) return alert("Select a country!");
    selectedCountry = s;
    applyTheme(color);
    document.getElementById('country-modal').style.display = 'none';
    
    const params = new URLSearchParams(window.location.search);
    if (params.get('recipe')) {
        viewRecipe(params.get('recipe'));
    } else if (params.get('budget')) {
        viewBudgetMeal(params.get('budget'));
    } else {
        showPage('home');
    }
}

window.onload = function() {
    const s2 = document.getElementById('modal-country-select');
    countries.forEach(c => { let o = document.createElement('option'); o.value = c; o.innerHTML = c; s2.appendChild(o); });
    updateHack(); 
    handleVisitorSession();
};

async function executeSearch() {
    const term = document.getElementById('search-input').value.trim();
    if (!term) return;
    const view = document.getElementById('main-view');
    view.innerHTML = `<div class="window-box"><h1>Searching for "${term}"...</h1></div>`;

    const { data, error } = await myDatabase.from('meals')
        .select('id, title, category, parent_category, author, created_at, meal_type')
        .or(`title.ilike.%${term}%,recipe.ilike.%${term}%`)
        .order('created_at', { ascending: false });

    if (error) {
        view.innerHTML = `<div class="window-box"><h1>Error</h1><p>${error.message}</p><button onclick="renderCategoryList('find')">← Back</button></div>`;
        return;
    }

    let html = `
        <div class="window-box" style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px; width: 100%; max-width: 600px; box-sizing: border-box;">
            <button onclick="renderCategoryList('find')" style="margin:0; background:var(--btn-grey); border:2px solid var(--border);">← Back to Categories</button>
            <h1 style="margin: 0;">Search Results</h1>
        </div>
    `;

    if (data.length === 0) {
        html += `<div class="window-box" style="width: 100%; max-width: 600px;"><p>No recipes found matching "${term}". Try a different ingredient or meal name.</p></div>`;
    } else {
        html += `<div style="display: flex; flex-direction: column; gap: 10px; max-width: 600px; width: 100%;">`;
        data.forEach(meal => {
            const author = meal.author || "Community";
            const isBudget = meal.category === 'budget';
            const clickAction = isBudget ? `viewBudgetMeal(${meal.id})` : `viewRecipe(${meal.id})`;
            const badge = isBudget ? `<span style="background: #ffcc00; padding: 2px 6px; font-size: 0.7rem; font-weight: bold; border: 1px solid var(--border); margin-left: 10px;">BUDGET</span>` : '';

            html += `<div class="window-box" onclick="${clickAction}" style="padding: 15px; cursor: pointer; margin-bottom: 0;">
                        <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 5px;">${meal.title} ${badge}</div>
                        <div style="font-size: 0.85rem; color: #666;">In ${meal.category} • By ${author}</div>
                     </div>`;
        });
        html += `</div>`;
    }
    view.innerHTML = html;
}

function renderFindHub() {
    const view = document.getElementById('main-view');
    view.innerHTML = `
        <div class="window-box" style="width: 100%; max-width: 900px; box-sizing: border-box;">
            <h1 style="margin-top: 0; margin-bottom: 5px;">FIND RECIPES</h1>
            <p style="font-size: 1.1rem; color: #555; margin-top: 0; margin-bottom: 0;">What are you looking for today?</p>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; width: 100%; max-width: 900px;">
            <div class="window-box" onclick="renderCategoryList('find')" style="cursor: pointer; text-align: center; margin-bottom: 0;">
                <h3 style="margin-top: 0; font-size: 1.4rem;">🍲 Global Recipes</h3>
                <p style="font-size: 0.95rem; color: #444; margin-bottom: 0;">Search our open library of everyday recipes shared by cooks worldwide.</p>
            </div>
            <div class="window-box" onclick="showPage('find-budget-meals')" style="cursor: pointer; text-align: center; margin-bottom: 0;">
                <h3 style="margin-top: 0; font-size: 1.4rem;">💰 Budget Meals</h3>
                <p style="font-size: 0.95rem; color: #444; margin-bottom: 0;">Find cost-calculated meals and clever takeaway hacks for your specific country.</p>
            </div>
            <div class="window-box" onclick="showPage('find-specials')" style="cursor: pointer; text-align: center; margin-bottom: 0;">
                <h3 style="margin-top: 0; font-size: 1.4rem;">🏷️ Local Specials</h3>
                <p style="font-size: 0.95rem; color: #444; margin-bottom: 0;">Discover great grocery deals or bulk specials shared locally before they expire.</p>
            </div>
            <div class="window-box" onclick="showPage('find-meal-plans')" style="cursor: pointer; text-align: center; margin-bottom: 0;">
                <h3 style="margin-top: 0; font-size: 1.4rem;">📅 7-Day Meal Plans</h3>
                <p style="font-size: 0.95rem; color: #444; margin-bottom: 0;">Browse full weeks of planned, budget-friendly eating to keep you on track.</p>
            </div>
            <div class="window-box" onclick="showPage('find-pet-food')" style="cursor: pointer; text-align: center; margin-bottom: 0;">
                <h3 style="margin-top: 0; font-size: 1.4rem;">🐾 Pet Food & Treats</h3>
                <p style="font-size: 0.95rem; color: #444; margin-bottom: 0;">Find homemade, cost-effective nutrition and treat recipes for furry friends.</p>
            </div>
        </div>
    `;
}

function renderCreatorHub() {
    const view = document.getElementById('main-view');
    view.innerHTML = `
        <div class="window-box" style="width: 100%; max-width: 900px; box-sizing: border-box;">
            <h1 style="margin-top: 0; margin-bottom: 5px;">ADD YOUR OWN</h1>
            <p style="font-size: 1.1rem; color: #555; margin-top: 0; margin-bottom: 0;">What would you like to share with the community today?</p>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; width: 100%; max-width: 900px;">
            <div class="window-box" onclick="addRecipeMenu()" style="cursor: pointer; text-align: center; margin-bottom: 0;">
                <h3 style="margin-top: 0; font-size: 1.4rem;">🍲 Global Recipe</h3>
                <p style="font-size: 0.95rem; color: #444; margin-bottom: 0;">Share a classic family favorite, quick dinner, or an everyday recipe with the world.</p>
            </div>
            <div class="window-box" onclick="showPage('add-budget-meal')" style="cursor: pointer; text-align: center; margin-bottom: 0;">
                <h3 style="margin-top: 0; font-size: 1.4rem;">💰 Budget Meal</h3>
                <p style="font-size: 0.95rem; color: #444; margin-bottom: 0;">Post a cost-calculated meal or a clever takeaway hack for your specific country.</p>
            </div>
            <div class="window-box" onclick="showPage('add-special')" style="cursor: pointer; text-align: center; margin-bottom: 0;">
                <h3 style="margin-top: 0; font-size: 1.4rem;">🏷️ Local Special</h3>
                <p style="font-size: 0.95rem; color: #444; margin-bottom: 0;">Spotted a great grocery deal or bulk special? Share it locally before it expires.</p>
            </div>
            <div class="window-box" onclick="showPage('add-meal-plan')" style="cursor: pointer; text-align: center; margin-bottom: 0;">
                <h3 style="margin-top: 0; font-size: 1.4rem;">📅 7-Day Meal Plan</h3>
                <p style="font-size: 0.95rem; color: #444; margin-bottom: 0;">Help others by sharing a full week of planned, budget-friendly eating.</p>
            </div>
            <div class="window-box" onclick="renderSubcategoryList('Pet Food & Treats', 'add')" style="cursor: pointer; text-align: center; margin-bottom: 0;">
                <h3 style="margin-top: 0; font-size: 1.4rem;">🐾 Pet Food & Treats</h3>
                <p style="font-size: 0.95rem; color: #444; margin-bottom: 0;">Homemade, cost-effective nutrition and treat recipes for our furry friends.</p>
            </div>
        </div>
    `;
}

function showPage(page) {
    const view = document.getElementById('main-view');
    window.history.pushState({}, document.title, window.location.pathname);

    if (page === 'home') {
        view.innerHTML = `
            <div class="window-box" style="text-align: center; max-width: 800px; width: 100%; box-sizing: border-box; background: var(--nav-color);">
                <h1 style="margin-top:0;">WELCOME TO THE GLOBAL RECIPE & MEAL PLANNER</h1>
                <p style="margin: 0; font-size: 1.2rem; margin-bottom: 8px;">From authentic global cuisines to cost-tracked weeknight dinners. Explore <strong>${totalApprovedRecipes}</strong> recipes shared by cooks worldwide.</p>
                <div id="home-visitor-counter" style="display: inline-block; background: #fff; border: 1px solid var(--border); padding: 5px 15px; font-weight: bold; color: #000; font-size: 1.1rem; box-shadow: 2px 2px 0px var(--border); margin-top: 10px;">
                    👀 ${totalVisitors.toLocaleString()} Total Visits to Website
                </div>
            </div>

            <div class="window-box" style="max-width: 800px; width: 100%; box-sizing: border-box;">
                <h2 style="font-size: 1.5rem; margin-bottom: 15px; margin-top: 0;">Meet the Team</h2>
                <div style="display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap;">
                    <img id="home-team-photo" src="${teamPhotoUrl}" style="width: 200px; height: 200px; border-radius: 50%; border: 4px solid var(--border); object-fit: cover;">
                    <div style="flex: 1; min-width: 300px;">
                        <p style="line-height: 1.6; margin-top: 0;"><strong>Real food, shared by real people.</strong></p>
                        <p style="line-height: 1.6;">Hi, we are the team behind this platform! I'm a 40-year-old beginner developer from South Africa, and this is my very first live project. My wife balances her day job as an online teacher with being our lead admin, manually reviewing community recipes.</p>
                        <p style="line-height: 1.6;">We built this because we were sick of AI bots, fake blogs, and recipes calling for unrealistic ingredients. We wanted a centralized place for real people cooking on a realistic budget.</p>
                        <p style="line-height: 1.6;"><strong>A quick note on ads and moderation:</strong> Because this is a two-person passion project, keeping the servers running requires a few ads. I apologize if they are ever intrusive; I am actively working on an ad-free version.</p>
                        <p style="line-height: 1.6;">On busy days, things might slip past us. If you see anything weird or fake, please use the ⚠️ <strong>Report</strong> button under any recipe. If you have suggestions, please don't hesitate to reach out via our <strong>Contact Us</strong> page. Whether you are here to find a cheap weeknight dinner or to share your own family recipes with the world—thank you for being part of this community. Happy cooking!</p>
                    </div>
                </div>
            </div>
        `;
    } else if (page === 'find-recipes') {
        renderFindHub();
    } else if (page === 'find-budget-meals') {
        loadBudgetMeals(); 
    } else if (page === 'add-budget-meal') {
        view.innerHTML = `
            <div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box;">
                <h1 style="margin-top: 0;">ADD BUDGET MEAL</h1>
                <p>Posting for: <strong>${selectedCountry}</strong></p>
                <select id="meal-type" onchange="toggleMealType()" style="width: 100%; max-width: 450px; padding: 8px; margin-bottom: 15px; border: 2px solid var(--border); box-sizing: border-box;">
                    <option value="home">Home-Cooked (Ingredients)</option>
                    <option value="takeaway">Takeaway / Fast Food</option>
                </select>
                <input type="text" id="budget-title" placeholder="Meal Name (e.g. Steers Phanda)" style="width: 100%; max-width: 450px; box-sizing: border-box;">
                <div style="display:flex; gap: 10px; max-width: 450px; margin-bottom: 15px;">
                    <div style="display:flex; flex:1;">
                        <span style="padding:8px; background:var(--btn-grey); border: 2px solid var(--border); border-right: none; font-weight:bold; box-sizing: border-box;">${currencyMap[selectedCountry]}</span>
                        <input type="number" id="budget-cost" step="any" placeholder="Total Cost" style="margin-bottom: 0; flex: 1; box-sizing: border-box;">
                    </div>
                    <input type="number" id="budget-servings" placeholder="Servings (e.g. 4)" style="margin-bottom: 0; flex: 1; box-sizing: border-box;">
                </div>
                <div id="home-cooked-section" style="width: 100%; max-width: 450px;">
                    <div style="background: #f9f9f9; border: 2px solid var(--border); padding: 15px; margin-bottom: 15px; box-sizing: border-box;">
                        <h3 style="margin-top: 0;">Ingredients</h3>
                        <div id="ingredients-list"></div>
                        <button onclick="addIngredientRow()" style="margin: 10px 0 0 0; background: #e0e0e0; font-size: 0.75rem; border: 2px solid var(--border); padding: 6px 12px; cursor: pointer;">+ Add Another Ingredient</button>
                    </div>
                    <textarea id="recipe-instructions" rows="6" placeholder="Cooking Instructions..." style="width: 100%; max-width: 450px; box-sizing: border-box;"></textarea>
                </div>
                <div id="takeaway-section" style="display: none; width: 100%; max-width: 450px;">
                    <textarea id="takeaway-included" rows="4" placeholder="What is included? (e.g. 4 Burgers, 2 Large Chips, 2L Coke)" style="width: 100%; box-sizing: border-box;"></textarea>
                </div>
                <button onclick="saveBudgetMeal()" style="margin-top: 10px;">Post Meal Live</button>
            </div>
        `;
        addIngredientRow(); 
    } else if (page === 'find-specials') {
        loadSpecials();
    } else if (page === 'add-special') {
        renderAddSpecialForm();
    } else if (page === 'find-meal-plans') {
        loadSubcategory('7-Day Meal Plans', 'Specialized Plans');
    } else if (page === 'add-meal-plan') {
        renderAddMealPlanForm(); 
    } else if (page === 'find-pet-food') {
        renderSubcategoryList('Pet Food & Treats', 'find');
    } else if (page === 'creator-hub') {
        renderCreatorHub();
    } else {
        view.innerHTML = `<div class="window-box"><h1>${page.replace(/-/g, ' ').toUpperCase()}</h1></div>`;
    }
}

function renderCategoryList(context) {
    const view = document.getElementById('main-view');
    const title = context === 'find' ? 'GLOBAL RECIPES' : 'ADD GLOBAL RECIPE';
    const subtitle = context === 'find' 
        ? `Search our open library of <strong>${totalApprovedRecipes}</strong> everyday recipes.`
        : `Select a primary category to post your recipe into.`;

    let html = `
        <div class="window-box" style="width: 100%; max-width: 900px; box-sizing: border-box;">
            <button onclick="${context === 'find' ? "showPage('find-recipes')" : "showPage('creator-hub')"}" style="margin-bottom: 20px; background:var(--btn-grey); border:2px solid var(--border);">← Back to Hub</button>
            <h1 style="margin-top: 0; margin-bottom: 5px;">${title}</h1>
            <p style="font-size: 1.1rem; color: #555; margin-top: 0; margin-bottom: 10px;">${subtitle}</p>
        </div>
    `;

    if (context === 'find') {
        html += `
        <div class="window-box" style="display: flex; gap: 10px; max-width: 900px; width: 100%; box-sizing: border-box; margin-bottom: 20px;">
            <input type="text" id="search-input" placeholder="Search recipes by name or ingredient..." style="margin-bottom: 0; flex: 1;">
            <button onclick="executeSearch()" style="margin: 0; background: #000; color: #fff;">🔍 Search</button>
        </div>
        `;
    }
        
    html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; width: 100%; max-width: 900px;">`;

    Object.keys(categories).forEach(cat => {
        if (cat === 'Specialized Plans' || cat === 'Pet Food & Treats') return;

        const meta = categoryMeta[cat] || { icon: "🍽️", desc: "Explore recipes in this category." };
        html += `
            <div class="window-box" onclick="renderSubcategoryList('${cat}', '${context}')" style="cursor: pointer; text-align: center; margin-bottom: 0;">
                <div style="font-size: 2.2rem; margin-bottom: 10px;">${meta.icon}</div>
                <h3 style="margin-top: 0; font-size: 1.3rem; margin-bottom: 5px;">${cat}</h3>
                <p style="font-size: 0.9rem; color: #555; margin: 0;">${meta.desc}</p>
            </div>
        `;
    });

    html += `</div>`;
    view.innerHTML = html;
}

function renderSubcategoryList(mainCategory, context) {
    const view = document.getElementById('main-view');
    
    let html = `
        <div class="window-box" style="width: 100%; max-width: 900px; box-sizing: border-box;">
            <button onclick="renderCategoryList('${context}')" style="margin-bottom: 20px; background:var(--btn-grey); border:2px solid var(--border);">← Back to All Categories</button>
            <h1 style="margin-top: 0; margin-bottom: 5px;">${mainCategory}</h1>
            <p style="font-size: 1.1rem; color: #555; margin-top: 0; margin-bottom: 0;">Select a specific subcategory.</p>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; width: 100%; max-width: 900px;">
    `;

    categories[mainCategory].forEach(sub => {
        const action = context === 'find' ? `loadSubcategory('${sub}', '${mainCategory}')` : `showForm('${sub}', '${mainCategory}')`;
        const meta = subcategoryMeta[sub] || { icon: "🍽️", desc: "Delicious homemade recipes." };
        
        html += `
            <div class="window-box" onclick="${action}" style="cursor: pointer; text-align: center; margin-bottom: 0;">
                <div style="font-size: 2.2rem; margin-bottom: 10px;">${meta.icon}</div>
                <h3 style="margin-top: 0; font-size: 1.3rem; margin-bottom: 5px;">${sub}</h3>
                <p style="font-size: 0.9rem; color: #555; margin: 0;">${meta.desc}</p>
            </div>
        `;
    });

    html += `</div>`;
    view.innerHTML = html;
}

function getParentCategory(subcategoryName) {
    for (const [mainCat, subCats] of Object.entries(categories)) {
        if (subCats.includes(subcategoryName)) { return mainCat; }
    }
    return null;
}

function renderAddMealPlanForm() {
    const view = document.getElementById('main-view');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let daysHTML = '';
    
    days.forEach(day => {
        daysHTML += `
            <label style="font-weight: bold; margin-top: 15px; display: block; font-size: 1.1rem; border-bottom: 1px solid var(--border); padding-bottom: 5px;">${day}</label>
            <textarea id="plan-${day.toLowerCase()}" rows="4" placeholder="Breakfast: ...\nLunch: ...\nDinner: ..." style="width: 100%; box-sizing: border-box; margin-top: 10px; margin-bottom: 5px;"></textarea>
        `;
    });

    view.innerHTML = `
        <div class="window-box" style="width: 100%; max-width: 650px; box-sizing: border-box;">
            <h1 style="margin-top: 0;">ADD 7-DAY MEAL PLAN</h1>
            <input type="text" id="plan-title" placeholder="Meal Plan Title (e.g., R500 Student Survival Week)" style="width: 100%; box-sizing: border-box; font-weight: bold; font-size: 1.1rem;">
            <div style="background: #f9f9f9; border: 2px solid var(--border); padding: 20px; box-sizing: border-box; margin-top: 10px;">
                <p style="margin-top: 0; font-size: 0.95rem; color: #555;">Fill out the meals for each day. If you plan to eat leftovers or skip a meal, just leave that day blank!</p>
                ${daysHTML}
            </div>
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button onclick="saveMealPlan()" style="margin: 0;">Post Plan Live</button>
                <button onclick="showPage('creator-hub')" style="margin: 0; background: var(--bg); color: var(--text);">Cancel</button>
            </div>
        </div>
    `;
}

async function saveMealPlan() {
    const title = document.getElementById('plan-title').value.trim();
    if (!title) return alert("Please enter a title for your meal plan.");

    let finalRecipe = "";
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let hasContent = false;

    days.forEach(day => {
        const text = document.getElementById(`plan-${day.toLowerCase()}`).value.trim();
        if (text) {
            hasContent = true;
            finalRecipe += `**${day}**\n${text}\n\n`;
        }
    });

    if (!hasContent) return alert("Please fill in at least one day of the meal plan.");

    const { error } = await myDatabase.from('meals').insert([{ 
        title: title, 
        category: '7-Day Meal Plans', 
        parent_category: 'Specialized Plans', 
        recipe: finalRecipe.trim(),
        status: 'pending' 
    }]);
    
    if (error) { alert("Error: " + error.message); } 
    else { alert("Meal Plan posted successfully!"); loadSubcategory('7-Day Meal Plans', 'Specialized Plans'); }
}

async function loadSpecials() {
    const view = document.getElementById('main-view');
    view.innerHTML = `<div class="window-box"><h1>Loading Local Specials...</h1></div>`;

    if (!selectedCountry) { view.innerHTML = `<div class="window-box"><h1>Error</h1><p>Please select a country first.</p></div>`; return; }

    const now = new Date().toISOString();
    const { data, error } = await myDatabase.from('meals').select('*').eq('category', 'special').eq('country', selectedCountry).gt('expiry_date', now);

    if (error) { view.innerHTML = `<div class="window-box"><h1>Error</h1><p>${error.message}</p></div>`; return; }

    let html = `
        <div class="window-box" style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px; width: 100%; max-width: 600px; box-sizing: border-box;">
            <button onclick="showPage('find-recipes')" style="margin:0; background:var(--btn-grey); border:2px solid var(--border);">← Back to Hub</button>
            <h1 style="margin: 0;">Local Specials in ${selectedCountry}</h1>
        </div>
    `;
    
    if (data.length === 0) {
        html += `<div class="window-box" style="width: 100%; max-width: 600px;"><p>No active specials posted for ${selectedCountry}. Be the first to share a deal!</p></div>`;
    } else {
        html += `<div style="display: flex; flex-direction: column; gap: 15px; max-width: 600px; width: 100%;">`;
        data.forEach(meal => {
            const expiryStr = new Date(meal.expiry_date).toLocaleDateString();
            html += `
            <div class="window-box" style="margin-bottom: 0;">
                <div style="margin-bottom: 8px;">
                    <span style="background: #ffcc00; padding: 3px 8px; font-size: 0.75rem; font-weight: bold; border: 1px solid var(--border); display: inline-block;">EXPIRES: ${expiryStr}</span>
                </div>
                <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 10px; word-wrap: break-word;">${meal.title}</div>
                <div style="font-size: 1.2rem; margin-bottom: 10px; color: #008080; font-weight: bold;">
                    ${currencyMap[selectedCountry] || ''}${meal.cost}
                </div>
                <div style="font-size: 1rem; line-height: 1.5; white-space: pre-wrap;">${meal.recipe}</div>
                <div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #ccc;">
                    <button onclick="reportRecipe('${meal.title.replace(/'/g, "\\'")}', ${meal.id})" style="background: #ffcccc; color: #900; border: 1px solid #900; padding: 5px 10px; font-size: 0.7rem; margin: 0;">⚠️ Report Fake/Expired Deal</button>
                </div>
            </div>`;
        });
        html += `</div>`;
    }
    view.innerHTML = html;
}

function renderAddSpecialForm() {
    const view = document.getElementById('main-view');
    view.innerHTML = `
        <div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box;">
            <h1 style="margin-top: 0;">SHARE A LOCAL SPECIAL</h1>
            <p>Posting deal for: <strong>${selectedCountry}</strong></p>
            <input type="text" id="special-title" placeholder="Deal Name & Store (e.g. Checkers 5kg Braai Pack)" style="width: 100%; max-width: 450px; box-sizing: border-box;">
            
            <div style="display:flex; flex:1; max-width: 450px; margin-bottom: 15px;">
                <span style="padding:8px; background:var(--btn-grey); border: 2px solid var(--border); border-right: none; font-weight:bold; box-sizing: border-box;">${currencyMap[selectedCountry] || '$'}</span>
                <input type="number" id="special-cost" step="any" placeholder="Special Price" style="margin-bottom: 0; flex: 1; box-sizing: border-box;">
            </div>

            <select id="special-duration" style="width: 100%; max-width: 450px; padding: 8px; margin-bottom: 15px; border: 2px solid var(--border); box-sizing: border-box;">
                <option value="">-- When does this special end? --</option>
                <option value="3">Just this weekend (3 days)</option>
                <option value="7">One week (7 days)</option>
                <option value="month">Until the end of the month</option>
            </select>

            <textarea id="special-details" rows="4" placeholder="What is included in the deal? Any specific conditions?" style="width: 100%; max-width: 450px; box-sizing: border-box;"></textarea>
            <br>
            <button onclick="saveSpecial()" style="margin-top: 10px;">Post Deal Live</button>
            <button onclick="showPage('creator-hub')" style="margin-top: 10px; background: var(--bg); color: var(--text);">Cancel</button>
        </div>
    `;
}

async function saveSpecial() {
    const title = document.getElementById('special-title').value.trim();
    const cost = parseFloat(document.getElementById('special-cost').value);
    const duration = document.getElementById('special-duration').value;
    const details = document.getElementById('special-details').value.trim();

    if (!title || !cost || !duration || !details) return alert("Please fill in all the details.");

    let expiryDate = new Date();
    if (duration === "3") { expiryDate.setDate(expiryDate.getDate() + 3); } 
    else if (duration === "7") { expiryDate.setDate(expiryDate.getDate() + 7); } 
    else if (duration === "month") { expiryDate = new Date(expiryDate.getFullYear(), expiryDate.getMonth() + 1, 0, 23, 59, 59); }
    
    const expiryISO = expiryDate.toISOString();

    const { error } = await myDatabase.from('meals').insert([{ 
        country: selectedCountry, title: title, recipe: details, cost: cost, category: 'special', parent_category: 'Specials', expiry_date: expiryISO, status: 'pending'
    }]);

    if (error) alert("Error: " + error.message); 
    else { alert("Special posted successfully!"); showPage('find-specials'); }
}

function toggleMealType() {
    const type = document.getElementById('meal-type').value;
    if (type === 'home') {
        document.getElementById('home-cooked-section').style.display = 'block';
        document.getElementById('takeaway-section').style.display = 'none';
    } else {
        document.getElementById('home-cooked-section').style.display = 'none';
        document.getElementById('takeaway-section').style.display = 'block';
    }
}

async function loadBudgetMeals(filter = 'all') {
    const view = document.getElementById('main-view');
    view.innerHTML = `<div class="window-box"><h1>Loading Budget Meals...</h1></div>`;

    let query = myDatabase.from('meals').select('*').eq('category', 'budget').eq('country', selectedCountry);
    if (filter !== 'all') { query = query.eq('meal_type', filter); }

    const { data, error } = await query;
    if (error) { view.innerHTML = `<div class="window-box"><h1>Error</h1><p>${error.message}</p></div>`; return; }

    let html = `
        <div class="window-box" style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px; width: 100%; max-width: 600px; box-sizing: border-box;">
            <button onclick="showPage('find-recipes')" style="margin:0; background:var(--btn-grey); border:2px solid var(--border);">← Back to Hub</button>
            <h1 style="margin: 0;">Budget Meals in ${selectedCountry}</h1>
        </div>
    `;
    html += `
        <div class="window-box" style="margin-bottom: 20px; width: 100%; max-width: 600px; box-sizing: border-box;">
            <button onclick="loadBudgetMeals('all')" style="${filter === 'all' ? 'background: #000; color: #fff;' : 'margin-right: 10px;'}">All</button>
            <button onclick="loadBudgetMeals('takeaway')" style="${filter === 'takeaway' ? 'background: #000; color: #fff;' : 'margin-right: 10px;'}">Takeaway Only</button>
            <button onclick="loadBudgetMeals('home')" style="${filter === 'home' ? 'background: #000; color: #fff;' : ''}">Home-Cooked Only</button>
        </div>
    `;
    
    if (data.length === 0) {
        html += `<div class="window-box" style="width: 100%; max-width: 600px;"><p>No budget meals posted for ${selectedCountry} under this filter.</p></div>`;
    } else {
        html += `<div style="display: flex; flex-direction: column; gap: 15px; max-width: 600px; width: 100%;">`;
        data.sort((a, b) => (a.cost / a.servings) - (b.cost / b.servings));
        data.forEach(meal => {
            const costPerPerson = (meal.cost / meal.servings).toFixed(2);
            const badgeColor = meal.meal_type === 'takeaway' ? '#ffcc00' : '#4caf50';
            const badgeText = meal.meal_type === 'takeaway' ? 'TAKEAWAY' : 'HOME-COOKED';
            
            html += `
            <div class="window-box" onclick="viewBudgetMeal(${meal.id})" style="cursor: pointer; margin-bottom: 0;">
                <div style="margin-bottom: 8px;">
                    <span style="background: ${badgeColor}; padding: 3px 8px; font-size: 0.7rem; font-weight: bold; border: 1px solid var(--border); display: inline-block;">${badgeText}</span>
                </div>
                <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 10px; word-wrap: break-word;">${meal.title}</div>
                <div style="font-size: 1.1rem;">
                    <strong>${currencyMap[selectedCountry]}${costPerPerson}</strong> per person 
                    <span style="font-size: 0.9rem; color: #555; display: block; margin-top: 5px;">(Total: ${currencyMap[selectedCountry]}${meal.cost} for ${meal.servings} servings)</span>
                </div>
            </div>`;
        });
        html += `</div>`;
    }
    view.innerHTML = html;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert("Link copied to clipboard!");
    }).catch(err => {
        alert("Failed to copy link. You can manually copy the URL in your browser.");
    });
}

async function likeMeal(id, btnElement) {
    const countSpan = btnElement.querySelector('.like-count');
    let currentLikes = parseInt(countSpan.innerText) || 0;
    currentLikes++;
    countSpan.innerText = currentLikes;
    btnElement.disabled = true; 
    btnElement.style.opacity = '0.6';
    btnElement.innerHTML = `❤️ Liked (${currentLikes})`;

    const { data } = await myDatabase.from('meals').select('likes').eq('id', id).single();
    const dbLikes = (data && data.likes ? data.likes : 0) + 1;
    await myDatabase.from('meals').update({ likes: dbLikes }).eq('id', id);
}

async function viewBudgetMeal(id) {
    const view = document.getElementById('main-view');
    view.innerHTML = `<div class="window-box"><h1>Loading...</h1></div>`;

    const { data, error } = await myDatabase.from('meals').select('*').eq('id', id).single();
    if (error) return;

    let contentHTML = "";

    if (data.meal_type === 'home') {
        let ingredientsHTML = `<ul style="margin: 0; padding-left: 20px;">`;
        if (data.ingredients && Array.isArray(data.ingredients)) {
            data.ingredients.forEach(ing => {
                let qty = ing.qty ? ing.qty : '';
                let unit = ing.unit ? ing.unit : '';
                ingredientsHTML += `<li style="margin-bottom: 8px;"><strong>${qty} ${unit}</strong> ${ing.item}</li>`;
            });
        }
        ingredientsHTML += `</ul>`;

        contentHTML = `
            <div class="farmhouse-scroll">
                <h2>Ingredients</h2>
                ${ingredientsHTML}
                <h2 style="margin-top: 30px;">Instructions</h2>
                <div style="white-space: pre-wrap;">${data.recipe}</div>
            </div>
        `;
    } else {
        contentHTML = `
            <div class="farmhouse-scroll">
                <h2>What is included?</h2>
                <div style="white-space: pre-wrap;">${data.recipe}</div>
            </div>
        `;
    }

    const costPer = (data.cost / data.servings).toFixed(2);
    
    const currentUrl = window.location.origin + window.location.pathname + '?budget=' + data.id;
    const whatsappText = encodeURIComponent(`Check out this budget meal: ${data.title} on Budget Meal Planner! ${currentUrl}`);

    view.innerHTML = `
        <div class="window-box" style="width: 100%; max-width: 650px; box-sizing: border-box;">
            <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                <button onclick="showPage('find-budget-meals')" style="margin:0; background:var(--btn-grey); border:2px solid var(--border);">← Back</button>
                <button onclick="likeMeal(${data.id}, this)" style="margin:0; background:#fff0f5; border:2px solid var(--border); color:#d00;">❤️ Like (<span class="like-count">${data.likes || 0}</span>)</button>
                <button onclick="copyToClipboard('${currentUrl}')" style="margin:0; background:#fff; border:2px solid var(--border);">🔗 Copy Link</button>
                <a href="https://wa.me/?text=${whatsappText}" target="_blank" style="display:inline-block; padding: 8px 16px; background:#25D366; color:#fff; font-weight:bold; border:2px solid var(--border); text-decoration:none; font-size:0.85rem; box-sizing:border-box;">📱 WhatsApp</a>
            </div>
            
            <h1 style="font-size: 2.5rem; margin-top: 0; margin-bottom: 5px;">${data.title}</h1>
            <div style="font-size: 1.2rem; padding: 10px; background: #e0e0e0; border: 2px solid var(--border); display: inline-block;">
                <strong>${currencyMap[selectedCountry]}${costPer}</strong> per person (Feeds ${data.servings} for ${currencyMap[selectedCountry]}${data.cost})
            </div>
        </div>
        
        ${contentHTML}
        
        <div class="window-box" style="width: 100%; max-width: 650px; box-sizing: border-box;">
            <button onclick="reportRecipe('${data.title.replace(/'/g, "\\'")}', ${data.id})" style="background: #ffcccc; color: #900; border: 1px solid #900; padding: 5px 10px; font-size: 0.8rem;">⚠️ Report Recipe</button>
        </div>
    `;
}

async function loadSubcategory(subcategory, parentCategory) {
    const view = document.getElementById('main-view');
    view.innerHTML = `<div class="window-box"><h1>Loading ${subcategory}...</h1></div>`;

    const { data, error } = await myDatabase.from('meals')
        .select('id, title, category, parent_category, author, created_at')
        .eq('category', subcategory)
        .eq('parent_category', parentCategory)
        .order('created_at', { ascending: false });

    if (error) { 
        view.innerHTML = `<div class="window-box"><h1>Error</h1><p>${error.message}</p><button onclick="renderSubcategoryList('${parentCategory}', 'find')">← Back</button></div>`; 
        return; 
    }

    let html = `
        <div class="window-box" style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px; width: 100%; max-width: 600px; box-sizing: border-box;">
            <button onclick="renderSubcategoryList('${parentCategory}', 'find')" style="margin:0; background:var(--btn-grey); border:2px solid var(--border);">← Back to ${parentCategory}</button>
            <h1 style="margin: 0;">${subcategory}</h1>
        </div>
    `;

    if (data.length === 0) {
        html += `<div class="window-box" style="width: 100%; max-width: 600px;"><p>No recipes found in this category yet.</p><button onclick="showForm('${subcategory}', '${parentCategory}')" style="margin-top: 10px;">Be the first to share one!</button></div>`;
    } else {
        html += `<div style="display: flex; flex-direction: column; gap: 10px; max-width: 600px; width: 100%;">`;
        data.forEach(meal => {
            const author = meal.author || "Home Cook";
            const date = meal.created_at ? new Date(meal.created_at).toLocaleDateString() : "Unknown Date";
            html += `<div class="window-box" onclick="viewRecipe(${meal.id})" style="cursor: pointer; margin-bottom: 0;">
                        <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 5px;">${meal.title}</div>
                        <div style="font-size: 0.85rem; color: #666;">By ${author} • ${date}</div>
                     </div>`;
        });
        html += `</div>`;
    }
    view.innerHTML = html;
}

async function viewRecipe(id) {
    const view = document.getElementById('main-view');
    view.innerHTML = `<div class="window-box"><h1>Loading Recipe...</h1></div>`;

    const { data, error } = await myDatabase.from('meals').select('*').eq('id', id).single();
    if (error) return;

    let ingredientsHTML = `<ul style="margin: 0; padding-left: 20px;">`;
    if (data.ingredients && Array.isArray(data.ingredients)) {
        data.ingredients.forEach(ing => {
            let qty = ing.qty ? ing.qty : '';
            let unit = ing.unit ? ing.unit : '';
            ingredientsHTML += `<li style="margin-bottom: 8px;"><strong>${qty} ${unit}</strong> ${ing.item}</li>`;
        });
    } else { ingredientsHTML += `<li>No structured ingredients found.</li>`; }
    ingredientsHTML += `</ul>`;

    const author = data.author || "Home Cook";
    const date = data.created_at ? new Date(data.created_at).toLocaleDateString() : "Unknown Date";

    const currentUrl = window.location.origin + window.location.pathname + '?recipe=' + data.id;
    const whatsappText = encodeURIComponent(`Check out this recipe for ${data.title} on Budget Meal Planner! ${currentUrl}`);

    const parentCat = data.parent_category || getParentCategory(data.category);

    view.innerHTML = `
        <div class="window-box" style="width: 100%; max-width: 650px; box-sizing: border-box;">
            <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                <button onclick="loadSubcategory('${data.category}', '${parentCat}')" style="margin:0; background:var(--btn-grey); border:2px solid var(--border);">← Back to ${data.category}</button>
                <button onclick="likeMeal(${data.id}, this)" style="margin:0; background:#fff0f5; border:2px solid var(--border); color:#d00;">❤️ Like (<span class="like-count">${data.likes || 0}</span>)</button>
                <button onclick="copyToClipboard('${currentUrl}')" style="margin:0; background:#fff; border:2px solid var(--border);">🔗 Copy Link</button>
                <a href="https://wa.me/?text=${whatsappText}" target="_blank" style="display:inline-block; padding: 8px 16px; background:#25D366; color:#fff; font-weight:bold; border:2px solid var(--border); text-decoration:none; font-size:0.85rem; box-sizing:border-box;">📱 WhatsApp</a>
            </div>

            <h1 style="font-size: 2.5rem; margin-top: 0; margin-bottom: 5px;">${data.title}</h1>
            <p style="font-size: 1rem; color: #666; margin-top: 0;">By ${author} • ${date}</p>
        </div>
        
        <div class="window-box" style="background: var(--nav-color); max-width: 650px; width: 100%; box-sizing: border-box;">
            <h3 style="margin-top: 0; font-size: 1.1rem;">Smart Converter</h3>
            <div style="display: flex; gap: 10px; align-items: center;">
                <input type="number" step="any" id="conv-amount" oninput="calculateConversion()" placeholder="Qty" style="flex: 1; margin: 0; min-width: 60px;">
                <select id="conv-from" onchange="updateConverter()" style="flex: 1.5; margin: 0; padding: 8px; border: 2px solid var(--border); background: #fff;">
                    <optgroup label="Weight">
                        <option value="g">Gram (g)</option><option value="kg">Kilogram (kg)</option><option value="oz">Ounce (oz)</option><option value="lb">Pound (lb)</option>
                    </optgroup>
                    <optgroup label="Volume">
                        <option value="ml">Milliliter (ml)</option><option value="l">Liter (L)</option><option value="tsp">Teaspoon (tsp)</option>
                        <option value="tbsp">Tablespoon (tbsp)</option><option value="cup">Cup</option><option value="fl oz">Fluid Ounce (fl oz)</option>
                    </optgroup>
                    <optgroup label="Temperature">
                        <option value="c">Celsius (°C)</option><option value="f">Fahrenheit (°F)</option>
                    </optgroup>
                </select>
                <span style="font-weight: bold; padding: 0 5px;">to</span>
                <select id="conv-to" onchange="calculateConversion()" style="flex: 1.5; margin: 0; padding: 8px; border: 2px solid var(--border); background: #fff;"></select>
            </div>
            <div id="conv-result" style="margin-top: 10px; font-weight: bold; font-size: 1.2rem; min-height: 25px; color: #333;"></div>
        </div>

        <div class="farmhouse-scroll">
            <h2>Ingredients</h2>
            ${ingredientsHTML}
            
            <h2 style="margin-top: 30px;">Instructions</h2>
            <div style="white-space: pre-wrap;">${data.recipe}</div>
        </div>
        
        <div class="window-box" style="width: 100%; max-width: 650px; box-sizing: border-box;">
            <button onclick="reportRecipe('${data.title.replace(/'/g, "\\'")}', ${data.id})" style="background: #ffcccc; color: #900; border: 1px solid #900; padding: 5px 10px; font-size: 0.8rem; margin: 0;">⚠️ Report Recipe</button>
        </div>
    `;
    updateConverter();
}

const convFamilies = { weight: ['g', 'kg', 'oz', 'lb'], volume: ['ml', 'l', 'tsp', 'tbsp', 'cup', 'fl oz'], temp: ['c', 'f'] };
const convRates = { 'g': 1, 'kg': 1000, 'oz': 28.3495, 'lb': 453.592, 'ml': 1, 'l': 1000, 'tsp': 4.9289, 'tbsp': 14.7868, 'cup': 250, 'fl oz': 29.5735 };

function updateConverter() {
    const fromUnit = document.getElementById('conv-from').value;
    const toSelect = document.getElementById('conv-to');
    toSelect.innerHTML = '';
    let family = [];
    if (convFamilies.weight.includes(fromUnit)) family = convFamilies.weight;
    else if (convFamilies.volume.includes(fromUnit)) family = convFamilies.volume;
    else if (convFamilies.temp.includes(fromUnit)) family = convFamilies.temp;

    family.forEach(unit => {
        if (unit !== fromUnit) {
            let opt = document.createElement('option');
            opt.value = unit;
            opt.innerHTML = unit;
            toSelect.appendChild(opt);
        }
    });
    calculateConversion();
}

function calculateConversion() {
    const amt = parseFloat(document.getElementById('conv-amount').value);
    const from = document.getElementById('conv-from').value;
    const to = document.getElementById('conv-to').value;
    const resDiv = document.getElementById('conv-result');

    if (isNaN(amt) || !from || !to) { resDiv.innerHTML = ''; return; }
    let result = 0;
    if (convFamilies.temp.includes(from)) {
        if (from === 'c' && to === 'f') result = (amt * 9/5) + 32;
        if (from === 'f' && to === 'c') result = (amt - 32) * 5/9;
    } else {
        const baseAmt = amt * convRates[from];
        result = baseAmt / convRates[to];
    }
    resDiv.innerHTML = `Result: ${+(Math.round(result + "e+2")  + "e-2")} ${to}`;
}

function addRecipeMenu() { renderCategoryList('add'); }

function showForm(subcategory, parentCategory) {
    selectedSubcategory = subcategory;
    selectedParentCategory = parentCategory; 
    const view = document.getElementById('main-view');
    
    view.innerHTML = `
        <div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box;">
            <button onclick="renderSubcategoryList('${parentCategory}', 'add')" style="margin-bottom: 20px; background:var(--btn-grey); border:2px solid var(--border);">← Back to ${parentCategory}</button>
            <h1 style="margin-top: 0;">Adding to: ${subcategory}</h1>
            <input type="text" id="recipe-name" placeholder="Recipe Title" style="width: 100%; max-width: 450px; box-sizing: border-box; margin-bottom: 10px;">
            <input type="text" id="author-name" placeholder="Your Name (Optional)" style="width: 100%; max-width: 450px; box-sizing: border-box; margin-bottom: 15px;">
            <div id="ingredients-container" style="width: 100%; max-width: 450px; background: #f9f9f9; border: 2px solid var(--border); padding: 15px; margin-bottom: 15px; box-sizing: border-box;">
                <h3 style="margin-top: 0;">Ingredients</h3>
                <div id="ingredients-list"></div>
                <button onclick="addIngredientRow()" style="margin: 10px 0 0 0; background: #e0e0e0; font-size: 0.75rem; border: 2px solid var(--border); padding: 6px 12px; cursor: pointer;">+ Add Another Ingredient</button>
            </div>
            <textarea id="recipe-instructions" rows="8" placeholder="Instructions..." style="width: 100%; max-width: 450px; box-sizing: border-box;"></textarea>
            <br>
            <button onclick="saveRecipe()" style="margin: 0;">Post Recipe Live</button>
        </div>
    `;
    addIngredientRow();
}

function addIngredientRow() {
    const list = document.getElementById('ingredients-list');
    const row = document.createElement('div');
    row.className = 'ingredient-row';
    row.style.display = 'flex';
    row.style.gap = '5px';
    row.style.marginBottom = '8px';
    row.style.alignItems = 'stretch'; 

    row.innerHTML = `
        <input type="text" class="ing-name" placeholder="Item (e.g. Flour)" style="flex: 2; margin-bottom: 0;">
        <input type="number" step="any" class="ing-qty" placeholder="Qty" style="flex: 1; margin-bottom: 0;">
        <select class="ing-unit" style="flex: 1; margin-bottom: 0; padding: 8px; border: 2px solid var(--border); background: #fff;">
            <option value="">-- Unit --</option>
            <option value="tsp">Teaspoon (tsp)</option>
            <option value="tbsp">Tablespoon (tbsp)</option>
            <option value="cup">Cup</option>
            <option value="ml">Milliliter (ml)</option>
            <option value="l">Liter (L)</option>
            <option value="g">Gram (g)</option>
            <option value="kg">Kilogram (kg)</option>
            <option value="oz">Ounce (oz)</option>
            <option value="lb">Pound (lb)</option>
            <option value="whole">Whole / Item</option>
            <option value="pinch">Pinch</option>
            <option value="slice">Slice</option>
            <option value="can">Can</option>
        </select>
        <button onclick="this.parentElement.remove()" style="margin: 0; background: #ffcccc; color: #900; border: 2px solid #900; padding: 0 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; box-sizing: border-box;">X</button>
    `;
    list.appendChild(row);
}

async function saveRecipe() {
    const title = document.getElementById('recipe-name').value.trim();
    const author = document.getElementById('author-name').value.trim() || "Home Cook";
    const instructions = document.getElementById('recipe-instructions').value.trim();
    
    const ingredientRows = document.querySelectorAll('.ingredient-row');
    let structuredIngredients = [];
    
    ingredientRows.forEach(row => {
        const name = row.querySelector('.ing-name').value.trim();
        const qty = row.querySelector('.ing-qty').value;
        const unit = row.querySelector('.ing-unit').value;
        if (name !== "") structuredIngredients.push({ item: name, qty: qty ? parseFloat(qty) : null, unit: unit });
    });

    if (!title || !instructions) return alert("Please enter a title and instructions.");

    const { error } = await myDatabase.from('meals').insert([{ 
        title: title, author: author, category: selectedSubcategory, parent_category: selectedParentCategory, ingredients: structuredIngredients, recipe: instructions, created_at: new Date().toISOString(), status: 'pending'
    }]);
    
    if (error) alert("Error: " + error.message);
    else { alert("Recipe posted successfully!"); loadSubcategory(selectedSubcategory, selectedParentCategory); }
}

async function reportRecipe(title, id) {
    const reason = prompt("Why are you reporting this?");
    if (!reason) return;

    const { error } = await myDatabase.from('messages').insert([{ name: "REPORTED: " + title, email: "System ID: " + id, message: "REASON: " + reason }]);
    if (error) alert("Error sending report: " + error.message);
    else alert("Report submitted successfully. Thank you!");
}

const masterKitchenHacks = [
    "Store onions and potatoes in completely separate cupboards; they make each other rot faster.",
    "Wrap celery tightly in aluminum foil and keep it in the fridge to keep it crisp for weeks.",
    "Store your natural peanut butter upside down so the oil doesn't pool at the top.",
    "Treat fresh herbs like asparagus and coriander like flowers: trim the stems and put them in a glass of water in the fridge.",
    "Wash your berries in a mix of 1 part vinegar to 3 parts water, rinse, and dry thoroughly. They will last twice as long without molding.",
    "Never put tomatoes in the fridge! The cold kills their flavor and turns them mushy. Keep them on the counter.",
    "Wrap the crown (the top stem part) of a bunch of bananas in cling wrap to slow down the ripening process.",
    "Put a paper towel inside your bags of spinach or salad greens to absorb moisture and stop them from getting slimy.",
    "Keep dairy at the back of the fridge where it's coldest, never in the door where the temperature fluctuates.",
    "Got too much fresh ginger? Put it in a ziplock bag in the freezer. It actually grates much easier when frozen solid.",
    "Store mushrooms in a brown paper bag, not plastic. Plastic traps moisture and makes them slimy.",
    "Freeze leftover tomato paste in 1-tablespoon blobs on wax paper, then bag them. No more half-empty tins going moldy.",
    "Revive wilted, sad-looking veggies (like carrots or celery) by soaking them in ice water for 30 minutes.",
    "If your brown sugar turned into a literal brick, put a slice of soft bread in the container overnight. It will be soft by morning.",
    "Store nuts and seeds in the freezer. Their natural oils make them go rancid quickly at room temperature.",
    "Keep a bag of rice or a few dried beans in your salt shaker to absorb humidity and stop the salt from clumping.",
    "Store blocks of cheese wrapped in baking paper or wax paper, not tightly sealed in plastic, so they can breathe.",
    "Freeze bread in slices, not as a whole loaf. You can pop frozen slices straight into the toaster.",
    "Keep avocados on the counter until they are perfectly ripe, then move them to the fridge to hit 'pause' on the ripening.",
    "Store flour in an airtight container, not the paper bag it came in, to keep out moisture and pantry bugs.",
    "Look up and look down. Supermarkets pay to put the most expensive, name-brand items right at your eye level.",
    "Never, ever go grocery shopping when you are hungry. You will buy 40% more junk food on impulse.",
    "Always check the 'Price per 100g' or 'Price per Kg' on the tag. It's the only real way to know which size is actually cheaper.",
    "Buy blocks of cheese instead of pre-grated. Pre-grated cheese costs more and is coated in anti-caking powder that ruins sauces.",
    "Skip the pre-cut fruits and veggies. You are paying a massive premium just for someone else to use a knife.",
    "Buy spices in the 'international' or ethnic aisles of the supermarket; they are usually half the price of the baking aisle spices.",
    "Whole chickens are drastically cheaper than buying pre-cut breasts or thighs. Learn to break one down yourself.",
    "Always check the clearance bakery rack. Day-old bread is perfect for toast, croutons, and French toast.",
    "Generic supermarket brands are often made in the exact same factories as the expensive name brands. Give them a try.",
    "Plan your weekly meals based on what is currently on special, not what you randomly crave.",
    "Don't buy bottled water. Buy a good reusable bottle and a filter if you don't like the taste of your tap water.",
    "Dried beans and lentils are infinitely cheaper than canned ones. Soak them overnight and batch-cook them.",
    "Buy rice, oats, and pasta in the biggest bulk bags you can comfortably store.",
    "Shop the perimeter of the grocery store first. That's where the real, unprocessed food lives.",
    "Always check your receipt before leaving the parking lot. Cash registers ring up sale items at full price surprisingly often.",
    "Sign up for every free loyalty card available, but only use the points for essentials, not treats.",
    "If meat is marked down on clearance because it's expiring today, buy it and throw it straight in the freezer when you get home.",
    "Avoid buying anything near the checkout line. It is entirely designed to trigger impulse buys while you wait.",
    "Meat is expensive. Pick one or two days a week to go completely vegetarian to stretch your budget.",
    "Keep a running list of what is in your freezer. People waste hundreds of Rands buying things they already have buried at the back.",
    "Keep a large ziplock bag in the freezer. Toss all your onion skins, carrot peels, and celery ends in it. Boil them later for free veggie stock.",
    "Never throw away the leftover carcass or bones from a roast chicken. Boil it with water and garlic for an incredible, free chicken stock.",
    "Don't throw away spring onion (scallion) roots! Put them in a glass with a little water on the windowsill and they will regrow in days.",
    "Stale bread? Dice it up, toss it in olive oil and herbs, and bake until crispy for homemade soup croutons.",
    "Don't throw away parmesan cheese rinds. Drop them into soups, stews, or bolognese sauces while they simmer for a massive flavor boost.",
    "Save your bacon grease in a glass jar in the fridge. Use it instead of butter or oil to fry eggs or roast potatoes.",
    "If you have fruit that is getting too soft to eat, chop it up and freeze it immediately. It's perfect for smoothies.",
    "Leftover wine that's been open too long? Freeze it in ice cube trays to drop into stews and pasta sauces.",
    "Before juicing a lemon, use a grater to take off the yellow zest. Freeze the zest in a small bag to add flavor to baking and sauces later.",
    "Don't dump pickle juice when the pickles are gone. Use it to marinate chicken—it makes it incredibly tender and flavorful.",
    "Leftover mashed potatoes? Mix in an egg and some flour, and fry them in a pan for amazing potato pancakes.",
    "Broccoli stems are just as good as the florets. Peel the tough outer skin with a potato peeler and chop the soft inside for stir-fries.",
    "Got a tiny bit of jam left in the jar? Pour in some olive oil and vinegar, put the lid on, and shake it for a quick, sweet salad dressing.",
    "Roast your pumpkin or butternut seeds with a little salt and oil instead of throwing them in the bin.",
    "Turn leftover cooked rice into fried rice the next day. Day-old, slightly dried-out rice actually fries much better than fresh rice.",
    "Don't toss the leafy green tops of carrots! They make a fantastic, peppery pesto when blended with garlic and oil.",
    "If your coffee goes cold, don't pour it down the sink. Freeze it into coffee ice cubes for iced coffee that doesn't get watered down.",
    "Used coffee grounds are great for your garden. Sprinkle them around plants to add nitrogen to the soil and keep pests away.",
    "Got herbs that are about to go bad? Chop them up, put them in an ice cube tray, fill with olive oil, and freeze.",
    "Never pour pasta water down the drain! It's full of starch. Use a splash of it to thicken your pasta sauces.",
    "Use a regular spoon to peel ginger. It scrapes the skin off easily and gets into all the weird bumps without wasting the ginger.",
    "Grate freezing cold butter directly into your flour when making pastry or biscuits. It mixes easier and makes them super flaky.",
    "To peel a whole bulb of garlic fast, smash it with the heel of your hand, put the cloves in a hard container with a lid, and shake vigorously.",
    "Cut a dozen cherry tomatoes at once by sandwiching them between two plastic tub lids and running a long knife horizontally through the middle.",
    "If you accidentally made a soup or stew too salty, drop in a peeled, raw potato and simmer for 15 minutes. It will absorb a lot of the salt.",
    "To get the most juice out of a lemon or lime, roll it hard on the counter under your palm before cutting it.",
    "Soak raw onions in a bowl of ice water for 10 minutes before adding them to salads. It keeps them crunchy but removes the harsh onion 'bite'.",
    "Trying to cut meat into super thin strips for a stir-fry? Put it in the freezer for 20 minutes first so it firms up.",
    "Always let cooked meat rest on a board for 5 to 10 minutes before cutting into it. If you cut it immediately, all the juices will run out.",
    "Use a wire egg slicer to perfectly and quickly slice strawberries or button mushrooms.",
    "Cook bacon on a sheet pan in the oven at 200°C instead of frying it. No flipping, no grease splatters, and it cooks perfectly flat.",
    "Put a damp paper towel or kitchen cloth under your cutting board. It stops the board from dangerously slipping around while you chop.",
    "Always toast your dry spices in a warm pan for 30 seconds before adding liquids. It wakes up the oils and doubles their flavor.",
    "Shred cooked chicken breast in 10 seconds by throwing it in a bowl and using a hand mixer on low speed.",
    "To easily remove the seed from an avocado, whack it gently with the blade of a heavy knife, twist, and pull.",
    "If a recipe calls for buttermilk and you don't have it, add 1 tablespoon of lemon juice or vinegar to a cup of normal milk and wait 5 minutes.",
    "Out of eggs for baking? You can often substitute one egg with 1/4 cup of unsweetened applesauce or half a mashed banana.",
    "Make your own DIY self-raising flour: mix 1 cup of plain all-purpose flour with 1.5 teaspoons of baking powder and a pinch of salt.",
    "Use plain yogurt as a cheaper, healthier, 1-to-1 substitute for sour cream on baked potatoes and in recipes.",
    "Stretch expensive ground beef by mixing in an equal amount of finely chopped mushrooms or cooked brown lentils.",
    "Always put a lid on your pot when boiling water or cooking stews. It traps the heat and uses up to 30% less electricity.",
    "Boil water in your electric kettle first, then pour it into your pot on the stove. Kettles are far more energy-efficient.",
    "Match the size of your pot to the size of the stove plate. Putting a small pot on a large burner wastes a massive amount of heat.",
    "Turn off your electric stove or oven 5 to 10 minutes before your food is completely done. The residual heat will finish the cooking for free.",
    "Never open the oven door just to 'check' on your baking. You lose about 20% of the heat every time you open it, costing you money to reheat.",
    "If you are using the oven, try to cook multiple things at once. Roast veggies on the bottom rack while baking chicken on the top.",
    "Keep your freezer as full as possible. A full freezer uses less energy to stay cold than an empty one. (If it's empty, fill it with bottles of water).",
    "Thaw your frozen meat by leaving it in the fridge overnight instead of using the microwave. The frozen block actually helps cool the fridge!",
    "Cut your root vegetables (like potatoes and carrots) into smaller, uniform pieces. They will cook significantly faster, saving gas/electricity.",
    "Air dry your dishes instead of using the heated dry setting on your dishwasher.",
    "Descale your kettle regularly with a mix of water and vinegar. A kettle with limescale buildup takes much longer to boil and wastes electricity.",
    "Use a microwave for reheating or cooking small portions. It uses about 80% less energy than firing up a whole conventional oven.",
    "Keep the coils at the back of your fridge clean and dust-free. If they get clogged, the motor has to work overtime, spiking your electric bill.",
    "Invest in a slow cooker (Crockpot). They cook tough, cheap cuts of meat beautifully while using less electricity than a standard lightbulb.",
    "Use cold water from the tap to wash your vegetables. There is no need to run the hot water heater just to rinse a tomato."
];

function updateHack() {
    const element = document.getElementById("hack-text");
    if (element) {
        const randomIndex = Math.floor(Math.random() * masterKitchenHacks.length);
        element.innerText = masterKitchenHacks[randomIndex];
    }
}
updateHack();
setInterval(updateHack, 30000);
