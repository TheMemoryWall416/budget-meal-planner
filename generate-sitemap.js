const fs = require('fs');

// We use your public keys to safely read the approved recipes
const SUPABASE_URL = 'https://bvdgbodzrfhgpvxzuogs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2ZGdib2R6cmZoZ3B2eHp1b2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjYxMzIsImV4cCI6MjA5NzMwMjEzMn0.C6jFxQmFQYnRjVK8V30mG4qTH3PtEWmVThiiSvr1tEw';

async function generateSitemap() {
    const baseUrl = 'https://budgetmealplanner.co.za';
    
    // 1. Start the XML file and add your permanent static pages
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    const staticPages = ['/', '/contact.html', '/privacy.html', '/terms.html'];
    for (const page of staticPages) {
        xml += `  <url>\n    <loc>${baseUrl}${page}</loc>\n    <changefreq>weekly</changefreq>\n  </url>\n`;
    }

    // 2. Fetch all APPROVED recipes from Supabase
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/meals?status=eq.approved&select=id,category,created_at`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const meals = await response.json();

        // 3. Loop through them and add them to the map
        meals.forEach(meal => {
            const urlParam = meal.category === 'budget' ? `?budget=${meal.id}` : `?recipe=${meal.id}`;
            const date = meal.created_at ? meal.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
            
            xml += `  <url>\n    <loc>${baseUrl}/${urlParam}</loc>\n    <lastmod>${date}</lastmod>\n  </url>\n`;
        });

    } catch (error) {
        console.error("Error fetching recipes for sitemap:", error);
    }

    // 4. Close the file and save it to the hard drive
    xml += `</urlset>`;
    fs.writeFileSync('sitemap.xml', xml);
    console.log("Sitemap generated successfully with latest recipes!");
}

generateSitemap();
