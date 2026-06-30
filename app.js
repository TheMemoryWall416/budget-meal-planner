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
let currentUser = null; 
let isLoginMode = false; 
let isAdmin = false;

async function initAuth() {
    const { data: { session } } = await myDatabase.auth.getSession();
    currentUser = session ? session.user : null;
    if (currentUser) {
        await checkAdminStatus(currentUser.email);
    } else {
        updateAuthUI();
    }
}

async function checkAdminStatus(email) {
    const { data, error } = await myDatabase.from('admin_whitelist').select('*').eq('email', email).single();
    isAdmin = !!data; 
    updateAuthUI();
}

async function updateAuthUI() {
    const authBtn = document.getElementById('nav-auth-btn');
    const existingAdminBtn = document.getElementById('nav-admin-btn');
    if (existingAdminBtn) existingAdminBtn.remove();

    if (authBtn) {
        authBtn.style.background = ''; 
        if (currentUser) {
            authBtn.innerHTML = '👤 My Profile';
            authBtn.onclick = () => showPage('profile');
            await checkUnreadMessages();

            if (isAdmin) {
                const adminBtn = document.createElement('button');
                adminBtn.id = 'nav-admin-btn';
                adminBtn.onclick = () => showPage('admin');
                adminBtn.style.cssText = 'margin-top: 8px; display: block; width: 100%; box-sizing: border-box;';
                adminBtn.innerHTML = '⚙️ Command Center';
                authBtn.parentNode.insertBefore(adminBtn, authBtn.nextSibling);
            }
        } else {
            authBtn.innerHTML = '🚪 Join / Sign In';
            authBtn.onclick = openAuthModal;
        }
    }
}

async function checkUnreadMessages() {
    if (!currentUser) return; 
    const { count, error } = await myDatabase.from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_email', currentUser.email)
        .eq('is_read', false);
    
    const authBtn = document.getElementById('nav-auth-btn');
    if (authBtn && count > 0) {
        authBtn.innerHTML = `👤 My Profile (${count} New)`;
    }
}

function openAuthModal() { document.getElementById('auth-modal').style.display = 'flex'; }
function closeAuthModal() { document.getElementById('auth-modal').style.display = 'none'; }

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
            await checkAdminStatus(currentUser.email);
            closeAuthModal();
            alert(isLoginMode ? "Welcome back to the kitchen!" : "Account created successfully! Welcome to the community.");
        }
    }
}

async function handleForgotPassword() {
    const email = document.getElementById('auth-email').value.trim();
    if (!email) return alert("Please type your email address into the box first, then click 'Forgot Password?'.");

    const { error } = await myDatabase.auth.resetPasswordForEmail(email);
    if (error) alert("Error: " + error.message);
    else { alert("Password reset email sent! Please check your inbox."); closeAuthModal(); }
}

async function logoutUser() {
    await myDatabase.auth.signOut();
    currentUser = null; 
    isAdmin = false;
    updateAuthUI(); 
    showPage('home');
}

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
    if (params.get('recipe')) { viewRecipe(params.get('recipe')); } 
    else if (params.get('budget')) { viewBudgetMeal(params.get('budget')); } 
    else { showPage('home'); }
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
        if (params.get('recipe')) { viewRecipe(params.get('recipe')); } 
        else if (params.get('budget')) { viewBudgetMeal(params.get('budget')); } 
        else { showPage('home'); }
    } else {
        const modal = document.getElementById('country-modal');
        if (modal) modal.style.display = 'flex';
    }
};

function showPage(page) {
    const view = document.getElementById('main-view');
    window.history.pushState({}, document.title, window.location.pathname);

    if (page === 'home') {
        view.innerHTML = `
            <div class="window-box" style="text-align: center; max-width: 800px; width: 100%; box-sizing: border-box; background: var(--nav-color); padding: 30px 10px; border-width: 4px;">
            <h1 style="margin: 0; line-height: 1.1; font-family: sans-serif;">
                <span style="font-size: 1.0rem; display: block; margin-bottom: 5px; color: var(--text);">WELCOME TO</span>
                
                <a href="/" style="color: #000000; text-decoration: none; display: inline-block;">
                    <span style="display: block; font-weight: 900; font-size: clamp(1.3rem, 3.5vw, 2.4rem); letter-spacing: -0.5px;">
                        budgetmealplanner
                    </span>
                    <span style="display: block; font-weight: 700; font-size: clamp(1.0rem, 2.5vw, 1.6rem); letter-spacing: 1px; margin-top: -2px;">
                        .co.za
                    </span>
                </a>
            </h1>
        </div>

        <div class="window-box" style="max-width: 800px; width: 100%; box-sizing: border-box;">
            <div style="display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap;">
                <img id="home-team-photo" src="${teamPhotoUrl}" style="width: 200px; height: 200px; border-radius: 50%; border: 4px solid var(--border); object-fit: cover;">
                <div style="flex: 1; min-width: 300px;">
                    <h2 style="font-size: 1.5rem; margin-top: 0; margin-bottom: 15px;">About Us</h2>
                    <h3 style="font-size: 1.2rem; margin-top: 0; margin-bottom: 5px;">Meet the Team</h3>
                    <p style="line-height: 1.6; margin-top: 0;">Hi! We're Anton and Jenny from South Africa, and we're the team behind this platform.</p>
                    
                    <h3 style="font-size: 1.2rem; margin-top: 20px; margin-bottom: 5px;">Who We Are</h3>
                    <p style="line-height: 1.6; margin-top: 0;">This website is my very first live project. I'm a self-taught developer who wanted to build something genuinely useful for everyday people. Jenny balances her full-time job as an online teacher while also serving as our lead administrator, manually reviewing community recipes and comments to help keep the platform friendly, helpful, and welcoming.</p>

                    <h3 style="font-size: 1.2rem; margin-top: 20px; margin-bottom: 5px;">Why We Built This</h3>
                    <p style="line-height: 1.6; margin-top: 0;">We created this platform because we couldn't find a recipe website that truly focused on affordable, realistic meals while allowing the community to actively participate. Too many recipe sites are filled with clickbait, AI-generated content, endless ads, or recipes that require expensive or difficult-to-find ingredients.</p>
                    <p style="line-height: 1.6;">As a family living on a budget ourselves, we wanted to create one central place where people from all over the world can discover, share, and discuss recipes and budget-friendly meals.</p>
                    <p style="line-height: 1.6;">We believe good food shouldn't be expensive, and great recipes should be shared — not hidden behind paywalls, flooded with advertisements, or buried beneath endless clickbait.</p>

                    <h3 style="font-size: 1.2rem; margin-top: 20px; margin-bottom: 5px;">Our Approach</h3>
                    <p style="line-height: 1.6; margin-top: 0;">Our goal has always been to build a platform that puts people first. While technology helps us run the website, we believe the heart of this community should always be real people sharing real recipes, honest experiences, and practical advice.</p>

                    <h3 style="font-size: 1.2rem; margin-top: 20px; margin-bottom: 5px;">Keeping It Free</h3>
                    <p style="line-height: 1.6; margin-top: 0;">The platform is completely free to use. To help cover the running costs, we've included a small number of carefully placed advertisements. We've worked hard to make sure they're as unobtrusive as possible and don't get in the way of your experience.</p>
                    <p style="line-height: 1.6;">As the platform continues to grow, our goal is to improve this even further — whether that means reducing or removing ads in the future, or making sure any advertisements that remain are more relevant, valuable, and genuinely useful to our community.</p>
                    <p style="line-height: 1.6;">We believe that if ads are part of the platform, they should add value rather than simply take up space.</p>

                    <h3 style="font-size: 1.2rem; margin-top: 20px; margin-bottom: 5px;">Join the Community</h3>
                    <p style="line-height: 1.6; margin-top: 0;">You do not need an account to use this platform. You can browse recipes, discover budget-friendly meals, share recipes, read comments, and explore the community completely free.</p>
                    <p style="line-height: 1.6;">Creating a free account simply allows you to become a more active part of the community. Members can join discussions, leave comments, save favourite recipes, keep track of their contributions, and help shape the platform through their ideas and feedback.</p>
                    <p style="line-height: 1.6;">We only ask for your email address as your login ID, and you choose your own password.</p>
                    <p style="line-height: 1.6;">Creating an account does not mean you will receive unwanted emails, and we will never sell or share your email address.</p>
                    <p style="line-height: 1.6;">The only emails you may receive from us are:</p>
                    <ul style="line-height: 1.6; margin-top: 0; padding-left: 20px;">
                        <li>Replies or feedback related to something you have contacted us about, such as a suggestion, question, or report.</li>
                        <li>Newsletter emails, but only if you specifically choose to sign up for our newsletter.</li>
                    </ul>
                    <p style="line-height: 1.6;">We believe your inbox belongs to you. We don't want to send emails to people who don't want them, which is why newsletters are only sent to people who actively choose to receive them.</p>

                    <h3 style="font-size: 1.2rem; margin-top: 20px; margin-bottom: 5px;">Helping Us Improve</h3>
                    <p style="line-height: 1.6; margin-top: 0;">Because there are only two of us running the platform, there may occasionally be something we miss. If you notice anything unusual, inappropriate, or simply not working as it should, please use the Report button or contact us directly.</p>
                    <p style="line-height: 1.6;">Every report, suggestion, recipe, and comment helps make the platform better, and we'll always do our best to respond as quickly as we can.</p>

                    <h3 style="font-size: 1.2rem; margin-top: 20px; margin-bottom: 5px;">The Journey Ahead</h3>
                    <p style="line-height: 1.6; margin-top: 0;">We're only just getting started. We have lots of ideas and exciting features planned for the future, and many of them will come directly from suggestions made by our community.</p>
                    <p style="line-height: 1.6;">We'll always listen, keep improving, and build this platform together with the people who use it.</p>
                    <p style="line-height: 1.6;">Thank you so much for visiting our website. We truly hope it's been useful, exceeded your expectations, and maybe even helped you discover your next favourite meal.</p>
                    <p style="line-height: 1.6;">Our mission is simple: to build one of the friendliest, most useful, and completely free recipe communities on the internet — one recipe at a time.</p>
                    
                    <p style="line-height: 1.6; font-style: italic;">One last thing... if something breaks, don't worry — Anton was probably just "optimising" his code. Jenny will gently remind him that it was working perfectly before he started "improving" it.</p>
                    
                    <p style="line-height: 1.6;">We look forward to seeing the recipes, ideas, and conversations that this community will create.</p>
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
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">
                    <button onclick="toggleCookbook()" style="background: var(--btn-grey);">📖 My Cookbook</button>
                    <button onclick="logoutUser()">🚪 Sign Out</button>
                </div>
            </div>

            <div id="profile-inbox-section" class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box;">
                <h2 style="margin-top:0; border-bottom: 2px solid var(--border); padding-bottom: 10px;">Private Inbox</h2>
                <p style="font-size: 0.9rem; color: #555; margin-top: 0;">Have a suggestion, question, or issue? Chat directly with Anton & Jenny here.</p>
                <div id="member-messages" style="max-height: 400px; overflow-y: auto; margin-bottom: 15px; padding: 15px; border: 2px solid var(--border); background: #fdf6e3;">Loading messages...</div>
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="new-message-text" placeholder="Type your message..." style="flex: 1; margin: 0;">
                    <button onclick="sendMessageToAdmin()" style="margin: 0;">Send</button>
                </div>
            </div>

            <div id="profile-cookbook-section" class="window-box" style="display: none; width: 100%; max-width: 600px; box-sizing: border-box;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border); padding-bottom: 10px; margin-bottom: 15px;">
                    <h2 style="margin:0;">My Saved Recipes</h2>
                    <button onclick="toggleCookbook()" style="margin:0; padding: 5px 10px; font-size: 0.8rem;">Back to Inbox</button>
                </div>
                <div id="cookbook-list">Loading favorites...</div>
            </div>
        `;
        loadMemberMessages(); 
    } else if (page === 'admin') {
        if (!isAdmin) { showPage('home'); return; }
        
        view.innerHTML = `
            <style>
                .admin-card { border: 2px solid var(--border); padding: 20px; margin-bottom: 15px; background: #ffffff; display: flex; justify-content: space-between; align-items: center; }
                .admin-card-content { flex-grow: 1; }
                .admin-card-actions { display: flex; gap: 10px; margin-left: 15px; flex-wrap: wrap; justify-content: flex-end;}
                .admin-badge { padding: 4px 8px; font-size: 0.75rem; font-weight: bold; border: 2px solid var(--border); margin-left: 10px; background: #fff; display: inline-block; margin-bottom: 5px;}
                .badge-special { background: #fff3cd; }
                .badge-plan { background: #cce5ff; }
                .badge-pet { background: #e2d9f3; }
                .badge-pending { background: #ffeeba; }
                .badge-approved { background: #d4edda; }
                .search-box { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; background: #ffffff; padding: 20px; border: 2px solid var(--border); }
            </style>
            
            <div class="window-box" style="width: 100%; max-width: 1000px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h1 style="margin: 0; font-size: 1.8rem;">Command Center</h1>
                    <p style="margin: 0; font-size: 1rem; color: #555;">Authorized personnel only.</p>
                </div>
            </div>
            
            <div class="window-box" style="width: 100%; max-width: 1000px; box-sizing: border-box; display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; padding: 10px;">
                <button id="tab-inbox" onclick="switchAdminTab('inbox')" style="margin:0;">📥 Inbox & Reports</button>
                <button id="tab-review" onclick="switchAdminTab('review')" style="margin:0;">⏳ New Recipe Queue</button>
                <button id="tab-photo" onclick="switchAdminTab('photo')" style="margin:0;">📸 Photo Moderation</button>
                <button id="tab-library" onclick="switchAdminTab('library')" style="margin:0;">📚 Manage Library</button>
                <button id="tab-settings" onclick="switchAdminTab('settings')" style="margin:0;">⚙️ Site Settings</button>
            </div>
            
            <div id="admin-content-area" style="width: 100%; max-width: 1000px;"></div>
        `;
        switchAdminTab('inbox');
        
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

async function loadMemberMessages() {
    if (!currentUser) return; 
    const container = document.getElementById('member-messages');
    
    await myDatabase.from('messages')
        .update({ is_read: true })
        .eq('recipient_email', currentUser.email)
        .eq('is_read', false);
    
    const authBtn = document.getElementById('nav-auth-btn');
    if (authBtn) authBtn.innerHTML = '👤 My Profile';

    const { data, error } = await myDatabase.from('messages')
        .select('*')
        .or(`email.eq.${currentUser.email},recipient_email.eq.${currentUser.email}`)
        .order('created_at', { ascending: true }); 

    if (error) { container.innerHTML = 'Error loading messages.'; return; }
    if (data.length === 0) { container.innerHTML = '<p style="color: #666; text-align: center; margin-top: 20px;">No messages yet. Send us a message below!</p>'; return; }

    let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';
    
    data.forEach(msg => {
        const isMine = msg.email === currentUser.email;
        const bg = isMine ? '#ffffff' : 'var(--nav-color)';
        const align = isMine ? 'align-self: flex-end; text-align: right;' : 'align-self: flex-start; text-align: left;';
        const sender = isMine ? 'You' : 'Anton & Jenny';
        
        html += `
            <div style="background: ${bg}; border: 2px solid var(--border); padding: 10px; border-radius: 4px; max-width: 80%; ${align}">
                <div style="font-size: 0.75rem; font-weight: bold; margin-bottom: 5px; color: #333;">${sender} - ${new Date(msg.created_at).toLocaleString()}</div>
                <div style="font-size: 0.95rem; white-space: pre-wrap;">${msg.message}</div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight; 
}

async function sendMessageToAdmin() {
    const input = document.getElementById('new-message-text');
    const text = input.value.trim();
    if (!text || !currentUser) return;
    
    input.disabled = true; 
    
    const { error } = await myDatabase.from('messages').insert([{
        name: 'Member Message',
        email: currentUser.email,
        recipient_email: 'admin',
        message: text,
        is_read: false
    }]);
    
    input.disabled = false; 
    
    if (error) alert("Error: " + error.message);
    else {
        input.value = ''; 
        loadMemberMessages();
    }
}

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
        html += `<div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box;"><p>No recipes found matching "${term}". Try a different ingredient or meal name.</p></div>`;
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
        html += `<div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box;"><p>No active specials posted for ${selectedCountry}. Be the first to share a deal!</p></div>`;
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
        html += `<div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box;"><p>No budget meals posted for ${selectedCountry} under this filter.</p></div>`;
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

async function viewBudgetMeal(id) {
    const view = document.getElementById('main-view');
    view.innerHTML = `<div class="window-box"><h1>Loading...</h1></div>`;

    const { data, error } = await myDatabase.from('meals').select('*').eq('id', id).single();
    if (error) return;

    let ingredientsHTML = `<ul style="margin: 0; padding-left: 20px;">`;
    if (data.ingredients && Array.isArray(data.ingredients)) {
        data.ingredients.forEach(ing => {
            let qty = ing.qty ? ing.qty : '';
            let unit = ing.unit ? ing.unit : '';
            ingredientsHTML += `<li style="margin-bottom: 8px;"><strong>${qty} ${unit}</strong> ${ing.item}</li>`;
        });
    }
    ingredientsHTML += `</ul>`;

    let contentHTML = "";
    if (data.meal_type === 'home') {
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

    let commentFormHTML = '';
    if (currentUser) {
        commentFormHTML = `
            <div style="margin-bottom: 20px;">
                <textarea id="new-comment-text" rows="3" placeholder="Share your thoughts or variations..." style="width: 100%; box-sizing: border-box; margin-bottom: 10px;"></textarea>
                <button onclick="postComment(${data.id})" style="background: var(--btn-grey);">Post Comment</button>
            </div>
        `;
    } else {
        commentFormHTML = `
            <div style="background: #f0f0f0; border: 2px dashed var(--border); padding: 15px; text-align: center; margin-bottom: 20px;">
                <p style="margin-top: 0; font-weight: bold;">Want to join the conversation?</p>
                <button onclick="openAuthModal()" style="margin: 0;">Login or Sign Up to Comment</button>
            </div>
        `;
    }

    const commentsSectionHTML = `
        <div class="window-box" style="width: 100%; max-width: 650px; box-sizing: border-box; margin-top: 10px; margin-bottom: 30px;">
            <h2 style="margin-top: 0; font-size: 1.5rem; border-bottom: 2px solid var(--border); padding-bottom: 10px;">Community Comments</h2>
            ${commentFormHTML}
            <div id="recipe-comments-list">Loading comments...</div>
        </div>
    `;

    // THE VISUAL ENGINE INJECTION: Display live photo, pending banner, or the "Add Photo" placeholder.
    let imageHTML = '';
    if (data.image_url) {
        imageHTML = `<img src="${data.image_url}" style="width: 100%; height: 350px; object-fit: cover; border: 2px solid var(--border); margin-bottom: 20px; display: block;">`;
    } else if (data.pending_image_url) {
        imageHTML = `<div style="width: 100%; padding: 20px; box-sizing: border-box; background: #fff3cd; border: 2px solid var(--border); text-align: center; margin-bottom: 20px;">📸 A photo has been submitted and is waiting for Anton & Jenny to approve it!</div>`;
    } else {
        imageHTML = `
        <div style="width: 100%; height: 250px; background: #fdf6e3; border: 2px dashed var(--border); display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 20px; cursor: pointer; box-sizing: border-box; transition: background 0.2s;" onclick="triggerPhotoUpload(${data.id})" onmouseover="this.style.background='#f4ecd8'" onmouseout="this.style.background='#fdf6e3'">
            <span style="font-size: 2.5rem; margin-bottom: 10px;">📸</span>
            <strong style="color: #333; font-size: 1.1rem;">Made this? Add a photo!</strong>
            <span style="font-size: 0.9rem; color: #666; margin-top: 5px;">(Click to upload)</span>
            <input type="file" id="recipe-photo-upload-${data.id}" accept="image/*" style="display: none;" onchange="submitPendingPhoto(${data.id}, event)">
        </div>`;
    }

    view.innerHTML = `
        <button onclick="showPage('find-budget-meals')" style="margin-bottom: 15px;">← Back</button>
        <div class="window-box" style="width: 100%; max-width: 650px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px;">
            <h1 style="font-size: 2rem; margin-top: 0; margin-bottom: 5px;">${data.title}</h1>
            <div style="font-size: 1.2rem; padding: 10px; background: #e0e0e0; border: 2px solid var(--border); display: inline-block;">
                <strong>${currencyMap[selectedCountry]}${costPer}</strong> per person (Feeds ${data.servings} for ${currencyMap[selectedCountry]}${data.cost})
            </div>
        </div>
        
        <div style="width: 100%; max-width: 650px; box-sizing: border-box;">
            ${imageHTML}
        </div>
        
        ${contentHTML}
        
        <div class="window-box" style="display: flex; gap: 10px; margin-top: 10px; margin-bottom: 10px; flex-wrap: wrap; width: 100%; max-width: 650px; background: transparent; border: none; box-shadow: none; padding: 0;">
            <button onclick="likeMeal(${data.id}, this)">❤️ Like (<span class="like-count">${data.likes || 0}</span>)</button>
            <button id="fav-btn-${data.id}" onclick="toggleFavorite(${data.id})">⭐ Save to Favorites</button>
            <button onclick="copyToClipboard('${currentUrl}')">🔗 Copy Link</button>
            <button onclick="window.open('https://wa.me/?text=${whatsappText}', '_blank')">📱 WhatsApp</button>
            <button onclick="reportRecipe('${data.title.replace(/'/g, "\\'")}', ${data.id})">⚠️ Report Recipe</button>
        </div>

        ${commentsSectionHTML}
    `;

    loadComments(data.id);
    checkFavoriteStatus(data.id);
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

async function reportRecipe(title, id) {
    const reason = prompt("Why are you reporting this?");
    if (!reason) return; 

    const reporterEmail = currentUser ? currentUser.email : 'Guest';

    const { error } = await myDatabase.from('messages').insert([{ 
        name: "REPORTED: " + title, 
        email: reporterEmail + " (System ID: " + id + ")", 
        recipient_email: 'admin',
        message: "REASON: " + reason,
        is_read: false
    }]);
    if (error) alert("Error sending report: " + error.message);
    else alert("Report submitted successfully. Thank you!");
}

async function loadComments(recipeId) {
    const list = document.getElementById('recipe-comments-list');
    if (!list) return;

    const { data, error } = await myDatabase.from('comments')
        .select('*')
        .eq('recipe_id', recipeId)
        .order('likes', { ascending: false })
        .order('created_at', { ascending: true });

    if (error) { list.innerHTML = `<p>Error loading comments.</p>`; return; }

    if (data.length === 0) {
        list.innerHTML = `<p style="color: #666; font-style: italic; text-align: center; margin-top: 10px;">Be the first to share your thoughts or variations on this recipe!</p>`;
        return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 15px;">';
    data.forEach(comment => {
        const dateStr = new Date(comment.created_at).toLocaleDateString();
        const safeText = comment.comment_text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        html += `
            <div style="background: #fff; border: 1px solid var(--border); padding: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: bold; font-size: 0.9rem;">${comment.email.split('@')[0]}</span>
                    <span style="font-size: 0.8rem; color: #666;">${dateStr}</span>
                </div>
                <p style="margin: 0 0 10px 0; white-space: pre-wrap; font-size: 0.95rem;">${comment.comment_text}</p>
                <div style="display: flex; gap: 10px;">
                    <button onclick="likeComment(${comment.id}, this)" style="padding: 4px 8px; font-size: 0.8rem; background: #f9f9f9;">👍 Like (<span class="comment-like-count">${comment.likes || 0}</span>)</button>
                    <button onclick="reportComment(${comment.id}, '${safeText}')" style="padding: 4px 8px; font-size: 0.8rem; background: #fff3cd;">⚠️ Report</button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    list.innerHTML = html;
}

async function postComment(recipeId) {
    if (!currentUser) return alert("Please log in to comment.");
    const input = document.getElementById('new-comment-text');
    const text = input.value.trim();
    
    if (!text) return;
    if (text.length > 500) return alert("Comments must be under 500 characters.");

    input.disabled = true; 

    const { error } = await myDatabase.from('comments').insert([{
        recipe_id: recipeId,
        email: currentUser.email,
        comment_text: text
    }]);

    input.disabled = false;

    if (error) alert("Error posting comment: " + error.message);
    else {
        input.value = '';
        loadComments(recipeId); 
    }
}

async function likeComment(commentId, btnElement) {
    const countSpan = btnElement.querySelector('.comment-like-count');
    let currentLikes = parseInt(countSpan.innerText) || 0;
    currentLikes++;
    countSpan.innerText = currentLikes;
    
    btnElement.disabled = true; 
    btnElement.style.opacity = '0.6';
    btnElement.innerHTML = `👍 Liked (${currentLikes})`;

    const { data } = await myDatabase.from('comments').select('likes').eq('id', commentId).single();
    const dbLikes = (data && data.likes ? data.likes : 0) + 1;
    await myDatabase.from('comments').update({ likes: dbLikes }).eq('id', commentId);
}

async function reportComment(commentId, commentText) {
    const reason = prompt("Why are you reporting this comment?");
    if (!reason) return;

    const reporterEmail = currentUser ? currentUser.email : 'Guest';
    const shortText = commentText.length > 30 ? commentText.substring(0, 30) + '...' : commentText;

    const { error } = await myDatabase.from('messages').insert([{ 
        name: "🚩 REPORTED COMMENT: " + shortText, 
        email: reporterEmail + " (Comment ID: " + commentId + ")", 
        recipient_email: 'admin',
        message: "REASON: " + reason + "\n\nFULL COMMENT:\n" + commentText,
        is_read: false
    }]);
    
    if (error) alert("Error sending report: " + error.message);
    else alert("Comment reported successfully. Thank you for keeping the community safe!");
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
        html += `<div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box;"><p>No recipes found in this category yet.</p><button onclick="showForm('${subcategory}', '${parentCategory}')" style="margin-top: 10px;">Be the first to share one!</button></div>`;
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

// User-Facing Photo Upload Logic
function triggerPhotoUpload(recipeId) {
    if (!currentUser) { 
        alert("Please log in or sign up to share a photo of your meal!"); 
        openAuthModal(); 
        return; 
    }
    document.getElementById(`recipe-photo-upload-${recipeId}`).click();
}

async function submitPendingPhoto(recipeId, event) {
    const file = event.target.files[0];
    if (!file) return;
    
    alert("Uploading photo... please wait.");
    
    const name = `recipe-${recipeId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const { error: err1 } = await myDatabase.storage.from('recipe_images').upload(name, file);
    if (err1) return alert("Upload Failed: " + err1.message);
    
    const url = myDatabase.storage.from('recipe_images').getPublicUrl(name).data.publicUrl;
    
    const { error: err2 } = await myDatabase.from('meals').update({ pending_image_url: url }).eq('id', recipeId);
    if (err2) return alert("Database Update Failed: " + err2.message);
    
    alert("Photo submitted! Anton and Jenny will review it shortly.");
    
    if (window.location.search.includes('budget')) viewBudgetMeal(recipeId);
    else viewRecipe(recipeId);
}

// [ATOMIC]: Added a unified upload interceptor to ensure mobile/desktop consistency.
function triggerPhotoUpload(recipeId) {
    if (!currentUser) { 
        alert("Please log in or sign up to share a photo of your meal!"); 
        openAuthModal(); 
        return; 
    }
    document.getElementById(`recipe-photo-upload-${recipeId}`).click();
}
