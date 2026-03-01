import re

with open('works.html', 'r', encoding='utf-8') as f:
    html = f.read()

# General navbar replacement
nav_html_old = """            <nav class="navbar">
                <ul class="navbar-list">
                    <li class="navbar-item">
                        <a href="index.html" class="navbar-link" aria-label="Home">
                            <ion-icon name="home-outline"></ion-icon>
                        </a>
                    </li>
                    <li class="navbar-separator"></li>
                    <li class="navbar-item">
                        <a href="works.html" class="navbar-link active" aria-label="Works">
                            <ion-icon name="briefcase-outline"></ion-icon>
                        </a>
                    </li>
                </ul>
            </nav>"""

nav_html_new = """            <nav class="navbar" style="bottom: auto; top: 0; width: 100%; position: sticky;">
                <ul class="navbar-list" style="justify-content: center;">
                    <li class="navbar-item">
                        <a href="index.html" class="navbar-link" aria-label="Home" title="Home">
                            <ion-icon name="home-outline"></ion-icon>
                        </a>
                    </li>
                    <li class="navbar-separator"></li>
                    <li class="navbar-item">
                        <a href="projects.html" class="navbar-link {P_ACTIVE}" aria-label="Projects" title="Projects">
                            <ion-icon name="laptop-outline"></ion-icon>
                        </a>
                    </li>
                    <li class="navbar-separator"></li>
                    <li class="navbar-item">
                        <a href="gallery.html" class="navbar-link {G_ACTIVE}" aria-label="Gallery" title="Photo Gallery">
                            <ion-icon name="camera-outline"></ion-icon>
                        </a>
                    </li>
                    <li class="navbar-separator"></li>
                    <li class="navbar-item">
                        <a href="media.html" class="navbar-link {M_ACTIVE}" aria-label="Media Output" title="Media">
                            <ion-icon name="videocam-outline"></ion-icon>
                        </a>
                    </li>
                </ul>
            </nav>"""

filter_buttons_regex = r'<div class="filter-buttons">.*?</div>'

js_content_regex = r'// Filter Logic.*?(?=// Initial Load)'

def create_page(filename, title, item_type, p_active, g_active, m_active, extra_style=""):
    content = html.replace("<title>My Works - Sridhar Portfolio</title>", f"<title>{title} - Sridhar Portfolio</title>")
    
    # Update navbar
    nav = nav_html_new.replace("{P_ACTIVE}", p_active).replace("{G_ACTIVE}", g_active).replace("{M_ACTIVE}", m_active)
    content = content.replace(nav_html_old, nav)
    
    # Update heading
    content = content.replace('<h2 class="h2 article-title">My Works</h2>', f'<h2 class="h2 article-title">{title}</h2>')
    
    # Remove filter buttons
    content = re.sub(filter_buttons_regex, '', content, flags=re.DOTALL)
    
    class_custom = "projects-grid"
    if item_type == "gallery":
        class_custom = "projects-grid gallery-grid"
    elif item_type == "output":
        class_custom = "projects-grid media-grid"
        
    content = content.replace('class="projects-grid"', f'class="{class_custom}"')
    
    # Add custom styles if any
    if extra_style:
        content = content.replace('</style>', extra_style + '\n    </style>')
    
    # Modify JS to only show the chosen item type
    new_js = f"""// Auto Filtering for {title}
        function loadWorks() {{
            try {{
                allWorks = getWorks();
                renderWorks(allWorks.filter(w => w.type === '{item_type}'));
            }} catch (err) {{
                console.error('Failed to load {item_type}', err);
                worksGrid.innerHTML = '<p style="color:var(--white-1);">Failed to load {title.lower()}.</p>';
            }}
        }}
    """
    
    # Remove filter logic
    content = re.sub(js_content_regex, '', content, flags=re.DOTALL)
    
    # Replace the loadWorks function
    content = re.sub(r'// Fetch works.*?// Render works', new_js + '\n        // Render works', content, flags=re.DOTALL)
    
    # Remove window.onload event
    content = re.sub(r'// Auto-trigger project filter on load.*?}\);', '', content, flags=re.DOTALL)
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

# PROJECTS
create_page(
    'projects.html',
    'Projects',
    'project',
    'active', '', ''
)

# GALLERY (Masonry-like distinct design)
gallery_style = """
        .gallery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
        }
        .gallery-grid .project-card {
            border-radius: 12px;
            overflow: hidden;
        }
        .gallery-grid .project-image {
            height: 300px; /* Taller images for gallery */
        }
        .gallery-grid .project-image img {
            transition: transform 0.4s ease;
        }
        .gallery-grid .project-card:hover .project-image img {
            transform: scale(1.1);
        }
"""
create_page(
    'gallery.html',
    'Photo Gallery',
    'gallery',
    '', 'active', '',
    gallery_style
)

# MEDIA (Video-focused design)
media_style = """
        .media-grid .project-card {
            background: var(--bg-gradient-jet);
            border: 1px solid var(--orange-yellow-crayola);
        }
        .media-grid .project-image {
            height: 250px;
        }
        .media-grid .project-image video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-bottom: 2px solid var(--orange-yellow-crayola);
        }
"""
create_page(
    'media.html',
    'Media Output',
    'output',
    '', '', 'active',
    media_style
)
