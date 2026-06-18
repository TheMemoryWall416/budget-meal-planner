const supabaseUrl = 'https://bvdgbodzrfhgpvxzuogs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGdib2R6cmZoZ3B2eHp1b2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjYxMzIsImV4cCI6MjA5NzMwMjEzMn0.C6jFxQmFQYnRjVK8V30mG4qTH3PtEWmVThiiSvr1tEw';
const myDatabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let selectedCountry = "";
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
};

function showPage(page) {
    const view = document.getElementById('main-view');
    if (page === 'home') {
        view.innerHTML = `
            <h1>WELCOME TO THE BUDGET MEAL PLANNER</h1>
            <p><strong>You have come to the right place.</strong></p>
            <p>Whether you are looking for a delicious recipe, want to share one of your own, are searching for the perfect budget-friendly meal, or have a thrifty creation you want to showcase to the community, you’ve arrived at your new home for smart cooking.</p>
            <h3>Built for Everyone, Completely Free</h3>
            <p>We believe that tools for cooking shouldn't come with barriers. That is why this site is <strong>100% free to use</strong>. There is absolutely <strong>no registration or login required</strong> to explore, search, or share your meals.</p>
            <h3>Optional Personalization</h3>
            <p>While we do provide an optional account registration feature if you would like to save your favorite recipes and keep track of your personal meal history, this is entirely up to you. Everything on this site remains fully accessible, open, and functional without the need for any accounts, logging in, or registration.</p>
            <p>Start your culinary journey today—no strings attached.</p>
        `;
    } else if (page === 'find-recipes') {
        view.innerHTML = `<h1>FIND RECIPES</h1>`;
        Object.keys(categories).forEach(cat => {
            view.innerHTML += `<h3>${cat}</h3><div class="btn-container">`;
            categories[cat].forEach(sub => view.innerHTML += `<button onclick="showPage('find-meal')">${sub}</button>`);
            view.innerHTML += `</div>`;
        });
    } else if (page === 'add-budget-meal') {
        view.innerHTML = `<h1>ADD BUDGET MEAL</h1><p>Posting for: <strong>${selectedCountry}</strong></p>
            <div style="display:flex; max-width: 450px;"><span style="padding:8px; background:var(--btn-grey); border: 2px solid var(--border); font-weight:bold; font-size:0.8rem;">${currencyMap[selectedCountry]}</span>
            <input type="number" id="cost" placeholder="Amount"></div>
            <textarea id="recipe" placeholder="Recipe"></textarea>
            <button onclick="saveMeal('budget')">Post</button>`;
    } else {
        view.innerHTML = `<h1>${page.replace(/-/g, ' ').toUpperCase()}</h1>`;
    }
}

function addRecipeMenu() {
    const view = document.getElementById('main-view');
    view.innerHTML = `<h1>ADD RECIPE</h1>`;
    Object.keys(categories).forEach(cat => {
        view.innerHTML += `<h3>${cat}</h3><div class="btn-container">`;
        categories[cat].forEach(sub => view.innerHTML += `<button onclick="showPage('add-meal')">${sub}</button>`);
        view.innerHTML += `</div>`;
    });
}

async function saveMeal(cat) {
    const { error } = await myDatabase.from('meals').insert([{ country: selectedCountry, title: document.getElementById('recipe-name')?.value || "Meal", recipe: document.getElementById('recipe')?.value, cost: document.getElementById('cost')?.value || null, category: cat }]);
    if (error) alert("Error: " + error.message); else alert("Saved to " + cat + "!");
}