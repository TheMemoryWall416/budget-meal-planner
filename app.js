const supabaseUrl = 'https://bvdgbodzrfhgpvxzuogs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2ZGdib2R6cmZoZ3B2eHp1b2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjYxMzIsImV4cCI6MjA5NzMwMjEzMn0.C6jFxQmFQYnRjVK8V30mG4qTH3PtEWmVThiiSvr1tEw';
const myDatabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let selectedCountry = "";
let selectedSubcategory = "";
let selectedParentCategory = ""; 
let totalApprovedRecipes = 0; 
let totalVisitors = 10000;
let teamPhotoUrl = localStorage.getItem('cached_team_photo') || 'https://via.placeholder.com/300';
let dynamicBudgetTips = []; 

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
    const { count: liveCount, error: recipeError } = await myDatabase.from('meals').select('*', { count: 'exact', head: true }).eq('status', 'approved');
    if (!recipeError && liveCount !== null) { totalApprovedRecipes = liveCount; }

    const { data: vData } = await myDatabase.from('site_stats').select('visitor_count').eq('id', 1).single();
    if (vData) { totalVisitors = vData.visitor_count; }

    let totalShared = 0;
    let totalLikes = 0;
    const { data: interactionStats } = await myDatabase.rpc('get_kitchen_stats');
    if (interactionStats) {
        totalShared = interactionStats.total_shared;
        totalLikes = interactionStats.total_likes;
    }

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
        navCounter.innerHTML = `
            <div style="margin-bottom: 8px;">🌍 <strong>${totalApprovedRecipes}</strong> Live Recipes</div>
            <div style="margin-bottom: 8px;">📤 <strong>${totalShared}</strong> Total Shared</div>
            <div style="margin-bottom: 8px; color: #d00;">❤️ <strong>${totalLikes}</strong> Total Likes</div>
            <div style="color: #008080;">👀 <strong>${totalVisitors.toLocaleString()}</strong> Total Visits</div>
        `;
    }

    const homeCounter = document.getElementById('home-visitor-counter');
    if (homeCounter) {
        homeCounter.innerHTML = `👀 ${totalVisitors.toLocaleString()} Total Visits to Website`;
    }
}

function confirmCountry() {
    const s = document.getElementById('modal-country-select').value;
    if (!s) return alert("Select a country!");
    selectedCountry = s;
    
    localStorage.setItem('saved_country', s);
    
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

async function fetchBudgetTips() {
    const { data, error } = await myDatabase.from('budget_tips').select('tip_text');
    if (!error && data && data.length > 0) {
        dynamicBudgetTips = data.map(item => item.tip_text);
        updateHack(); 
    } else {
        document.getElementById("hack-text").innerText = "Add tips in your database to see them here!";
    }
}

function updateHack() {
    const element = document.getElementById("hack-text");
    if (element && dynamicBudgetTips.length > 0) {
        const randomIndex = Math.floor(Math.random() * dynamicBudgetTips.length);
        element.innerText = dynamicBudgetTips[randomIndex];
    }
}

window.onload = function() {
    const s2 = document.getElementById('modal-country-select');
    if (s2) {
        countries.forEach(c => { let o = document.createElement('option'); o.value = c; o.innerHTML = c; s2.appendChild(o); });
    }
    
    handleVisitorSession();
    fetchBudgetTips(); 
    setInterval(updateHack, 30000); 

    const savedCountry = localStorage.getItem('saved_country');

    if (savedCountry) {
        selectedCountry = savedCountry;
        const modal = document.getElementById('country-modal');
        if (modal) modal.style.display = 'none';
        
        const params = new URLSearchParams(window.location.search);
        if (params.get('recipe')) {
            viewRecipe(params.get('recipe'));
        } else if (params.get('budget')) {
            viewBudgetMeal(params.get('budget'));
        } else {
            showPage('home');
        }
    } else {
        const modal = document.getElementById('country-modal');
        if (modal) modal.style.display = 'flex';
    }
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
            <button onclick="renderCategoryList('find')" style="margin:0;">← Back to Categories</button>
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
                <div id="home-visitor-counter" style="display: inline-block; background: #f0f0f0; border: 1px solid var(--border); padding: 5px 15px; font-weight: bold; color: #000; font-size: 1.1rem; box-shadow: 2px 2px 0px var(--border); margin-top: 10px;">
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
                    <div style="background: #f0f0f0; border: 2px solid var(--border); padding: 15px; margin-bottom: 15px; box-sizing: border-box;">
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
            <button onclick="${context === 'find' ? "showPage('find-recipes')" : "showPage('creator-hub')"}" style="margin-bottom: 20px;">← Back to Hub</button>
            <h1 style="margin-top: 0; margin-bottom: 5px;">${title}</h1>
            <p style="font-size: 1.1rem; color: #555; margin-top: 0; margin-bottom: 10px;">${subtitle}</p>
        </div>
    `;

    if (context === 'find') {
        html += `
        <div class="window-box" style="display: flex; gap: 10px; max-width: 900px; width: 100%; box-sizing: border-box; margin-bottom: 20px;">
            <input type="text" id="search-input" placeholder="Search recipes by name or ingredient..." style="margin-bottom: 0; flex: 1;">
            <button onclick="executeSearch()" style="margin: 0;">🔍 Search</button>
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
            <button onclick="renderCategoryList('${context}')" style="margin-bottom: 20px;">← Back to All Categories</button>
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
            <div style="background: #f0f0f0; border: 2px solid var(--border); padding: 20px; box-sizing: border-box; margin-top: 10px;">
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
            <button onclick="showPage('find-recipes')" style="margin:0;">← Back to Hub</button>
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
            <button onclick="showPage('find-recipes')" style="margin:0;">← Back to Hub</button>
            <h1 style="margin: 0;">Budget Meals in ${selectedCountry}</h1>
        </div>
    `;
    
    html += `
        <div class="window-box" style="margin-bottom: 20px; width: 100%; max-width: 600px; box-sizing: border-box;">
            <button onclick="loadBudgetMeals('all')" style="${filter === 'all' ? 'background: var(--nav-color); border-color: var(--border);' : 'margin-right: 10px;'}">All</button>
            <button onclick="loadBudgetMeals('takeaway')" style="${filter === 'takeaway' ? 'background: var(--nav-color); border-color: var(--border);' : 'margin-right: 10px;'}">Takeaway Only</button>
            <button onclick="loadBudgetMeals('home')" style="${filter === 'home' ? 'background: var(--nav-color); border-color: var(--border);' : ''}">Home-Cooked Only</button>
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
                <button onclick="showPage('find-budget-meals')" style="margin:0;">← Back</button>
                <button onclick="likeMeal(${data.id}, this)" style="margin:0; background:#fff0f5; border:2px solid var(--border); color:#d00;">❤️ Like (<span class="like-count">${data.likes || 0}</span>)</button>
                <button onclick="copyToClipboard('${currentUrl}')" style="margin:0; background:#fff;">🔗 Copy Link</button>
                <a href="https://wa.me/?text=${whatsappText}" target="_blank" style="display:inline-block; padding: 8px 16px; background:#25D366; color:#fff; font-weight:bold; border:2px solid var(--border); text-decoration:none; font-size:0.85rem; box-sizing:border-box;">📱 WhatsApp</a>
            </div>
            
            <h1 style="font-size: 2.5rem; margin-top: 0; margin-bottom: 5px;">${data.title}</h1>
            <div style="font-size: 1.2rem; padding: 10px; background: #e0e0e0; border: 2px solid var(--border); display: inline-block;">
                <strong>${currencyMap[selectedCountry]}${costPer}</strong> per person (Feeds ${data.servings} for ${currencyMap[selectedCountry]}${data.cost})
            </div>
        </div>
        
        ${contentHTML}
        
        <div class="window-box" style="width: 100%; max-width: 650px; box-sizing: border-box;">
            <button onclick="reportRecipe('${data.title.replace(/'/g, "\\'")}', ${data.id})" style="background: #ffcccc; color: #900; border: 1px solid #900; padding: 5px 10px; font-size: 0.8rem; margin: 0;">⚠️ Report Recipe</button>
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
            <button onclick="renderSubcategoryList('${parentCategory}', 'find')" style="margin:0;">← Back to ${parentCategory}</button>
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
                <button onclick="loadSubcategory('${data.category}', '${parentCat}')" style="margin:0;">← Back to ${data.category}</button>
                <button onclick="likeMeal(${data.id}, this)" style="margin:0; background:#fff0f5; border:2px solid var(--border); color:#d00;">❤️ Like (<span class="like-count">${data.likes || 0}</span>)</button>
                <button onclick="copyToClipboard('${currentUrl}')" style="margin:0; background:#fff;">🔗 Copy Link</button>
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
            <button onclick="renderSubcategoryList('${parentCategory}', 'add')" style="margin-bottom: 20px;">← Back to ${parentCategory}</button>
            <h1 style="margin-top: 0;">Adding to: ${subcategory}</h1>
            <input type="text" id="recipe-name" placeholder="Recipe Title" style="width: 100%; max-width: 450px; box-sizing: border-box; margin-bottom: 10px;">
            <input type="text" id="author-name" placeholder="Your Name (Optional)" style="width: 100%; max-width: 450px; box-sizing: border-box; margin-bottom: 15px;">
            <div id="ingredients-container" style="width: 100%; max-width: 450px; background: #f0f0f0; border: 2px solid var(--border); padding: 15px; margin-bottom: 15px; box-sizing: border-box;">
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
