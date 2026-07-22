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
                            // Jugad: Client-side Image Compression using Canvas to save DB space
                            const reader = new FileReader();
                            reader.onload = (readerEvent) => {
                                const img = new Image();
                                img.onload = () => {
                                    const canvas = document.createElement('canvas');
                                    const MAX_WIDTH = 800;
                                    const MAX_HEIGHT = 800;
                                    let width = img.width;
                                    let height = img.height;
                                    if (width > height && width > MAX_WIDTH) {
                                        height *= MAX_WIDTH / width; width = MAX_WIDTH;
                                    } else if (height > MAX_HEIGHT) {
                                        width *= MAX_HEIGHT / height; height = MAX_HEIGHT;
                                    }
                                    canvas.width = width; canvas.height = height;
                                    const ctx = canvas.getContext('2d');
                                    ctx.drawImage(img, 0, 0, width, height);
                                    
                                    el.src = canvas.toDataURL('image/webp', 0.8);
                                    el.style.border = 'none';
                                    alert("Image heavily compressed and uploaded temporarily! Click 'Save to Database' to permanently save it.");
                                };
                                img.src = readerEvent.target.result;
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
    
    // Preserve all existing data (from other pages) and merge with new edits
    let newData = { ...window.garrfSiteData };
    
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
    
    const isAdmin = sessionStorage.getItem('adminMode') === 'true';
    
    let html = '';
    data.forEach((category, cIdx) => {
        // Only show category header if we aren't already filtered to a single category
        if (!categoryFilter) {
            html += `<div class="d-flex justify-content-between align-items-center mt-5 mb-4" style="border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 10px;">
                        <h3 class="text-dark fw-bold mb-0" style="border-left: 4px solid #D4AF37; padding-left: 15px;">${category.categoryName || 'Category'}</h3>
                        ${isAdmin ? `<div class="d-flex gap-2">
                            <button class="btn btn-sm btn-outline-primary" onclick="editCategoryName(${cIdx})">✏️ Rename</button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteCat(${cIdx})">🗑️ Delete</button>
                            <button class="btn btn-sm btn-outline-secondary" onclick="copyCatLink('${category.categoryName ? category.categoryName.replace(/'/g, "\\'") : ''}')">🔗 Copy Link</button>
                        </div>` : ''}
                    </div>`;
        }
        
        const isFullWidth = category.categoryName.toLowerCase().includes('patron') || category.categoryName.toLowerCase().includes('leadership');
        
        html += `<div class="committee-grid"><div class="row justify-content-center">`;
        
        if(category.members) {
            category.members.forEach((member, mIdx) => {
                const memberData = encodeURIComponent(JSON.stringify(member));
                const onclickStr = isAdmin ? `openMemEditModal(${cIdx}, ${mIdx})` : `openMemberModal('${memberData.replace(/'/g, "\\'")}')`;
                
                let linksHtml = '';
                if (member.link && member.link.trim() !== '') {
                    if (member.link.includes('linkedin.com')) {
                        linksHtml = `<a href="${member.link}" target="_blank" class="linkedin-btn"><i class="fab fa-linkedin"></i> LinkedIn</a>`;
                    } else {
                        linksHtml = `<a href="${member.link}" target="_blank" class="website-btn"><i class="fas fa-globe"></i> Website</a>`;
                    }
                }
                
                let allFieldsHtml = '';
                if (member.customFields && member.customFields.length > 0) {
                    member.customFields.forEach(f => {
                        allFieldsHtml += `<p class="mt-3 mb-3" style="color: #444; font-size: 0.95rem; line-height: 1.7; text-align: justify;">${f.value}</p>`;
                    });
                }

                if (isFullWidth) {
                    // Screenshot 1: Full Width Presentation Layout (No Card)
                    html += `
                    <div class="col-lg-10 mb-5 position-relative text-center" onclick="${onclickStr}" style="cursor: pointer;">
                        ${isAdmin ? `<button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2" style="z-index: 10;" onclick="event.stopPropagation(); deleteMem(${cIdx}, ${mIdx})">🗑️</button>` : ''}
                        
                        <div class="mb-4">
                            <img src="${member.photo || 'css/fig.png'}" alt="${member.name}" style="width: 180px; height: 180px; border-radius: 50%; object-fit: cover; border: 4px solid #fff; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                        </div>
                        
                        <h2 class="fw-bold mb-2" style="color: #005582;">${member.name || 'Name'}</h2>
                        <h5 class="fw-semibold mb-4" style="color: #28a745;">${member.role || 'Role'}</h5>
                        
                        ${allFieldsHtml}
                        
                        <div class="mt-4 d-flex justify-content-center gap-3">
                            ${linksHtml}
                        </div>
                        
                        ${isAdmin ? `<div class="mt-4 text-primary small fw-bold text-center">✏️ Click anywhere to Edit</div>` : ''}
                    </div>`;
                } else {
                    // Screenshot 2: Circular Image Grid Card
                    html += `
                    <div class="col-lg-4 col-md-6 col-sm-12 mb-4">
                        <div class="grid-card h-100 position-relative" onclick="${onclickStr}">
                            ${isAdmin ? `<button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2" style="z-index: 10;" onclick="event.stopPropagation(); deleteMem(${cIdx}, ${mIdx})">🗑️</button>` : ''}
                            
                            <div class="text-center pt-4">
                                <img src="${member.photo || 'css/fig.png'}" alt="${member.name}" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 4px solid #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                            </div>
                            
                            <div class="grid-card-body pt-3 pb-4 px-4 text-center">
                                <h4 class="fw-bold mb-2" style="color: #005582; font-size: 1.3rem;">${member.name || 'Name'}</h4>
                                <h6 class="fw-semibold mb-3" style="color: #28a745;">${member.role || 'Role'}</h6>
                                ${member.customFields && member.customFields.length > 0 ? `<p class="text-muted mb-0" style="font-size: 0.9rem; line-height: 1.5;">${member.customFields[0].value}</p>` : ''}
                                
                                <div class="mt-4 pt-2">
                                    ${linksHtml}
                                </div>
                                
                                ${isAdmin ? `<div class="mt-auto pt-4 text-primary small fw-bold">✏️ Click to Edit</div>` : ''}
                            </div>
                        </div>
                    </div>`;
                }
            });
        }
        
        if (isAdmin) {
            html += `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="grid-card h-100 d-flex align-items-center justify-content-center" style="border: 2px dashed #D4AF37; background: rgba(0,0,0,0.2); cursor: pointer; min-height: 400px;" onclick="addMem(${cIdx})">
                    <div class="text-center">
                        <div style="font-size: 3rem; color: #D4AF37; line-height: 1;">+</div>
                        <div class="fw-bold mt-2" style="color: #D4AF37;">Add Member</div>
                    </div>
                </div>
            </div>`;
        }
        
        html += `</div></div>`;
    });
    
    if (isAdmin) {
        html += `<div class="text-center mt-5 mb-5"><button class="btn btn-lg btn-success shadow" onclick="addCat()">+ Add New Category / Division</button></div>`;
    }
    
    container.innerHTML = html;
}

window.openMemberModal = function(memberDataStr) {
    const member = JSON.parse(decodeURIComponent(memberDataStr));
    
    const overlay = document.createElement('div');
    overlay.className = 'committee-modal-overlay';
    
    let fieldsHtml = '';
    if (member.customFields && member.customFields.length > 0) {
        member.customFields.forEach(f => {
            fieldsHtml += `<div><div class="cm-field-label">${f.label}</div><div class="cm-field-value">${f.value}</div></div>`;
        });
    }
    
    let linksHtml = '';
    if (member.link && member.link.trim() !== '') {
        if (member.link.includes('linkedin.com')) {
            linksHtml = `<a href="${member.link}" target="_blank" class="linkedin-btn mt-3"><i class="fab fa-linkedin"></i> LinkedIn</a>`;
        } else {
            linksHtml = `<a href="${member.link}" target="_blank" class="website-btn mt-3"><i class="fas fa-globe"></i> Website</a>`;
        }
    }
    
    overlay.innerHTML = `
        <div class="committee-modal-content">
            <button class="committee-modal-close" onclick="this.parentElement.parentElement.remove()">×</button>
            <img src="${member.photo || 'css/fig.png'}" class="committee-modal-img" alt="${member.name}">
            <div class="committee-modal-body">
                <h2 style="font-weight: 700; margin-bottom: 5px; color: #222;">${member.name || 'Name'}</h2>
                <div class="cm-role">${member.role || 'Role'}</div>
                <hr style="border-color: rgba(0,0,0,0.1); margin-bottom: 20px;">
                ${fieldsHtml}
                ${linksHtml}
            </div>
        </div>
    `;
    
    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
    };
    
    document.body.appendChild(overlay);
    setTimeout(() => { overlay.style.opacity = '1'; }, 10);
}

window.deleteCat = (cIdx) => {
    if(confirm("Delete category?")) {
        window.garrfSiteData.committee_data.splice(cIdx, 1);
        renderCommittee(window.garrfSiteData.committee_data);
    }
};

window.addCat = () => {
    window.garrfSiteData.committee_data.push({categoryName: "New Category", members: []});
    renderCommittee(window.garrfSiteData.committee_data);
    window.scrollTo(0, document.body.scrollHeight);
};

window.deleteMem = (cIdx, mIdx) => {
    if(confirm("Delete member?")) {
        window.garrfSiteData.committee_data[cIdx].members.splice(mIdx, 1);
        renderCommittee(window.garrfSiteData.committee_data);
    }
};

window.addMem = (cIdx) => {
    window.garrfSiteData.committee_data[cIdx].members.push({name: "New Member", role: "Role", link: "", photo: "", customFields: []});
    renderCommittee(window.garrfSiteData.committee_data);
    openMemEditModal(cIdx, window.garrfSiteData.committee_data[cIdx].members.length - 1);
};

window.editCategoryName = (cIdx) => {
    const newName = prompt("Enter new category name:", window.garrfSiteData.committee_data[cIdx].categoryName);
    if (newName !== null) {
        window.garrfSiteData.committee_data[cIdx].categoryName = newName.trim();
        renderCommittee(window.garrfSiteData.committee_data);
    }
};

window.openMemEditModal = function(cIdx, mIdx) {
    let mem = JSON.parse(JSON.stringify(window.garrfSiteData.committee_data[cIdx].members[mIdx]));
    if (!mem.customFields) mem.customFields = [];
    
    const overlay = document.createElement('div');
    overlay.className = 'committee-modal-overlay';
    overlay.style.zIndex = '105001';
    
    const renderUI = () => {
        let fieldsHtml = '';
        mem.customFields.forEach((f, fIdx) => {
            fieldsHtml += `<div class="input-group input-group-sm mb-2">
                <input type="text" class="form-control bg-dark text-white border-secondary" placeholder="Label (e.g. Qualification)" value="${f.label}" onchange="mem.customFields[${fIdx}].label=this.value">
                <input type="text" class="form-control w-50 bg-dark text-white border-secondary" placeholder="Value (e.g. Ph.D)" value="${f.value}" onchange="mem.customFields[${fIdx}].value=this.value">
                <button class="btn btn-outline-danger" onclick="mem.customFields.splice(${fIdx}, 1); renderUI()">X</button>
            </div>`;
        });

        overlay.innerHTML = `
            <div class="committee-modal-content" style="max-width: 600px; padding: 20px; display: block; overflow-y: auto;">
                <h3 class="text-warning mb-4">✏️ Edit Member</h3>
                <div class="text-center mb-3">
                    <img src="${mem.photo || 'css/fig.png'}" style="width: 150px; height: 150px; object-fit: cover; border-radius: 50%; cursor: pointer; border: 2px dashed #D4AF37;" onclick="uploadMemPhotoInModal()" title="Click to upload photo">
                    <div class="small mt-1 text-muted">Click to change photo</div>
                </div>
                
                <label class="small text-muted mb-1">Name</label>
                <input type="text" class="form-control bg-dark text-white border-secondary mb-3" value="${mem.name || ''}" onchange="mem.name=this.value">
                
                <label class="small text-muted mb-1">Role / Designation</label>
                <input type="text" class="form-control bg-dark text-white border-secondary mb-3" value="${mem.role || ''}" onchange="mem.role=this.value">
                
                <label class="small text-muted mb-1">Dashboard Link (URL) - Optional</label>
                <input type="text" class="form-control bg-dark text-white border-secondary mb-4" value="${mem.link || ''}" onchange="mem.link=this.value">
                
                <h6 class="text-warning border-bottom border-secondary pb-2 mb-3">Custom Fields</h6>
                ${fieldsHtml}
                <button class="btn btn-sm btn-outline-secondary mt-2 mb-4" onclick="mem.customFields.push({label:'', value:''}); renderUI()">+ Add Custom Field</button>
                
                <div class="d-flex justify-content-end gap-2 mt-2 pt-3 border-top border-secondary">
                    <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">Cancel</button>
                    <button class="btn btn-warning text-dark fw-bold" onclick="saveMemEdit()">Save Member</button>
                </div>
            </div>
        `;
        
        window.renderUI = renderUI;
        window.mem = mem;
    };
    
    window.uploadMemPhotoInModal = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (re) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 400; // Smaller limit since it's just a portrait
                        const MAX_HEIGHT = 400;
                        let width = img.width;
                        let height = img.height;
                        if (width > height && width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width; width = MAX_WIDTH;
                        } else if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height; height = MAX_HEIGHT;
                        }
                        canvas.width = width; canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // Convert to heavily compressed webp
                        mem.photo = canvas.toDataURL('image/webp', 0.7);
                        renderUI();
                    };
                    img.src = re.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
        fileInput.click();
    };
    
    window.saveMemEdit = () => {
        window.garrfSiteData.committee_data[cIdx].members[mIdx] = mem;
        overlay.remove();
        renderCommittee(window.garrfSiteData.committee_data);
    };
    
    document.body.appendChild(overlay);
    renderUI();
    setTimeout(() => { overlay.style.opacity = '1'; }, 10);
};

window.copyCatLink = (catName) => {
    if (!catName) { alert("Please enter a category name first!"); return; }
    const url = `committee.html?category=${encodeURIComponent(catName)}`;
    navigator.clipboard.writeText(url).then(() => alert(`Link copied to clipboard!\n\n${url}\n\nYou can now paste this using the 🔗 button on any card in the main UI.`));
};
