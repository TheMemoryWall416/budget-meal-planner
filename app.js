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
let userRole = 'user'; 

// ==========================================
//        THE SWR CACHE ENGINE
// ==========================================
async function fetchWithSWR(cacheKey, dbQueryFunction, renderFunction) {
    const cachedDataString = localStorage.getItem(cacheKey);
    let hasRenderedCache = false;

    if (cachedDataString) {
        try {
            const cachedData = JSON.parse(cachedDataString);
            renderFunction(cachedData);
            hasRenderedCache = true;
        } catch (e) {
            console.error("Cache parsing error:", e);
        }
    }

    try {
        const freshData = await dbQueryFunction();
        if (freshData) {
            const freshDataString = JSON.stringify(freshData);
            if (freshDataString !== cachedDataString || !hasRenderedCache) {
                localStorage.setItem(cacheKey, freshDataString);
                renderFunction(freshData);
            }
        }
    } catch (e) {
        console.error("Fresh fetch error:", e);
    }
}

// ==========================================
//        SECURITY & UTILITIES
// ==========================================
async function logAction(actionType, targetInfo, contextMsg) {
    if (!currentUser) return;
    await myDatabase.from('audit_logs').insert([{
        actor_email: currentUser.email,
        action_type: actionType,
        target_info: targetInfo,
        context: contextMsg
    }]);
}

async function isUserBanned() {
    if (!currentUser) return false;
    const { data } = await myDatabase.from('banned_users').select('id').eq('user_id', currentUser.id).single();
    if (data) {
        alert("Your account is currently restricted from posting. Please check your Private Inbox on your profile for details.");
        return true;
    }
    return false;
}

function getUserDisplayName() {
    if (!currentUser) return "Guest";
    const rawName = currentUser.user_metadata?.nickname || currentUser.email.split('@')[0];
    
    let roleTag = "(Member)";
    if (userRole === 'developer') roleTag = "(Founder)";
    else if (userRole === 'admin') roleTag = "(Admin)";
    else if (userRole === 'moderator') roleTag = "(Moderator)";
    
    return `${rawName} ${roleTag}`;
}

async function adminDeleteContent(table, id, btnElement) {
    if (!confirm("ADMIN ACTION: Permanently delete this content?")) return;
    await logAction(`DELETE_${table.toUpperCase()}`, `ID: ${id}`, "Deleted via frontend quick-button.");
    const { error } = await myDatabase.from(table).delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else {
        if (btnElement) {
            const box = btnElement.closest('.window-box');
            if (box) box.remove();
            else btnElement.parentElement.remove();
        }
    }
}

function triggerPhotoUpload(recipeId) {
    if (!currentUser) { 
        alert("Please log in or sign up to share a photo of your meal!"); 
        openAuthModal(); 
        return; 
    }
    document.getElementById(`recipe-photo-upload-${recipeId}`).click();
}

async function initAuth() {
    const { data: { session } } = await myDatabase.auth.getSession();
    currentUser = session ? session.user : null;
    if (currentUser) {
        await checkAdminStatus(currentUser.email);
        
        // Silently update user active status once per day per device
        const lastActiveKey = `last_active_${currentUser.id}`;
        const todayStr = new Date().toDateString();
        if (localStorage.getItem(lastActiveKey) !== todayStr) {
            myDatabase.rpc('update_user_active_status', { user_uuid: currentUser.id }).then();
            localStorage.setItem(lastActiveKey, todayStr);
        }
    } else {
        updateAuthUI();
    }
}

async function checkAdminStatus(email) {
    const { data } = await myDatabase.from('admin_whitelist').select('*').eq('email', email).single();
    if (data) {
        isAdmin = true;
        userRole = data.role || 'admin';
    } else {
        isAdmin = false;
        userRole = 'user';
    }
    updateAuthUI();
}

async function updateAuthUI() {
    const authBtn = document.getElementById('nav-auth-btn');
    const existingAdminBtn = document.getElementById('nav-admin-btn');
    if (existingAdminBtn) existingAdminBtn.remove();

    if (authBtn) {
        if (currentUser) {
            authBtn.innerHTML = '👤 My Profile';
            authBtn.onclick = () => showPage('profile');
            authBtn.style.marginBottom = '20px'; 
            await checkUnreadMessages();
        } else {
            authBtn.innerHTML = '🚪 Join / Sign In';
            authBtn.onclick = openAuthModal;
            authBtn.style.marginBottom = '20px';
        }
    }
}

async function checkUnreadMessages() {
    if (!currentUser) return; 
    const { count } = await myDatabase.from('messages').select('*', { count: 'exact', head: true }).eq('recipient_email', currentUser.email).eq('is_read', false);
    const authBtn = document.getElementById('nav-auth-btn');
    if (authBtn && count > 0) { authBtn.innerHTML = `👤 My Profile (${count})`; }
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
    const nicknameContainer = document.getElementById('nickname-container');

    if (isLoginMode) {
        title.innerText = 'Welcome Back';
        desc.innerText = 'Sign in to access your saved recipes and community features.';
        btn.innerText = 'Sign In';
        toggleText.innerText = 'Need an account?';
        toggleLink.innerText = 'Join for Free';
        if(nicknameContainer) nicknameContainer.style.display = 'none';
    } else {
        title.innerText = 'Join the Community';
        desc.innerText = 'Create a free member account to save recipes, participate in community discussions, and track your kitchen contributions!';
        btn.innerText = 'Join for Free';
        toggleText.innerText = 'Already a member?';
        toggleLink.innerText = 'Sign In';
        if(nicknameContainer) nicknameContainer.style.display = 'block';
    }
}

async function handleAuthSubmit() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const nicknameInput = document.getElementById('auth-nickname');
    const nickname = nicknameInput ? nicknameInput.value.trim() : '';
    
    if (!email || !password) return alert("Please enter both email and password.");
    if (password.length < 6) return alert("Password must be at least 6 characters.");
    if (!isLoginMode && !nickname) return alert("Please choose a public nickname.");

    const btn = document.getElementById('auth-primary-btn');
    const originalText = btn.innerText;
    btn.innerText = 'Processing...';
    btn.disabled = true;

    let error, data;

    if (isLoginMode) {
        const res = await myDatabase.auth.signInWithPassword({ email, password });
        error = res.error; data = res.data;
    } else {
        const res = await myDatabase.auth.signUp({ email, password, options: { data: { nickname: nickname } } });
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
    userRole = 'user';
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
    const { count: liveCount } = await myDatabase.from('meals').select('*', { count: 'exact', head: true }).eq('status', 'approved');
    if (liveCount !== null) totalApprovedRecipes = liveCount;

    const { data: vData } = await myDatabase.from('site_stats').select('visitor_count').eq('id', 1).single();
    if (vData) totalVisitors = vData.visitor_count;

    let totalShared = 0; let totalLikes = 0;
    const { data: interactionStats } = await myDatabase.rpc('get_kitchen_stats');
    if (interactionStats) { totalShared = interactionStats.total_shared; totalLikes = interactionStats.total_likes; }

    const { data: configData } = await myDatabase.from('site_config').select('team_photo_url, main_background_url').eq('id', 1).single();
    
    if (configData) {
        if (configData.team_photo_url) {
            teamPhotoUrl = configData.team_photo_url;
            localStorage.setItem('cached_team_photo', teamPhotoUrl); 
            const homePhoto = document.getElementById('home-team-photo');
            if (homePhoto && homePhoto.src !== teamPhotoUrl) homePhoto.src = teamPhotoUrl;
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
            <div style="margin-bottom: 12px; text-align: center;">
                <div style="font-size: 1.1rem; font-weight: bold; color: #000;">🌍 ${totalApprovedRecipes}</div>
                <div style="font-size: 0.7rem; font-weight: bold; color: #666; text-transform: uppercase;">Live Recipes</div>
            </div>
            <div style="margin-bottom: 12px; text-align: center;">
                <div style="font-size: 1.1rem; font-weight: bold; color: #000;">📤 ${totalShared}</div>
                <div style="font-size: 0.7rem; font-weight: bold; color: #666; text-transform: uppercase;">Total Shared</div>
            </div>
            <div style="margin-bottom: 12px; text-align: center;">
                <div style="font-size: 1.1rem; font-weight: bold; color: #000;">❤️ ${totalLikes}</div>
                <div style="font-size: 0.7rem; font-weight: bold; color: #666; text-transform: uppercase;">Total Likes</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 1.1rem; font-weight: bold; color: #000;">👀 ${totalVisitors.toLocaleString()}</div>
                <div style="font-size: 0.7rem; font-weight: bold; color: #666; text-transform: uppercase;">Total Visits</div>
            </div>
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
    if (s2 && typeof countries !== 'undefined') { countries.forEach(c => { let o = document.createElement('option'); o.value = c; o.innerHTML = c; s2.appendChild(o); }); }
    
    initAuth();
    handleVisitorSession();
    fetchBudgetTips(); 
    checkNewBroadcasts(); 
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

// ==========================================
//        MASTER ROUTER
// ==========================================
function showPage(page) {
    const restrictedPages = ['add-budget-meal', 'add-special', 'add-meal-plan'];
    if (restrictedPages.includes(page) && !currentUser) {
        alert("Please join or sign in to share with the community!");
        openAuthModal();
        return;
    }

    const view = document.getElementById('main-view');
    window.history.pushState({}, document.title, window.location.pathname);

    if (page === 'home') {
        view.innerHTML = `
            <div class="window-box" style="text-align: center; max-width: 800px; width: 100%; box-sizing: border-box; background: var(--nav-color); padding: 30px 10px; border-width: 4px;">
                <h1 style="margin: 0; line-height: 1.1; font-family: sans-serif;">
                    <span style="font-size: 1.0rem; display: block; margin-bottom: 5px; color: var(--text);">WELCOME TO</span>
                    <a href="/" style="color: #000000; text-decoration: none; display: inline-block;">
                        <span style="display: block; font-weight: 900; font-size: clamp(1.3rem, 3.5vw, 2.4rem); letter-spacing: -0.5px;">budgetmealplanner</span>
                        <span style="display: block; font-weight: 700; font-size: clamp(1.0rem, 2.5vw, 1.6rem); letter-spacing: 1px; margin-top: -2px;">.co.za</span>
                    </a>
                </h1>
            </div>

            <div class="window-box" style="max-width: 800px; width: 100%; box-sizing: border-box;">
                <div style="display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap;">
                    <img id="home-team-photo" src="${teamPhotoUrl}" style="width: 200px; height: 200px; border-radius: 50%; border: 4px solid var(--border); object-fit: cover;">
                    <div style="flex: 1; min-width: 300px;">
                        <h2 style="font-size: 1.5rem; margin-top: 0; margin-bottom: 15px;">About Us</h2>
                        <h3 style="font-size: 1.2rem; margin-top: 0; margin-bottom: 5px;">Meet the Team</h3>
                        <p style="line-height: 1.6; margin-top: 0;">Hi! We're Anton and Jenny from South Africa, and we're the team behind this platform. <a href="javascript:void(0)" onclick="showPage('family')" style="color: #007bff; font-style: italic; font-weight: bold;">click here to meet the family</a></p>
                        
                        <h3 style="font-size: 1.2rem; margin-top: 20px; margin-bottom: 5px;">Who We Are</h3>
                        <p style="line-height: 1.6; margin-top: 0;">This website is my very first live project. I'm a self-taught developer who wanted to build something genuinely useful for everyday people. Jenny balances her full-time job as an online teacher while also serving as our lead administrator, manually reviewing community recipes and comments to help keep the platform friendly, helpful, and welcoming.</p>

                        <h3 style="font-size: 1.2rem; margin-top: 20px; margin-bottom: 5px;">Why We Built This</h3>
                        <p style="line-height: 1.6; margin-top: 0;">We created this platform because we couldn't find a recipe website that truly focused on affordable, realistic meals while allowing the community to actively participate. Too many recipe sites are filled with clickbait, AI-generated content, endless ads, or recipes that require expensive or difficult-to-find ingredients.</p>
                        <p style="line-height: 1.6;">As a family living on a budget ourselves, we wanted to create one central place where people from all over the world can discover, share, and discuss recipes and budget-friendly meals.</p>

                        <h3 style="font-size: 1.2rem; margin-top: 20px; margin-bottom: 5px;">Our Approach</h3>
                        <p style="line-height: 1.6; margin-top: 0;">Our goal has always been to build a platform that puts people first. While technology helps us run the website, we believe the heart of this community should always be real people sharing real recipes, honest experiences, and practical advice.</p>

                        <h3 style="font-size: 1.2rem; margin-top: 20px; margin-bottom: 5px;">Helping Us Improve</h3>
                        <p style="line-height: 1.6; margin-top: 0;">Because there are only two of us running the platform, there may occasionally be something we miss. If you notice anything unusual, inappropriate, or simply not working as it should, please use the Report button or contact us directly.</p>

                        <h3 style="font-size: 1.2rem; margin-top: 20px; margin-bottom: 5px;">The Journey Ahead</h3>
                        <p style="line-height: 1.6; margin-top: 0;">We're only just getting started. We have lots of ideas and exciting features planned for the future, and many of them will come directly from suggestions made by our community.</p>
                        
                        <p style="line-height: 1.6; font-style: italic;">One last thing... if something breaks, don't worry — Anton was probably just "optimising" his code. Jenny will gently remind him that it was working perfectly before he started "improving" it.</p>
                        
                        <p style="line-height: 1.6; font-size: 1.2rem; margin-top: 20px;">Happy cooking,<br><strong>Anton & Jenny</strong></p>
                    </div>
                </div>
            </div>
        `;
    } 
    else if (page === 'profile') {
        renderProfileDashboard(view);
    } 
    else if (page === 'family') {
        if (!currentUser) {
            alert("🏡 The Family Hub is a private sanctuary for our registered members. Please log in or join us for free to enter!");
            openAuthModal();
            return; 
        }
        renderFamilyPage();
    } else if (page === 'shoutbox') {
        renderShoutbox();
    } else if (page === 'broadcasts') {
        renderPublicBroadcasts();
    } else if (page === 'admin') {
        if (!isAdmin) { showPage('home'); return; }
        
        let developerTabs = '';
        let developerWarning = '';
        if (userRole === 'developer') {
            developerTabs = `
                <button id="tab-family" onclick="switchAdminTab('family')" style="flex: 1; min-width: 140px; margin: 0;">🏡 Family Hub</button>
                <button id="tab-broadcasts" onclick="switchAdminTab('broadcasts')" style="flex: 1; min-width: 140px; margin: 0;">📣 Broadcasts</button>
                <button id="tab-settings" onclick="switchAdminTab('settings')" style="flex: 1; min-width: 140px; margin: 0;">⚙️ Site Settings</button>
                <button id="tab-jail" onclick="switchAdminTab('jail')" style="flex: 1; min-width: 140px; margin: 0;">🛑 Holding Cell</button>
                <button id="tab-audit" onclick="switchAdminTab('audit')" style="flex: 1; min-width: 140px; margin: 0;">👁️ Audit Logs</button>
                <button id="tab-users" onclick="switchAdminTab('users')" style="flex: 1; min-width: 140px; margin: 0;">👥 User Directory</button>
            `;
        } else {
            developerWarning = `<div class="window-box" style="margin-bottom: 15px;"><p style="margin:0; font-size: 0.95rem;"><strong>Notice:</strong> You are currently logged in with 'admin' clearance. To see your Developer tabs, change your role to 'developer' in the Supabase admin_whitelist table.</p></div>`;
        }

        view.innerHTML = `
            <div class="window-box" style="width: 100%; max-width: 1000px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 1.8rem;">Command Center</h1>
                <p style="margin: 0; font-size: 1rem; color: #555;">Clearance: <strong>${userRole.toUpperCase()}</strong></p>
            </div>
            
            <div id="admin-pulse-dashboard" style="width: 100%; max-width: 1000px; box-sizing: border-box; margin-bottom: 20px;"></div>
            
            ${developerWarning}

            <div class="window-box" style="width: 100%; max-width: 1000px; box-sizing: border-box; display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; padding: 10px;">
                <button id="tab-inbox" onclick="switchAdminTab('inbox')" style="flex: 1; min-width: 140px; margin: 0;">📥 Inbox & Reports</button>
                <button id="tab-review" onclick="switchAdminTab('review')" style="flex: 1; min-width: 140px; margin: 0;">⏳ New Recipe Queue</button>
                <button id="tab-photo" onclick="switchAdminTab('photo')" style="flex: 1; min-width: 140px; margin: 0;">📸 Photo Moderation</button>
                <button id="tab-library" onclick="switchAdminTab('library')" style="flex: 1; min-width: 140px; margin: 0;">📚 Manage Library</button>
                <button id="tab-campfire" onclick="switchAdminTab('campfire')" style="flex: 1; min-width: 140px; margin: 0;">🔥 Campfire Logs</button>
                ${developerTabs}
            </div>
            
            <div id="admin-content-area" style="width: 100%; max-width: 1000px;"></div>
        `;
        loadAdminPulse();
        switchAdminTab('inbox');
        
    } else if (page === 'find-recipes') {
        renderFindHub();
    } else if (page === 'find-budget-meals') {
        loadBudgetMeals(); 
    } else if (page === 'add-budget-meal') {
        view.innerHTML = `
            <button onclick="showPage('creator-hub')" style="margin-bottom: 15px;">← Back</button>
            <div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; text-align: center;">
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

// ==========================================
//        ADMIN PULSE DASHBOARD (NEW)
// ==========================================
async function loadAdminPulse() {
    const pulseDiv = document.getElementById('admin-pulse-dashboard');
    if (!pulseDiv) return;
    
    pulseDiv.innerHTML = '<div class="window-box"><p style="text-align: center; margin: 0;">Loading live platform metrics...</p></div>';
    
    const { data, error } = await myDatabase.rpc('get_admin_dashboard_stats');
    
    if (error) {
        pulseDiv.innerHTML = `<div class="window-box"><p style="color: red; margin: 0;">Error loading stats: ${error.message}</p></div>`;
        return;
    }

    pulseDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
            <div class="window-box" style="margin: 0; padding: 15px; text-align: center; border-top: 4px solid #007bff;">
                <div style="font-size: 2rem; font-weight: 900;">${data.total_users}</div>
                <div style="font-size: 0.8rem; font-weight: bold; color: #666; text-transform: uppercase;">Total Members</div>
            </div>
            <div class="window-box" style="margin: 0; padding: 15px; text-align: center; border-top: 4px solid #28a745;">
                <div style="font-size: 2rem; font-weight: 900;">${data.new_users_today}</div>
                <div style="font-size: 0.8rem; font-weight: bold; color: #666; text-transform: uppercase;">Sign-Ups Today</div>
            </div>
            <div class="window-box" style="margin: 0; padding: 15px; text-align: center; border-top: 4px solid #17a2b8;">
                <div style="font-size: 2rem; font-weight: 900;">${data.active_users_today}</div>
                <div style="font-size: 0.8rem; font-weight: bold; color: #666; text-transform: uppercase;">Active Today</div>
            </div>
            <div class="window-box" style="margin: 0; padding: 15px; text-align: center; border-top: 4px solid #ffc107;">
                <div style="font-size: 2rem; font-weight: 900;">${data.daily_visits}</div>
                <div style="font-size: 0.8rem; font-weight: bold; color: #666; text-transform: uppercase;">Visits Today</div>
            </div>
            <div class="window-box" style="margin: 0; padding: 15px; text-align: center; border-top: 4px solid #fd7e14;">
                <div style="font-size: 2rem; font-weight: 900;">${data.new_recipes_today}</div>
                <div style="font-size: 0.8rem; font-weight: bold; color: #666; text-transform: uppercase;">Recipes Today</div>
            </div>
            <div class="window-box" style="margin: 0; padding: 15px; text-align: center; border-top: 4px solid #6f42c1;">
                <div style="font-size: 2rem; font-weight: 900;">${data.new_comments_today}</div>
                <div style="font-size: 0.8rem; font-weight: bold; color: #666; text-transform: uppercase;">Comments Today</div>
            </div>
        </div>
    `;
}

// ==========================================
//        PERSONAL DASHBOARD (UPGRADED)
// ==========================================
function renderProfileDashboard(view) {
    const currentName = currentUser?.user_metadata?.nickname || '';
    const currentCountry = localStorage.getItem('saved_country') || selectedCountry;

    let countryOptions = '<option value="">-- Select Country --</option>';
    if (typeof countries !== 'undefined') {
        countries.forEach(c => {
            countryOptions += `<option value="${c}" ${c === currentCountry ? 'selected' : ''}>${c}</option>`;
        });
    }

    let adminTabButton = '';
    if (isAdmin) {
        adminTabButton = `<button onclick="showPage('admin')" style="flex: 1; margin: 0; background: #ffe6e6; border-color: #cc0000; border-bottom: 4px solid #cc0000; color: #cc0000; min-width: 150px;">⚙️ Command Center</button>`;
    }

    view.innerHTML = `
        <div class="window-box" style="width: 100%; max-width: 650px; box-sizing: border-box; background: var(--nav-color); padding: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
            <div style="text-align: left;">
                <h1 style="margin: 0; font-size: 1.8rem; font-weight: 900;">${getUserDisplayName()}</h1>
                <p style="margin: 5px 0 0 0; font-size: 0.95rem; font-weight: bold; color: #333;">${currentUser ? currentUser.email : 'Unknown'}</p>
            </div>
            <button onclick="logoutUser()" style="margin: 0; background: #ffe6e6; border-color: #cc0000; color: #cc0000; box-shadow: 2px 2px 0px #cc0000;">🚪 Sign Out</button>
        </div>

        <div class="window-box" style="width: 100%; max-width: 650px; box-sizing: border-box;">
            <h2 style="margin-top: 0; border-bottom: 2px solid var(--border); padding-bottom: 10px; font-size: 1.3rem;">⚙️ Account Settings</h2>
            
            <label style="font-weight: bold; font-size: 0.9rem;">Public Nickname</label>
            <div style="display: flex; gap: 10px; margin-bottom: 15px; margin-top: 5px;">
                <input type="text" id="update-nickname-input" placeholder="New Nickname" value="${currentName}" style="flex: 1; margin: 0;">
                <button onclick="updateUserNickname()" style="margin: 0; padding: 0 20px;">Update</button>
            </div>

            <label style="font-weight: bold; font-size: 0.9rem;">Local Region</label>
            <div style="display: flex; gap: 10px; margin-bottom: 15px; margin-top: 5px;">
                <select id="update-country-input" style="flex: 1; margin: 0;">
                    ${countryOptions}
                </select>
                <button onclick="updateUserCountry()" style="margin: 0; padding: 0 20px;">Update</button>
            </div>

            <label style="font-weight: bold; font-size: 0.9rem;">Change Password</label>
            <div style="display: flex; gap: 10px; margin-bottom: 5px; margin-top: 5px;">
                <input type="password" id="update-password-input" placeholder="Enter new password (min 6 chars)" style="flex: 1; margin: 0;">
                <button onclick="updateUserPassword(event)" style="margin: 0; padding: 0 20px;">Update</button>
            </div>
        </div>

        <div class="window-box" style="width: 100%; max-width: 650px; box-sizing: border-box; display: flex; gap: 10px; padding: 10px; flex-wrap: wrap;">
            <button onclick="switchProfileTab('inbox')" id="prof-tab-inbox" style="flex: 1; margin: 0; background: #ffffff; border-bottom: 4px solid var(--border); min-width: 150px;">📥 Private Inbox</button>
            <button onclick="switchProfileTab('cookbook')" id="prof-tab-cookbook" style="flex: 1; margin: 0; background: var(--btn-grey); border-bottom: 2px solid var(--border); min-width: 150px;">📖 My Cookbook</button>
            ${adminTabButton}
        </div>

        <div id="profile-inbox-section" class="window-box" style="width: 100%; max-width: 650px; box-sizing: border-box;">
            <h2 style="margin-top:0; border-bottom: 2px dashed var(--border); padding-bottom: 10px; font-size: 1.3rem;">Inbox & Support</h2>
            <p style="font-size: 0.9rem; color: #555; margin-top: 0;">Have a suggestion or issue? Chat directly with Anton & Jenny here.</p>
            <div id="member-messages" style="max-height: 400px; overflow-y: auto; margin-bottom: 15px; padding: 15px; border: 2px solid var(--border); background: #fdf6e3;">Loading messages...</div>
            <div style="display: flex; gap: 10px;">
                <input type="text" id="new-message-text" placeholder="Type your message..." style="flex: 1; margin: 0;">
                <button onclick="sendMessageToAdmin()" style="margin: 0; padding: 0 20px;">Send</button>
            </div>
        </div>

        <div id="profile-cookbook-section" class="window-box" style="display: none; width: 100%; max-width: 650px; box-sizing: border-box;">
            <h2 style="margin-top:0; border-bottom: 2px dashed var(--border); padding-bottom: 10px; font-size: 1.3rem;">Saved Recipes</h2>
            <div id="cookbook-list">Loading favorites...</div>
        </div>
    `;
    loadMemberMessages();
}

function switchProfileTab(tab) {
    document.getElementById('profile-inbox-section').style.display = tab === 'inbox' ? 'block' : 'none';
    document.getElementById('profile-cookbook-section').style.display = tab === 'cookbook' ? 'block' : 'none';
    
    document.getElementById('prof-tab-inbox').style.background = tab === 'inbox' ? '#ffffff' : 'var(--btn-grey)';
    document.getElementById('prof-tab-inbox').style.borderBottom = tab === 'inbox' ? '4px solid var(--border)' : '2px solid var(--border)';
    
    document.getElementById('prof-tab-cookbook').style.background = tab === 'cookbook' ? '#ffffff' : 'var(--btn-grey)';
    document.getElementById('prof-tab-cookbook').style.borderBottom = tab === 'cookbook' ? '4px solid var(--border)' : '2px solid var(--border)';

    if (tab === 'cookbook') loadCookbook();
}

async function updateUserNickname() {
    if (!currentUser) return;
    const newName = document.getElementById('update-nickname-input').value.trim();
    if (!newName) return alert("Please enter a valid nickname.");

    const { data, error } = await myDatabase.auth.updateUser({ data: { nickname: newName } });

    if (error) alert("Error updating nickname: " + error.message);
    else {
        alert("Nickname updated successfully!");
        currentUser = data.user; 
        updateAuthUI(); 
        showPage('profile'); 
    }
}

function updateUserCountry() {
    const newCountry = document.getElementById('update-country-input').value;
    if (!newCountry) return alert("Please select a valid country.");
    selectedCountry = newCountry;
    localStorage.setItem('saved_country', newCountry);
    alert("Region successfully updated to " + newCountry + "!");
}

async function updateUserPassword(event) {
    const newPassword = document.getElementById('update-password-input').value;
    if (!newPassword || newPassword.length < 6) return alert("Password must be at least 6 characters.");
    
    const btn = event.target;
    btn.innerText = "Updating...";
    btn.disabled = true;

    const { error } = await myDatabase.auth.updateUser({ password: newPassword });
    
    btn.innerText = "Update";
    btn.disabled = false;

    if (error) alert("Error updating password: " + error.message);
    else {
        alert("Password securely updated!");
        document.getElementById('update-password-input').value = '';
    }
}

async function uploadTeamPhoto(event) {
    const file = document.getElementById('team-photo-upload').files[0];
    if (!file) return alert("Select an image first.");
    const btn = event.target;
    btn.innerText = "Uploading...";
    
    const name = `team-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const { error: err1 } = await myDatabase.storage.from('recipe_images').upload(name, file);
    if (err1) { btn.innerText = "Upload & Save Image"; return alert("Upload Failed: " + err1.message); }

    const url = myDatabase.storage.from('recipe_images').getPublicUrl(name).data.publicUrl;
    await myDatabase.from('site_config').update({ team_photo_url: url }).eq('id', 1);
    await logAction('UPDATE_SETTINGS', 'Team Photo', 'Uploaded new team photo');
    
    teamPhotoUrl = url;
    localStorage.setItem('cached_team_photo', url);
    btn.innerText = "Upload & Save Image";
    alert("Team photo updated!");
}

async function uploadBackgroundPhoto(event) {
    const file = document.getElementById('bg-photo-upload').files[0];
    if (!file) return alert("Select an image first.");
    const btn = event.target;
    btn.innerText = "Uploading...";
    
    const name = `bg-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const { error: err1 } = await myDatabase.storage.from('recipe_images').upload(name, file);
    if (err1) { btn.innerText = "Upload & Save Background"; return alert("Upload Failed: " + err1.message); }

    const url = myDatabase.storage.from('recipe_images').getPublicUrl(name).data.publicUrl;
    await myDatabase.from('site_config').update({ main_background_url: url }).eq('id', 1);
    await logAction('UPDATE_SETTINGS', 'Background', 'Uploaded new background');
    
    document.body.style.backgroundImage = `url('${url}')`;
    btn.innerText = "Upload & Save Background";
    alert("Background updated!");
}

function renderFindHub() {
    const view = document.getElementById('main-view');
    view.innerHTML = `
        <div class="window-box" style="width: 100%; max-width: 900px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; text-align: center;">
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
        <div class="window-box" style="width: 100%; max-width: 900px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; text-align: center;">
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
    
    await myDatabase.from('messages').update({ is_read: true }).eq('recipient_email', currentUser.email).eq('is_read', false);
    
    const authBtn = document.getElementById('nav-auth-btn');
    if (authBtn) authBtn.innerHTML = '👤 My Profile';

    const cacheKey = `cache_member_messages_${currentUser.email}`;

    const renderList = (data) => {
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
    };

    if (!localStorage.getItem(cacheKey)) container.innerHTML = 'Loading messages...';

    await fetchWithSWR(
        cacheKey,
        async () => {
            const { data, error } = await myDatabase.from('messages')
                .select('*')
                .or(`email.eq.${currentUser.email},recipient_email.eq.${currentUser.email}`)
                .order('created_at', { ascending: true }); 
            if (error) throw error;
            return data;
        },
        renderList
    );
}

async function sendMessageToAdmin() {
    const input = document.getElementById('new-message-text');
    const text = input.value.trim();
    if (!text || !currentUser) return;
    
    input.disabled = true; 
    const { error } = await myDatabase.from('messages').insert([{
        name: 'Member Message', email: currentUser.email, recipient_email: 'admin', message: text, is_read: false
    }]);
    input.disabled = false; 
    
    if (error) alert("Error: " + error.message);
    else { input.value = ''; loadMemberMessages(); }
}

async function executeSearch() {
    const term = document.getElementById('search-input').value.trim();
    if (!term) return;
    const view = document.getElementById('main-view');
    view.innerHTML = `<div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; text-align: center;"><h1>Searching for "${term}"...</h1></div>`;

    const { data, error } = await myDatabase.from('meals')
        .select('id, title, category, parent_category, author, created_at, meal_type')
        .or(`title.ilike.%${term}%,recipe.ilike.%${term}%`)
        .order('created_at', { ascending: false });

    if (error) {
        view.innerHTML = `<button onclick="renderCategoryList('find')" style="margin-bottom: 15px;">← Back</button><div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; text-align: center;"><h1>Error</h1><p>${error.message}</p></div>`;
        return;
    }

    let html = `
        <button onclick="renderCategoryList('find')" style="margin-bottom: 15px;">← Back</button>
        <div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; text-align: center;">
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
            const clickAction = isBudget ? `viewBudgetMeal('${meal.id}')` : `viewRecipe('${meal.id}')`;
            const badge = isBudget ? ` - BUDGET` : '';
            const urlParam = isBudget ? `?budget=${meal.id}` : `?recipe=${meal.id}`;

            html += `<div class="window-box" style="padding: 15px; margin-bottom: 0;">
                        <a href="${urlParam}" onclick="event.preventDefault(); window.history.pushState({}, '', '${urlParam}'); ${clickAction};" style="text-decoration: none; color: inherit; display: block; cursor: pointer;">
                            <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 5px;">${meal.title}${badge}</div>
                            <div style="font-size: 0.85rem; color: #666;">In ${meal.category} • By ${author}</div>
                        </a>
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
        <div class="window-box" style="width: 100%; max-width: 900px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; text-align: center;">
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

    if (typeof categories !== 'undefined') {
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
    }

    html += `</div>`;
    view.innerHTML = html;
}

function renderSubcategoryList(mainCategory, context) {
    if (context === 'add' && !currentUser) {
        alert("Please join or sign in to share with the community!");
        openAuthModal();
        return;
    }

    const view = document.getElementById('main-view');
    
    let html = `
        <button onclick="renderCategoryList('${context}')" style="margin-bottom: 15px;">← Back</button>
        <div class="window-box" style="width: 100%; max-width: 900px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; text-align: center;">
            <h1 style="margin-top: 0; margin-bottom: 5px; font-size: 1.8rem;">${mainCategory}</h1>
            <p style="font-size: 1.1rem; color: #555; margin-top: 0; margin-bottom: 0;">Select a specific subcategory.</p>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; width: 100%; max-width: 900px;">
    `;

    if (categories && categories[mainCategory]) {
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
    }

    html += `</div>`;
    view.innerHTML = html;
}

function getParentCategory(subcategoryName) {
    if (!categories) return null;
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
        <div class="window-box" style="width: 100%; max-width: 650px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; text-align: center;">
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
    if(await isUserBanned()) return; 
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
        author: getUserDisplayName(),
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
    if (!selectedCountry) { view.innerHTML = `<div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; text-align: center;"><h1>Error</h1><p>Please select a country first.</p></div>`; return; }

    const cacheKey = `cache_specials_${selectedCountry}`;

    const renderList = (data) => {
        let html = `
            <button onclick="showPage('find-recipes')" style="margin-bottom: 15px;">← Back</button>
            <div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 1.8rem;">Local Specials in ${selectedCountry}</h1>
            </div>
        `;
        
        if (data.length === 0) {
            html += `<div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box;"><p>No active specials posted for ${selectedCountry}. Be the first to share a deal!</p></div>`;
        } else {
            html += `<div style="display: flex; flex-direction: column; gap: 15px; max-width: 600px; width: 100%;">`;
            data.forEach(meal => {
                const expiryStr = new Date(meal.expiry_date).toLocaleDateString();
                
                let adminControls = '';
                if (isAdmin) {
                    adminControls = `<button onclick="adminDeleteContent('meals', '${meal.id}', this)" style="margin: 0 0 10px 0;">Delete Post</button>`;
                }

                html += `
                <div class="window-box" style="margin-bottom: 0;">
                    ${adminControls}
                    <div style="margin-bottom: 8px;">
                        <span style="font-size: 0.75rem; font-weight: bold; border: 1px solid var(--border); display: inline-block; padding: 3px 8px;">EXPIRES: ${expiryStr}</span>
                        <span style="font-size: 0.8rem; color: #666; margin-left: 10px;">By: ${meal.author || 'Community'}</span>
                    </div>
                    <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 10px; word-wrap: break-word;">${meal.title}</div>
                    <div style="font-size: 1.2rem; margin-bottom: 10px; font-weight: bold;">
                        ${currencyMap[selectedCountry] || ''}${meal.cost}
                    </div>
                    <div style="font-size: 1rem; line-height: 1.5; white-space: pre-wrap;">${meal.recipe}</div>
                    <div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #ccc;">
                        <button onclick="reportRecipe('${meal.title.replace(/'/g, "\\'")}', '${meal.id}')">⚠️ Report Fake/Expired Deal</button>
                    </div>
                </div>`;
            });
            html += `</div>`;
        }
        view.innerHTML = html;
    };

    if (!localStorage.getItem(cacheKey)) {
        view.innerHTML = `<div class="window-box"><h1>Loading Local Specials...</h1></div>`;
    }

    await fetchWithSWR(
        cacheKey,
        async () => {
            const now = new Date().toISOString();
            const { data, error } = await myDatabase.from('meals').select('*').eq('category', 'special').eq('country', selectedCountry).gt('expiry_date', now).order('created_at', {ascending: false});
            if (error) throw error;
            return data;
        },
        renderList
    );
}

function renderAddSpecialForm() {
    const view = document.getElementById('main-view');
    view.innerHTML = `
        <button onclick="showPage('creator-hub')" style="margin-bottom: 15px;">← Back</button>
        <div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; text-align: center;">
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
    if(await isUserBanned()) return;
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
        country: selectedCountry, title: title, recipe: details, cost: cost, category: 'special', parent_category: 'Specials', expiry_date: expiryISO, status: 'pending', author: getUserDisplayName()
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
    const cacheKey = `cache_budget_${selectedCountry}_${filter}`;

    const renderList = (data) => {
        let html = `
            <button onclick="showPage('find-recipes')" style="margin-bottom: 15px;">← Back</button>
            <div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; text-align: center;">
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
            
            let sortedData = [...data].sort((a, b) => (a.cost / a.servings) - (b.cost / b.servings)); 
            
            sortedData.forEach(meal => {
                const costPerPerson = (meal.cost / meal.servings).toFixed(2);
                const badgeText = meal.meal_type === 'takeaway' ? 'TAKEAWAY' : 'HOME-COOKED';
                
                let adminControls = '';
                if (isAdmin) {
                    adminControls = `<button onclick="adminDeleteContent('meals', '${meal.id}', this); event.preventDefault(); event.stopPropagation();" style="margin: 0 0 10px 0; position: relative; z-index: 10;">Delete Post</button>`;
                }

                html += `
                <div class="window-box" style="position: relative; margin-bottom: 0;">
                    ${adminControls}
                    <a href="?budget=${meal.id}" onclick="event.preventDefault(); window.history.pushState({}, '', '?budget=${meal.id}'); viewBudgetMeal('${meal.id}');" style="text-decoration: none; color: inherit; display: block; cursor: pointer;">
                        <div style="margin-bottom: 8px;">
                            <span style="font-size: 0.7rem; font-weight: bold; border: 1px solid var(--border); display: inline-block; padding: 3px 8px;">${badgeText}</span>
                            <span style="font-size: 0.8rem; color: #666; margin-left: 10px;">By: ${meal.author || 'Community'}</span>
                        </div>
                        <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 10px; word-wrap: break-word;">${meal.title}</div>
                        <div style="font-size: 1.1rem;">
                            <strong>${currencyMap[selectedCountry]}${costPerPerson}</strong> per person 
                            <span style="font-size: 0.9rem; color: #555; display: block; margin-top: 5px;">(Total: ${currencyMap[selectedCountry]}${meal.cost} for ${meal.servings} servings)</span>
                        </div>
                    </a>
                </div>`;
            });
            html += `</div>`;
        }
        view.innerHTML = html;
    };

    if (!localStorage.getItem(cacheKey)) {
        view.innerHTML = `<div class="window-box"><h1>Loading Budget Meals...</h1></div>`;
    }

    await fetchWithSWR(
        cacheKey,
        async () => {
            let query = myDatabase.from('meals').select('*').eq('category', 'budget').eq('country', selectedCountry);
            if (filter !== 'all') { query = query.eq('meal_type', filter); }
            const { data, error } = await query;
            if (error) throw error;
            return data;
        },
        renderList
    );
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
    const currentUrl = `https://bvdgbodzrfhgpvxzuogs.supabase.co/functions/v1/og-tag-interceptor?recipe=${data.id}`;
    const whatsappText = encodeURIComponent(`Check out this meal: ${data.title} on BudgetMealPlanner! ${currentUrl}`);

    // Send dynamic page view to Google Analytics
    if (typeof gtag === 'function') {
      gtag('event', 'page_view', {
        page_title: data.title,
        page_location: window.location.href,
        page_path: window.location.pathname + window.location.search
      });
    }

    let commentFormHTML = '';
    if (currentUser) {
        commentFormHTML = `
            <div style="margin-bottom: 20px;">
                <textarea id="new-comment-text" rows="3" placeholder="Share your thoughts or variations..." style="width: 100%; box-sizing: border-box; margin-bottom: 10px;"></textarea>
                <button onclick="postComment('${data.id}')">Post Comment</button>
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

    let imageHTML = '';
    if (data.image_url) {
        imageHTML = `<img src="${data.image_url}" style="width: 100%; height: 350px; object-fit: cover; border: 2px solid var(--border); margin-bottom: 20px; display: block;">`;
    } else if (data.pending_image_url) {
        imageHTML = `<div style="width: 100%; padding: 20px; box-sizing: border-box; background: #fff3cd; border: 2px solid var(--border); text-align: center; margin-bottom: 20px;">📸 A photo has been submitted and is waiting for Anton & Jenny to approve it!</div>`;
    } else {
        imageHTML = `
        <div style="width: 100%; height: 250px; background: #fdf6e3; border: 2px dashed var(--border); display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 20px; cursor: pointer; box-sizing: border-box; transition: background 0.2s;" onclick="triggerPhotoUpload('${data.id}')" onmouseover="this.style.background='#f4ecd8'" onmouseout="this.style.background='#fdf6e3'">
            <span style="font-size: 2.5rem; margin-bottom: 10px;">📸</span>
            <strong style="color: #333; font-size: 1.1rem;">Made this? Add a photo!</strong>
            <span style="font-size: 0.9rem; color: #666; margin-top: 5px;">(Click to upload)</span>
            <input type="file" id="recipe-photo-upload-${data.id}" accept="image/*" style="display: none;" onchange="submitPendingPhoto('${data.id}', event)">
        </div>`;
    }

    view.innerHTML = `
        <button onclick="showPage('find-budget-meals')" style="margin-bottom: 15px;">← Back</button>
        <div class="window-box" style="width: 100%; max-width: 650px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; text-align: center;">
            <h1 style="font-size: 2rem; margin-top: 0; margin-bottom: 5px;">${data.title}</h1>
            <div style="font-size: 1.2rem; padding: 10px; background: #e0e0e0; border: 2px solid var(--border); display: inline-block;">
                <strong>${currencyMap[selectedCountry]}${costPer}</strong> per person (Feeds ${data.servings} for ${currencyMap[selectedCountry]}${data.cost})
            </div>
            <p style="font-size: 0.9rem; color: #666; margin-top: 10px; margin-bottom:0;">Posted by: ${data.author || 'Community'}</p>
        </div>
        
        <div style="width: 100%; max-width: 650px; box-sizing: border-box;">
            ${imageHTML}
        </div>
        
        ${contentHTML}
        
        <div class="window-box" style="display: flex; gap: 10px; margin-top: 10px; margin-bottom: 20px; flex-wrap: wrap; width: 100%; max-width: 650px; background: transparent; border: none; box-shadow: none; padding: 0;">
            <button onclick="likeMeal('${data.id}', this)">❤️ Like (<span class="like-count">${data.likes || 0}</span>)</button>
            <button id="fav-btn-${data.id}" onclick="toggleFavorite('${data.id}')">⭐ Save to Favorites</button>
            <button onclick="copyToClipboard('${currentUrl}')">🔗 Copy Link</button>
            <button onclick="window.open('https://wa.me/?text=${whatsappText}', '_blank')">📱 WhatsApp</button>
            <button onclick="reportRecipe('${data.title.replace(/'/g, "\\'")}', '${data.id}')">⚠️ Report Recipe</button>
        </div>

        <div class="window-box" style="width: 100%; max-width: 650px; box-sizing: border-box; margin-bottom: 20px; padding: 15px;">
            <div class="ad-placeholder" style="height: 250px; width: 100%; border-radius: 4px;">Future AdSense Space<br>(End of Content)</div>
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
    if (!currentUser) { alert("Please sign in to report content."); openAuthModal(); return; }
    const reason = prompt("Why are you reporting this?");
    if (!reason) return; 

    const reporterEmail = currentUser.email;

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

    const cacheKey = `cache_comments_${recipeId}`;

    const renderList = (data) => {
        if (data.length === 0) {
            list.innerHTML = `<p style="color: #666; font-style: italic; text-align: center; margin-top: 10px;">Be the first to share your thoughts or variations on this recipe!</p>`;
            return;
        }

        let html = '<div style="display: flex; flex-direction: column; gap: 15px;">';
        data.forEach(comment => {
            const dateStr = new Date(comment.created_at).toLocaleDateString();
            const safeText = comment.comment_text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            
            let displayName = comment.nickname || comment.email.split('@')[0];
            let nameHTML = `<span style="font-weight: bold; font-size: 0.9rem;">${displayName}</span>`;
            
            let adminControls = '';
            if (isAdmin) {
                nameHTML = `<span style="font-weight: bold; font-size: 0.9rem; cursor: pointer;" onclick="openModMenu('${comment.user_id}', '${comment.email}', '${displayName}', event)">${displayName} ⚙️</span>`;
                adminControls = `<button onclick="adminDeleteContent('comments', '${comment.id}', this)" style="padding: 4px 8px; font-size: 0.7rem; margin-left: 10px;">Delete</button>`;
            }

            html += `
                <div class="window-box" style="padding: 15px; margin-bottom: 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <div>${nameHTML}</div>
                        <span style="font-size: 0.8rem; color: #666;">${dateStr}</span>
                    </div>
                    <p style="margin: 0 0 10px 0; white-space: pre-wrap; font-size: 0.95rem;">${comment.comment_text}</p>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <button onclick="likeComment('${comment.id}', this)" style="padding: 4px 8px; font-size: 0.8rem; margin: 0;">👍 Like (<span class="comment-like-count">${comment.likes || 0}</span>)</button>
                        <button onclick="reportComment('${comment.id}', '${safeText}')" style="padding: 4px 8px; font-size: 0.8rem; margin: 0;">⚠️ Report</button>
                        ${adminControls}
                    </div>
                </div>
            `;
        });
        html += '</div>';
        list.innerHTML = html;
    };

    if (!localStorage.getItem(cacheKey)) {
        list.innerHTML = `Loading comments...`;
    }

    await fetchWithSWR(
        cacheKey,
        async () => {
            const { data, error } = await myDatabase.from('comments')
                .select('*')
                .eq('recipe_id', recipeId)
                .order('likes', { ascending: false })
                .order('created_at', { ascending: true });
            if (error) throw error;
            return data;
        },
        renderList
    );
}

function openModMenu(userId, email, nickname, event) {
    if (!isAdmin) return;
    
    let existing = document.getElementById('mod-context-menu');
    if (existing) existing.remove();

    if (!userId) return alert("System ID missing for this user. Cannot perform moderation.");

    const menu = document.createElement('div');
    menu.id = 'mod-context-menu';
    menu.style.cssText = `
        position: absolute;
        background: #f0f0f0;
        border: 2px solid var(--border);
        box-shadow: 4px 4px 0px rgba(0,0,0,0.15);
        padding: 10px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 5px;
    `;
    
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';

    menu.innerHTML = `
        <div style="font-size: 0.75rem; font-weight: bold; margin-bottom: 5px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Mod: ${nickname}</div>
        <button style="margin: 0; font-size: 0.85rem; padding: 5px;" onclick="modDirectMessage('${email}')">✉️ Send DM</button>
        <button style="margin: 0; font-size: 0.85rem; padding: 5px;" onclick="modSoftBlock('${userId}', '${email}')">🛑 Block User</button>
        <button style="margin: 0; font-size: 0.85rem; padding: 5px;" onclick="this.parentElement.remove()">Cancel</button>
    `;

    document.body.appendChild(menu);
}

function modDirectMessage(email) {
    const existing = document.getElementById('mod-context-menu');
    if (existing) existing.remove();

    const msg = prompt(`Direct message to ${email}:\n(This goes to their profile inbox)`);
    if (!msg) return;

    myDatabase.from('messages').insert([{
        name: 'MODERATOR MESSAGE',
        email: currentUser.email,
        recipient_email: email,
        message: msg,
        is_read: false
    }]).then(({error}) => {
        if(error) alert("Failed to send: " + error.message);
        else {
            logAction('MOD_DM_SENT', `To: ${email}`, `Sent warning DM.`);
            alert("Message sent securely.");
        }
    });
}

async function modSoftBlock(userId, email) {
    const existing = document.getElementById('mod-context-menu');
    if (existing) existing.remove();

    const reason = prompt(`CRITICAL: Enter reason for blocking ${email}.\nThis places them in the Holding Cell.`);
    if (!reason) return alert("Block cancelled. Reason required.");

    const { error } = await myDatabase.from('banned_users').insert([{
        user_id: userId,
        user_email: email,
        reason: reason,
        banned_by: currentUser.email
    }]);

    if (error) alert("Error placing block: " + error.message);
    else {
        await logAction('USER_BLOCKED', `Target: ${email}`, `Reason: ${reason}`);
        alert(`${email} has been restricted and sent to the Holding Cell.`);
    }
}


async function postComment(recipeId) {
    if (!currentUser) return alert("Please log in to comment.");
    if(await isUserBanned()) return; 

    const input = document.getElementById('new-comment-text');
    const text = input.value.trim();
    
    if (!text) return;
    if (text.length > 500) return alert("Comments must be under 500 characters.");

    input.disabled = true; 

    const { error } = await myDatabase.from('comments').insert([{
        recipe_id: recipeId,
        user_id: currentUser.id, 
        email: currentUser.email,
        nickname: getUserDisplayName(), 
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
    if (!currentUser) { alert("Please sign in to report content."); openAuthModal(); return; }
    const reason = prompt("Why are you reporting this comment?");
    if (!reason) return;

    const reporterEmail = currentUser.email;
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
    const cacheKey = `cache_category_${subcategory}`;

    const renderList = (data) => {
        let html = `
            <button onclick="renderSubcategoryList('${parentCategory}', 'find')" style="margin-bottom: 15px;">← Back</button>
            <div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; text-align: center;">
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
                
                let adminControls = '';
                if (isAdmin) {
                    adminControls = `<button onclick="adminDeleteContent('meals', '${meal.id}', this); event.preventDefault(); event.stopPropagation();" style="padding: 4px 8px; font-size: 0.7rem; float: right; position: relative; z-index: 10;">Delete Post</button>`;
                }

                html += `<div class="window-box" style="position: relative; margin-bottom: 0;">
                            ${adminControls}
                            <a href="?recipe=${meal.id}" onclick="event.preventDefault(); window.history.pushState({}, '', '?recipe=${meal.id}'); viewRecipe('${meal.id}');" style="text-decoration: none; color: inherit; display: block; cursor: pointer;">
                                <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 5px;">${meal.title}</div>
                                <div style="font-size: 0.85rem; color: #666;">By ${author} • ${date}</div>
                            </a>
                         </div>`;
            });
            html += `</div>`;
        }
        view.innerHTML = html;
    };

    if (!localStorage.getItem(cacheKey)) {
        view.innerHTML = `<div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; text-align: center;"><h1>Loading ${subcategory}...</h1></div>`;
    }

    await fetchWithSWR(
        cacheKey,
        async () => {
            const { data, error } = await myDatabase.from('meals')
                .select('id, title, category, parent_category, author, created_at')
                .eq('category', subcategory)
                .eq('parent_category', parentCategory)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },
        renderList
    );
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
    const currentUrl = `https://bvdgbodzrfhgpvxzuogs.supabase.co/functions/v1/og-tag-interceptor?recipe=${data.id}`;
    const whatsappText = encodeURIComponent(`Check out this meal: ${data.title} on BudgetMealPlanner! ${currentUrl}`);
    const parentCat = data.parent_category || getParentCategory(data.category);

    // Send dynamic page view to Google Analytics
    if (typeof gtag === 'function') {
      gtag('event', 'page_view', {
        page_title: data.title,
        page_location: window.location.href,
        page_path: window.location.pathname + window.location.search
      });
    }

    let commentFormHTML = '';
    if (currentUser) {
        commentFormHTML = `
            <div style="margin-bottom: 20px;">
                <textarea id="new-comment-text" rows="3" placeholder="Share your thoughts or variations..." style="width: 100%; box-sizing: border-box; margin-bottom: 10px;"></textarea>
                <button onclick="postComment('${data.id}')">Post Comment</button>
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

    let imageHTML = '';
    if (data.image_url) {
        imageHTML = `<img src="${data.image_url}" style="width: 100%; height: 350px; object-fit: cover; border: 2px solid var(--border); margin-bottom: 20px; display: block;">`;
    } else if (data.pending_image_url) {
        imageHTML = `<div style="width: 100%; padding: 20px; box-sizing: border-box; background: #fff3cd; border: 2px solid var(--border); text-align: center; margin-bottom: 20px;">📸 A photo has been submitted and is waiting for Anton & Jenny to approve it!</div>`;
    } else {
        imageHTML = `
        <div style="width: 100%; height: 250px; background: #fdf6e3; border: 2px dashed var(--border); display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 20px; cursor: pointer; box-sizing: border-box; transition: background 0.2s;" onclick="triggerPhotoUpload('${data.id}')" onmouseover="this.style.background='#f4ecd8'" onmouseout="this.style.background='#fdf6e3'">
            <span style="font-size: 2.5rem; margin-bottom: 10px;">📸</span>
            <strong style="color: #333; font-size: 1.1rem;">Made this? Add a photo!</strong>
            <span style="font-size: 0.9rem; color: #666; margin-top: 5px;">(Click to upload)</span>
            <input type="file" id="recipe-photo-upload-${data.id}" accept="image/*" style="display: none;" onchange="submitPendingPhoto('${data.id}', event)">
        </div>`;
    }

    view.innerHTML = `
        <button onclick="loadSubcategory('${data.category}', '${parentCat}')" style="margin-bottom: 15px;">← Back</button>
        <div class="window-box" style="width: 100%; max-width: 650px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; text-align: center;">
            <h1 style="font-size: 2rem; margin-top: 0; margin-bottom: 5px;">${data.title}</h1>
            <p style="font-size: 1rem; color: #666; margin-top: 0;">By ${author} • ${date}</p>
        </div>
        
        <div style="width: 100%; max-width: 650px; box-sizing: border-box;">
            ${imageHTML}
        </div>
        
        <div class="window-box" style="background: #f0f0f0; max-width: 650px; width: 100%; box-sizing: border-box;">
            <h3 style="margin-top: 0; font-size: 1.1rem;">Smart Converter</h3>
            <div style="display: flex; gap: 10px; align-items: center;">
                <input type="number" step="any" id="conv-amount" oninput="calculateConversion()" placeholder="Qty" style="flex: 1; margin: 0; min-width: 60px; height: 38px; padding: 0 10px; box-sizing: border-box; border: 1px solid var(--border); border-radius: 4px; outline: none; vertical-align: middle;">
                <select id="conv-from" onchange="updateConverter()" style="height: 38px; margin: 0; padding: 0 10px; box-sizing: border-box; border: 1px solid var(--border); border-radius: 4px; outline: none; vertical-align: middle;">
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
                <span style="font-weight: bold; padding: 0 5px; margin: 0; line-height: 38px;">to</span>
                <select id="conv-to" onchange="calculateConversion()" style="height: 38px; margin: 0; padding: 0 10px; box-sizing: border-box; border: 1px solid var(--border); border-radius: 4px; outline: none; vertical-align: middle;"></select>
            </div>
            <div id="conv-result" style="margin-top: 10px; font-weight: bold; font-size: 1.2rem; min-height: 25px; color: #333;"></div>
        </div>

        <div class="farmhouse-scroll">
            <h2>Ingredients</h2>
            ${ingredientsHTML}
            
            <h2 style="margin-top: 30px;">Instructions</h2>
            <div style="white-space: pre-wrap;">${data.recipe}</div>
        </div>
        
        <div class="window-box" style="display: flex; gap: 10px; margin-top: 10px; margin-bottom: 20px; flex-wrap: wrap; width: 100%; max-width: 650px; background: transparent; border: none; box-shadow: none; padding: 0;">
            <button onclick="likeMeal('${data.id}', this)">❤️ Like (<span class="like-count">${data.likes || 0}</span>)</button>
            <button id="fav-btn-${data.id}" onclick="toggleFavorite('${data.id}')">⭐ Save to Favorites</button>
            <button onclick="copyToClipboard('${currentUrl}')">🔗 Copy Link</button>
            <button onclick="window.open('https://wa.me/?text=${whatsappText}', '_blank')">📱 WhatsApp</button>
            <button onclick="reportRecipe('${data.title.replace(/'/g, "\\'")}', '${data.id}')">⚠️ Report Recipe</button>
        </div>

        <div class="window-box" style="width: 100%; max-width: 650px; box-sizing: border-box; margin-bottom: 20px; padding: 15px;">
            <div class="ad-placeholder" style="height: 250px; width: 100%; border-radius: 4px;">Future AdSense Space<br>(End of Content)</div>
        </div>

        ${commentsSectionHTML}
    `;
    updateConverter();
    loadComments(data.id);
    checkFavoriteStatus(data.id);
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

function addRecipeMenu() { 
    if (!currentUser) { alert("Please join or sign in to share a recipe!"); openAuthModal(); return; }
    renderCategoryList('add'); 
}

function showForm(subcategory, parentCategory) {
    selectedSubcategory = subcategory;
    selectedParentCategory = parentCategory; 
    const view = document.getElementById('main-view');
    
    view.innerHTML = `
        <button onclick="renderSubcategoryList('${parentCategory}', 'add')" style="margin-bottom: 15px;">← Back</button>
        <div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; text-align: center;">
            <h1 style="margin-top: 0; margin-bottom: 0; font-size: 1.8rem;">Adding to: ${subcategory}</h1>
        </div>
        <div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box;">
            <input type="text" id="recipe-name" placeholder="Recipe Title">
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
    if(await isUserBanned()) return; 
    const title = document.getElementById('recipe-name').value.trim();
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
        title: title, author: getUserDisplayName(), category: selectedSubcategory, parent_category: selectedParentCategory, ingredients: structuredIngredients, recipe: instructions, created_at: new Date().toISOString(), status: 'pending'
    }]);
    
    if (error) alert("Error: " + error.message);
    else { alert("Recipe posted successfully!"); loadSubcategory(selectedSubcategory, selectedParentCategory); }
}

// ==========================================
//        ADMIN COMMAND CENTER LOGIC
// ==========================================
function switchAdminTab(tab) {
    ['inbox', 'review', 'photo', 'library', 'settings', 'family', 'broadcasts', 'campfire', 'jail', 'audit', 'users'].forEach(t => {
        const btn = document.getElementById('tab-' + t);
        if (btn) {
            btn.style.background = (t === tab) ? '#ffffff' : 'var(--btn-grey)';
            btn.style.borderBottom = (t === tab) ? '4px solid var(--border)' : '2px solid var(--border)';
        }
    });

    const area = document.getElementById('admin-content-area');
    
    if (tab === 'inbox') {
        area.innerHTML = `
            <div class="window-box" style="width: 100%; box-sizing: border-box;">
                <h2 style="margin-top: 0; border-bottom: 2px solid var(--border); padding-bottom: 10px;">User Messages & Reports</h2>
                <div id="messages-list">Loading...</div>
            </div>`;
        loadMessages();
    } 
    else if (tab === 'review') {
        area.innerHTML = `
            <div class="window-box" style="width: 100%; box-sizing: border-box;">
                <h2 style="margin-top: 0; border-bottom: 2px solid var(--border); padding-bottom: 10px;">Needs Approval</h2>
                <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                    <select id="review-tier1" onchange="updateTier2('review')" style="flex: 1; min-width: 200px; margin-bottom: 0;"></select>
                    <select id="review-tier2" onchange="updateTier3('review')" style="flex: 1; min-width: 200px; margin-bottom: 0; display: none;"></select>
                    <select id="review-tier3" onchange="loadReviewQueue()" style="flex: 1; min-width: 200px; margin-bottom: 0; display: none;"></select>
                </div>
                <div id="review-list" style="margin-top: 20px;">Loading...</div>
            </div>`;
        setupAdminFilters('review');
    } 
    else if (tab === 'photo') {
        area.innerHTML = `
            <div class="window-box" style="width: 100%; box-sizing: border-box;">
                <h2 style="margin-top: 0; border-bottom: 2px solid var(--border); padding-bottom: 10px;">Pending Photo Submissions</h2>
                <p style="color: #555; margin-top: 0;">Approve user-submitted photos to send them live, or decline to delete them.</p>
                <div id="photo-list" style="margin-top: 20px;">Loading...</div>
            </div>`;
        loadPhotoQueue();
    }
    else if (tab === 'library') {
        area.innerHTML = `
            <div class="window-box" style="width: 100%; box-sizing: border-box;">
                <h2 style="margin-top: 0; border-bottom: 2px solid var(--border); padding-bottom: 10px;">Approved Content</h2>
                <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                    <input type="text" id="library-search" placeholder="Search title or ingredient..." style="flex-basis: 100%; margin-bottom: 10px;" onkeyup="if(event.key === 'Enter') loadLibrary()">
                    <select id="library-tier1" onchange="updateTier2('library')" style="flex: 1; min-width: 200px; margin-bottom: 0;"></select>
                    <select id="library-tier2" onchange="updateTier3('library')" style="flex: 1; min-width: 200px; margin-bottom: 0; display: none;"></select>
                    <select id="library-tier3" onchange="loadLibrary()" style="flex: 1; min-width: 200px; margin-bottom: 0; display: none;"></select>
                    <button onclick="loadLibrary()" style="flex-basis: 100%; margin-top: 10px;">🔍 Search / Apply Filters</button>
                </div>
                <div id="library-list" style="margin-top: 20px;">Loading...</div>
            </div>`;
        setupAdminFilters('library');
    } 
    else if (tab === 'settings') {
        area.innerHTML = `
            <div class="window-box" style="width: 100%; box-sizing: border-box;">
                <h2 style="margin-top: 0; border-bottom: 2px solid var(--border); padding-bottom: 10px;">Site Settings</h2>
                <div class="window-box" style="margin-bottom: 20px;">
                    <h3 style="margin-top: 0;">📸 Update Team Photo</h3>
                    <input type="file" id="team-photo-upload" accept="image/*" style="margin-bottom: 15px; display: block; border: none; padding: 0;">
                    <button onclick="uploadTeamPhoto(event)">Upload & Save Image</button>
                </div>
                <div class="window-box" style="margin-bottom: 0;">
                    <h3 style="margin-top: 0;">🖼️ Update Website Background</h3>
                    <input type="file" id="bg-photo-upload" accept="image/*" style="margin-bottom: 15px; display: block; border: none; padding: 0;">
                    <button onclick="uploadBackgroundPhoto(event)">Upload & Save Background</button>
                </div>
            </div>`;
    } else if (tab === 'family') {
        area.innerHTML = `
            <div class="window-box" style="width: 100%; box-sizing: border-box;">
                <h2 style="margin-top: 0; border-bottom: 2px solid var(--border); padding-bottom: 10px;">🏡 The Family Hub</h2>
                <p style="color: #555; margin-top: 0;">Add a new family member or pet to the Sanctuary page.</p>

                <div class="window-box" style="display: flex; flex-direction: column; gap: 15px; max-width: 500px; margin-bottom: 30px;">
                    <input type="text" id="family-name" placeholder="Name (e.g., Buster, Anton)" required style="margin-bottom: 0;">
                    
                    <select id="family-type" style="margin-bottom: 0;">
                        <option value="pet">Pet</option>
                        <option value="human">Human</option>
                    </select>
                    
                    <textarea id="family-story" placeholder="Write their story here..." rows="4" required style="margin-bottom: 0;"></textarea>
                    
                    <label style="font-weight: bold; font-size: 0.9rem;">Upload Photo:</label>
                    <input type="file" id="family-image" accept="image/*" required style="margin-bottom: 0;">
                    
                    <label style="font-weight: bold; font-size: 0.9rem;">Display Order (1 shows up first):</label>
                    <input type="number" id="family-order" value="1" min="1" style="margin-bottom: 0;">
                    
                    <button onclick="saveFamilyMember(event)" style="margin: 0; padding: 10px;">Add to Family Hub</button>
                </div>

                <h3 style="border-bottom: 2px solid var(--border); padding-bottom: 10px;">Manage Current Family</h3>
                <div id="admin-family-list" style="display: flex; flex-direction: column; gap: 15px; margin-top: 20px;">
                    <p><i>Loading family members...</i></p>
                </div>
            </div>
        `;
        if (typeof loadAdminFamilyList === 'function') loadAdminFamilyList();
    } else if (tab === 'broadcasts') {
        area.innerHTML = `
            <div class="window-box" style="width: 100%; box-sizing: border-box;">
                <h2 style="margin-top: 0; border-bottom: 2px solid var(--border); padding-bottom: 10px;">📣 Community Broadcasts</h2>
                <p style="color: #555; margin-top: 0;">Post an update directly to the user sidebar. Everyone will see it.</p>

                <div class="window-box" style="display: flex; flex-direction: column; gap: 15px; max-width: 700px; margin-bottom: 30px;">
                    <textarea id="broadcast-message" placeholder="Type your announcement here... (e.g., Hey everyone, we are looking for moderators!)" rows="4" required style="margin-bottom: 0; font-family: inherit;"></textarea>
                    
                    <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                        <label style="font-weight: bold;">Post as:</label>
                        <select id="broadcast-signature" style="margin-bottom: 0; flex: 1; min-width: 150px;">
                            <option value="Anton">— Anton</option>
                            <option value="Jenny">— Jenny</option>
                            <option value="Anton & Jenny">— Anton & Jenny</option>
                        </select>
                        <button onclick="postBroadcast(event)" style="padding: 10px 20px; margin: 0;">Send Broadcast 📢</button>
                    </div>
                </div>

                <h3 style="border-bottom: 2px solid var(--border); padding-bottom: 10px;">Past Broadcasts</h3>
                <div id="admin-broadcast-list" style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                    <p><i>Loading past broadcasts...</i></p>
                </div>
            </div>
        `;
        if (typeof loadAdminBroadcasts === 'function') loadAdminBroadcasts();
    } else if (tab === 'campfire') {
        area.innerHTML = `
            <div class="window-box" style="width: 100%; box-sizing: border-box;">
                <h2 style="margin-top: 0; border-bottom: 2px solid var(--border); padding-bottom: 10px;">🔥 Campfire Logs (Moderation)</h2>
                <p style="color: #555; margin-top: 0;">Live feed of the public shoutbox. Delete inappropriate messages instantly.</p>
                <div id="admin-campfire-list" style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                    <p><i>Loading logs...</i></p>
                </div>
            </div>
        `;
        if (typeof loadAdminCampfire === 'function') loadAdminCampfire();
    } else if (tab === 'jail') {
        area.innerHTML = `
            <div class="window-box" style="width: 100%; box-sizing: border-box;">
                <h2 style="margin-top: 0; border-bottom: 2px solid var(--border); padding-bottom: 10px;">🛑 Holding Cell (Soft Blocks)</h2>
                <p style="color: #555; margin-top: 0;">Users currently restricted from posting. Review and Reinstate.</p>
                <div id="admin-jail-list" style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                    <p><i>Loading restricted users...</i></p>
                </div>
            </div>
        `;
        loadHoldingCell();
    } else if (tab === 'audit') {
        area.innerHTML = `
            <div class="window-box" style="width: 100%; box-sizing: border-box;">
                <h2 style="margin-top: 0; border-bottom: 2px solid var(--border); padding-bottom: 10px;">👁️ Live Audit Logs</h2>
                <p style="color: #555; margin-top: 0;">Immutable record of all administrative and moderation actions.</p>
                <div id="admin-audit-list" style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                    <p><i>Pulling security tapes...</i></p>
                </div>
            </div>
        `;
        loadAuditLogs();
    } else if (tab === 'users') {
        area.innerHTML = `
            <div class="window-box" style="width: 100%; box-sizing: border-box;">
                <h2 style="margin-top: 0; border-bottom: 2px solid var(--border); padding-bottom: 10px;">👥 User Directory & Staff Roster</h2>
                <p style="color: #555; margin-top: 0;">Manage your team and search the public profile database to moderate users.</p>
                
                <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                    <input type="text" id="directory-search" placeholder="Search by email or nickname..." style="flex: 1; margin: 0;" onkeyup="if(event.key === 'Enter') searchUserDirectory()">
                    <button style="margin: 0;" onclick="searchUserDirectory()">Search Global Directory</button>
                </div>

                <h3 style="border-bottom: 2px solid var(--border); padding-bottom: 10px; margin-top: 20px;">Current Staff Roster</h3>
                <div id="admin-roster-list" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 30px;">
                    <p><i>Loading staff roster...</i></p>
                </div>

                <h3 style="border-bottom: 2px solid var(--border); padding-bottom: 10px; margin-top: 20px;">Search Results</h3>
                <div id="admin-directory-list" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                    <p><i>Enter a search term above...</i></p>
                </div>
            </div>
        `;
        if (typeof loadStaffRoster === 'function') loadStaffRoster();
    }
}

// ==========================================
//        ADMIN FUNCTIONS (DIRECTORY/JAIL/AUDIT)
// ==========================================
async function loadStaffRoster() {
    const listDiv = document.getElementById('admin-roster-list');
    if (!listDiv) return;
    const { data, error } = await myDatabase.from('admin_whitelist').select('*').order('role', { ascending: true });
    
    if (error) { listDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`; return; }
    if (data.length === 0) { listDiv.innerHTML = "<p>No staff members found.</p>"; return; }

    let html = "";
    data.forEach(staff => {
        let revokeBtn = (userRole === 'developer' && staff.email !== currentUser.email) 
            ? `<button style="margin: 0; padding: 6px 12px; background: #ffe6e6; color: #cc0000; border-color: #cc0000;" onclick="revokeUser('${staff.email}')">Revoke Role</button>` 
            : '';
        
        html += `
            <div class="window-box" style="padding: 15px; margin-bottom: 0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div>
                    <p style="margin: 0 0 5px 0; font-weight: bold; font-size: 1.1rem;">${staff.email}</p>
                    <span style="display: inline-block; padding: 4px 8px; background: #007bff; color: white; border-radius: 12px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase;">${staff.role}</span>
                </div>
                <div>${revokeBtn}</div>
            </div>
        `;
    });
    listDiv.innerHTML = html;
}

async function revokeUser(email) {
    if (!confirm(`Are you absolutely sure you want to revoke ${email}'s admin privileges?`)) return;
    const { error } = await myDatabase.from('admin_whitelist').delete().eq('email', email);
    if (error) alert("Error revoking role: " + error.message);
    else {
        await logAction('ROLE_REVOKED', `Target: ${email}`, `Removed from admin whitelist.`);
        alert(`${email} has been demoted to a standard member.`);
        loadStaffRoster();
    }
}

async function searchUserDirectory() {
    const term = document.getElementById('directory-search').value.trim();
    if(!term) return;

    const listDiv = document.getElementById('admin-directory-list');
    listDiv.innerHTML = "<p>Searching vault...</p>";

    // Fetch current staff to cross-reference roles
    const { data: staffData } = await myDatabase.from('admin_whitelist').select('email, role');
    const staffMap = {};
    if (staffData) { staffData.forEach(s => staffMap[s.email] = s.role); }

    const { data, error } = await myDatabase.from('public_profiles')
        .select('*')
        .or(`email.ilike.%${term}%,nickname.ilike.%${term}%`)
        .limit(20);

    if (error) { listDiv.innerHTML = `<p>Error: ${error.message}</p>`; return; }
    if (data.length === 0) { listDiv.innerHTML = "<p>No matching users found.</p>"; return; }

    let html = '';
    data.forEach(user => {
        let nameToDisplay = user.nickname || "No Nickname Set";
        let currentRole = staffMap[user.email];
        let roleBadge = currentRole ? `<span style="display: inline-block; padding: 3px 8px; background: #007bff; color: white; border-radius: 12px; font-size: 0.7rem; font-weight: bold; margin-left: 10px; text-transform: uppercase; vertical-align: middle;">${currentRole}</span>` : '';
        
        let promoteBtn = userRole === 'developer' ? `<button style="margin: 0;" onclick="promoteUser('${user.email}')">Promote Role</button>` : '';

        html += `
            <div class="window-box" style="padding: 15px; margin-bottom: 15px; display: flex; flex-direction: column; gap: 10px;">
                <div style="border-bottom: 1px solid #ccc; padding-bottom: 10px;">
                    <p style="font-weight: bold; font-size: 1.2rem; margin: 0 0 5px 0;">${nameToDisplay} ${roleBadge}</p>
                    <p style="font-size: 0.85rem; color: #666; margin: 0;">Email: ${user.email} | ID: <span style="font-family: monospace;">${user.id}</span></p>
                </div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    ${promoteBtn}
                    <button style="margin: 0;" onclick="modDirectMessage('${user.email}')">Message</button>
                    <button style="margin: 0;" onclick="modSoftBlock('${user.id}', '${user.email}')">Soft Block</button>
                </div>
            </div>
        `;
    });
    listDiv.innerHTML = html;
}

async function promoteUser(email) {
    const newRole = prompt(`Promote ${email} to what role?\nOptions: 'moderator', 'admin', 'developer'`);
    if (!newRole || !['moderator', 'admin', 'developer'].includes(newRole.toLowerCase())) return alert("Invalid role. Cancelled.");

    const { error } = await myDatabase.from('admin_whitelist').upsert({ email: email, role: newRole.toLowerCase() }, { onConflict: 'email' });
    if(error) alert("Error: " + error.message);
    else {
        await logAction('ROLE_CHANGED', `Target: ${email}`, `Promoted to ${newRole}`);
        alert(`${email} is now a ${newRole}.`);
        if (typeof loadStaffRoster === 'function') loadStaffRoster();
        searchUserDirectory(); // Refresh search list to show new badge
    }
}

async function loadHoldingCell() {
    const listDiv = document.getElementById('admin-jail-list');
    const { data, error } = await myDatabase.from('banned_users').select('*').order('banned_at', { ascending: false });

    if (error) { listDiv.innerHTML = `<p>Error: ${error.message}</p>`; return; }
    if (data.length === 0) { listDiv.innerHTML = "<p>The Holding Cell is currently empty.</p>"; return; }

    let html = "";
    data.forEach(inmate => {
        const dateStr = new Date(inmate.banned_at).toLocaleString();
        html += `
            <div class="window-box" style="padding: 15px; margin-bottom: 15px;">
                <p style="font-weight: bold; font-size: 1.1rem; margin: 0 0 5px 0;">${inmate.user_email}</p>
                <p style="margin: 0 0 5px 0; font-size: 0.95rem;"><strong>Reason:</strong> ${inmate.reason}</p>
                <p style="margin: 0 0 10px 0; font-size: 0.8rem; color: #666;">Banned by ${inmate.banned_by} on ${dateStr}</p>
                <button onclick="unblockUser('${inmate.id}', '${inmate.user_email}')" style="margin: 0;">✅ Unblock User</button>
            </div>
        `;
    });
    listDiv.innerHTML = html;
}

async function unblockUser(recordId, email) {
    if (!confirm(`Are you sure you want to reinstate ${email}?`)) return;
    const { error } = await myDatabase.from('banned_users').delete().eq('id', recordId);
    if (error) alert("Error unblocking: " + error.message);
    else {
        await logAction('USER_UNBLOCKED', `Target: ${email}`, `Reinstated from holding cell.`);
        alert("User unblocked successfully.");
        loadHoldingCell();
    }
}

async function loadAuditLogs() {
    const listDiv = document.getElementById('admin-audit-list');

    const renderList = (data) => {
        if (data.length === 0) { listDiv.innerHTML = "<p>No logs found.</p>"; return; }
        let html = '<div style="overflow-x: auto;"><table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">';
        html += '<tr style="border-bottom: 2px solid var(--border);"><th style="padding: 8px;">Time</th><th style="padding: 8px;">Actor</th><th style="padding: 8px;">Action</th><th style="padding: 8px;">Target/Context</th></tr>';
        
        data.forEach(log => {
            const dateStr = new Date(log.created_at).toLocaleString();
            html += `
                <tr style="border-bottom: 1px solid #ccc;">
                    <td style="padding: 8px; color: #666;">${dateStr}</td>
                    <td style="padding: 8px; font-weight: bold;">${log.actor_email}</td>
                    <td style="padding: 8px;"><span style="background: #e0e0e0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${log.action_type}</span></td>
                    <td style="padding: 8px;">${log.target_info} <br><i style="color: #666; font-size: 0.8rem;">${log.context}</i></td>
                </tr>
            `;
        });
        html += '</table></div>';
        listDiv.innerHTML = html;
    };

    await fetchWithSWR('cache_audit_logs', async () => {
        const { data, error } = await myDatabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
        if (error) throw error;
        return data;
    }, renderList);
}

// ==========================================
//        ADMIN QUEUES (PHOTOS/RECIPES/LIBRARY)
// ==========================================
async function loadPhotoQueue() {
    const area = document.getElementById('photo-list');
    area.innerHTML = "Checking for pending photos...";
    
    const { data, error } = await myDatabase.from('meals')
        .select('id, title, pending_image_url')
        .not('pending_image_url', 'is', null);
        
    if (error) { area.innerHTML = `<p>Error: ${error.message}</p>`; return; }
    if (data.length === 0) { 
        area.innerHTML = `<div class="window-box" style="text-align:center; padding: 40px;"><h2 style="margin:0;">All caught up!</h2><p style="color:#666;">No pending photos to review.</p></div>`; 
        return; 
    }
    
    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">';
    data.forEach(meal => {
        html += `
        <div class="window-box" style="padding: 0; overflow: hidden; display: flex; flex-direction: column; margin-bottom: 0;">
            <img src="${meal.pending_image_url}" style="width: 100%; height: 250px; object-fit: cover; border-bottom: 2px solid var(--border);">
            <div style="padding: 15px;">
                <h3 style="margin: 0 0 5px 0;">${meal.title}</h3>
                <p style="margin: 0 0 15px 0; font-size: 0.85rem; color: #666;">Submitted by Community</p>
                <div style="display: flex; gap: 10px;">
                    <button style="flex: 1; margin: 0;" onclick="approvePhoto('${meal.id}', '${meal.pending_image_url}')">✅ Approve</button>
                    <button style="flex: 1; margin: 0;" onclick="declinePhoto('${meal.id}', '${meal.pending_image_url}')">❌ Decline</button>
                </div>
            </div>
        </div>`;
    });
    html += '</div>';
    area.innerHTML = html;
}

async function approvePhoto(id, url) {
    await logAction('APPROVE_PHOTO', `Recipe ID: ${id}`, `Approved user submitted photo.`);
    const { error } = await myDatabase.from('meals').update({ image_url: url, pending_image_url: null }).eq('id', id);
    if (error) alert("Error approving photo: " + error.message);
    else loadPhotoQueue();
}

async function declinePhoto(id, url) {
    if(!confirm("Decline and permanently delete this photo?")) return;
    await logAction('DECLINE_PHOTO', `Recipe ID: ${id}`, `Declined & deleted photo.`);
    const fileName = url.split('/').pop();
    await myDatabase.storage.from('recipe_images').remove([fileName]);
    const { error } = await myDatabase.from('meals').update({ pending_image_url: null }).eq('id', id);
    if (error) alert("Error declining photo: " + error.message);
    else loadPhotoQueue();
}

function setupAdminFilters(ctx) {
    const types = [
        { id: "all", label: "-- All Content Types --" },
        { id: "global", label: "🍲 Global Recipes" },
        { id: "budget", label: "💰 Budget Meals" },
        { id: "special", label: "🏷️ Local Specials" },
        { id: "plan", label: "📅 7-Day Meal Plans" },
        { id: "pet", label: "🐾 Pet Food & Treats" }
    ];
    const t1 = document.getElementById(`${ctx}-tier1`);
    if(t1) {
        types.forEach(t => {
            let opt = document.createElement('option');
            opt.value = t.id; opt.innerHTML = t.label;
            t1.appendChild(opt);
        });
    }
    if (ctx === 'review') loadReviewQueue(); else loadLibrary();
}

function updateTier2(context) {
    const t1 = document.getElementById(`${context}-tier1`).value;
    const t2 = document.getElementById(`${context}-tier2`);
    const t3 = document.getElementById(`${context}-tier3`);
    
    t2.innerHTML = ''; t3.innerHTML = '';
    t2.style.display = 'none'; t3.style.display = 'none';

    if (t1 === 'global') {
        t2.style.display = 'block';
        t2.innerHTML = '<option value="all">-- All Main Categories --</option>';
        if (typeof categories !== 'undefined') {
            Object.keys(categories).forEach(cat => {
                if (cat !== 'Pet Food & Treats' && cat !== 'Specialized Plans') {
                    t2.innerHTML += `<option value="${cat}">${cat}</option>`;
                }
            });
        }
    } else if (t1 === 'budget' || t1 === 'special') {
        t2.style.display = 'block';
        t2.innerHTML = '<option value="all">-- All Countries --</option>';
        if (typeof countries !== 'undefined') {
            countries.forEach(c => t2.innerHTML += `<option value="${c}">${c}</option>`);
        }
    } else if (t1 === 'pet') {
        t2.style.display = 'block';
        t2.innerHTML = '<option value="all">-- All Pets --</option>';
        if (typeof categories !== 'undefined' && categories['Pet Food & Treats']) {
            categories['Pet Food & Treats'].forEach(sub => t2.innerHTML += `<option value="${sub}">${sub}</option>`);
        }
    }
    if (context === 'review') loadReviewQueue(); else loadLibrary();
}

function updateTier3(context) {
    const t1 = document.getElementById(`${context}-tier1`).value;
    const t2 = document.getElementById(`${context}-tier2`).value;
    const t3 = document.getElementById(`${context}-tier3`);

    t3.innerHTML = ''; t3.style.display = 'none';

    if (t1 === 'global' && t2 !== 'all') {
        t3.style.display = 'block';
        t3.innerHTML = '<option value="all">-- All Subcategories --</option>';
        if (typeof categories !== 'undefined' && categories[t2]) {
            categories[t2].forEach(sub => t3.innerHTML += `<option value="${sub}">${sub}</option>`);
        }
    } else if (t1 === 'budget') {
        t3.style.display = 'block';
        t3.innerHTML = `<option value="all">-- All Meal Types --</option><option value="home">Home-Cooked</option><option value="takeaway">Takeaway</option>`;
    }
    if (context === 'review') loadReviewQueue(); else loadLibrary();
}

function buildAdminQuery(context, status) {
    let query = myDatabase.from('meals').select('id, title, category, country, meal_type, created_at').eq('status', status).order('created_at', { ascending: false });
    
    const t1 = document.getElementById(`${context}-tier1`).value;
    const t2 = document.getElementById(`${context}-tier2`) ? document.getElementById(`${context}-tier2`) : { value: 'all' };
    const t3 = document.getElementById(`${context}-tier3`) ? document.getElementById(`${context}-tier3`) : { value: 'all' };

    if (context === 'library') {
        const term = document.getElementById('library-search').value.trim();
        if (term !== '') { query = query.or(`title.ilike.%${term}%,recipe.ilike.%${term}%`); } 
        else { query = query.limit(50); }
    } else {
        query = query.limit(100); 
    }

    if (t1 === 'global') {
        if (t3.value !== 'all') {
            query = query.eq('category', t3.value);
        } else if (t2.value !== 'all') {
            query = query.eq('parent_category', t2.value);
        } else {
            let allGlobalSubcats = [];
            if (typeof categories !== 'undefined') {
                Object.keys(categories).forEach(c => {
                    if (c !== 'Pet Food & Treats' && c !== 'Specialized Plans') {
                        allGlobalSubcats = allGlobalSubcats.concat(categories[c]);
                    }
                });
            }
            query = query.in('category', allGlobalSubcats);
        }
    } else if (t1 === 'budget') {
        query = query.eq('category', 'budget');
        if (t2.value !== 'all') query = query.eq('country', t2.value);
        if (t3.value !== 'all') query = query.eq('meal_type', t3.value);
    } else if (t1 === 'special') {
        query = query.eq('category', 'special');
        if (t2.value !== 'all') query = query.eq('country', t2.value);
    } else if (t1 === 'plan') {
        query = query.eq('category', '7-Day Meal Plans');
    } else if (t1 === 'pet') {
        if (t2.value !== 'all') { query = query.eq('category', t2.value); } 
        else { query = query.eq('parent_category', 'Pet Food & Treats'); }
    }
    return query;
}

async function loadReviewQueue() {
    const list = document.getElementById('review-list');
    list.innerHTML = "Checking for new submissions...";
    const { data, error } = await buildAdminQuery('review', 'pending');
    if (error) { list.innerHTML = `<p>Error: ${error.message}</p>`; return; }
    if (data.length === 0) { list.innerHTML = `<div class="window-box"><p>Queue is empty for this filter! You are all caught up.</p></div>`; return; }
    renderAdminItems(data, list, 'review');
}

async function loadLibrary() {
    const list = document.getElementById('library-list');
    list.innerHTML = "Loading library...";
    const { data, error } = await buildAdminQuery('library', 'approved');
    if (error) { list.innerHTML = `<p>Error: ${error.message}</p>`; return; }
    if (data.length === 0) { list.innerHTML = `<div class="window-box"><p>No approved content found matching this filter.</p></div>`; return; }
    renderAdminItems(data, list, 'library');
}

function renderAdminItems(data, container, contextPrefix) {
    let html = '';
    data.forEach(meal => {
        let statusBadge = contextPrefix === 'review' ? `(PENDING)` : `(APPROVED)`;
        let typeInfo = `Global Recipe (${meal.category})`;
        
        if (meal.category === 'budget') { typeInfo = `Budget Meal (${meal.country}) - ${meal.meal_type || 'Unknown'}`; } 
        else if (meal.category === 'special') { typeInfo = `Local Special (${meal.country})`; } 
        else if (meal.category === '7-Day Meal Plans') { typeInfo = `Meal Plan (Global)`; } 
        else if (typeof categories !== 'undefined' && categories['Pet Food & Treats'] && categories['Pet Food & Treats'].includes(meal.category)) { typeInfo = `Pet Food (${meal.category})`; }

        html += `
        <div class="window-box" id="${contextPrefix}-${meal.id}" style="padding: 15px; margin-bottom: 15px; display: flex; flex-direction: column; gap: 10px;">
            <div style="border-bottom: 1px solid #ccc; padding-bottom: 10px;">
                <p style="font-weight: bold; font-size: 1.2rem; margin: 0 0 5px 0;">${meal.title} ${statusBadge}</p>
                <p style="font-size: 0.85rem; color: #666; margin: 0;">Type: ${typeInfo} | ID: ${meal.id} | Date: ${new Date(meal.created_at).toLocaleDateString()}</p>
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">`;
        
        if (contextPrefix === 'review') {
            html += `<button onclick="approveRecipe('${meal.id}')" style="margin: 0;">Approve</button>`;
        } else if (contextPrefix === 'library') {
            html += `<button onclick="moderateComments('${meal.id}', '${meal.title.replace(/'/g, "\\'")}')" style="margin: 0;">Moderate Comments</button>`;
        }
        
        html += `
                <button onclick="openEdit('${meal.id}')" style="margin: 0;">Edit</button>
                <button onclick="deleteRecord('meals', '${meal.id}')" style="margin: 0;">${contextPrefix === 'review' ? 'Decline' : 'Delete'}</button>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

async function approveRecipe(id) {
    await logAction('APPROVE_RECIPE', `ID: ${id}`, `Approved post from queue.`);
    const { error } = await myDatabase.from('meals').update({ status: 'approved' }).eq('id', id);
    if (error) alert("Error approving: " + error.message); 
    else loadReviewQueue(); 
}

async function moderateComments(recipeId, recipeTitle) {
    const area = document.getElementById('admin-content-area');
    area.innerHTML = `<div class="window-box"><p>Loading comments for ${recipeTitle}...</p></div>`;

    const { data, error } = await myDatabase.from('comments').select('*').eq('recipe_id', recipeId).order('created_at', { ascending: false });
    if (error) { alert("Error: " + error.message); switchAdminTab('library'); return; }

    let html = `
        <div class="window-box" style="width: 100%; box-sizing: border-box;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">Moderating: ${recipeTitle}</h2>
                <button onclick="switchAdminTab('library')">← Back to Library</button>
            </div>
    `;

    if (data.length === 0) {
        html += `<p>No comments on this recipe.</p>`;
    } else {
        html += `<div style="display: flex; flex-direction: column; gap: 15px;">`;
        data.forEach(comment => {
            let displayName = comment.nickname || comment.email;
            html += `
                <div class="window-box" style="padding: 15px; margin-bottom: 0;">
                    <p style="font-weight: bold; margin: 0 0 5px 0;">
                        <span style="color:#007bff; cursor:pointer;" onclick="openModMenu('${comment.user_id}', '${comment.email}', '${displayName}', event)">${displayName} ⚙️</span> 
                        <span style="font-size: 0.8rem; font-weight: normal; color: #666;">(${new Date(comment.created_at).toLocaleString()})</span>
                    </p>
                    <p style="margin: 0 0 10px 0; white-space: pre-wrap;">${comment.comment_text}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <p style="font-size: 0.8rem; color: #666; margin: 0;">Likes: ${comment.likes || 0} | Comment ID: ${comment.id}</p>
                        <button onclick="deleteRecord('comments', '${comment.id}', '${recipeId}', '${recipeTitle.replace(/'/g, "\\'")}')" style="margin: 0;">Delete Comment</button>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }
    html += `</div>`;
    area.innerHTML = html;
}

async function loadMessages() {
    const list = document.getElementById('messages-list');
    const { data, error } = await myDatabase.from('messages').select('*').order('created_at', { ascending: false });
    
    if (error) { list.innerHTML = `<p>Error: ${error.message}</p>`; return; }
    if (data.length === 0) { list.innerHTML = `<div class="window-box"><p>Inbox is empty.</p></div>`; return; }
    
    const unreadAdminIds = data.filter(m => m.recipient_email === 'admin' && m.is_read === false).map(m => m.id);
    if (unreadAdminIds.length > 0) {
        myDatabase.from('messages').update({ is_read: true }).in('id', unreadAdminIds).then();
    }
    
    let html = '<div style="display:flex; flex-direction:column; gap: 15px;">';
    data.forEach(msg => {
        const isReport = msg.name.startsWith("REPORTED") || msg.name.startsWith("🚩 REPORTED");
        const isAdminReply = (msg.email === currentUser.email) || (msg.recipient_email !== 'admin');
        const unreadText = (!isAdminReply && !msg.is_read) ? ' (UNREAD)' : '';
        const safeEmailId = (msg.email || '').replace(/[^a-zA-Z0-9]/g, '');

        html += `
        <div class="window-box" style="padding: 15px; margin-bottom: 0;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 10px; flex-wrap: wrap; gap: 10px;">
                <div>
                    <p style="font-weight: bold; font-size: 1.2rem; margin: 0 0 5px 0;">
                        ${isAdminReply ? 'Admin Reply To:' : msg.name} <span style="font-size: 0.85rem; color: #666;">(${isAdminReply ? msg.recipient_email : msg.email})</span><strong style="color: #dc3545;">${unreadText}</strong>
                    </p>
                    <p style="font-size: 0.85rem; color: #666; margin: 0;">${new Date(msg.created_at).toLocaleString()}</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    ${!isAdminReply && !isReport ? `<button onclick="openAdminReply('${safeEmailId}')" style="margin: 0;">Reply</button>` : ''}
                    <button onclick="deleteRecord('messages', '${msg.id}')" style="margin: 0;">Delete</button>
                </div>
            </div>
            <p style="white-space: pre-wrap; margin: 0;">${msg.message}</p>
            
            <div id="reply-box-${safeEmailId}" style="display:none; width: 100%; margin-top: 15px; border-top: 1px dashed var(--border); padding-top: 15px;">
                <textarea id="reply-text-${safeEmailId}" rows="3" placeholder="Type your reply to ${msg.email}..." style="width: 100%; margin-bottom: 10px;"></textarea>
                <button onclick="sendAdminReply('${msg.email}', '${safeEmailId}')" style="margin: 0;">Send Reply</button>
            </div>
        </div>`;
    });
    list.innerHTML = html + '</div>';
}

function openAdminReply(safeId) {
    const box = document.getElementById('reply-box-' + safeId);
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

async function sendAdminReply(recipientEmail, safeId) {
    const text = document.getElementById('reply-text-' + safeId).value.trim();
    if (!text) return;
    
    await logAction('ADMIN_REPLY', `To: ${recipientEmail}`, `Sent reply from inbox.`);
    const { error } = await myDatabase.from('messages').insert([{
        name: 'Admin Support', email: currentUser.email, recipient_email: recipientEmail, message: text, is_read: false
    }]);
    
    if (error) alert("Error sending reply: " + error.message);
    else { alert("Reply sent successfully!"); loadMessages(); }
}

async function deleteRecord(table, id, fallbackId = null, fallbackTitle = null) {
    if (!confirm("Are you 100% sure you want to permanently delete this?")) return;
    await logAction(`DELETE_${table.toUpperCase()}`, `ID: ${id}`, `Deleted from admin panel.`);
    const { error } = await myDatabase.from(table).delete().eq('id', id);
    if (error) alert("Error deleting: " + error.message);
    else {
        if (table === 'messages') loadMessages();
        else if (table === 'comments') moderateComments(fallbackId, fallbackTitle);
        else { loadReviewQueue(); loadLibrary(); }
    }
}

async function openEdit(id) {
    const area = document.getElementById('admin-content-area');
    area.innerHTML = `<div class="window-box"><p>Loading record...</p></div>`;
    
    const { data, error } = await myDatabase.from('meals').select('*').eq('id', id).single();
    if (error) { alert("Error: " + error.message); switchAdminTab('library'); return; }

    let countryOptionsHTML = '<option value="">-- None / Global --</option>';
    if (typeof countries !== 'undefined') {
        countries.forEach(c => {
            const isSel = (data.country === c) ? 'selected' : '';
            countryOptionsHTML += `<option value="${c}" ${isSel}>${c}</option>`;
        });
    }

    let categoryOptionsHTML = '<option value="">-- Select Category --</option>';
    const hardcodedCats = ['budget', 'special', '7-Day Meal Plans'];
    hardcodedCats.forEach(hc => {
        const isSel = (data.category === hc) ? 'selected' : '';
        categoryOptionsHTML += `<option value="${hc}" ${isSel}>${hc === 'budget' ? 'budget (Budget Meal)' : hc}</option>`;
    });
    
    if (typeof categories !== 'undefined') {
        Object.keys(categories).forEach(mainCat => {
            categories[mainCat].forEach(sub => {
                if (!hardcodedCats.includes(sub)) {
                    const isSel = (data.category === sub) ? 'selected' : '';
                    categoryOptionsHTML += `<option value="${sub}" ${isSel}>${sub}</option>`;
                }
            });
        });
    }

    let currentPhotoHTML = '';
    if (data.image_url) {
        currentPhotoHTML = `
            <div style="margin-bottom: 15px; padding: 10px; border: 1px solid var(--border); background: #fdf6e3; display: inline-block;">
                <p style="margin: 0 0 10px 0; font-size: 0.9rem; font-weight: bold;">Currently Live Photo:</p>
                <img src="${data.image_url}" style="width: 150px; height: 100px; object-fit: cover; border-radius: 4px; display: block; margin-bottom: 10px;">
                <button onclick="adminRemovePhoto('${data.id}', '${data.image_url}')" style="margin: 0;">🗑️ Remove Photo</button>
            </div>
        `;
    } else {
        currentPhotoHTML = `<p style="font-size: 0.9rem; color: #666; margin-bottom: 15px;">No live photo for this recipe.</p>`;
    }

    area.innerHTML = `
        <div class="window-box" style="width: 100%; box-sizing: border-box;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">Edit Record</h2>
                <button onclick="switchAdminTab('library')" style="margin: 0;">Cancel & Return</button>
            </div>
            
            <div class="window-box" style="margin-bottom: 20px;">
                <h3 style="margin-top: 0;">🖼️ Recipe Photo Management</h3>
                ${currentPhotoHTML}
                <label style="font-size: 0.85rem; color: #555; display: block; border-top: 1px dashed var(--border); padding-top: 10px; margin-top: 10px; width: 100%;">Upload / Replace Live Photo (Bypasses moderation queue):</label>
                <div style="display: flex; gap: 10px; align-items: center; margin-top: 10px;">
                    <input type="file" id="admin-recipe-photo-${data.id}" accept="image/*" style="margin: 0;">
                    <button onclick="adminUploadRecipePhoto('${data.id}')" style="margin: 0;">Upload & Set Live</button>
                </div>
            </div>

            <input type="hidden" id="edit-id" value="${data.id}">
            <label style="font-weight: bold; font-size: 0.9rem;">Recipe Title</label>
            <input type="text" id="edit-title" placeholder="Recipe Title" value="${(data.title || '').replace(/"/g, '&quot;')}">
            
            <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 250px;">
                    <label style="font-weight: bold; font-size: 0.9rem;">Category</label>
                    <select id="edit-category" onchange="toggleAdminFields()" style="width: 100%; box-sizing: border-box;">
                        ${categoryOptionsHTML}
                    </select>
                </div>
                <div style="flex: 1; min-width: 250px;">
                    <label style="font-weight: bold; font-size: 0.9rem;">Country</label>
                    <select id="edit-country" style="width: 100%; box-sizing: border-box;">
                        ${countryOptionsHTML}
                    </select>
                </div>
            </div>
            
            <label style="font-weight: bold; font-size: 0.9rem;">Meal Type (Crucial for Budget Meals)</label>
            <select id="edit-meal-type" onchange="toggleAdminFields()">
                <option value="" ${!data.meal_type ? 'selected' : ''}>Global Recipe (No specific type)</option>
                <option value="home" ${data.meal_type === 'home' ? 'selected' : ''}>Home-Cooked (Uses Ingredients)</option>
                <option value="takeaway" ${data.meal_type === 'takeaway' ? 'selected' : ''}>Takeaway (No Ingredients)</option>
            </select>
            
            <div id="edit-budget-fields" style="display:none; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                <div style="flex:1; min-width: 150px;"><label style="font-weight: bold; font-size: 0.9rem;">Total Cost</label><input type="number" id="edit-cost" placeholder="Cost" step="any" value="${data.cost || ''}"></div>
                <div style="flex:1; min-width: 150px;"><label style="font-weight: bold; font-size: 0.9rem;">Servings</label><input type="number" id="edit-servings" placeholder="Servings" value="${data.servings || ''}"></div>
            </div>
            
            <div id="edit-ingredients-container" class="window-box" style="margin-bottom: 20px;">
                <h3 style="margin-top: 0;">Ingredients</h3>
                <div id="edit-ingredients-list"></div>
                <button onclick="adminAddIngredientRow()" style="margin-top: 15px;">+ Add Ingredient Row</button>
            </div>
            
            <label style="font-weight: bold; font-size: 0.9rem;">Instructions / What is Included</label>
            <textarea id="edit-instructions" rows="8" placeholder="Instructions...">${(data.recipe || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
            
            <button style="width: 100%; font-size: 1.1rem; padding: 15px; margin: 0;" onclick="saveEdit()">💾 Save Changes to Database</button>
        </div>
    `;

    toggleAdminFields();

    const ingList = document.getElementById('edit-ingredients-list');
    ingList.innerHTML = ''; 
    if (data.ingredients && Array.isArray(data.ingredients)) {
        data.ingredients.forEach(ing => adminAddIngredientRow(ing.item, ing.qty, ing.unit));
    }
    adminAddIngredientRow(); 
}

async function adminRemovePhoto(id, url) {
    if(!confirm("Are you sure you want to remove the live photo? This will delete the file entirely.")) return;
    await logAction('REMOVE_PHOTO', `Recipe ID: ${id}`, `Removed live photo manually.`);
    const fileName = url.split('/').pop();
    await myDatabase.storage.from('recipe_images').remove([fileName]);
    const { error } = await myDatabase.from('meals').update({ image_url: null }).eq('id', id);
    if(error) alert("Error: " + error.message);
    else openEdit(id);
}

async function adminUploadRecipePhoto(id) {
    const file = document.getElementById(`admin-recipe-photo-${id}`).files[0];
    if (!file) return alert("Select an image first.");
    
    alert("Uploading directly to live...");
    const name = `recipe-${id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const { error: err1 } = await myDatabase.storage.from('recipe_images').upload(name, file);
    if (err1) return alert("Upload Failed: " + err1.message);

    const url = myDatabase.storage.from('recipe_images').getPublicUrl(name).data.publicUrl;
    
    await logAction('UPLOAD_PHOTO', `Recipe ID: ${id}`, `Uploaded new live photo manually.`);
    const { error: err2 } = await myDatabase.from('meals').update({ image_url: url, pending_image_url: null }).eq('id', id);
    if (err2) alert("Database Error: " + err2.message);
    else openEdit(id);
}

function toggleAdminFields() {
    const cat = document.getElementById('edit-category').value.toLowerCase();
    const mType = document.getElementById('edit-meal-type').value;
    document.getElementById('edit-budget-fields').style.display = cat === 'budget' ? 'flex' : 'none';
    document.getElementById('edit-ingredients-container').style.display = mType === 'takeaway' ? 'none' : 'block';
}

function adminAddIngredientRow(name = '', qty = '', unit = '') {
    const list = document.getElementById('edit-ingredients-list');
    const row = document.createElement('div');
    row.className = 'ingredient-row';
    row.style.display = 'flex'; row.style.gap = '10px'; row.style.marginBottom = '10px';
    const safeQty = (qty !== null && qty !== undefined) ? qty : '';
    row.innerHTML = `
        <input type="text" class="ing-name" placeholder="Item Name" value="${name.replace(/"/g, '&quot;')}" style="flex: 2; margin: 0;">
        <input type="number" step="any" class="ing-qty" placeholder="Qty" value="${safeQty}" style="flex: 1; margin: 0;">
        <input type="text" class="ing-unit" placeholder="Unit" value="${unit.replace(/"/g, '&quot;')}" style="flex: 1; margin: 0;">
        <button style="margin: 0; padding: 0 15px;" onclick="this.parentElement.remove()">X</button>
    `;
    list.appendChild(row);
}

async function saveEdit() {
    const id = document.getElementById('edit-id').value;
    const cat = document.getElementById('edit-category').value.trim();
    const mType = document.getElementById('edit-meal-type').value;
    
    let structuredIngredients = null;
    if (mType !== 'takeaway') {
        structuredIngredients = [];
        document.querySelectorAll('#edit-ingredients-list .ingredient-row').forEach(row => {
            const name = row.querySelector('.ing-name').value.trim();
            const qty = row.querySelector('.ing-qty').value;
            if (name !== "") structuredIngredients.push({ item: name, qty: qty ? parseFloat(qty) : null, unit: row.querySelector('.ing-unit').value.trim() });
        });
    }

    let payload = {
        title: document.getElementById('edit-title').value.trim(), category: cat, country: document.getElementById('edit-country').value.trim(),
        meal_type: mType === "" ? null : mType, recipe: document.getElementById('edit-instructions').value.trim(), ingredients: structuredIngredients
    };

    let resolvedParent = null;
    if (cat === 'budget' || cat === 'special') resolvedParent = null;
    else if (cat === '7-Day Meal Plans') resolvedParent = 'Specialized Plans';
    else { resolvedParent = getParentCategory(cat); }
    
    if (resolvedParent) { payload.parent_category = resolvedParent; }

    if (cat === 'budget') {
        payload.cost = parseFloat(document.getElementById('edit-cost').value);
        payload.servings = parseInt(document.getElementById('edit-servings').value);
    } else { payload.cost = null; payload.servings = null; }

    await logAction('EDIT_RECIPE', `ID: ${id}`, `Edited details manually.`);
    const { error } = await myDatabase.from('meals').update(payload).eq('id', id);
    if (error) alert("Error saving: " + error.message);
    else { alert("Updated successfully!"); switchAdminTab('library'); }
}

// ==========================================
//        FRONTEND UTILITIES (COOKBOOK/FAVS)
// ==========================================
async function checkFavoriteStatus(recipeId) {
    if (!currentUser) return;
    const btn = document.getElementById(`fav-btn-${recipeId}`);
    if (!btn) return;
    
    const { data } = await myDatabase.from('favorites').select('id').eq('user_email', currentUser.email).eq('recipe_id', recipeId).single();
    if (data) { btn.innerHTML = '⭐ Saved to Favorites'; btn.dataset.saved = 'true'; } 
    else { btn.innerHTML = '⭐ Save to Favorites'; btn.dataset.saved = 'false'; }
}

async function toggleFavorite(recipeId) {
    if (!currentUser) { alert("Please create a free account to save recipes to your personal cookbook!"); openAuthModal(); return; }

    const btn = document.getElementById(`fav-btn-${recipeId}`);
    btn.disabled = true;
    
    if (btn.dataset.saved === 'true') {
        const { error } = await myDatabase.from('favorites').delete().eq('user_email', currentUser.email).eq('recipe_id', recipeId);
        if (!error) { btn.innerHTML = '⭐ Save to Favorites'; btn.dataset.saved = 'false'; }
    } else {
        const { error } = await myDatabase.from('favorites').insert([{ user_email: currentUser.email, recipe_id: recipeId }]);
        if (!error) { btn.innerHTML = '⭐ Saved to Favorites'; btn.dataset.saved = 'true'; }
    }
    btn.disabled = false;
}

async function loadCookbook() {
    const list = document.getElementById('cookbook-list');
    list.innerHTML = 'Loading your recipes...';
    
    const { data: favs, error: favErr } = await myDatabase.from('favorites').select('recipe_id').eq('user_email', currentUser.email).order('created_at', { ascending: false });
    if (favErr) { list.innerHTML = 'Error loading favorites.'; return; }
    if (!favs || favs.length === 0) { list.innerHTML = '<p style="text-align:center; color:#666; margin-top: 20px;">Your cookbook is empty. Explore recipes and click "Save to Favorites" to build your collection!</p>'; return; }
    
    const recipeIds = favs.map(f => f.recipe_id);
    const { data: meals, error: mealErr } = await myDatabase.from('meals').select('id, title, category, author, meal_type, country').in('id', recipeIds);
    if (mealErr) { list.innerHTML = 'Error loading recipes.'; return; }
    
    let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';
    favs.forEach(fav => {
        const meal = meals.find(m => m.id === fav.recipe_id);
        if (meal) {
            const isBudget = meal.category === 'budget';
            const clickAction = isBudget ? `viewBudgetMeal('${meal.id}')` : `viewRecipe('${meal.id}')`;
            const badge = isBudget ? ` - BUDGET (${meal.country})` : '';
            const author = meal.author || 'Community';
            
            html += `
                <div class="window-box" onclick="${clickAction}" style="padding: 15px; cursor: pointer; margin-bottom: 0; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
                    <div>
                        <div style="font-size: 1.1rem; font-weight: bold; margin-bottom: 5px;">${meal.title}${badge}</div>
                        <div style="font-size: 0.85rem; color: #666;">In ${meal.category} • By ${author}</div>
                    </div>
                    <button onclick="removeFromCookbook('${meal.id}', event)" style="margin: 0; white-space: nowrap;">❌ Remove</button>
                </div>
            `;
        }
    });
    html += '</div>';
    list.innerHTML = html;
}

async function removeFromCookbook(recipeId, event) {
    event.stopPropagation(); 
    if (!confirm("Remove this recipe from your cookbook?")) return;
    const { error } = await myDatabase.from('favorites').delete().eq('user_email', currentUser.email).eq('recipe_id', recipeId);
    if (error) alert("Error: " + error.message); else loadCookbook(); 
}

// ==========================================
//        FAMILY HUB LOGIC
// ==========================================
async function saveFamilyMember(event) {
    const name = document.getElementById('family-name').value.trim();
    const type = document.getElementById('family-type').value;
    const story = document.getElementById('family-story').value.trim();
    const orderIndex = document.getElementById('family-order').value;
    const fileInput = document.getElementById('family-image');
    const file = fileInput.files[0];

    if (!name || !story || !file) return alert("Please fill in the name, story, and select a photo!");

    const btn = event ? event.target : document.querySelector('button[onclick^="saveFamilyMember"]');
    const originalText = btn ? btn.innerText : 'Add to Family Hub';
    if (btn) { btn.innerText = "Uploading... please wait"; btn.disabled = true; }

    const fileName = `family-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const { error: uploadError } = await myDatabase.storage.from('recipe_images').upload(fileName, file);
    if (uploadError) { if (btn) { btn.innerText = originalText; btn.disabled = false; } return alert("Photo upload failed: " + uploadError.message); }

    const imageUrl = myDatabase.storage.from('recipe_images').getPublicUrl(fileName).data.publicUrl;

    await logAction('ADD_FAMILY', `Name: ${name}`, `Added to Sanctuary.`);
    const { error: dbError } = await myDatabase.from('family_members').insert([{ name: name, type: type, story: story, image_url: imageUrl, order_index: parseInt(orderIndex) || 1 }]);

    if (btn) { btn.innerText = originalText; btn.disabled = false; }
    if (dbError) { alert("Database error: " + dbError.message); } 
    else {
        alert("Successfully added to the Family Hub!");
        document.getElementById('family-name').value = '';
        document.getElementById('family-story').value = '';
        fileInput.value = '';
        loadAdminFamilyList();
    }
}

async function loadAdminFamilyList() {
    const listDiv = document.getElementById('admin-family-list');
    if (!listDiv) return;
    listDiv.innerHTML = "<p>Loading family members...</p>";

    const { data, error } = await myDatabase.from('family_members').select('*').order('order_index', { ascending: true });
    if (error) { listDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`; return; }
    if (data.length === 0) { listDiv.innerHTML = "<p>No family members added yet.</p>"; return; }

    let html = "";
    data.forEach((member, index) => {
        let sortButtons = '';
        if (data.length > 1) {
            if (index > 0) sortButtons += `<button style="margin: 0; padding: 4px 8px; flex: 1;" onclick="moveFamilyMember('${member.id}', 'up')">⬆️</button>`;
            if (index < data.length - 1) sortButtons += `<button style="margin: 0; padding: 4px 8px; flex: 1;" onclick="moveFamilyMember('${member.id}', 'down')">⬇️</button>`;
        }

        html += `
            <div class="window-box" style="display: flex; gap: 15px; padding: 15px; margin-bottom: 0; align-items: center; justify-content: space-between; flex-wrap: wrap;">
                <div style="display: flex; gap: 15px; flex: 1; align-items: center;">
                    <img src="${member.image_url}" style="width: 80px; height: 80px; min-width: 80px; object-fit: cover; border-radius: 50%;">
                    <div>
                        <h4 style="margin: 0 0 5px 0; font-size: 1.1rem;">${member.name} <span style="font-size: 0.8rem; color: #666; font-weight: normal;">(${member.type.toUpperCase()}) - Order: ${member.order_index}</span></h4>
                        <p style="margin: 0; font-size: 0.9rem; color: #555; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${member.story}</p>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px; min-width: 80px;">
                    <div style="display: flex; gap: 5px; width: 100%;">${sortButtons}</div>
                    <button style="margin: 0; width: 100%; padding: 6px;" onclick="deleteFamilyMember('${member.id}', '${member.image_url}')">Delete</button>
                </div>
            </div>
        `;
    });
    listDiv.innerHTML = html;
}

async function moveFamilyMember(id, direction) {
    const listDiv = document.getElementById('admin-family-list');
    listDiv.innerHTML = "<p>Updating order...</p>";

    const { data, error } = await myDatabase.from('family_members').select('id, order_index').order('order_index', { ascending: true });
    if (error || !data) { alert("Error loading order."); return loadAdminFamilyList(); }

    const currentIndex = data.findIndex(m => m.id == id);
    if (currentIndex === -1) return loadAdminFamilyList();

    let swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= data.length) return loadAdminFamilyList();

    const temp = data[currentIndex]; data[currentIndex] = data[swapIndex]; data[swapIndex] = temp;

    for (let i = 0; i < data.length; i++) {
        await myDatabase.from('family_members').update({ order_index: i + 1 }).eq('id', data[i].id);
    }
    loadAdminFamilyList(); 
}

async function deleteFamilyMember(id, imageUrl) {
    if (!confirm("Are you sure you want to remove this family member?")) return;
    await logAction('DELETE_FAMILY', `ID: ${id}`, `Deleted from Sanctuary.`);
    const fileName = imageUrl.split('/').pop();
    await myDatabase.storage.from('recipe_images').remove([fileName]);
    const { error } = await myDatabase.from('family_members').delete().eq('id', id);
    if (error) alert("Error deleting: " + error.message); else loadAdminFamilyList(); 
}

// ==========================================
//        COMMUNITY BROADCASTS
// ==========================================
async function postBroadcast(event) {
    const message = document.getElementById('broadcast-message').value.trim();
    const signature = document.getElementById('broadcast-signature').value;

    if (!message) return alert("Please type a message first!");

    const btn = event ? event.target : document.querySelector('button[onclick^="postBroadcast"]');
    const originalText = btn.innerText; btn.innerText = "Sending..."; btn.disabled = true;

    await logAction('BROADCAST_SENT', `Signature: ${signature}`, `Sent new public broadcast.`);
    const { error } = await myDatabase.from('community_updates').insert([{ message: message, author_signature: '— ' + signature }]);

    btn.innerText = originalText; btn.disabled = false;
    if (error) alert("Error posting broadcast: " + error.message);
    else { document.getElementById('broadcast-message').value = ''; loadAdminBroadcasts(); }
}

async function loadAdminBroadcasts() {
    const listDiv = document.getElementById('admin-broadcast-list');
    if (!listDiv) return;
    const { data, error } = await myDatabase.from('community_updates').select('*').order('created_at', { ascending: false });

    if (error) { listDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`; return; }
    if (data.length === 0) { listDiv.innerHTML = "<p>No broadcasts sent yet.</p>"; return; }

    let html = "";
    data.forEach(update => {
        const dateStr = new Date(update.created_at).toLocaleString();
        html += `
            <div class="window-box" style="padding: 15px; margin-bottom: 0; display: flex; justify-content: space-between; align-items: flex-start; gap: 15px;">
                <div style="flex: 1;">
                    <p style="margin: 0 0 10px 0; white-space: pre-wrap; font-size: 1rem;">${update.message}</p>
                    <p style="margin: 0; font-size: 0.85rem; font-weight: bold; color: #007bff;">${update.author_signature} <span style="font-weight: normal; color: #666;">(${dateStr})</span></p>
                </div>
                <button style="margin: 0; padding: 6px 12px;" onclick="deleteBroadcast('${update.id}')">Delete</button>
            </div>
        `;
    });
    listDiv.innerHTML = html;
}

async function deleteBroadcast(id) {
    if (!confirm("Delete this broadcast? It will be removed from the users' feed instantly.")) return;
    await logAction('DELETE_BROADCAST', `ID: ${id}`, `Removed broadcast from feed.`);
    const { error } = await myDatabase.from('community_updates').delete().eq('id', id);
    if (error) alert("Error deleting: " + error.message); else loadAdminBroadcasts();
}

function renderPublicBroadcasts() {
    const view = document.getElementById('main-view');
    view.innerHTML = `
        <div class="window-box" style="width: 100%; max-width: 800px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; text-align: center;">
            <h1 style="margin-top: 0; margin-bottom: 5px; font-size: 1.8rem;">📣 COMMUNITY UPDATES</h1>
            <p style="font-size: 1.1rem; color: #555; margin-top: 0; margin-bottom: 0;">The latest news, announcements, and updates straight from Anton & Jenny.</p>
        </div>
        <div id="public-broadcast-list" style="width: 100%; max-width: 800px; display: flex; flex-direction: column; gap: 15px;">
            <p>Loading updates...</p>
        </div>
    `;
    
    const badge = document.getElementById('new-broadcast-badge');
    if (badge) badge.style.display = 'none';
    
    localStorage.setItem('last_broadcast_view', Date.now().toString());
    loadPublicBroadcasts();
}

async function loadPublicBroadcasts() {
    const container = document.getElementById('public-broadcast-list');
    if (!container) return;

    const cacheKey = 'cache_public_broadcasts';

    const renderList = (data) => {
        if (data.length === 0) { container.innerHTML = `<div class="window-box"><p>No recent announcements.</p></div>`; return; }

        let html = '';
        data.forEach(update => {
            const dateStr = new Date(update.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            html += `
                <div class="window-box" style="background: #fff; margin-bottom: 0; border-left: 5px solid #007bff; padding: 20px;">
                    <p style="font-size: 0.85rem; color: #666; margin: 0 0 10px 0; font-weight: bold; text-transform: uppercase;">${dateStr}</p>
                    <p style="margin: 0 0 15px 0; font-size: 1.1rem; line-height: 1.6; white-space: pre-wrap;">${update.message}</p>
                    <p style="margin: 0; font-weight: bold; color: #007bff; font-family: 'Georgia', serif; font-size: 1.1rem;">${update.author_signature}</p>
                </div>
            `;
        });
        container.innerHTML = html;
    };

    if (!localStorage.getItem(cacheKey)) container.innerHTML = '<p>Loading updates...</p>';

    await fetchWithSWR(
        cacheKey,
        async () => {
            const { data, error } = await myDatabase.from('community_updates').select('*').order('created_at', { ascending: false });
            if (error) throw error; return data;
        },
        renderList
    );
}

async function checkNewBroadcasts() {
    const { data, error } = await myDatabase.from('community_updates').select('created_at').order('created_at', { ascending: false }).limit(1);
    if (!error && data.length > 0) {
        const latestDbTime = new Date(data[0].created_at).getTime();
        const lastViewTime = parseInt(localStorage.getItem('last_broadcast_view') || '0');
        if (latestDbTime > lastViewTime) {
            const badge = document.getElementById('new-broadcast-badge');
            if (badge) badge.style.display = 'block';
        }
    }
}

// ==========================================
//        CAMPFIRE LOGIC
// ==========================================
async function loadAdminCampfire() {
    const listDiv = document.getElementById('admin-campfire-list');
    if (!listDiv) return;
    const { data, error } = await myDatabase.from('global_chat').select('*').order('created_at', { ascending: false }).limit(100);

    if (error) { listDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`; return; }
    if (data.length === 0) { listDiv.innerHTML = "<p>No messages in the campfire.</p>"; return; }

    let html = "";
    data.forEach(msg => {
        const dateStr = new Date(msg.created_at).toLocaleString();
        html += `
            <div class="window-box" style="padding: 15px; margin-bottom: 0; display: flex; justify-content: space-between; align-items: flex-start; gap: 15px;">
                <div style="flex: 1;">
                    <p style="margin: 0 0 5px 0; font-size: 0.85rem; color: #666;">
                        <span style="color:#007bff; font-weight:bold; cursor:pointer;" onclick="openModMenu('${msg.user_id}', 'Unknown', '${msg.user_name}', event)">${msg.user_name} ⚙️</span> - ${dateStr}
                    </p>
                    <p style="margin: 0; font-size: 1rem; word-wrap: break-word;">${msg.message}</p>
                </div>
                <button style="margin: 0; padding: 6px 12px;" onclick="adminDeleteCampfireMessage('${msg.id}', this)">Delete</button>
            </div>
        `;
    });
    listDiv.innerHTML = html;
}

async function adminDeleteCampfireMessage(id, btnElement) {
    if (!confirm("Permanently delete this message from the public campfire?")) return;
    await logAction('DELETE_CHAT', `ID: ${id}`, `Deleted from campfire logs.`);
    const { error } = await myDatabase.from('global_chat').delete().eq('id', id);
    if (error) alert("Error deleting message: " + error.message);
    else { if (btnElement) btnElement.closest('.window-box').remove(); }
}

function renderShoutbox() {
    const view = document.getElementById('main-view');
    let inputArea = '';
    if (currentUser) {
        inputArea = `
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <input type="text" id="shoutbox-input" placeholder="Say hello to the community..." style="flex: 1; margin: 0;" onkeyup="if(event.key === 'Enter') postShoutboxMessage()">
                <button onclick="postShoutboxMessage()" style="margin: 0;">Send 🔥</button>
            </div>
        `;
    } else {
        inputArea = `
            <div style="background: #f0f0f0; border: 2px dashed var(--border); padding: 15px; text-align: center; margin-bottom: 20px;">
                <p style="margin-top: 0; font-weight: bold; color: #000000;">Want to join the conversation around the fire?</p>
                <button onclick="openAuthModal()" style="margin: 0;">Sign In to Chat</button>
            </div>
        `;
    }

    view.innerHTML = `
        <div class="window-box" style="width: 100%; max-width: 800px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; text-align: center;">
            <h1 style="margin-top: 0; margin-bottom: 5px; font-size: 1.8rem;">🔥 THE CAMPFIRE</h1>
            <p style="font-size: 1.1rem; color: #555; margin-top: 0; margin-bottom: 0;">Pull up a log. This is our global community shoutbox. Say hi, share what you're cooking, and connect with everyday cooks from all over the world!</p>
        </div>
        <div style="width: 100%; max-width: 800px; box-sizing: border-box;">
            ${inputArea}
            <div id="shoutbox-messages" style="display: flex; flex-direction: column; gap: 10px;">
                <p>Loading messages...</p>
            </div>
        </div>
    `;
    loadShoutboxMessages();
}

async function loadShoutboxMessages() {
    const container = document.getElementById('shoutbox-messages');
    if (!container) return;

    const cacheKey = 'cache_shoutbox_messages';

    const renderList = (data) => {
        if (data.length === 0) { container.innerHTML = `<p style="text-align: center; color: #666; font-style: italic;">The campfire is quiet. Be the first to speak!</p>`; return; }

        let html = '';
        data.forEach(msg => {
            const isStaff = msg.user_name.includes('(Founder)') || msg.user_name.includes('(Admin)') || msg.user_name.includes('(Moderator)');
            const nameStyle = isStaff ? 'color: #d9534f; font-weight: 900;' : 'color: #333; font-weight: bold;';
            const timeStr = new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            let nameHTML = `<span style="${nameStyle}">${msg.user_name}</span>`;
            let reportBtn = currentUser ? `<span style="cursor:pointer; font-size: 0.8rem; opacity: 0.5;" onclick="reportShoutbox('${msg.id}', '${msg.message.replace(/'/g, "\\'")}')" title="Report Message">🚩</span>` : '';
            
            let adminControls = '';
            if (isAdmin) {
                nameHTML = `<span style="${nameStyle} cursor: pointer; color: #007bff;" onclick="openModMenu('${msg.user_id}', 'Unknown', '${msg.user_name}', event)">${msg.user_name} ⚙️</span>`;
                adminControls = `<button onclick="adminDeleteContent('global_chat', '${msg.id}', this)" style="padding: 4px 8px; font-size: 0.7rem; margin-left: 10px;">Delete</button>`;
            }

            html += `
                <div class="window-box" style="padding: 10px; margin-bottom: 0; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; align-items: center;">
                        <div>${nameHTML}<span style="font-size: 0.75rem; color: #888; margin-left: 8px;">${timeStr}</span></div>
                        <div>${reportBtn}${adminControls}</div>
                    </div>
                    <div style="font-size: 0.95rem; line-height: 1.4; word-wrap: break-word;">${msg.message}</div>
                </div>
            `;
        });
        container.innerHTML = html;
    };

    if (!localStorage.getItem(cacheKey)) container.innerHTML = '<p>Loading messages...</p>';

    await fetchWithSWR(
        cacheKey,
        async () => {
            const { data, error } = await myDatabase.from('global_chat').select('*').order('created_at', { ascending: false }).limit(50);
            if (error) throw error; return data;
        },
        renderList
    );
}

async function postShoutboxMessage() {
    if (!currentUser) return openAuthModal();
    if(await isUserBanned()) return; 

    const input = document.getElementById('shoutbox-input');
    const text = input.value.trim();
    if (!text) return;

    input.disabled = true;
    let displayName = getUserDisplayName();

    const { error } = await myDatabase.from('global_chat').insert([{ user_id: currentUser.id, user_name: displayName, message: text }]);

    input.disabled = false;
    if (error) alert("Error posting: " + error.message);
    else { input.value = ''; loadShoutboxMessages(); }
}

async function reportShoutbox(id, text) {
    if (!currentUser) { alert("Please sign in to report content."); openAuthModal(); return; }
    const reason = prompt("Why are you reporting this message?");
    if (!reason) return;
    const reporterEmail = currentUser.email;
    
    await myDatabase.from('reports').insert([{ item_type: 'chat', item_id: id, reported_by: currentUser.id }]);
    await myDatabase.from('messages').insert([{ 
        name: "🚩 REPORTED CHAT", email: reporterEmail, recipient_email: 'admin', message: "REASON: " + reason + "\n\nMESSAGE:\n" + text, is_read: false
    }]);
    alert("Message reported. Thank you.");
}

async function renderFamilyPage() {
    const view = document.getElementById('main-view');
    view.innerHTML = `<div class="window-box" style="width: 100%; max-width: 800px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; text-align: center;"><h1>Opening the front door...</h1></div>`;

    const { data, error } = await myDatabase.from('family_members').select('*').order('order_index', { ascending: true });

    if (error) { view.innerHTML = `<div class="window-box" style="width: 100%; max-width: 800px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; text-align: center;"><p>Error: ${error.message}</p></div>`; return; }

    let html = `
        <div class="window-box" style="width: 100%; max-width: 800px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; text-align: center;">
            <h1 style="margin-top: 0; margin-bottom: 5px; font-size: 1.8rem;">🏡 MEET THE FAMILY</h1>
            <p style="font-size: 1.1rem; color: #555; margin-top: 0; margin-bottom: 0;">Welcome to our personal sanctuary. Get to know the humans and pets behind the platform!</p>
        </div>
    `;

    if (data.length === 0) {
        html += `<div class="window-box" style="width: 100%; max-width: 800px;"><p>The house is quiet... Anton & Jenny haven't uploaded their photos yet!</p></div>`;
    } else {
        html += `<div style="display: flex; flex-direction: column; gap: 15px; width: 100%; max-width: 800px;">`;
        data.forEach(member => {
            const isPet = member.type === 'pet';
            const badge = isPet ? '🐾 Family Pet' : '👤 The Team';
            
            html += `
                <div class="window-box" style="padding: 20px; display: flex; gap: 20px; align-items: flex-start; flex-wrap: nowrap; background: #fff; margin-bottom: 0;">
                    <img src="${member.image_url}" style="width: 100px; height: 100px; min-width: 100px; border-radius: 50%; border: 3px solid var(--border); object-fit: cover; flex-shrink: 0; background: #fdf6e3;">
                    <div style="flex: 1; min-width: 0;">
                        <span style="display: inline-block; padding: 4px 10px; background: #8b4513; color: white; font-size: 0.75rem; font-weight: bold; border-radius: 12px; margin-bottom: 8px; box-shadow: 1px 1px 0px rgba(0,0,0,0.2);">${badge}</span>
                        <h2 style="margin: 0 0 8px 0; font-size: 1.5rem; color: #2b1a10; font-family: 'Georgia', serif; line-height: 1.2;">${member.name}</h2>
                        <p style="margin: 0; font-size: 0.95rem; line-height: 1.6; color: #444; white-space: pre-wrap; word-wrap: break-word;">${member.story}</p>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }
    view.innerHTML = html;
}
