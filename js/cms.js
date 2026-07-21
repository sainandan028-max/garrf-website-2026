document.addEventListener("DOMContentLoaded", async function () {
    let siteData = {};
    const isAdmin = sessionStorage.getItem('adminMode') === 'true';

    // 1. Load default content
    if (typeof defaultContent !== 'undefined') {
        siteData = { ...defaultContent };
    }

    // 2. Fetch live data from Supabase
    try {
        const { data, error } = await window.supabaseClient
            .from('site_data')
            .select('content')
            .eq('id', 'garrf_content')
            .single();
            
        if (data && data.content) {
            siteData = { ...siteData, ...data.content };
        }
    } catch(e) {
        console.error("Failed to fetch from Supabase", e);
    }
    // 3. Apply data to DOM
    window.garrfSiteData = siteData;
    
    if (siteData.logo_style === 'brand-bold-white') {
        const brand = document.querySelector('.navbar-brand');
        if (brand) {
            brand.classList.remove('brand-elegant-gold');
            brand.classList.add('brand-bold-white');
        }
    }
    
    document.querySelectorAll('[data-editable]').forEach(el => {
        const key = el.getAttribute('data-editable');
        if (siteData.hasOwnProperty(key)) {
            if (el.tagName === 'IMG') {
                el.src = siteData[key];
            } else if (el.tagName === 'A') {
                const hrefKey = key + "_href";
                if (siteData.hasOwnProperty(hrefKey)) {
                    el.href = siteData[hrefKey];
                }
                el.innerHTML = siteData[key];
            } else {
                el.innerHTML = siteData[key];
            }
        }
    });

    // 3.5 Apply Committee Data
    if (document.getElementById('committee-container')) {
        renderCommittee(siteData.committee_data || []);
    }

    // 4. Initialize Admin Mode Edit Features
    if (isAdmin) {
        enableEditMode();
    }
});

function enableEditMode() {
    // Add Admin CSS
    const style = document.createElement('style');
    style.innerHTML = `
        [data-editable] {
            outline: 2px dashed rgba(46,125,50,0);
            transition: outline 0.2s;
            position: relative;
        }
        [data-editable]:hover {
            outline: 2px dashed rgba(46,125,50,0.8);
        }
        .admin-edit-btn {
            position: absolute;
            top: -10px;
            right: -10px;
            background: #2E7D32;
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            font-size: 12px;
            cursor: pointer;
            z-index: 9999;
            display: none;
            align-items: center;
            justify-content: center;
        }
        [data-editable]:hover .admin-edit-btn {
            display: flex;
        }
        .admin-toolbar {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #0D3B66;
            padding: 10px 20px;
            border-radius: 30px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            display: flex;
            gap: 15px;
            align-items: center;
        }
        .admin-toolbar button {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
        }
        .admin-toolbar button:hover {
            background: rgba(255,255,255,0.2);
        }
        .admin-toolbar .save-btn {
            background: #2E7D32;
            border: none;
            font-weight: bold;
        }
        .admin-toolbar .save-btn:hover {
            background: #1B5E20;
        }
    `;
    document.head.appendChild(style);

    // Setup editability
    document.querySelectorAll('[data-editable]').forEach(el => {
        if (el.tagName === 'IMG') {
            // Image Edit
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';
            wrapper.style.width = el.style.width || '100%';
            
            // Allow resizing the height of the container
            wrapper.style.resize = 'vertical';
            wrapper.style.overflow = 'hidden';
            wrapper.style.minHeight = '100px';
            
            // If image is empty/broken, make it a visible dropzone placeholder in admin mode
            if (!el.getAttribute('src') || el.src.endsWith(window.location.host + "/") || el.style.display === 'none') {
                el.style.display = 'block';
                el.style.minHeight = '200px';
                el.style.width = '100%';
                el.style.backgroundColor = 'rgba(0,0,0,0.2)';
                el.style.border = '2px dashed rgba(255,255,255,0.4)';
                el.removeAttribute('onerror'); // remove onerror so it doesn't hide itself
            }

            el.parentNode.insertBefore(wrapper, el);
            wrapper.appendChild(el);

            const btn = document.createElement('button');
            btn.className = 'admin-edit-btn';
            btn.innerHTML = '🖼️ Upload Image';
            btn.title = "Change Image";
            btn.style.width = 'auto';
            btn.style.padding = '0 15px';
            btn.style.borderRadius = '20px';
            btn.onclick = () => {
                const choice = confirm("Click OK to upload a new image file, or Cancel to provide a URL.");
                if (choice) {
                    // File Upload (Base64)
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = 'image/*';
                    fileInput.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                                alert("File is too large. Please upload an image smaller than 2MB.");
                                return;
                            }
                            const reader = new FileReader();
                            reader.onload = (readerEvent) => {
                                el.src = readerEvent.target.result;
                                el.style.border = 'none';
                                alert("Image uploaded temporarily! Click 'Save Changes' to permanently save it to the database.");
                            };
                            reader.readAsDataURL(file);
                        }
                    };
                    fileInput.click();
                } else {
                    // URL Prompt
                    const newUrl = prompt("Enter new image URL (e.g., https://...):", el.getAttribute('src') || "");
                    if (newUrl !== null) {
                        el.src = newUrl;
                        el.style.border = 'none';
                    }
                }
            };
            wrapper.appendChild(btn);
            
            // Fix hover visibility for buttons outside the IMG tag
            wrapper.addEventListener('mouseenter', () => btn.style.display = 'flex');
            wrapper.addEventListener('mouseleave', () => btn.style.display = 'none');
            btn.style.display = 'none';

        } else if (el.tagName === 'A') {
            el.contentEditable = "true";
            el.title = "Click to edit text. Ctrl+Click to follow link.";
            el.addEventListener('click', (e) => {
                // If they hold Ctrl/Cmd, let them navigate naturally.
                if (e.ctrlKey || e.metaKey) {
                    return; // Allow navigation
                }
                // Otherwise, prevent navigation so they can click and type to edit spelling
                e.preventDefault();
            });
            
            // Wrap the A tag
            const wrapper = document.createElement('span');
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';
            el.parentNode.insertBefore(wrapper, el);
            wrapper.appendChild(el);
            
            // Link Edit URL Button
            const btn = document.createElement('button');
            btn.className = 'admin-edit-btn';
            btn.innerHTML = '🔗';
            btn.title = "Edit Link URL";
            btn.style.right = '-25px'; // Push it outside the text
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const newHref = prompt("Enter new link URL:", el.getAttribute('href') || el.href);
                if (newHref) el.setAttribute('href', newHref);
            };
            btn.contentEditable = "false";
            wrapper.appendChild(btn);

            // Link Navigate Button
            const navBtn = document.createElement('button');
            navBtn.className = 'admin-edit-btn';
            navBtn.innerHTML = '↗️';
            navBtn.title = "Go to Page";
            navBtn.style.right = '-55px'; // Push it further outside
            navBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = el.getAttribute('href') || el.href;
            };
            navBtn.contentEditable = "false";
            wrapper.appendChild(navBtn);
            
            // Add hover effect to the wrapper to show buttons
            wrapper.addEventListener('mouseenter', () => {
                btn.style.display = 'flex';
                navBtn.style.display = 'flex';
            });
            wrapper.addEventListener('mouseleave', () => {
                btn.style.display = 'none';
                navBtn.style.display = 'none';
            });
            
            // initially hide buttons
            btn.style.display = 'none';
            navBtn.style.display = 'none';
            
        } else {
            // Normal Text
            el.contentEditable = "true";
            // Strip formatting on paste
            el.addEventListener('paste', (e) => {
                e.preventDefault();
                const text = (e.originalEvent || e).clipboardData.getData('text/plain');
                document.execCommand('insertText', false, text);
            });
        }
    });

    // Create Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'admin-toolbar';
    toolbar.innerHTML = `
        <span style="color:white; font-weight:bold; margin-right:10px;">Edit Mode</span>
        <button onclick="openCommitteeManager()" style="background: rgba(255,193,7,0.2); border: 1px solid #ffc107; color: #ffc107; font-weight: bold;">Manage Committee</button>
        <select id="admin-logo-style" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 5px 10px; border-radius: 20px; outline: none; margin-right: 15px;">
            <option value="brand-elegant-gold" style="color: black;">Logo: Elegant Gold</option>
            <option value="brand-bold-white" style="color: black;">Logo: Bold White</option>
        </select>
        <button class="save-btn" onclick="saveAdminChanges()">Save to Database</button>
        <button onclick="logoutAdmin()">Logout</button>
    `;
    document.body.appendChild(toolbar);
    
    // Initialize dropdown with current value
    const logoSelect = document.getElementById('admin-logo-style');
    if (document.querySelector('.navbar-brand') && document.querySelector('.navbar-brand').classList.contains('brand-bold-white')) {
        logoSelect.value = 'brand-bold-white';
    }
    
    // Live preview for logo
    logoSelect.addEventListener('change', (e) => {
        const brand = document.querySelector('.navbar-brand');
        if (brand) {
            brand.classList.remove('brand-elegant-gold', 'brand-bold-white');
            brand.classList.add(e.target.value);
        }
    });
}

window.saveAdminChanges = async function() {
    const btn = document.querySelector('.admin-toolbar .save-btn');
    btn.innerText = "Saving...";
    
    let newData = {};
    document.querySelectorAll('[data-editable]').forEach(el => {
        const key = el.getAttribute('data-editable');
        if (el.tagName === 'IMG') {
            newData[key] = el.getAttribute('src');
        } else if (el.tagName === 'A') {
            // Remove the edit button HTML before saving text
            const clone = el.cloneNode(true);
            clone.querySelectorAll('.admin-edit-btn').forEach(b => b.remove());
            
            newData[key] = clone.innerHTML.trim();
            newData[key + "_href"] = el.getAttribute('href');
        } else {
            newData[key] = el.innerHTML.trim();
        }
    });
    
    // Save the logo style preference
    const logoSelect = document.getElementById('admin-logo-style');
    if (logoSelect) {
        newData['logo_style'] = logoSelect.value;
    }
    
    try {
        const { error } = await window.supabaseClient
            .from('site_data')
            .upsert({ id: 'garrf_content', content: newData });
        if (error) throw error;
        btn.innerText = "Saved!";
        setTimeout(() => btn.innerText = "Save to Database", 2000);
    } catch (e) {
        alert("Failed to save: " + e.message);
        btn.innerText = "Save Failed";
    }
}

window.logoutAdmin = function() {
    sessionStorage.removeItem('adminMode');
    window.location.reload();
}

function renderCommittee(data) {
    const container = document.getElementById('committee-container');
    if (!container) return;
    
    // Check for category filter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const categoryFilter = urlParams.get('category');
    
    if (categoryFilter) {
        data = data.filter(cat => cat.categoryName && cat.categoryName.toLowerCase() === categoryFilter.toLowerCase());
        // Update page title dynamically
        const pageTitle = document.querySelector('.page-header h1');
        if (pageTitle) pageTitle.innerText = categoryFilter + " Team";
    }
    
    if (!data || data.length === 0) {
        container.innerHTML = `<div class="text-center py-5 text-muted">No members found${categoryFilter ? ' for ' + categoryFilter : ''}. Log into the Admin Portal to add some.</div>`;
        return;
    }
    
    let html = '';
    data.forEach(category => {
        // Only show category header if we aren't already filtered to a single category
        if (!categoryFilter) {
            html += `<h3 class="mt-5 mb-4 text-primary fw-bold" style="border-bottom: 2px solid var(--primary); padding-bottom: 10px;">${category.categoryName || 'Category'}</h3>`;
        }
        html += `<div class="row justify-content-center ${categoryFilter ? 'mt-4' : ''}">`;
        
        if(category.members) {
            category.members.forEach(member => {
                const hasDashboard = member.link && member.link.trim() !== "";
                const cardTag = hasDashboard ? 'a' : 'div';
                const linkAttr = hasDashboard ? `href="${member.link}" target="_blank"` : '';
                const cursorStyle = hasDashboard ? 'cursor: pointer;' : '';
                const hoverClass = hasDashboard ? 'committee-card-hover' : '';
                
                html += `
                <div class="col-md-3 col-sm-6 mb-4">
                    <${cardTag} ${linkAttr} class="card h-100 shadow border-0 ${hoverClass}" style="border-radius: 15px; overflow: hidden; text-decoration: none; color: inherit; ${cursorStyle} transition: transform 0.3s, box-shadow 0.3s;">
                        <img src="${member.photo || 'css/fig.png'}" class="card-img-top" style="height: 250px; object-fit: cover; width: 100%;" alt="${member.name}">
                        <div class="card-body text-center" style="background: rgba(255,255,255,0.9);">
                            <h5 class="card-title fw-bold mb-1">${member.name || 'Name'}</h5>
                            <p class="card-text text-muted small mb-0">${member.role || 'Role'}</p>
                            ${hasDashboard ? '<div class="mt-2 small fw-bold text-primary">View Dashboard &rarr;</div>' : ''}
                        </div>
                    </${cardTag}>
                </div>`;
            });
        }
        html += `</div>`;
    });
    
    container.innerHTML = html;
}

window.openCommitteeManager = function() {
    let data = JSON.parse(JSON.stringify(window.garrfSiteData.committee_data || []));
    
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0'; modal.style.left = '0'; modal.style.width = '100%'; modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    modal.style.zIndex = '100000';
    modal.style.overflowY = 'auto';
    modal.style.padding = '50px 20px';
    
    const content = document.createElement('div');
    content.className = 'container bg-white p-4 rounded shadow';
    content.style.maxWidth = '800px';
    
    const renderUI = () => {
        let html = '<h2 class="mb-4 text-dark">Manage Organizational Committee</h2>';
        data.forEach((cat, cIdx) => {
            html += `<div class="card mb-4 border-primary">
                <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <input type="text" class="form-control me-2" value="${cat.categoryName || ''}" onchange="updateCat(${cIdx}, this.value)" style="max-width: 300px;">
                    <button class="btn btn-sm btn-danger" onclick="deleteCat(${cIdx})">Delete Category</button>
                </div>
                <div class="card-body">`;
            
            if (cat.members) {
                cat.members.forEach((mem, mIdx) => {
                    html += `<div class="border rounded p-3 mb-3 bg-light position-relative">
                        <button class="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-2" onclick="deleteMem(${cIdx}, ${mIdx})">X</button>
                        <div class="row">
                            <div class="col-md-3 text-center">
                                <img src="${mem.photo || 'css/fig.png'}" style="width: 100%; height: 100px; object-fit: cover; cursor: pointer; border: 1px dashed #ccc;" onclick="uploadMemPhoto(${cIdx}, ${mIdx})" title="Click to upload photo">
                                <div class="small mt-1 text-muted">Click to change</div>
                            </div>
                            <div class="col-md-9 mt-3 mt-md-0">
                                <input type="text" class="form-control mb-2" placeholder="Member Name" value="${mem.name || ''}" onchange="updateMem(${cIdx}, ${mIdx}, 'name', this.value)">
                                <input type="text" class="form-control mb-2" placeholder="Role/Designation" value="${mem.role || ''}" onchange="updateMem(${cIdx}, ${mIdx}, 'role', this.value)">
                                <input type="text" class="form-control" placeholder="Dashboard Link (URL)" value="${mem.link || ''}" onchange="updateMem(${cIdx}, ${mIdx}, 'link', this.value)">
                            </div>
                        </div>
                    </div>`;
                });
            }
            html += `<button class="btn btn-sm btn-outline-primary" onclick="addMem(${cIdx})">+ Add Member</button>`;
            html += `</div></div>`;
        });
        
        html += `<button class="btn btn-success me-2" onclick="addCat()">+ Add Category</button>`;
        html += `<hr><div class="d-flex justify-content-end">
            <button class="btn btn-secondary me-2" onclick="closeComm()">Cancel</button>
            <button class="btn btn-primary" onclick="saveComm()">Apply Changes</button>
        </div>`;
        content.innerHTML = html;
    };
    
    window.updateCat = (cIdx, val) => { data[cIdx].categoryName = val; };
    window.deleteCat = (cIdx) => { if(confirm("Delete category?")) { data.splice(cIdx, 1); renderUI(); } };
    window.addCat = () => { data.push({categoryName: "New Category", members: []}); renderUI(); };
    window.updateMem = (cIdx, mIdx, field, val) => { data[cIdx].members[mIdx][field] = val; };
    window.deleteMem = (cIdx, mIdx) => { if(confirm("Delete member?")) { data[cIdx].members.splice(mIdx, 1); renderUI(); } };
    window.addMem = (cIdx) => { data[cIdx].members.push({name: "", role: "", link: "", photo: ""}); renderUI(); };
    
    window.uploadMemPhoto = (cIdx, mIdx) => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) { alert("File too large (max 2MB)"); return; }
                const reader = new FileReader();
                reader.onload = (re) => {
                    data[cIdx].members[mIdx].photo = re.target.result;
                    renderUI();
                };
                reader.readAsDataURL(file);
            }
        };
        fileInput.click();
    };
    
    window.closeComm = () => { document.body.removeChild(modal); };
    window.saveComm = () => { 
        window.garrfSiteData.committee_data = data; 
        document.body.removeChild(modal);
        if(typeof renderCommittee !== 'undefined') renderCommittee(data);
        alert("Applied to page! Click 'Save to Database' in the toolbar to make it permanent.");
    };
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    renderUI();
};

