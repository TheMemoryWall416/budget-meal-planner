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

// --- AUTHENTICATION STATE & LOGIC ---
let currentUser = null;
let isLoginMode = false;

async function initAuth() {
    const { data: { session } } = await myDatabase.auth.getSession();
    currentUser = session ? session.user : null;
    updateAuthUI();
}

function updateAuthUI() {
    const authBtn = document.getElementById('nav-auth-btn');
    if (authBtn) {
        if (currentUser) {
            authBtn.innerHTML = '👤 My Profile';
            authBtn.onclick = () => showPage('profile');
        } else {
            authBtn.innerHTML = '🚪 Join / Sign In';
            authBtn.onclick = openAuthModal;
        }
    }
}

function openAuthModal() {
    document.getElementById('auth-modal').style.display = 'flex';
}

function closeAuthModal() {
    document.getElementById('auth-modal').style.display = 'none';
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-modal-title');
    const desc = document.getElementById('auth-modal-desc');
    const btn = document.getElementById('auth-primary-btn');
    const toggleText = document.getElementById('auth-toggle-text');
    const toggleLink = document.getElementById('auth-toggle-link');

    if (isLoginMode) {
        title.innerText = 'Welcome Back';
        desc.innerText = 'Sign in to access your saved recipes and community features.';
        btn.innerText = 'Sign In';
        toggleText.innerText = 'Need an account?';
        toggleLink.innerText = 'Join for Free';
    } else {
        title.innerText = 'Join the Community';
        desc.innerText = 'Create a free member account to save recipes, participate in community discussions, and track your kitchen contributions!';
        btn.innerText = 'Join for Free';
        toggleText.innerText = 'Already a member?';
        toggleLink.innerText = 'Sign In';
    }
}

async function handleAuthSubmit() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    
    if (!email || !password) return alert("Please enter both email and password.");
    if (password.length < 6) return alert("Password must be at least 6 characters.");

    const btn = document.getElementById('auth-primary-btn');
    const originalText = btn.innerText;
    btn.innerText = 'Processing...';
    btn.disabled = true;

    let error, data;

    if (isLoginMode) {
        const res = await myDatabase.auth.signInWithPassword({ email, password });
        error = res.error; data = res.data;
    } else {
        const res = await myDatabase.auth.signUp({ email, password });
        error = res.error; data = res.data;
    }

    btn.innerText = originalText;
    btn.disabled = false;

    if (error) {
        alert("Error: " + error.message);
    } else {
        if (!isLoginMode && data?.user && data?.session === null) {
            alert("Registration successful! Check your email to confirm your account.");
        } else {
            currentUser = data.user;
            updateAuthUI();
            closeAuthModal();
            alert(isLoginMode ? "Welcome back to the kitchen!" : "Account created successfully! Welcome to the community.");
        }
    }
}

async function logoutUser() {
    await myDatabase.auth.signOut();
    currentUser = null;
    updateAuthUI();
    showPage('home');
}
// --- END AUTH LOGIC ---

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
            <div style="margin-bottom: 8px;">❤️ <strong>${totalLikes}</strong> Total Likes</div>
            <div>👀 <strong>${totalVisitors.toLocaleString()}</strong> Total Visits</div>
        `;
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
    
    initAuth();
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
        view.innerHTML = `<button onclick="renderCategoryList('find')" style="margin-bottom: 15px;">← Back</button><div class="window-box"><h1>Error</h1><p>${error.message}</p></div>`;
        return;
    }

    let html = `
        <button onclick="renderCategoryList('find')" style="margin-bottom: 15px;">← Back</button>
        <div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px;">
            <h1 style="margin: 0; font-size: 1.8rem;">Search Results</h1>
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
            const badge = isBudget ? ` - BUDGET` : '';

            html += `<div class="window-box" onclick="${clickAction}" style="padding: 15px; cursor: pointer; margin-bottom: 0;">
                        <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 5px;">${meal.title}${badge}</div>
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
        <div class="window-box" style="width: 100%; max-width: 900px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px;">
            <h1 style="margin-top: 0; margin-bottom: 5px; font-size: 1.8rem;">FIND RECIPES</h1>
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
        <div class="window-box" style="width: 100%; max-width: 900px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px;">
            <h1 style="margin-top: 0; margin-bottom: 5px; font-size: 1.8rem;">ADD YOUR OWN</h1>
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
            <div class="window-box" style="text-align: center; max-width: 800px; width: 100%; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px;">
                <h1 style="margin-top:0; font-size: 1.8rem;">WELCOME TO THE GLOBAL RECIPE & MEAL PLANNER</h1>
                <p style="margin: 0; font-size: 1.2rem; margin-bottom: 0;">From authentic global cuisines to cost-tracked weeknight dinners. Explore <strong>${totalApprovedRecipes}</strong> recipes shared by cooks worldwide.</p>
            </div>

            <div class="window-box" style="max-width: 800px; width: 100%; box-sizing: border-box;">
                <div style="display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap;">
                    <img id="home-team-photo" src="${teamPhotoUrl}" style="width: 200px; height: 200px; border-radius: 50%; border: 4px solid var(--border); object-fit: cover;">
                    <div style="flex: 1; min-width: 300px;">
                        <h2 style="font-size: 1.5rem; margin-top: 0; margin-bottom: 15px;">About Us</h2>
                        <h3 style="font-size: 1.2rem; margin-top: 0; margin-bottom: 5px;">Meet the Team</h3>
                        <p style="line-height: 1.6; margin-top: 0;">Hi! We're Anton and Jenny from South Africa, and we're the team behind this platform.</p>
                        <p style="line-height: 1.6; font-size: 1.2rem; margin-top: 20px;">Happy cooking,<br><strong>Anton & Jenny</strong></p>
                    </div>
                </div>
            </div>
        `;
    } else if (page === 'profile') {
        view.innerHTML = `
            <div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px;">
                <h1 style="margin-top: 0; margin-bottom: 0; font-size: 1.8rem;">MY PROFILE</h1>
            </div>
            <div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box; text-align: center;">
                <h2 style="margin-top:0;">Welcome!</h2>
                <p>You are signed in as: <strong style="font-size:1.1rem; display:block; margin-top: 5px;">${currentUser ? currentUser.email : 'Unknown'}</strong></p>
                <div style="background: #fdf6e3; border: 2px dashed #ccc; padding: 20px; margin: 20px 0;">
                    <p style="color: #666; margin: 0; font-style: italic;">(More profile features like your saved recipes and personal submissions are coming soon!)</p>
                </div>
                <button onclick="logoutUser()">🚪 Sign Out</button>
            </div>
        `;
    } else if (page === 'find-recipes') {
        renderFindHub();
    } else if (page === 'find-budget-meals') {
        loadBudgetMeals(); 
    } else if (page === 'add-budget-meal') {
        view.innerHTML = `
            <button onclick="showPage('creator-hub')" style="margin-bottom: 15px;">← Back</button>
            <div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px;">
                <h1 style="margin-top: 0; font-size: 1.8rem; margin-bottom: 0;">ADD BUDGET MEAL</h1>
                <p style="margin: 0; font-size: 1.1rem; color: #555; margin-top: 5px;">Posting for: <strong>${selectedCountry}</strong></p>
            </div>
            <div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box;">
                <select id="meal-type" onchange="toggleMealType()">
                    <option value="home">Home-Cooked (Ingredients)</option>
                    <option value="takeaway">Takeaway / Fast Food</option>
                </select>
                <input type="text" id="budget-title" placeholder="Meal Name (e.g. Steers Phanda)">
                <div style="display:flex; gap: 10px; max-width: 450px; margin-bottom: 15px;">
                    <div style="display:flex; flex:1;">
                        <span style="padding:8px; background:var(--btn-grey); border: 2px solid var(--border); border-right: none; font-weight:bold; box-sizing: border-box;">${currencyMap[selectedCountry] || '$'}</span>
                        <input type="number" id="budget-cost" step="any" placeholder="Total Cost" style="flex: 1;">
                    </div>
                    <input type="number" id="budget-servings" placeholder="Servings (e.g. 4)" style="flex: 1;">
                </div>
                <div id="home-cooked-section" style="width: 100%; max-width: 450px;">
                    <div style="background: #f0f0f0; border: 2px solid var(--border); padding: 15px; margin-bottom: 15px; box-sizing: border-box;">
                        <h3 style="margin-top: 0;">Ingredients</h3>
                        <div id="ingredients-list"></div>
                        <button onclick="addIngredientRow()">+ Add Another Ingredient</button>
                    </div>
                    <textarea id="recipe-instructions" rows="6" placeholder="Cooking Instructions..."></textarea>
                </div>
                <div id="takeaway-section" style="display: none; width: 100%; max-width: 450px;">
                    <textarea id="takeaway-included" rows="4" placeholder="What is included?"></textarea>
                </div>
                <button onclick="saveBudgetMeal()">Post Meal Live</button>
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
        <button onclick="${context === 'find' ? "showPage('find-recipes')" : "showPage('creator-hub')"}" style="margin-bottom: 15px;">← Back</button>
        <div class="window-box" style="width: 100%; max-width: 900px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px;">
            <h1 style="margin-top: 0; margin-bottom: 5px; font-size: 1.8rem;">${title}</h1>
            <p style="font-size: 1.1rem; color: #555; margin-top: 0; margin-bottom: 5px;">${subtitle}</p>
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
        <button onclick="renderCategoryList('${context}')" style="margin-bottom: 15px;">← Back</button>
        <div class="window-box" style="width: 100%; max-width: 900px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px;">
            <h1 style="margin-top: 0; margin-bottom: 5px; font-size: 1.8rem;">${mainCategory}</h1>
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
        <button onclick="showPage('creator-hub')" style="margin-bottom: 15px;">← Back</button>
        <div class="window-box" style="width: 100%; max-width: 650px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px;">
            <h1 style="margin-top: 0; font-size: 1.8rem; margin-bottom: 0;">ADD 7-DAY MEAL PLAN</h1>
        </div>
        <div class="window-box" style="width: 100%; max-width: 650px; box-sizing: border-box;">
            <input type="text" id="plan-title" placeholder="Meal Plan Title (e.g., R500 Student Survival Week)" style="font-weight: bold; font-size: 1.1rem;">
            <div style="background: #f0f0f0; border: 2px solid var(--border); padding: 20px; box-sizing: border-box; margin-top: 10px;">
                <p style="margin-top: 0; font-size: 0.95rem; color: #555;">Fill out the meals for each day. If you plan to eat leftovers or skip a meal, just leave that day blank!</p>
                ${daysHTML}
            </div>
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button onclick="saveMealPlan()">Post Plan Live</button>
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
        <button onclick="showPage('find-recipes')" style="margin-bottom: 15px;">← Back</button>
        <div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px;">
            <h1 style="margin: 0; font-size: 1.8rem;">Local Specials in ${selectedCountry}</h1>
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
                    <span style="font-size: 0.75rem; font-weight: bold; border: 1px solid var(--border); display: inline-block; padding: 3px 8px;">EXPIRES: ${expiryStr}</span>
                </div>
                <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 10px; word-wrap: break-word;">${meal.title}</div>
                <div style="font-size: 1.2rem; margin-bottom: 10px; font-weight: bold;">
                    ${currencyMap[selectedCountry] || ''}${meal.cost}
                </div>
                <div style="font-size: 1rem; line-height: 1.5; white-space: pre-wrap;">${meal.recipe}</div>
                <div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #ccc;">
                    <button onclick="reportRecipe('${meal.title.replace(/'/g, "\\'")}', ${meal.id})">⚠️ Report Fake/Expired Deal</button>
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
        <button onclick="showPage('creator-hub')" style="margin-bottom: 15px;">← Back</button>
        <div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px;">
            <h1 style="margin-top: 0; font-size: 1.8rem; margin-bottom: 0;">SHARE A LOCAL SPECIAL</h1>
        </div>
        <div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box;">
            <p>Posting deal for: <strong>${selectedCountry}</strong></p>
            <input type="text" id="special-title" placeholder="Deal Name & Store (e.g. Checkers 5kg Braai Pack)">
            
            <div style="display:flex; flex:1; max-width: 450px; margin-bottom: 15px;">
                <span style="padding:8px; background:var(--btn-grey); border: 2px solid var(--border); border-right: none; font-weight:bold; box-sizing: border-box;">${currencyMap[selectedCountry] || '$'}</span>
                <input type="number" id="special-cost" step="any" placeholder="Special Price" style="margin-bottom: 0; flex: 1;">
            </div>

            <select id="special-duration">
                <option value="">-- When does this special end? --</option>
                <option value="3">Just this weekend (3 days)</option>
                <option value="7">One week (7 days)</option>
                <option value="month">Until the end of the month</option>
            </select>

            <textarea id="special-details" rows="4" placeholder="What is included in the deal? Any specific conditions?"></textarea>
            <br>
            <button onclick="saveSpecial()">Post Deal Live</button>
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
        <button onclick="showPage('find-recipes')" style="margin-bottom: 15px;">← Back</button>
        <div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px;">
            <h1 style="margin: 0; font-size: 1.8rem;">Budget Meals in ${selectedCountry}</h1>
        </div>
    `;
    
    html += `
        <div class="window-box" style="margin-bottom: 20px; width: 100%; max-width: 600px; box-sizing: border-box;">
            <button onclick="loadBudgetMeals('all')">All</button>
            <button onclick="loadBudgetMeals('takeaway')">Takeaway Only</button>
            <button onclick="loadBudgetMeals('home')">Home-Cooked Only</button>
        </div>
    `;
    
    if (data.length === 0) {
        html += `<div class="window-box" style="width: 100%; max-width: 600px;"><p>No budget meals posted for ${selectedCountry} under this filter.</p></div>`;
    } else {
        html += `<div style="display: flex; flex-direction: column; gap: 15px; max-width: 600px; width: 100%;">`;
        data.sort((a, b) => (a.cost / a.servings) - (b.cost / b.servings));
        data.forEach(meal => {
            const costPerPerson = (meal.cost / meal.servings).toFixed(2);
            const badgeText = meal.meal_type === 'takeaway' ? 'TAKEAWAY' : 'HOME-COOKED';
            
            html += `
            <div class="window-box" onclick="viewBudgetMeal(${meal.id})" style="cursor: pointer; margin-bottom: 0;">
                <div style="margin-bottom: 8px;">
                    <span style="font-size: 0.7rem; font-weight: bold; border: 1px solid var(--border); display: inline-block; padding: 3px 8px;">${badgeText}</span>
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
        <button onclick="showPage('find-budget-meals')" style="margin-bottom: 15px;">← Back</button>
        <div class="window-box" style="width: 100%; max-width: 650px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px;">
            <h1 style="font-size: 2rem; margin-top: 0; margin-bottom: 5px;">${data.title}</h1>
            <div style="font-size: 1.2rem; padding: 10px; background: #e0e0e0; border: 2px solid var(--border); display: inline-block;">
                <strong>${currencyMap[selectedCountry]}${costPer}</strong> per person (Feeds ${data.servings} for ${currencyMap[selectedCountry]}${data.cost})
            </div>
        </div>
        
        ${contentHTML}
        
        <div class="window-box" style="display: flex; gap: 10px; margin-top: 10px; margin-bottom: 30px; flex-wrap: wrap; width: 100%; max-width: 650px; background: transparent; border: none; box-shadow: none; padding: 0;">
            <button onclick="likeMeal(${data.id}, this)">❤️ Like (<span class="like-count">${data.likes || 0}</span>)</button>
            <button onclick="copyToClipboard('${currentUrl}')">🔗 Copy Link</button>
            <button onclick="window.open('https://wa.me/?text=${whatsappText}', '_blank')">📱 WhatsApp</button>
            <button onclick="reportRecipe('${data.title.replace(/'/g, "\\'")}', ${data.id})">⚠️ Report Recipe</button>
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
        view.innerHTML = `<button onclick="renderSubcategoryList('${parentCategory}', 'find')" style="margin-bottom: 15px;">← Back</button><div class="window-box"><h1>Error</h1><p>${error.message}</p></div>`; 
        return; 
    }

    let html = `
        <button onclick="renderSubcategoryList('${parentCategory}', 'find')" style="margin-bottom: 15px;">← Back</button>
        <div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px;">
            <h1 style="margin: 0; font-size: 1.8rem;">${subcategory}</h1>
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
        <button onclick="loadSubcategory('${data.category}', '${parentCat}')" style="margin-bottom: 15px;">← Back</button>
        <div class="window-box" style="width: 100%; max-width: 650px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px;">
            <h1 style="font-size: 2rem; margin-top: 0; margin-bottom: 5px;">${data.title}</h1>
            <p style="font-size: 1rem; color: #666; margin-top: 0;">By ${author} • ${date}</p>
        </div>
        
        <div class="window-box" style="background: var(--nav-color); max-width: 650px; width: 100%; box-sizing: border-box;">
            <h3 style="margin-top: 0; font-size: 1.1rem;">Smart Converter</h3>
            <div style="display: flex; gap: 10px; align-items: center;">
                <input type="number" step="any" id="conv-amount" oninput="calculateConversion()" placeholder="Qty" style="flex: 1; margin: 0; min-width: 60px;">
                <select id="conv-from" onchange="updateConverter()">
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
                <select id="conv-to" onchange="calculateConversion()"></select>
            </div>
            <div id="conv-result" style="margin-top: 10px; font-weight: bold; font-size: 1.2rem; min-height: 25px; color: #333;"></div>
        </div>

        <div class="farmhouse-scroll">
            <h2>Ingredients</h2>
            ${ingredientsHTML}
            
            <h2 style="margin-top: 30px;">Instructions</h2>
            <div style="white-space: pre-wrap;">${data.recipe}</div>
        </div>
        
        <div class="window-box" style="display: flex; gap: 10px; margin-top: 10px; margin-bottom: 30px; flex-wrap: wrap; width: 100%; max-width: 650px; background: transparent; border: none; box-shadow: none; padding: 0;">
            <button onclick="likeMeal(${data.id}, this)">❤️ Like (<span class="like-count">${data.likes || 0}</span>)</button>
            <button onclick="copyToClipboard('${currentUrl}')">🔗 Copy Link</button>
            <button onclick="window.open('https://wa.me/?text=${whatsappText}', '_blank')">📱 WhatsApp</button>
            <button onclick="reportRecipe('${data.title.replace(/'/g, "\\'")}', ${data.id})">⚠️ Report Recipe</button>
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
        <button onclick="renderSubcategoryList('${parentCategory}', 'add')" style="margin-bottom: 15px;">← Back</button>
        <div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px;">
            <h1 style="margin-top: 0; margin-bottom: 0; font-size: 1.8rem;">Adding to: ${subcategory}</h1>
        </div>
        <div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box;">
            <input type="text" id="recipe-name" placeholder="Recipe Title">
            <input type="text" id="author-name" placeholder="Your Name (Optional)">
            <div id="ingredients-container" style="width: 100%; max-width: 450px; background: #f0f0f0; border: 2px solid var(--border); padding: 15px; margin-bottom: 15px; box-sizing: border-box;">
                <h3 style="margin-top: 0;">Ingredients</h3>
                <div id="ingredients-list"></div>
                <button onclick="addIngredientRow()">+ Add Another Ingredient</button>
            </div>
            <textarea id="recipe-instructions" rows="8" placeholder="Instructions..."></textarea>
            <br>
            <button onclick="saveRecipe()">Post Recipe Live</button>
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
        <input type="text" class="ing-name" placeholder="Item (e.g. Flour)" style="flex: 2;">
        <input type="number" step="any" class="ing-qty" placeholder="Qty" style="flex: 1;">
        <select class="ing-unit" style="flex: 1;">
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
        <button onclick="this.parentElement.remove()">X</button>
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
