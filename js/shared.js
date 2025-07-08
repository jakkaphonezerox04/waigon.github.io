const DEFAULT_WEBSITE_SETTINGS = {
    "websiteName": "WAIGON [WG]",
    "backgroundColor": "#1b0088",
    "textColor": "#ffffff",
    "backgroundImageUrl": "https://img2.pic.in.th/pic/wp8012828-fivem-wallpapers.jpg",
    "logoImageUrl": "https://img5.pic.in.th/file/secure-sv1/logo-nobg.png",
    "themeAccentColor": "#1b00a3",
    "webhookUrl": "",
    "registrationWebhookUrl": "",
    "deliveryWebhookUrl": "",
    "reportWebhookUrl": "",
    "leaveTypes": ["Airdrop", "ลาประชุม", "ลาธุระ", "ลาป่วย"],
    "availableGroups": ["member", "staff", "admin"],
    "groupPermissions": {
        "admin": ["admin.html", "user.html", "staff.html", "leave_form.html", "delivery_form.html", "report_form.html", "house_list.html", "fine_form.html"],
        "staff": ["user.html", "staff.html", "leave_form.html", "delivery_form.html", "report_form.html", "house_list.html", "fine_form.html"],
        "member": ["user.html", "leave_form.html", "delivery_form.html", "report_form.html"]
    },
    "fineList": [
        {"name": "วิ่งแก้บน", "amount": 500},
        {"name": "นอนเวลางาน", "amount": 1000}
    ],
    "users": { "admin": { "password": "admin", "group": "admin" } }
};

function getSettings() {
    try {
        const stored = localStorage.getItem('websiteSettings');
        let settings = stored ? JSON.parse(stored) : DEFAULT_WEBSITE_SETTINGS;

        // Ensure availableGroups exists and has default values
        if (!settings.availableGroups || !Array.isArray(settings.availableGroups) || settings.availableGroups.length === 0) {
            settings.availableGroups = DEFAULT_WEBSITE_SETTINGS.availableGroups;
        }
        // Ensure groupPermissions exists and has default values
        if (!settings.groupPermissions) {
            settings.groupPermissions = DEFAULT_WEBSITE_SETTINGS.groupPermissions;
        } else {
            // Merge default permissions in case new default groups are added later
            for (const group in DEFAULT_WEBSITE_SETTINGS.groupPermissions) {
                if (!settings.groupPermissions[group]) {
                    settings.groupPermissions[group] = DEFAULT_WEBSITE_SETTINGS.groupPermissions[group];
                }
            }
        }
        // Ensure fineList exists and has default values
        if (!settings.fineList || !Array.isArray(settings.fineList) || settings.fineList.length === 0) {
            settings.fineList = DEFAULT_WEBSITE_SETTINGS.fineList;
        }
        // Ensure default admin user and group are always present
        if (!settings.users || !settings.users.admin) {
            settings.users = { ...settings.users, ...DEFAULT_WEBSITE_SETTINGS.users };
        }
        // Migrate old 'role' to 'group' if present
        for (const userKey in settings.users) {
            if (settings.users[userKey].role && !settings.users[userKey].group) {
                settings.users[userKey].group = settings.users[userKey].role;
                delete settings.users[userKey].role;
            }
        }
        
        return settings;
    } catch (e) {
        console.error("Failed to parse website settings from localStorage:", e);
        return DEFAULT_WEBSITE_SETTINGS;
    }
}

function saveSettings(settings) {
    localStorage.setItem('websiteSettings', JSON.stringify(settings));
}

function getLeaveRequests() {
    try {
        const stored = localStorage.getItem('leaveRequests');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to parse leave requests from localStorage:", e);
        return [];
    }
}

function saveLeaveRequests(requests) {
    localStorage.setItem('leaveRequests', JSON.stringify(requests));
}

function getDeliveryHistory() {
    try {
        const stored = localStorage.getItem('deliveryHistory');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to parse delivery history from localStorage:", e);
        return [];
    }
}

function saveDeliveryHistory(history) {
    localStorage.setItem('deliveryHistory', JSON.stringify(history));
}

function getReportHistory() {
    try {
        const stored = localStorage.getItem('reportHistory');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to parse report history from localStorage:", e);
        return [];
    }
}

function saveReportHistory(history) {
    localStorage.setItem('reportHistory', JSON.stringify(history));
}

function applyThemeSettings() {
    const settings = getSettings();
    const websiteTitle = document.getElementById('websiteTitle');
    if (websiteTitle) {
        websiteTitle.textContent = settings.websiteName;
    }
    
    document.body.style.backgroundColor = settings.backgroundColor;
    document.body.style.color = settings.textColor;
    document.body.style.backgroundImage = `url('${settings.backgroundImageUrl}')`;
    document.documentElement.style.setProperty('--theme-accent-color', settings.themeAccentColor);
    
    const logoImg = document.getElementById('bioniczLogo') || document.getElementById('logo');
    if (logoImg) {
        logoImg.src = settings.logoImageUrl;
    }

    const copyrightYear = document.getElementById('copyrightYear');
    if (copyrightYear) copyrightYear.textContent = new Date().getFullYear();
    const copyrightName = document.getElementById('copyrightName');
    if (copyrightName) copyrightName.textContent = settings.websiteName;
}

function showMessage(box, message, isError = false) {
    if (!box) return;
    box.textContent = message;
    box.style.display = 'block';
    box.style.borderColor = isError ? '#FF4500' : '#32CD32';
    box.style.animation = 'fadeIn 0.5s forwards';
    setTimeout(() => {
        box.style.animation = 'fadeOut 0.5s forwards';
        box.addEventListener('animationend', () => {
            if (box.style.animationName === 'fadeOut') {
                box.style.display = 'none';
            }
        }, { once: true });
    }, 3000);
}

async function sendDiscordWebhook(url, payloadOrFormData) {
    try {
        let options = { method: 'POST' };

        if (payloadOrFormData instanceof FormData) {
            options.body = payloadOrFormData;
        } else {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(payloadOrFormData);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Webhook error! Status: ${response.status}, Response: ${errorText}`);
        }
    } catch (err) {
        console.error("Failed to send webhook:", err);
        throw err;
    }
}

function checkPagePermission(userGroup, pageFileName) {
    const settings = getSettings();
    const allowedPages = settings.groupPermissions[userGroup];
    if (!allowedPages) {
        return false;
    }
    return allowedPages.includes(pageFileName);
}

// --- NEW FUNCTIONS FOR HOUSE LIST ---

function gethouselist() { // เปลี่ยน L เป็น l ที่นี่
    return JSON.parse(localStorage.getItem('houseList')) || []; // เปลี่ยน key เป็น 'houseList' (L ใหญ่)
}

function saveHouseList(houseList) {
    localStorage.setItem('houseList', JSON.stringify(houseList)); // key เป็น 'houseList' (L ใหญ่)
}

// --- NEW FUNCTIONS FOR FINE LIST AND FINE HISTORY ---

function getFineList() {
    const settings = getSettings();
    return settings.fineList || [];
}

function saveFineList(fineList) {
    let settings = getSettings();
    settings.fineList = fineList;
    saveSettings(settings);
}

function getFineDetails(fineName) {
    const fineList = getFineList();
    return fineList.find(fine => fine.name === fineName);
}

function getFineHistory() {
    try {
        const stored = localStorage.getItem('fineHistory');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to parse fine history from localStorage:", e);
        return [];
    }
}

function saveFineHistory(history) {
    localStorage.setItem('fineHistory', JSON.stringify(history));
}

// --- END NEW FUNCTIONS ---