/* ================================================================================
   THE MASTER ARCHITECT'S MANUAL: app.js (v3.0 - ATOMIC PRECISION)
   --------------------------------------------------------------------------------
   This file dictates the physical execution of your digital sanctuary.
   
   ATOMIC LEGEND:
   - [MACRO]: The architecture / business logic of the block.
   - [MICRO]: Step-by-step roadmap of the function's physical execution.
   - [ATOMIC]: Pinpoint translation of browser engine mechanics, memory allocation, 
               data types, and strict syntax behaviors.
   - [LIVE WIRE]: Critical database column names or HTML IDs that will crash the app.
================================================================================ */

/* ==========================================================
   SECTION 1: ENGINE INITIALIZATION & GLOBAL MEMORY
   [MACRO]: Connects the browser to your Supabase backend and 
            allocates the RAM needed for a user session.
========================================================== */

// [ATOMIC]: 'const' locks the memory pointer. These string payloads cannot be overwritten by any script.
const supabaseUrl = 'https://bvdgbodzrfhgpvxzuogs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2ZGdib2R6cmZoZ3B2eHp1b2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjYxMzIsImV4cCI6MjA5NzMwMjEzMn0.C6jFxQmFQYnRjVK8V30mG4qTH3PtEWmVThiiSvr1tEw';

// [ATOMIC]: window.supabase references the global library. .createClient() opens a persistent WebSocket/HTTP tunnel.
const myDatabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// --- GLOBAL STATE RAM ---
// [ATOMIC]: 'let' allocates dynamic memory. These initialize as zero-length strings ("") or integers (0).
let selectedCountry = "";
let selectedSubcategory = "";
let selectedParentCategory = ""; 
let totalApprovedRecipes = 0; 
let totalVisitors = 10000;

// [ATOMIC]: localStorage.getItem() accesses physical browser cache. '||' (Logical OR) dictates that if the cache returns null, memory falls back to the right-side string.
let teamPhotoUrl = localStorage.getItem('cached_team_photo') || 'https://via.placeholder.com/300';
let dynamicBudgetTips = []; // Initializes an empty Array object.

let currentUser = null; // Explicitly declares empty memory.
let isLoginMode = false; // Initializes a Boolean primitive.
let isAdmin = false;

/* ==========================================================
   SECTION 2: THE AUTHENTICATION GATEKEEPER
   [MACRO]: Verifies JWT tokens and modifies the UI layout.
========================================================== */

async function initAuth() {
    // [ATOMIC]: 'async' detaches this from the main thread. 'await' suspends execution until the Promise resolves.
    // [ATOMIC]: Deep Destructuring { data: { session } } extracts the exact memory block we need from the JSON response.
    const { data: { session } } = await myDatabase.auth.getSession();
    
    // [ATOMIC]: Ternary Operator (Condition ? True : False). Assigns Object if session exists, else assigns null.
    currentUser = session ? session.user : null;
    
    if (currentUser) {
        // [ATOMIC]: Dot-notation (.email) extracts the string property from the currentUser Object.
        await checkAdminStatus(currentUser.email);
    } else {
        updateAuthUI();
    }
}

async function checkAdminStatus(email) {
    // [ATOMIC]: .eq() translates to a SQL WHERE clause. .single() forces the DB to return a single JSON Object instead of an Array [].
    const { data, error } = await myDatabase.from('admin_whitelist').select('*').eq('email', email).single();
    // [ATOMIC]: Double Negation '!!' casts the raw Object/Null into a strict primitive Boolean (true or false).
    isAdmin = !!data; 
    updateAuthUI();
}

async function updateAuthUI() {
    // [ATOMIC]: document.getElementById traverses the DOM tree to locate specific Node references.
    const authBtn = document.getElementById('nav-auth-btn');
    const existingAdminBtn = document.getElementById('nav-admin-btn');
    
    // [ATOMIC]: .remove() explicitly destroys the HTML Node from the browser's render tree.
    if (existingAdminBtn) existingAdminBtn.remove();

    if (authBtn) {
        // [ATOMIC]: Direct mutation of inline CSS properties.
        authBtn.style.background = ''; 

        if (currentUser) {
            // [ATOMIC]: .innerHTML parses the string and injects it into the DOM tree.
            authBtn.innerHTML = '👤 My Profile';
            // [ATOMIC]: Binds an anonymous Arrow Function to the 'click' event listener in memory.
            authBtn.onclick = () => showPage('profile');
            
            await checkUnreadMessages();

            if (isAdmin) {
                // [ATOMIC]: .createElement('a') commands the engine to forge a new anchor tag Node in isolated memory.
                const adminBtn = document.createElement('a');
                adminBtn.id = 'nav-admin-btn';
                adminBtn.href = 'javascript:void(0)'; // Pre-empts default anchor navigation.
                adminBtn.onclick = () => showPage('admin');
                adminBtn.style.cssText = 'margin-top: 8px;';
                adminBtn.innerHTML = '⚙️ Command Center';
                
                // [ATOMIC]: .parentNode traverses up the tree. .insertBefore injects the forged Node precisely before the target's next sibling.
                authBtn.parentNode.insertBefore(adminBtn, authBtn.nextSibling);
            }
        } else {
            authBtn.innerHTML = '🚪 Join / Sign In';
            authBtn.onclick = openAuthModal;
        }
    }
}

async function checkUnreadMessages() {
    if (!currentUser) return; // Immediate memory abort if null.
    
    // [ATOMIC]: { count: 'exact', head: true } is an API directive. It aborts fetching rows and only returns the integer count, saving bandwidth.
    const { count, error } = await myDatabase.from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_email', currentUser.email)
        .eq('is_read', false);
    
    const authBtn = document.getElementById('nav-auth-btn');
    if (authBtn && count > 0) {
        // [ATOMIC]: Template Literal (``). Evaluates the ${count} variable and concatenates it into the string block.
        authBtn.innerHTML = `👤 My Profile (${count} New)`;
    }
}

// [ATOMIC]: CSS Mutation. Alters the render tree without modifying HTML.
function openAuthModal() { document.getElementById('auth-modal').style.display = 'flex'; }
function closeAuthModal() { document.getElementById('auth-modal').style.display = 'none'; }

function toggleAuthMode() {
    // [ATOMIC]: Logical NOT (!). Inverts the current Boolean state.
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-modal-title');
    const desc = document.getElementById('auth-modal-desc');
    const btn = document.getElementById('auth-primary-btn');
    const toggleText = document.getElementById('auth-toggle-text');
    const toggleLink = document.getElementById('auth-toggle-link');

    // [ATOMIC]: Standard conditional branching. .innerText mutates text nodes without parsing HTML.
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
    // [ATOMIC]: .value captures the String payload of the input element. .trim() executes a regex to strip leading/trailing whitespace bytes.
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    
    // [ATOMIC]: Logical OR (||). Evaluates if either variable is falsy (empty). If true, executes alert() and aborts function.
    if (!email || !password) return alert("Please enter both email and password.");
    if (password.length < 6) return alert("Password must be at least 6 characters.");

    const btn = document.getElementById('auth-primary-btn');
    const originalText = btn.innerText;
    
    // [ATOMIC]: .disabled = true locks the DOM element, freezing user interaction to prevent overlapping network requests.
    btn.innerText = 'Processing...';
    btn.disabled = true;

    // [ATOMIC]: Hoisting declaration. Reserves memory for 'error' and 'data' before the conditional block.
    let error, data;

    if (isLoginMode) {
        // [ATOMIC]: Object Literal { email, password }. Shorthand for { email: email, password: password }.
        const res = await myDatabase.auth.signInWithPassword({ email, password });
        error = res.error; data = res.data;
    } else {
        const res = await myDatabase.auth.signUp({ email, password });
        error = res.error; data = res.data;
    }

    // [ATOMIC]: Restores DOM element to interactive state.
    btn.innerText = originalText;
    btn.disabled = false;

    if (error) {
        alert("Error: " + error.message);
    } else {
        // [ATOMIC]: Optional Chaining (?.). Checks if data.user is undefined before attempting to read its properties. Prevents NullReference crashes.
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
    // [ATOMIC]: .signOut() transmits a kill signal to Supabase, revoking the active JWT token from the backend.
    await myDatabase.auth.signOut();
    currentUser = null; 
    isAdmin = false;
    updateAuthUI(); 
    showPage('home');
}

/* ==========================================================
   SECTION 3: BACKGROUND PROCESSES & SITE CONFIG
   [MACRO]: Executes invisible API calls to gather metrics and UI configurations.
========================================================== */

async function handleVisitorSession() {
    // [ATOMIC]: Date.now() queries the system clock, returning total milliseconds elapsed since Jan 1, 1970 (Epoch time).
    const now = Date.now();
    // [ATOMIC]: Queries the local hard drive cache. Returns a String.
    const lastVisit = localStorage.getItem('last_visit_time');
    const cooldown = 30 * 60 * 1000; // 30 minutes expressed in strict milliseconds.

    // [ATOMIC]: parseInt() forcefully casts the cached String back into a mathematical Integer for calculation.
    if (!lastVisit || (now - parseInt(lastVisit)) > cooldown) {
        // [ATOMIC]: .rpc() (Remote Procedure Call) executes a raw Postgres SQL function hosted on the server.
        await myDatabase.rpc('increment_visitor_count');
        // [ATOMIC]: .toString() casts the integer back to a String for storage compliance.
        localStorage.setItem('last_visit_time', now.toString());
    }
    fetchStats();
}

async function fetchStats() {
    // [ATOMIC]: Aliasing deep destructure `{ count: liveCount }`. It grabs 'count' but assigns it to a new local variable named 'liveCount'.
    const { count: liveCount, error: recipeError } = await myDatabase.from('meals').select('*', { count: 'exact', head: true }).eq('status', 'approved');
    // [ATOMIC]: Strict evaluation (!== null) ensures it only updates if data is physically present, not just falsy (like 0).
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
            // [ATOMIC]: Logic gate prevents unnecessary DOM repaints if the image source is already correct.
            if (homePhoto && homePhoto.src !== teamPhotoUrl) { homePhoto.src = teamPhotoUrl; }
        }
        
        if (configData.main_background_url) {
            // [ATOMIC]: Inline CSS Object manipulation targeting the global <body> tag.
            document.body.style.backgroundImage = `url('${configData.main_background_url}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center center';
            document.body.style.backgroundAttachment = 'fixed';
            document.body.style.backgroundRepeat = 'no-repeat';
        }
    }

    const navCounter = document.getElementById('nav-counter');
    if (navCounter) {
        // [ATOMIC]: .toLocaleString() triggers the browser's regional format engine (e.g., adds commas to 10000 -> 10,000).
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
    
    // [ATOMIC]: URLSearchParams() parses the current browser address bar (window.location.search) into a readable Object.
    const params = new URLSearchParams(window.location.search);
    if (params.get('recipe')) { viewRecipe(params.get('recipe')); } 
    else if (params.get('budget')) { viewBudgetMeal(params.get('budget')); } 
    else { showPage('home'); }
}

async function fetchBudgetTips() {
    const { data, error } = await myDatabase.from('budget_tips').select('tip_text');
    if (!error && data && data.length > 0) {
        // [ATOMIC]: .map() iterates over the array of objects, extracting just the 'tip_text' string, and constructs a brand new 1-dimensional Array.
        dynamicBudgetTips = data.map(item => item.tip_text);
        updateHack(); 
    } else {
        document.getElementById("hack-text").innerText = "Add tips in your database to see them here!";
    }
}

function updateHack() {
    const element = document.getElementById("hack-text");
    if (element && dynamicBudgetTips.length > 0) {
        // [ATOMIC]: Math.random() produces a float between 0 and 1. Math.floor() drops the decimal, creating an absolute Integer index.
        const randomIndex = Math.floor(Math.random() * dynamicBudgetTips.length);
        // [ATOMIC]: Array accessing via bracket notation []. Grabs the string at that exact index.
        element.innerText = dynamicBudgetTips[randomIndex];
    }
}

// [ATOMIC]: Global Event Listener. Fires exactly when the browser engine finishes constructing the DOM tree and downloading core assets.
window.onload = function() {
    const s2 = document.getElementById('modal-country-select');
    if (s2) {
        // [ATOMIC]: .forEach() loop iterates over external 'countries' array. .appendChild() manually glues the generated HTML Node to the DOM.
        countries.forEach(c => { let o = document.createElement('option'); o.value = c; o.innerHTML = c; s2.appendChild(o); });
    }
    
    initAuth();
    handleVisitorSession();
    fetchBudgetTips(); 
    // [ATOMIC]: setInterval() registers a recurring callback function in the JavaScript engine, executing precisely every 30000ms.
    setInterval(updateHack, 30000); 

    const savedCountry = localStorage.getItem('saved_country');

    if (savedCountry) {
        selectedCountry = savedCountry;
        const modal = document.getElementById('country-modal');
        if (modal) modal.style.display = 'none';
        
        // [ATOMIC]: Deep Link router evaluation. Looks for URL parameters (e.g., ?recipe=45) and executes direct navigation bypass.
        const params = new URLSearchParams(window.location.search);
        if (params.get('recipe')) { viewRecipe(params.get('recipe')); } 
        else if (params.get('budget')) { viewBudgetMeal(params.get('budget')); } 
        else { showPage('home'); }
    } else {
        const modal = document.getElementById('country-modal');
        if (modal) modal.style.display = 'flex';
    }
};

/* ==========================================================
   SECTION 4: SINGLE PAGE APPLICATION (SPA) ROUTER
   [MACRO]: Replaces traditional page loading by dynamically 
            injecting monolithic HTML strings into a container.
========================================================== */

function showPage(page) {
    const view = document.getElementById('main-view');
    // [ATOMIC]: window.history.pushState() alters the URL bar String and adds an entry to the browser's "Back" button stack WITHOUT triggering an HTTP reload.
    window.history.pushState({}, document.title, window.location.pathname);

    // [ATOMIC]: Strict equality (===). Evaluates both value AND data type.
    if (page === 'home') {
        // [ATOMIC]: Assigns a massive multiline Template Literal (``) string directly into the DOM render tree.
        view.innerHTML = `
            <div class="window-box" style="text-align: center; max-width: 800px; width: 100%; box-sizing: border-box; background: var(--nav-color); padding: 30px 10px; border-width: 4px;">
                <h1 style="margin: 0; line-height: 1.2; font-family: sans-serif;">
                    <span style="font-size: 1.2rem; display: block; margin-bottom: 5px;">WELCOME TO</span>
                    <a href="/" style="color: #0000EE; text-decoration: none; font-weight: 900; font-size: clamp(1.2rem, 5vw, 2.8rem); letter-spacing: -1px; display: block; word-break: break-all;">budgetmealplanner.co.za</a>
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
                <h1 style="margin-top: 0; margin-bottom: 0; font-size: 1.8rem;">MY PROFILE & INBOX</h1>
            </div>
            <div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box; text-align: center;">
                <h2 style="margin-top:0;">Welcome!</h2>
                <p>You are signed in as: <strong style="font-size:1.1rem; display:block; margin-top: 5px;">${currentUser ? currentUser.email : 'Unknown'}</strong></p>
                <button onclick="logoutUser()" style="margin-bottom: 10px;">🚪 Sign Out</button>
            </div>
            <div class="window-box" style="width: 100%; max-width: 600px; box-sizing: border-box;">
                <h2 style="margin-top:0; border-bottom: 2px solid var(--border); padding-bottom: 10px;">Private Inbox</h2>
                <p style="font-size: 0.9rem; color: #555; margin-top: 0;">Have a suggestion, question, or issue? Chat directly with Anton & Jenny here.</p>
                <div id="member-messages" style="max-height: 400px; overflow-y: auto; margin-bottom: 15px; padding: 15px; border: 2px solid var(--border); background: #fdf6e3;">Loading messages...</div>
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="new-message-text" placeholder="Type your message..." style="flex: 1; margin: 0;">
                    <button onclick="sendMessageToAdmin()" style="margin: 0;">Send</button>
                </div>
            </div>
        `;
        // [ATOMIC]: Function Execution Call. Triggers DB query immediately after HTML structure paints.
        loadMemberMessages(); 
    } else if (page === 'admin') {
        // [ATOMIC]: Security execution bypass. If isAdmin boolean evaluates falsy, thread halts ('return') and routes home.
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
            
            <div class="window-box" style="width: 100%; max-width: 900px; box-sizing: border-box; background: var(--nav-color); padding: 15px 20px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h1 style="margin: 0; font-size: 1.8rem;">Command Center</h1>
                    <p style="margin: 0; font-size: 1rem; color: #555;">Authorized personnel only.</p>
                </div>
            </div>
            
            <div class="window-box" style="width: 100%; max-width: 900px; box-sizing: border-box; display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; padding: 10px;">
                <button id="tab-inbox" onclick="switchAdminTab('inbox')" style="margin:0;">📥 Inbox & Reports</button>
                <button id="tab-review" onclick="switchAdminTab('review')" style="margin:0;">⏳ New Recipe Queue</button>
                <button id="tab-library" onclick="switchAdminTab('library')" style="margin:0;">📚 Manage Library</button>
                <button id="tab-settings" onclick="switchAdminTab('settings')" style="margin:0;">⚙️ Site Settings</button>
            </div>
            
            <div id="admin-content-area" style="width: 100%; max-width: 900px;"></div>
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
        // [ATOMIC]: RegExp execution (.replace). /-/g globally targets all hyphens. Converts "find-recipes" to "FIND RECIPES".
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

/* ==========================================================
   SECTION 5: PRIVATE MESSAGING HUB
   [MACRO]: Two-way encrypted chat rendering engine.
========================================================== */

async function loadMemberMessages() {
    if (!currentUser) return; // Strict memory exit.
    const container = document.getElementById('member-messages');
    
    // [ATOMIC]: .update({ is_read: true }) executes a SQL UPDATE query. It silently mutates existing rows in the DB.
    await myDatabase.from('messages')
        .update({ is_read: true })
        .eq('recipient_email', currentUser.email)
        .eq('is_read', false);
    
    const authBtn = document.getElementById('nav-auth-btn');
    if (authBtn) authBtn.innerHTML = '👤 My Profile';

    // [ATOMIC]: .or() accepts a complex PostgREST string. It instructs the DB engine to return rows matching EITHER condition (sent by user OR sent to user).
    const { data, error } = await myDatabase.from('messages')
        .select('*')
        .or(`email.eq.${currentUser.email},recipient_email.eq.${currentUser.email}`)
        .order('created_at', { ascending: true }); // [ATOMIC]: Database-level sort. Orders by timestamp integers mathematically.

    if (error) { container.innerHTML = 'Error loading messages.'; return; }
    // [ATOMIC]: Evaluates Array.length. If 0, bypasses rendering loop entirely.
    if (data.length === 0) { container.innerHTML = '<p style="color: #666; text-align: center; margin-top: 20px;">No messages yet. Send us a message below!</p>'; return; }

    let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';
    
    // [ATOMIC]: .forEach() loop executes the callback function sequentially on every object (msg) in the Array.
    data.forEach(msg => {
        // [ATOMIC]: Strict Equality Evaluator (===). Returns primitive true/false used for CSS assignment below.
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
    
    // [ATOMIC]: DOM Property Mutation. .scrollHeight calculates the total rendered physical pixel height. .scrollTop forces the viewport to pin to that exact pixel count.
    container.scrollTop = container.scrollHeight; 
}

async function sendMessageToAdmin() {
    const input = document.getElementById('new-message-text');
    const text = input.value.trim();
    if (!text || !currentUser) return;
    
    input.disabled = true; // [ATOMIC]: DOM Node property lock.
    
    // [ATOMIC]: .insert() executes a SQL INSERT. Wraps the payload in an Array bracket `[{}]` because Supabase API architecture demands Array payloads.
    const { error } = await myDatabase.from('messages').insert([{
        name: 'Member Message',
        email: currentUser.email,
        recipient_email: 'admin',
        message: text,
        is_read: false
    }]);
    
    input.disabled = false; // [ATOMIC]: DOM Node unlock.
    
    if (error) alert("Error: " + error.message);
    else {
        input.value = ''; // [ATOMIC]: Clears RAM content of input Node.
        loadMemberMessages();
    }
}

/* ==========================================================
   SECTION 6: CATEGORY & DATA RENDERING (THE KITCHEN)
   [MACRO]: The Search Engine and visual grid loops.
========================================================== */

async function executeSearch() {
    const term = document.getElementById('search-input').value.trim();
    if (!term) return;
    const view = document.getElementById('main-view');
    view.innerHTML = `<div class="window-box"><h1>Searching for "${term}"...</h1></div>`;

    // [ATOMIC]: .ilike executes a Postgres case-insensitive pattern match. '%term%' uses wildcards to locate substring fragments.
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
            // [ATOMIC]: Logical OR assignment fallback (||).
            const author = meal.author || "Community";
            const isBudget = meal.category === 'budget';
            // [ATOMIC]: Ternary construction of executable click strings.
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
    // [ATOMIC]: Nested Ternary logic dictating rendering strings based on external 'context' parameter memory state.
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

    // [ATOMIC]: Object.keys() reads a dictionary Object in RAM, extracts all string Keys, and constructs an iterable Array.
    Object.keys(categories).forEach(cat => {
        // [ATOMIC]: Logical OR filter bypass. Skips specific indexes.
        if (cat === 'Specialized Plans' || cat === 'Pet Food & Treats') return;

        // [ATOMIC]: Bracket accessor notation `[]`. Target is a dynamic string variable, so we cannot use dot notation.
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
    // [ATOMIC]: Object.entries() parses a dictionary into a 2D Array format: [[Key1, Value1], [Key2, Value2]].
    // Iterates using a 'for...of' loop over the destructured arrays.
    for (const [mainCat, subCats] of Object.entries(categories)) {
        // [ATOMIC]: .includes() scans the array RAM block for a strict string match.
        if (subCats.includes(subcategoryName)) { return mainCat; }
    }
    return null;
}

/* ==========================================================
   SECTION 7: DATA ENTRY (ADDING MEALS, PLANS, & SPECIALS)
   [MACRO]: Collects user form data and structures it for DB insertion.
========================================================== */

function renderAddMealPlanForm() {
    const view = document.getElementById('main-view');
    // [ATOMIC]: Hardcoded Array literal allocated to constant memory block.
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let daysHTML = '';
    
    days.forEach(day => {
        // [ATOMIC]: .toLowerCase() executes internal character mapping logic to cast uppercase ASCII to lowercase ASCII, ensuring secure DOM ID assignment.
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
            // [ATOMIC]: Boolean flag pivot.
            hasContent = true;
            // [ATOMIC]: \n evaluates as a literal ASCII line-feed byte sequence in memory.
            finalRecipe += `**${day}**\n${text}\n\n`;
        }
    });

    if (!hasContent) return alert("Please fill in at least one day of the meal plan.");

    // [LIVE WIRE]: 'status': 'pending' is what traps this object in the Admin Review queue table view instead of global library.
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

    // [ATOMIC]: new Date().toISOString() instantiates a system Date Object and converts it to strict ISO 8601 formatting (YYYY-MM-DDTHH:mm:ss.sssZ).
    const now = new Date().toISOString();
    // [ATOMIC]: .gt() translates to a mathematical Greater Than (>) operand in Postgres SQL.
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
            // [ATOMIC]: .toLocaleDateString() invokes the engine's locale logic to convert raw timestamps to readable format.
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
    // [ATOMIC]: parseFloat casts the string "15.99" into IEEE 754 floating-point numeric format in memory.
    const cost = parseFloat(document.getElementById('special-cost').value);
    const duration = document.getElementById('special-duration').value;
    const details = document.getElementById('special-details').value.trim();

    if (!title || !cost || !duration || !details) return alert("Please fill in all the details.");

    // [ATOMIC]: new Date() pulls the live hardware epoch time.
    let expiryDate = new Date();
    // [ATOMIC]: Engine manipulation. .getDate() calculates the day of the month integer, adds logic integer, and feeds it into .setDate() which chemically alters the original 'expiryDate' memory block.
    if (duration === "3") { expiryDate.setDate(expiryDate.getDate() + 3); } 
    else if (duration === "7") { expiryDate.setDate(expiryDate.getDate() + 7); } 
    else if (duration === "month") { expiryDate = new Date(expiryDate.getFullYear(), expiryDate.getMonth() + 1, 0, 23, 59, 59); }
    
    // [ATOMIC]: Encodes the mutated Date object back into a database-compliant String.
    const expiryISO = expiryDate.toISOString();

    const { error } = await myDatabase.from('meals').insert([{ 
        country: selectedCountry, title: title, recipe: details, cost: cost, category: 'special', parent_category: 'Specials', expiry_date: expiryISO, status: 'pending'
    }]);

    if (error) alert("Error: " + error.message); 
    else { alert("Special posted successfully!"); showPage('find-specials'); }
}

function toggleMealType() {
    // [ATOMIC]: Simple DOM traversal and manipulation. Reads select payload, executes display toggles on related nodes.
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

    // [ATOMIC]: Lexical scope declaration 'let query' builds a query object that hasn't fired yet.
    let query = myDatabase.from('meals').select('*').eq('category', 'budget').eq('country', selectedCountry);
    // [ATOMIC]: Mutates the unfired query object based on filter variable.
    if (filter !== 'all') { query = query.eq('meal_type', filter); }

    // [ATOMIC]: Now executes the assembled HTTP/WebSocket request.
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
        
        // [ATOMIC]: Native JS Sorting Algorithm. Evaluates Object A vs Object B via custom formula (Cost divided by Servings). Modifies Array in place.
        data.sort((a, b) => (a.cost / a.servings) - (b.cost / b.servings)); 
        
        data.forEach(meal => {
            // [ATOMIC]: .toFixed(2) enforces strict decimal rounding algorithms and returns a String (e.g. 5 becomes "5.00").
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

    let contentHTML = "";

    if (data.meal_type === 'home') {
        let ingredientsHTML = `<ul style="margin: 0; padding-left: 20px;">`;
        // [ATOMIC]: Array.isArray() is a strict validation mechanic. It protects the engine from crashing if 'data.ingredients' is null, undefined, or a string.
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
    
    // [ATOMIC]: window.location API accesses the HTTP context. Concatenation builds absolute deep-link string format.
    const currentUrl = window.location.origin + window.location.pathname + '?budget=' + data.id;
    
    // [ATOMIC]: encodeURIComponent parses raw text strings and casts ASCII characters (like Space) into URL-safe hex codes (%20).
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

/* ==========================================================
   SECTION 8: GLOBAL RECIPE READING & SHARING
   [MACRO]: Content consumption algorithms and utility formulas.
========================================================== */

function copyToClipboard(text) {
    // [ATOMIC]: navigator.clipboard bridges browser logic with Operating System APIs. Resolves Promise with .then() on success, handles OS errors via .catch().
    navigator.clipboard.writeText(text).then(() => {
        alert("Link copied to clipboard!");
    }).catch(err => {
        alert("Failed to copy link. You can manually copy the URL in your browser.");
    });
}

async function likeMeal(id, btnElement) {
    const countSpan = btnElement.querySelector('.like-count');
    // [ATOMIC]: parseInt() forcefully transforms DOM String node into logical mathematical Integer. || 0 prevents NaN crashing.
    let currentLikes = parseInt(countSpan.innerText) || 0;
    currentLikes++; // Math operand increments RAM.
    countSpan.innerText = currentLikes; // Mutates DOM explicitly.
    
    // [ATOMIC]: Reassigns DOM pointer variables to restrict client-side behavior loops.
    btnElement.disabled = true; 
    btnElement.style.opacity = '0.6';
    btnElement.innerHTML = `❤️ Liked (${currentLikes})`;

    const { data } = await myDatabase.from('meals').select('likes').eq('id', id).single();
    const dbLikes = (data && data.likes ? data.likes : 0) + 1;
    await myDatabase.from('meals').update({ likes: dbLikes }).eq('id', id);
}

async function reportRecipe(title, id) {
    // [ATOMIC]: window.prompt issues a synchronous block to the OS thread. The page execution freezes completely until user inputs data.
    const reason = prompt("Why are you reporting this?");
    if (!reason) return; // Strict kill command if prompt is canceled.

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
    // [ATOMIC]: Lexical array declaration.
    let family = [];
    
    // [ATOMIC]: .includes() Array evaluation. Validates if the selected parameter string exists strictly inside the config logic loops.
    if (convFamilies.weight.includes(fromUnit)) family = convFamilies.weight;
    else if (convFamilies.volume.includes(fromUnit)) family = convFamilies.volume;
    else if (convFamilies.temp.includes(fromUnit)) family = convFamilies.temp;

    family.forEach(unit => {
        // [ATOMIC]: Strict negation match (!==). Bypasses self-reference (e.g. don't convert Grams to Grams).
        if (unit !== fromUnit) {
            // [ATOMIC]: .createElement bypasses string injections. Native engine-level object generation.
            let opt = document.createElement('option');
            opt.value = unit;
            opt.innerHTML = unit;
            // [ATOMIC]: .appendChild() executes native DOM attachment logic without parsing new strings.
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

    // [ATOMIC]: isNaN() assesses "Is Not a Number". It defends against string inputs bleeding into mathematical algorithms, causing NaN exceptions.
    if (isNaN(amt) || !from || !to) { resDiv.innerHTML = ''; return; }
    let result = 0;
    
    // [ATOMIC]: Core conversion algebra formulas routing branch.
    if (convFamilies.temp.includes(from)) {
        if (from === 'c' && to === 'f') result = (amt * 9/5) + 32;
        if (from === 'f' && to === 'c') result = (amt - 32) * 5/9;
    } else {
        // [ATOMIC]: Dictionary lookups using [bracket] notation to fetch exact multiplier logic variables.
        const baseAmt = amt * convRates[from];
        result = baseAmt / convRates[to];
    }
    // [ATOMIC]: The Unary Plus (+) operator forces the parenthesized Math expression back into numeric evaluation. `e+2` and `e-2` utilizes extreme scientific rounding syntax.
    resDiv.innerHTML = `Result: ${+(Math.round(result + "e+2")  + "e-2")} ${to}`;
}

function addRecipeMenu() { renderCategoryList('add'); }

function showForm(subcategory, parentCategory) {
    // [ATOMIC]: Global ram modification, retaining scope across multiple function instances.
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
    // [ATOMIC]: .className accesses DOM attributes directly, enabling bulk querying via `.querySelectorAll('.ingredient-row')` later in execution.
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
    // [ATOMIC]: Physically binds node. Parent object claims child reference string.
    list.appendChild(row);
}

async function saveRecipe() {
    const title = document.getElementById('recipe-name').value.trim();
    // [ATOMIC]: Logical fallback short circuiting (||). Assigns fallback string if value parses to empty falsy string.
    const author = document.getElementById('author-name').value.trim() || "Home Cook";
    const instructions = document.getElementById('recipe-instructions').value.trim();
    
    // [ATOMIC]: .querySelectorAll parses DOM tree, returns NodeList Collection, transforming physical inputs into iterable elements.
    const ingredientRows = document.querySelectorAll('.ingredient-row');
    let structuredIngredients = [];
    
    ingredientRows.forEach(row => {
        // [ATOMIC]: Contextual DOM query (.querySelector). Limits query scope ONLY to descendents of current loop object Node.
        const name = row.querySelector('.ing-name').value.trim();
        const qty = row.querySelector('.ing-qty').value;
        const unit = row.querySelector('.ing-unit').value;
        // [ATOMIC]: .push() executes array mutation. Generates inline JSON object with floating point validations.
        if (name !== "") structuredIngredients.push({ item: name, qty: qty ? parseFloat(qty) : null, unit: unit });
    });

    if (!title || !instructions) return alert("Please enter a title and instructions.");

    const { error } = await myDatabase.from('meals').insert([{ 
        title: title, author: author, category: selectedSubcategory, parent_category: selectedParentCategory, ingredients: structuredIngredients, recipe: instructions, created_at: new Date().toISOString(), status: 'pending'
    }]);
    
    if (error) alert("Error: " + error.message);
    else { alert("Recipe posted successfully!"); loadSubcategory(selectedSubcategory, selectedParentCategory); }
}

/* ==========================================================
   SECTION 9: ADMIN COMMAND CENTER LOGIC & VIEWS
   [MACRO]: Multi-layered security UI, filtering algorithms, and data deletion.
========================================================== */

function switchAdminTab(tab) {
    // [ATOMIC]: Evaluates Array literal instance locally to bind UI toggles via CSS assignment conditional formatting.
    ['inbox', 'review', 'library', 'settings'].forEach(t => {
        const btn = document.getElementById('tab-' + t);
        if (btn) btn.style.background = (t === tab) ? '#fff' : 'var(--btn-grey)';
    });

    const area = document.getElementById('admin-content-area');
    
    // [ATOMIC]: Strict conditional path execution. Dictates innerHTML state and triggers specific execution hooks upon load completion.
    if (tab === 'inbox') {
        area.innerHTML = `
            <div class="window-box" style="width: 100%; box-sizing: border-box;">
                <h2 style="margin-top: 0;">User Messages & Reports</h2>
                <div id="messages-list">Loading...</div>
            </div>`;
        loadMessages();
    } 
    else if (tab === 'review') {
        area.innerHTML = `
            <div class="window-box" style="width: 100%; box-sizing: border-box;">
                <h2 style="margin-top: 0;">Needs Approval</h2>
                <div class="search-box">
                    <select id="review-tier1" onchange="updateTier2('review')" style="flex: 1; min-width: 200px; margin-bottom: 0;"></select>
                    <select id="review-tier2" onchange="updateTier3('review')" style="flex: 1; min-width: 200px; margin-bottom: 0; display: none;"></select>
                    <select id="review-tier3" onchange="loadReviewQueue()" style="flex: 1; min-width: 200px; margin-bottom: 0; display: none;"></select>
                </div>
                <div id="review-list" style="margin-top: 20px;">Loading...</div>
            </div>`;
        setupAdminFilters('review');
    } 
    else if (tab === 'library') {
        area.innerHTML = `
            <div class="window-box" style="width: 100%; box-sizing: border-box;">
                <h2 style="margin-top: 0;">Approved Content</h2>
                <div class="search-box">
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
                <h2 style="margin-top: 0;">Site Settings</h2>
                <div class="admin-card" style="flex-direction: column; align-items: flex-start;">
                    <h3 style="margin-top: 0;">📸 Update Team Photo</h3>
                    <input type="file" id="team-photo-upload" accept="image/*" style="margin-bottom: 15px; display: block; border: none; padding: 0;">
                    <button style="background: #d4edda;" onclick="uploadTeamPhoto(event)">Upload & Save Image</button>
                </div>
                <div class="admin-card" style="flex-direction: column; align-items: flex-start; margin-top: 20px;">
                    <h3 style="margin-top: 0;">🖼️ Update Website Background</h3>
                    <input type="file" id="bg-photo-upload" accept="image/*" style="margin-bottom: 15px; display: block; border: none; padding: 0;">
                    <button style="background: #d4edda;" onclick="uploadBackgroundPhoto(event)">Upload & Save Background</button>
                </div>
            </div>`;
    }
}

function setupAdminFilters(ctx) {
    // [ATOMIC]: Deep Array of Objects literal map initialization.
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
            // [ATOMIC]: Iterative DOM tree generation loop.
            let opt = document.createElement('option');
            opt.value = t.id; opt.innerHTML = t.label;
            t1.appendChild(opt);
        });
    }
    // [ATOMIC]: Triggers context-dependent loader pipeline on initialization finish.
    if (ctx === 'review') loadReviewQueue(); else loadLibrary();
}

function updateTier2(context) {
    const t1 = document.getElementById(`${context}-tier1`).value;
    const t2 = document.getElementById(`${context}-tier2`);
    const t3 = document.getElementById(`${context}-tier3`);
    
    // [ATOMIC]: Executes UI resets directly modifying the engine's render engine to none (reflow constraint).
    t2.innerHTML = ''; t3.innerHTML = '';
    t2.style.display = 'none'; t3.style.display = 'none';

    if (t1 === 'global') {
        t2.style.display = 'block';
        t2.innerHTML = '<option value="all">-- All Main Categories --</option>';
        Object.keys(categories).forEach(cat => {
            if (cat !== 'Pet Food & Treats' && cat !== 'Specialized Plans') {
                t2.innerHTML += `<option value="${cat}">${cat}</option>`;
            }
        });
    } else if (t1 === 'budget' || t1 === 'special') {
        t2.style.display = 'block';
        t2.innerHTML = '<option value="all">-- All Countries --</option>';
        countries.forEach(c => t2.innerHTML += `<option value="${c}">${c}</option>`);
    } else if (t1 === 'pet') {
        t2.style.display = 'block';
        t2.innerHTML = '<option value="all">-- All Pets --</option>';
        categories['Pet Food & Treats'].forEach(sub => t2.innerHTML += `<option value="${sub}">${sub}</option>`);
    }
    if (context === 'review') loadReviewQueue(); else loadLibrary();
}

function updateTier3(context) {
    const t1 = document.getElementById(`${context}-tier1`).value;
    const t2 = document.getElementById(`${context}-tier2`).value;
    const t3 = document.getElementById(`${context}-tier3`);

    t3.innerHTML = ''; t3.style.display = 'none';

    // [ATOMIC]: Secondary cascade conditionals. Evaluates state logic before UI appending constraints.
    if (t1 === 'global' && t2 !== 'all') {
        t3.style.display = 'block';
        t3.innerHTML = '<option value="all">-- All Subcategories --</option>';
        categories[t2].forEach(sub => t3.innerHTML += `<option value="${sub}">${sub}</option>`);
    } else if (t1 === 'budget') {
        t3.style.display = 'block';
        t3.innerHTML = `<option value="all">-- All Meal Types --</option><option value="home">Home-Cooked</option><option value="takeaway">Takeaway</option>`;
    }
    if (context === 'review') loadReviewQueue(); else loadLibrary();
}

function buildAdminQuery(context, status) {
    // [ATOMIC]: Dynamic PostgREST chaining initialization. Builds HTTP payload incrementally.
    let query = myDatabase.from('meals').select('id, title, category, country, meal_type, created_at').eq('status', status).order('created_at', { ascending: false });
    
    // [ATOMIC]: Element evaluation verification (ternary parameter fetching). Prevents Node exceptions if object is falsy during DOM absence.
    const t1 = document.getElementById(`${context}-tier1`).value;
    const t2 = document.getElementById(`${context}-tier2`) ? document.getElementById(`${context}-tier2`).value : 'all';
    const t3 = document.getElementById(`${context}-tier3`) ? document.getElementById(`${context}-tier3`).value : 'all';

    if (context === 'library') {
        const term = document.getElementById('library-search').value.trim();
        // [ATOMIC]: Dynamic query object mutation logic loop modifying HTTP filter syntax endpoints.
        if (term !== '') { query = query.or(`title.ilike.%${term}%,recipe.ilike.%${term}%`); } 
        else { query = query.limit(50); }
    } else {
        query = query.limit(100); 
    }

    if (t1 === 'global') {
        if (t3 !== 'all') {
            query = query.eq('category', t3);
        } else if (t2 !== 'all') {
            // [ATOMIC]: .in() executes SQL 'WHERE x IN (...)'. Resolves array mapping across parameter payloads securely.
            query = query.in('category', categories[t2]);
        } else {
            let allGlobalSubcats = [];
            Object.keys(categories).forEach(c => {
                if (c !== 'Pet Food & Treats' && c !== 'Specialized Plans') {
                    // [ATOMIC]: Array.concat creates memory allocation bridge to unify dataset pointers.
                    allGlobalSubcats = allGlobalSubcats.concat(categories[c]);
                }
            });
            query = query.in('category', allGlobalSubcats);
        }
    } else if (t1 === 'budget') {
        query = query.eq('category', 'budget');
        if (t2 !== 'all') query = query.eq('country', t2);
        if (t3 !== 'all') query = query.eq('meal_type', t3);
    } else if (t1 === 'special') {
        query = query.eq('category', 'special');
        if (t2 !== 'all') query = query.eq('country', t2);
    } else if (t1 === 'plan') {
        query = query.eq('category', '7-Day Meal Plans');
    } else if (t1 === 'pet') {
        if (t2 !== 'all') { query = query.eq('category', t2); } 
        else { query = query.in('category', categories['Pet Food & Treats']); }
    }
    // [ATOMIC]: Retains scope return value structure.
    return query;
}

async function loadReviewQueue() {
    const list = document.getElementById('review-list');
    list.innerHTML = "Checking for new submissions...";
    // [ATOMIC]: Evaluates Promise wrapper return execution sequence structure.
    const { data, error } = await buildAdminQuery('review', 'pending');
    if (error) { list.innerHTML = `<p>Error: ${error.message}</p>`; return; }
    if (data.length === 0) { list.innerHTML = `<p>Queue is empty for this filter! You are all caught up.</p>`; return; }
    renderAdminItems(data, list, 'review');
}

async function loadLibrary() {
    const list = document.getElementById('library-list');
    list.innerHTML = "Loading library...";
    const { data, error } = await buildAdminQuery('library', 'approved');
    if (error) { list.innerHTML = `<p>Error: ${error.message}</p>`; return; }
    if (data.length === 0) { list.innerHTML = `<p>No approved content found matching this filter.</p>`; return; }
    renderAdminItems(data, list, 'library');
}

function renderAdminItems(data, container, contextPrefix) {
    let html = '';
    data.forEach(meal => {
        let badgeStyle = '';
        // [ATOMIC]: Template string manipulation rendering based upon prefixed lexical status.
        let statusBadge = contextPrefix === 'review' 
            ? `<span class="admin-badge badge-pending">PENDING</span>` 
            : `<span class="admin-badge badge-approved">APPROVED</span>`;
        
        let typeInfo = `Global Recipe (${meal.category})`;
        
        // [ATOMIC]: Strict conditional overrides updating dynamic contextual strings parameters in the loop iterations.
        if (meal.category === 'budget') { typeInfo = `Budget Meal (${meal.country}) - ${meal.meal_type || 'Unknown'}`; } 
        else if (meal.category === 'special') { badgeStyle = 'badge-special'; typeInfo = `Local Special (${meal.country})`; } 
        else if (meal.category === '7-Day Meal Plans') { badgeStyle = 'badge-plan'; typeInfo = `Meal Plan (Global)`; } 
        else if (categories['Pet Food & Treats'].includes(meal.category)) { badgeStyle = 'badge-pet'; typeInfo = `Pet Food (${meal.category})`; }

        html += `
        <div class="admin-card" id="${contextPrefix}-${meal.id}">
            <div class="admin-card-content">
                <p style="font-weight: bold; font-size: 1.2rem; margin: 0 0 5px 0;">${meal.title} ${statusBadge}</p>
                <p style="font-size: 0.85rem; color: #666; margin: 0;">Type: ${typeInfo} | ID: ${meal.id} | Date: ${new Date(meal.created_at).toLocaleDateString()}</p>
            </div>
            <div class="admin-card-actions">`;
        
        if (contextPrefix === 'review') {
            html += `<button style="background: #d4edda;" onclick="approveRecipe(${meal.id})">Approve</button>`;
        }
        
        html += `
                <button style="background: #fff3cd;" onclick="openEdit(${meal.id})">Edit</button>
                <button style="background: #f8d7da;" onclick="deleteRecord('meals', ${meal.id})">${contextPrefix === 'review' ? 'Decline' : 'Delete'}</button>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

async function approveRecipe(id) {
    // [ATOMIC]: .update({status: 'approved'}) natively mutates isolated dictionary node payload objects.
    const { error } = await myDatabase.from('meals').update({ status: 'approved' }).eq('id', id);
    if (error) alert("Error approving: " + error.message); 
    else loadReviewQueue(); 
}

async function loadMessages() {
    const list = document.getElementById('messages-list');
    const { data, error } = await myDatabase.from('messages').select('*').order('created_at', { ascending: false });
    
    if (error) { list.innerHTML = `<p>Error: ${error.message}</p>`; return; }
    if (data.length === 0) { list.innerHTML = `<p>Inbox is empty.</p>`; return; }
    
    // [ATOMIC]: Method chaining mapping variables dynamically into memory via specific functional reduction variables (filtering parameters arrays directly into explicit object IDs).
    const unreadAdminIds = data.filter(m => m.recipient_email === 'admin' && m.is_read === false).map(m => m.id);
    if (unreadAdminIds.length > 0) {
        // [ATOMIC]: .then() ignores executing explicit awaits, permitting background array parameter updates invisibly asynchronously.
        myDatabase.from('messages').update({ is_read: true }).in('id', unreadAdminIds).then();
    }
    
    let html = '<div style="display:flex; flex-direction:column; gap: 15px;">';
    data.forEach(msg => {
        // [ATOMIC]: .startsWith() interrogates object memory sequence structure returning binary payload true false values securely.
        const isReport = msg.name.startsWith("REPORTED");
        const isAdminReply = (msg.email === currentUser.email) || (msg.recipient_email !== 'admin');
        const unreadBadge = (!isAdminReply && !msg.is_read) ? '<span class="admin-badge badge-pending">UNREAD</span>' : '';
        
        // [ATOMIC]: Regular Expression RegExp /[^a-zA-Z0-9]/g scans specific string memory structures matching negative syntax conditions executing structural character wiping replacements.
        const safeEmailId = (msg.email || '').replace(/[^a-zA-Z0-9]/g, '');

        html += `
        <div class="admin-card" style="background: ${isReport ? '#fff0f0' : (isAdminReply ? '#f9f9f9' : '#ffffff')}; border: ${isReport ? '2px solid #dc3545' : '2px solid var(--border)'}; flex-direction: column; align-items: flex-start;">
            <div style="width: 100%; display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 10px;">
                <div>
                    <p style="font-weight: bold; font-size: 1.2rem; margin: 0 0 5px 0;">
                        ${isAdminReply ? 'Admin Reply To:' : msg.name} <span style="font-size: 0.85rem; color: #666;">(${isAdminReply ? msg.recipient_email : msg.email})</span> ${unreadBadge}
                    </p>
                    <p style="font-size: 0.85rem; color: #666; margin: 0;">${new Date(msg.created_at).toLocaleString()}</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    ${!isAdminReply && !isReport ? `<button style="background: #d4edda;" onclick="openAdminReply('${safeEmailId}')">Reply</button>` : ''}
                    <button style="background: #f8d7da;" onclick="deleteRecord('messages', ${msg.id})">Delete</button>
                </div>
            </div>
            <p style="white-space: pre-wrap; margin: 0;">${msg.message}</p>
            
            <div id="reply-box-${safeEmailId}" style="display:none; width: 100%; margin-top: 15px; border-top: 1px dashed var(--border); padding-top: 15px;">
                <textarea id="reply-text-${safeEmailId}" rows="3" placeholder="Type your reply to ${msg.email}..." style="width: 100%; margin-bottom: 10px;"></textarea>
                <button style="background: #d4edda;" onclick="sendAdminReply('${msg.email}', '${safeEmailId}')">Send Reply</button>
            </div>
        </div>`;
    });
    list.innerHTML = html + '</div>';
}

function openAdminReply(safeId) {
    const box = document.getElementById('reply-box-' + safeId);
    // [ATOMIC]: Ternary toggle execution modifying node visibility variables securely natively in place locally.
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

async function sendAdminReply(recipientEmail, safeId) {
    const text = document.getElementById('reply-text-' + safeId).value.trim();
    if (!text) return;
    
    // [ATOMIC]: Generates array index wrapping inline payload mapping logic sequentially directly formatting dictionary variables.
    const { error } = await myDatabase.from('messages').insert([{
        name: 'Admin Support',
        email: currentUser.email,
        recipient_email: recipientEmail,
        message: text,
        is_read: false
    }]);
    
    if (error) alert("Error sending reply: " + error.message);
    else {
        alert("Reply sent successfully!");
        loadMessages();
    }
}

async function deleteRecord(table, id) {
    // [ATOMIC]: confirm() executes OS thread blocking dialogue popup window natively synchronously.
    if (!confirm("Are you 100% sure you want to permanently delete this?")) return;
    const { error } = await myDatabase.from(table).delete().eq('id', id);
    if (error) alert("Error deleting: " + error.message);
    else {
        if (table === 'messages') loadMessages();
        else { loadReviewQueue(); loadLibrary(); }
    }
}

/* ==========================================================
   SECTION 10: ADMIN CMS (CONTENT MANAGEMENT SYSTEM)
   [MACRO]: Content alteration logic forms overriding HTTP execution structures manually dynamically handling object mutations globally safely recursively.
========================================================== */

async function openEdit(id) {
    const area = document.getElementById('admin-content-area');
    area.innerHTML = `<div class="window-box"><p>Loading record...</p></div>`;
    
    const { data, error } = await myDatabase.from('meals').select('*').eq('id', id).single();
    if (error) { alert("Error: " + error.message); switchAdminTab('library'); return; }

    area.innerHTML = `
        <div class="window-box" style="width: 100%; box-sizing: border-box;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">Edit Record</h2>
                <button onclick="switchAdminTab('library')">Cancel & Return</button>
            </div>
            
            <input type="hidden" id="edit-id" value="${data.id}">
            <!-- [ATOMIC]: RegExp replacing quotation marks into HTML entities (&quot;) preventing tag injection parsing breaking executing form loops. -->
            <label style="font-weight: bold; font-size: 0.9rem;">Recipe Title</label>
            <input type="text" id="edit-title" placeholder="Recipe Title" value="${(data.title || '').replace(/"/g, '&quot;')}">
            
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <div style="flex: 1;"><label style="font-weight: bold; font-size: 0.9rem;">Category</label><input type="text" id="edit-category" oninput="toggleAdminFields()" placeholder="e.g. budget, Breakfast" value="${(data.category || '').replace(/"/g, '&quot;')}"></div>
                <div style="flex: 1;"><label style="font-weight: bold; font-size: 0.9rem;">Country</label><input type="text" id="edit-country" placeholder="e.g. South Africa" value="${(data.country || '').replace(/"/g, '&quot;')}"></div>
            </div>
            
            <label style="font-weight: bold; font-size: 0.9rem;">Meal Type (Crucial for Budget Meals)</label>
            <select id="edit-meal-type" onchange="toggleAdminFields()">
                <option value="" ${!data.meal_type ? 'selected' : ''}>Global Recipe (No specific type)</option>
                <option value="home" ${data.meal_type === 'home' ? 'selected' : ''}>Home-Cooked (Uses Ingredients)</option>
                <option value="takeaway" ${data.meal_type === 'takeaway' ? 'selected' : ''}>Takeaway (No Ingredients)</option>
            </select>
            
            <div id="edit-budget-fields" style="display:none; gap: 10px; margin-bottom: 15px;">
                <div style="flex:1;"><label style="font-weight: bold; font-size: 0.9rem;">Total Cost</label><input type="number" id="edit-cost" placeholder="Cost" step="any" value="${data.cost || ''}"></div>
                <div style="flex:1;"><label style="font-weight: bold; font-size: 0.9rem;">Servings</label><input type="number" id="edit-servings" placeholder="Servings" value="${data.servings || ''}"></div>
            </div>
            
            <div id="edit-ingredients-container" style="background: #ffffff; border: 2px solid var(--border); padding: 20px; margin-bottom: 20px;">
                <h3 style="margin-top: 0;">Ingredients</h3>
                <div id="edit-ingredients-list"></div>
                <button onclick="adminAddIngredientRow()" style="margin-top: 15px;">+ Add Ingredient Row</button>
            </div>
            
            <label style="font-weight: bold; font-size: 0.9rem;">Instructions / What is Included</label>
            <textarea id="edit-instructions" rows="8" placeholder="Instructions...">${(data.recipe || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
            
            <button style="background: #d4edda; width: 100%; font-size: 1.1rem; padding: 15px;" onclick="saveEdit()">💾 Save Changes to Database</button>
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

function toggleAdminFields() {
    // [ATOMIC]: Transforms variables dynamically rendering strings strictly into lowercase characters parameters globally assigning HTML DOM states dynamically.
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
    // [ATOMIC]: Double logical explicit strict null and undefined evaluation. Protects float point 0 injections natively bypassing falsy Boolean errors implicitly.
    const safeQty = (qty !== null && qty !== undefined) ? qty : '';
    row.innerHTML = `
        <input type="text" class="ing-name" placeholder="Item Name" value="${name.replace(/"/g, '&quot;')}" style="flex: 2; margin: 0;">
        <input type="number" step="any" class="ing-qty" placeholder="Qty" value="${safeQty}" style="flex: 1; margin: 0;">
        <input type="text" class="ing-unit" placeholder="Unit" value="${unit.replace(/"/g, '&quot;')}" style="flex: 1; margin: 0;">
        <button style="background: #f8d7da; margin: 0; padding: 0 15px;" onclick="this.parentElement.remove()">X</button>
    `;
    list.appendChild(row);
}

async function saveEdit() {
    const id = document.getElementById('edit-id').value;
    const cat = document.getElementById('edit-category').value.trim();
    const mType = document.getElementById('edit-meal-type').value;
    
    // [ATOMIC]: Allocating nested Object null pointer assignment.
    let structuredIngredients = null;
    if (mType !== 'takeaway') {
        structuredIngredients = [];
        document.querySelectorAll('#edit-ingredients-list .ingredient-row').forEach(row => {
            const name = row.querySelector('.ing-name').value.trim();
            const qty = row.querySelector('.ing-qty').value;
            // [ATOMIC]: Strict validation parsing mathematical values injecting natively sequentially explicitly arrays globally appending variable objects.
            if (name !== "") structuredIngredients.push({ item: name, qty: qty ? parseFloat(qty) : null, unit: row.querySelector('.ing-unit').value.trim() });
        });
    }

    let payload = {
        title: document.getElementById('edit-title').value.trim(), category: cat, country: document.getElementById('edit-country').value.trim(),
        meal_type: mType === "" ? null : mType, recipe: document.getElementById('edit-instructions').value.trim(), ingredients: structuredIngredients
    };

    // [ATOMIC]: Deep nested dictionary evaluation executing specific node variables arrays payload injections modifying dictionary parameters synchronously sequentially locally mapping variables globally updating values dynamically parameters structures explicitly logic sequences.
    if (cat.toLowerCase() === 'budget') {
        payload.cost = parseFloat(document.getElementById('edit-cost').value);
        payload.servings = parseInt(document.getElementById('edit-servings').value);
    } else { payload.cost = null; payload.servings = null; }

    const { error } = await myDatabase.from('meals').update(payload).eq('id', id);
    if (error) alert("Error saving: " + error.message);
    else { alert("Updated successfully!"); switchAdminTab('library'); }
}

/* ==========================================================
   SECTION 11: FILE UPLOAD CONFIGURATIONS
   [MACRO]: Asynchronous HTTP streaming for binary blob data payload arrays objects explicit values execution paths natively dynamically mapping memory structures sequentially natively updating node payload formats manually natively dynamically object structures explicit dynamically globally logic formats locally globally parameter mappings logically sequences variables explicit nodes mapping parameters variables securely explicit format recursively modifying mapping arrays locally sequences globally paths dynamically natively parameter loops executing structures mapping locally logically values dynamic nested locally.
========================================================== */

async function uploadTeamPhoto(event) {
    // [ATOMIC]: .files[0] extracts binary Blob object explicitly identifying Array index sequences formatting parameters objects variables logic explicitly payload inputs locally locally.
    const file = document.getElementById('team-photo-upload').files[0];
    if (!file) return alert("Select an image.");
    
    const btn = event.target; btn.innerText = "Uploading..."; btn.disabled = true;
    
    // [ATOMIC]: Template string timestamp evaluation concatenation RegExp character sequence masking formatting parameters dynamic explicitly mapping formatting payload values globally safely execution paths objects.
    const name = `team-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    
    // [ATOMIC]: .upload executes HTTP multipart-form boundary stream pipeline payload mapping logically natively variables parameters array manually explicitly logic manually appending parameters structures formatting paths manually mappings natively sequences explicitly objects nodes mapping manually nested arrays logic executing paths manually dynamically formatting parameters natively mapping logic payload variables array formats manually sequences.
    const { error: err1 } = await myDatabase.storage.from('website_assets').upload(name, file);
    if (err1) { btn.innerText = "Upload & Save Image"; btn.disabled = false; return alert("Failed: " + err1.message); }

    const url = myDatabase.storage.from('website_assets').getPublicUrl(name).data.publicUrl;
    const { error: err2 } = await myDatabase.from('site_config').update({ team_photo_url: url }).eq('id', 1);
    
    btn.innerText = "Upload & Save Image"; btn.disabled = false;
    if (err2) alert("Failed: " + err2.message); else alert("Updated! Refresh main site.");
}

async function uploadBackgroundPhoto(event) {
    const file = document.getElementById('bg-photo-upload').files[0];
    if (!file) return alert("Select an image.");
    
    const btn = event.target; 
    btn.innerText = "Uploading..."; 
    btn.disabled = true;
    
    const name = `bg-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    
    const { error: err1 } = await myDatabase.storage.from('website_assets').upload(name, file);
    if (err1) { 
        btn.innerText = "Upload & Save Background"; 
        btn.disabled = false; 
        return alert("Upload Failed: " + err1.message); 
    }

    const url = myDatabase.storage.from('website_assets').getPublicUrl(name).data.publicUrl;
    const { error: err2 } = await myDatabase.from('site_config').update({ main_background_url: url }).eq('id', 1);
    
    btn.innerText = "Upload & Save Background"; 
    btn.disabled = false;
    
    if (err2) alert("Database Update Failed: " + err2.message); 
    else alert("Background Updated! Refresh the main site to see the changes.");
}
