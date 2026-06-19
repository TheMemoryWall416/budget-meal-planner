const supabaseUrl = 'https://bvdgbodzrfhgpvxzuogs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2ZGdib2R6cmZoZ3B2eHp1b2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjYxMzIsImV4cCI6MjA5NzMwMjEzMn0.C6jFxQmFQYnRjVK8V30mG4qTH3PtEWmVThiiSvr1tEw';
const myDatabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let selectedCountry = "";
let selectedSubcategory = "";

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
    "Dietary Categories": ["Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Low-carb", "Keto", "High-protein"]
};

// --- INITIALIZATION & THEMES ---
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
    showPage('home');
}

window.onload = function() {
    const s2 = document.getElementById('modal-country-select');
    countries.forEach(c => { let o = document.createElement('option'); o.value = c; o.innerHTML = c; s2.appendChild(o); });
    updateHack(); // Starts the daily tips
};

// --- MAIN ROUTER ---
function showPage(page) {
    const view = document.getElementById('main-view');
    if (page === 'home') {
        view.innerHTML = `
            <h1 style="margin-top:0;">WELCOME TO THE GLOBAL RECIPE & MEAL PLANNER</h1>
            
            <p style="font-size: 1.1rem; line-height: 1.6;">Whether you are searching for a strict budget-friendly main course to stretch your groceries, a quick weeknight dinner, a decadent dessert, or a refreshing drink, you will find it here.</p>
            
            <p style="font-size: 1.1rem; line-height: 1.6;">Looking to showcase your own culinary creations? This is the perfect place to share everything from your favorite hearty stews to your best cocktail recipes and thrifty kitchen hacks with the world.</p>
            
            <div style="background: var(--nav-color); border: 2px solid var(--border); padding: 20px; margin-top: 25px; max-width: 700px; box-sizing: border-box;">
                <h3 style="margin-top: 0; font-size: 1.2rem;">Built for Everyone. 100% Free.</h3>
                <p style="margin-bottom: 0; font-size: 1.05rem; line-height: 1.5;">We believe cooking tools should be accessible to everyone without barriers. To keep this platform permanently free for the community, we have dedicated a small, unobtrusive space for ads. You will never encounter hidden paywalls, intrusive pop-ups, or forced account registrations—just jump straight in and start exploring.</p>
            </div>
        `;
    } else if (page === 'find-recipes') {
        view.innerHTML = `<h1>FIND RECIPES</h1>`;
        Object.keys(categories).forEach(cat => {
            view.innerHTML += `<h3>${cat}</h3><div class="btn-container">`;
            categories[cat].forEach(sub => view.innerHTML += `<button onclick="loadSubcategory('${sub}')">${sub}</button>`);
            view.innerHTML += `</div>`;
        });
    } else if (page === 'find-budget-meals') {
        loadBudgetMeals(); 
    } else if (page === 'add-budget-meal') {
        view.innerHTML = `
            <h1>ADD BUDGET MEAL</h1>
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
                <div style="background: #fff; border: 2px solid var(--border); padding: 15px; margin-bottom: 15px; box-sizing: border-box;">
                    <h3 style="margin-top: 0;">Ingredients</h3>
                    <div id="ingredients-list"></div>
                    <button onclick="addIngredientRow()" style="margin: 10px 0 0 0; background: #e0e0e0; font-size: 0.75rem; border: 2px solid var(--border); padding: 6px 12px; cursor: pointer;">+ Add Another Ingredient</button>
                </div>
                <textarea id="recipe-instructions" rows="6" placeholder="Cooking Instructions..." style="width: 100%; max-width: 450px; box-sizing: border-box;"></textarea>
            </div>

            <div id="takeaway-section" style="display: none; width: 100%; max-width: 450px;">
                <textarea id="takeaway-included" rows="4" placeholder="What is included? (e.g. 4 Burgers, 2 Large Chips, 2L Coke)" style="width: 100%; box-sizing: border-box;"></textarea>
            </div>

            <button onclick="saveBudgetMeal()" style="margin-top: 10px;">Post Budget Meal</button>
        `;
        addIngredientRow(); 
    } else {
        view.innerHTML = `<h1>${page.replace(/-/g, ' ').toUpperCase()}</h1>`;
    }
}

// --- BUDGET MEAL LOGIC ---
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
    view.innerHTML = `<h1>Loading Budget Meals...</h1>`;

    let query = myDatabase.from('meals').select('*').eq('category', 'budget').eq('country', selectedCountry);
    
    if (filter !== 'all') {
        query = query.eq('meal_type', filter);
    }

    const { data, error } = await query;

    if (error) {
        view.innerHTML = `<h1>Error</h1><p>${error.message}</p>`;
        return;
    }

    let html = `<h1>Budget Meals in ${selectedCountry}</h1>`;
    
    html += `
        <div style="margin-bottom: 20px;">
            <button onclick="loadBudgetMeals('all')" style="${filter === 'all' ? 'background: #000; color: #fff;' : 'margin-right: 10px;'}">All</button>
            <button onclick="loadBudgetMeals('takeaway')" style="${filter === 'takeaway' ? 'background: #000; color: #fff;' : 'margin-right: 10px;'}">Takeaway Only</button>
            <button onclick="loadBudgetMeals('home')" style="${filter === 'home' ? 'background: #000; color: #fff;' : ''}">Home-Cooked Only</button>
        </div>
    `;
    
    if (data.length === 0) {
        html += `<p>No budget meals posted for ${selectedCountry} under this filter.</p>`;
    } else {
        html += `<div style="display: flex; flex-direction: column; gap: 15px; max-width: 600px;">`;
        
        data.sort((a, b) => (a.cost / a.servings) - (b.cost / b.servings));

        data.forEach(meal => {
            const costPerPerson = (meal.cost / meal.servings).toFixed(2);
            const badgeColor = meal.meal_type === 'takeaway' ? '#ffcc00' : '#4caf50';
            const badgeText = meal.meal_type === 'takeaway' ? 'TAKEAWAY' : 'HOME-COOKED';
            
            html += `
            <div onclick="viewBudgetMeal(${meal.id})" style="padding: 15px; background: #fff; border: 2px solid var(--border); cursor: pointer;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 1.2rem; font-weight: bold;">${meal.title}</span>
                    <span style="background: ${badgeColor}; padding: 3px 8px; font-size: 0.7rem; font-weight: bold; border: 1px solid var(--border);">${badgeText}</span>
                </div>
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

async function viewBudgetMeal(id) {
    const view = document.getElementById('main-view');
    view.innerHTML = `<h1>Loading...</h1>`;

    const { data, error } = await myDatabase.from('meals').select('*').eq('id', id).single();

    if (error) return;

    let contentHTML = "";

    if (data.meal_type === 'home') {
        let ingredientsHTML = `<ul style="font-size: 1.1rem; line-height: 1.8; background: #fff; padding: 20px 40px; border: 2px solid var(--border); max-width: 600px; margin-top: 10px;">`;
        if (data.ingredients && Array.isArray(data.ingredients)) {
            data.ingredients.forEach(ing => {
                let qty = ing.qty ? ing.qty : '';
                let unit = ing.unit ? ing.unit : '';
                ingredientsHTML += `<li><strong>${qty} ${unit}</strong> ${ing.item}</li>`;
            });
        }
        ingredientsHTML += `</ul>`;

        contentHTML = `
            <h2 style="margin-top: 20px;">Ingredients</h2>
            ${ingredientsHTML}
            <h2 style="margin-top: 20px;">Instructions</h2>
            <div style="font-size: 1.1rem; line-height: 1.6; background: #fff; padding: 20px; border: 2px solid var(--border); max-width: 600px; white-space: pre-wrap;">${data.recipe}</div>
        `;
    } else {
        contentHTML = `
            <h2 style="margin-top: 20px;">What is included?</h2>
            <div style="font-size: 1.1rem; line-height: 1.6; background: #fff; padding: 20px; border: 2px solid var(--border); max-width: 600px; white-space: pre-wrap;">${data.recipe}</div>
        `;
    }

    const costPer = (data.cost / data.servings).toFixed(2);

    view.innerHTML = `
        <button onclick="showPage('find-budget-meals')" style="margin-bottom: 20px; background:var(--btn-grey); border:2px solid var(--border);">← Back to Budget Meals</button>
        <h1 style="font-size: 2.5rem; margin-top: 0; margin-bottom: 5px;">${data.title}</h1>
        <div style="font-size: 1.2rem; margin-bottom: 20px; padding: 10px; background: #e0e0e0; border: 2px solid var(--border); display: inline-block;">
            <strong>${currencyMap[selectedCountry]}${costPer}</strong> per person (Feeds ${data.servings} for ${currencyMap[selectedCountry]}${data.cost})
        </div>
        ${contentHTML}
    `;
}

// --- GLOBAL RECIPE LOGIC ---
async function loadSubcategory(subcategory) {
    const view = document.getElementById('main-view');
    view.innerHTML = `<h1>Loading ${subcategory}...</h1>`;

    const { data, error } = await myDatabase
        .from('meals')
        .select('id, title, category')
        .eq('category', subcategory)
        .order('title', { ascending: true });

    if (error) {
        view.innerHTML = `<h1>Error Loading Recipes</h1><p>${error.message}</p><button onclick="showPage('find-recipes')">← Back to Categories</button>`;
        return;
    }

    let html = `
        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
            <button onclick="showPage('find-recipes')" style="margin:0; background:var(--btn-grey); border:2px solid var(--border);">← Back to Categories</button>
            <h1 style="margin: 0;">${subcategory}</h1>
        </div>
    `;

    if (data.length === 0) {
        html += `<p>No recipes found in this category yet. Be the first to add one!</p>`;
    } else {
        html += `<div style="display: flex; flex-direction: column; gap: 10px; max-width: 600px;">`;
        data.forEach(meal => {
            html += `<div 
                        onclick="viewRecipe(${meal.id})" 
                        style="padding: 15px; background: #fff; border: 2px solid var(--border); cursor: pointer; font-size: 1.2rem; font-weight: bold;">
                        ${meal.title}
                     </div>`;
        });
        html += `</div>`;
    }
    view.innerHTML = html;
}

async function viewRecipe(id) {
    const view = document.getElementById('main-view');
    view.innerHTML = `<h1>Loading Recipe...</h1>`;

    const { data, error } = await myDatabase.from('meals').select('*').eq('id', id).single();

    if (error) return;

    let ingredientsHTML = `<ul style="font-size: 1.1rem; line-height: 1.8; background: #fff; padding: 20px 40px; border: 2px solid var(--border); max-width: 600px; margin-top: 10px;">`;
    
    if (data.ingredients && Array.isArray(data.ingredients)) {
        data.ingredients.forEach(ing => {
            let qty = ing.qty ? ing.qty : '';
            let unit = ing.unit ? ing.unit : '';
            ingredientsHTML += `<li><strong>${qty} ${unit}</strong> ${ing.item}</li>`;
        });
    } else {
        ingredientsHTML += `<li>No structured ingredients found.</li>`;
    }
    ingredientsHTML += `</ul>`;

    view.innerHTML = `
        <button onclick="loadSubcategory('${data.category}')" style="margin-bottom: 20px; background:var(--btn-grey); border:2px solid var(--border);">← Back to ${data.category}</button>
        <h1 style="font-size: 2.5rem; margin-top: 0; margin-bottom: 10px;">${data.title}</h1>
        
        <h2 style="margin-top: 20px;">Ingredients</h2>
        
        <div style="background: var(--nav-color); border: 2px solid var(--border); padding: 15px; max-width: 600px; box-sizing: border-box;">
            <h3 style="margin-top: 0; font-size: 1.1rem;">Smart Converter</h3>
            <div style="display: flex; gap: 10px; align-items: center;">
                <input type="number" step="any" id="conv-amount" oninput="calculateConversion()" placeholder="Qty" style="flex: 1; margin: 0; min-width: 60px;">
                <select id="conv-from" onchange="updateConverter()" style="flex: 1.5; margin: 0; padding: 8px; border: 2px solid var(--border); background: #fff;">
                    <optgroup label="Weight">
                        <option value="g">Gram (g)</option>
                        <option value="kg">Kilogram (kg)</option>
                        <option value="oz">Ounce (oz)</option>
                        <option value="lb">Pound (lb)</option>
                    </optgroup>
                    <optgroup label="Volume">
                        <option value="ml">Milliliter (ml)</option>
                        <option value="l">Liter (L)</option>
                        <option value="tsp">Teaspoon (tsp)</option>
                        <option value="tbsp">Tablespoon (tbsp)</option>
                        <option value="cup">Cup</option>
                        <option value="fl oz">Fluid Ounce (fl oz)</option>
                    </optgroup>
                    <optgroup label="Temperature">
                        <option value="c">Celsius (°C)</option>
                        <option value="f">Fahrenheit (°F)</option>
                    </optgroup>
                </select>
                <span style="font-weight: bold; padding: 0 5px;">to</span>
                <select id="conv-to" onchange="calculateConversion()" style="flex: 1.5; margin: 0; padding: 8px; border: 2px solid var(--border); background: #fff;"></select>
            </div>
            <div id="conv-result" style="margin-top: 10px; font-weight: bold; font-size: 1.2rem; min-height: 25px; color: #333;"></div>
        </div>

        ${ingredientsHTML}
        
        <h2 style="margin-top: 20px;">Instructions</h2>
        <div style="font-size: 1.1rem; line-height: 1.6; background: #fff; padding: 20px; border: 2px solid var(--border); max-width: 600px; white-space: pre-wrap;">${data.recipe}</div>
    `;
    updateConverter();
}

// --- SMART CONVERTER LOGIC ---
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

// --- SAVING DATA (RECIPES & BUDGET MEALS) ---
function addRecipeMenu() {
    const view = document.getElementById('main-view');
    view.innerHTML = `<h1>ADD RECIPE</h1>`;
    Object.keys(categories).forEach(cat => {
        view.innerHTML += `<h3>${cat}</h3><div class="btn-container">`;
        categories[cat].forEach(sub => view.innerHTML += `<button onclick="showForm('${sub}')">${sub}</button>`);
        view.innerHTML += `</div>`;
    });
}

function showForm(subcategory) {
    selectedSubcategory = subcategory;
    const view = document.getElementById('main-view');
    view.innerHTML = `
        <h1>Adding to: ${subcategory}</h1>
        <input type="text" id="recipe-name" placeholder="Recipe Title" style="width: 100%; max-width: 450px; box-sizing: border-box;">
        <div id="ingredients-container" style="width: 100%; max-width: 450px; background: #fff; border: 2px solid var(--border); padding: 15px; margin-bottom: 15px; box-sizing: border-box;">
            <h3 style="margin-top: 0;">Ingredients</h3>
            <div id="ingredients-list"></div>
            <button onclick="addIngredientRow()" style="margin: 10px 0 0 0; background: #e0e0e0; font-size: 0.75rem; border: 2px solid var(--border); padding: 6px 12px; cursor: pointer;">+ Add Another Ingredient</button>
        </div>
        <textarea id="recipe-instructions" rows="8" placeholder="Instructions..." style="width: 100%; max-width: 450px; box-sizing: border-box;"></textarea>
        <div style="display: flex; gap: 10px; width: 100%; max-width: 450px;">
            <button onclick="saveRecipe()" style="margin: 0;">Save Recipe</button>
            <button onclick="addRecipeMenu()" style="margin: 0;">Cancel</button>
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
    const title = document.getElementById('recipe-name').value;
    const instructions = document.getElementById('recipe-instructions').value;
    
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
        title: title, 
        category: selectedSubcategory, 
        ingredients: structuredIngredients,
        recipe: instructions 
    }]);
    
    if (error) alert("Error: " + error.message);
    else { alert("Recipe Saved successfully!"); addRecipeMenu(); }
}

async function saveBudgetMeal() {
    const type = document.getElementById('meal-type').value;
    const title = document.getElementById('budget-title').value;
    const cost = parseFloat(document.getElementById('budget-cost').value);
    const servings = parseInt(document.getElementById('budget-servings').value);

    if (!title || !cost || !servings) return alert("Please fill in the meal name, total cost, and servings.");

    let finalIngredients = null;
    let finalRecipe = "";

    if (type === 'home') {
        const rows = document.querySelectorAll('.ingredient-row');
        finalIngredients = [];
        rows.forEach(r => {
            const name = r.querySelector('.ing-name').value.trim();
            const qty = r.querySelector('.ing-qty').value;
            const unit = r.querySelector('.ing-unit').value;
            if (name) finalIngredients.push({ item: name, qty: qty ? parseFloat(qty) : null, unit: unit });
        });
        finalRecipe = document.getElementById('recipe-instructions').value;
    } else {
        finalRecipe = document.getElementById('takeaway-included').value;
    }

    const { error } = await myDatabase.from('meals').insert([{ 
        country: selectedCountry, 
        title: title, 
        recipe: finalRecipe, 
        ingredients: finalIngredients,
        cost: cost, 
        servings: servings,
        meal_type: type,
        category: 'budget'
    }]);

    if (error) alert("Error: " + error.message); 
    else { alert("Saved budget meal!"); showPage('find-budget-meals'); }
}

// --- DAILY KITCHEN TIPS ---
const masterKitchenHacks = [
    "Store your potatoes with an apple to stop them from sprouting.",
    "Wrap celery tightly in aluminum foil to keep it crisp for weeks.",
    "Look lower! Supermarkets hide cheaper generic brands below eye level.",
    "Never shop hungry to reduce impulse buys by up to 60%.",
    "Put a lid on your boiling water to use up to 30% less electricity.",
    "Freeze leftover sauce in ice cube trays for easy flavor bombs.",
    "Keep a bag of rice in your salt shaker to prevent clumping.",
    "Collect veggie scraps in a freezer bag to make free homemade stock.",
    "The Freezer Tray Trick: Freeze leftover wine/soup for flavor bombs.",
    "The Milk Sniff Test: Use your nose; 'Best Before' dates are suggestions.",
    "The Onion Saver: Never store onions with potatoes; they spoil each other.",
    "The Bread Freeze: Freeze half a loaf and toast slices directly from frozen."
];

function updateHack() {
    const element = document.getElementById("hack-text");
    if (element) {
        const randomIndex = Math.floor(Math.random() * masterKitchenHacks.length);
        element.innerText = masterKitchenHacks[randomIndex];
    }
}

setInterval(updateHack, 30000);
