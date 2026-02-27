(function() {
    const $ = (id) => document.getElementById(id);

    // --- STATE ENGINE ---
    const STATE = {
        inventory: JSON.parse(localStorage.getItem('mh_inv')) || [],
        cart: JSON.parse(localStorage.getItem('mh_cart')) || [],
        queue: JSON.parse(localStorage.getItem('mh_queue')) || [],
        logs: JSON.parse(localStorage.getItem('mh_logs')) || [],
        activeUser: localStorage.getItem('mh_activeUser') || '',
        currentRole: localStorage.getItem('mh_role') || ''
    };

    function log(msg) {
        const e = `[${new Date().toLocaleTimeString()}] ${msg}`;
        STATE.logs.push(e);
        localStorage.setItem('mh_logs', JSON.stringify(STATE.logs));
    }

    // --- AUTHENTICATION ---
    window.setRole = (r) => {
        STATE.currentRole = r;
        localStorage.setItem('mh_role', r);
        $('auth-roles').style.display = 'none';
        $('login-form').style.display = 'block';
        $('role-tag').innerText = r === 'create' ? "IDENTITY REGISTRATION" : `${r.toUpperCase()} PORTAL`;
    };

    window.startBio = () => {
        const u = $('uid').value.trim().toUpperCase(), p = $('upin').value;
        if (!u || !p) return alert("Credentials Required.");
        $('login-form').style.display = 'none';
        $('bio-scanner').style.display = 'block';
        setTimeout(() => {
            if (STATE.currentRole === 'admin' && p !== 'SUPER-LOGS') return location.reload();
            if (STATE.currentRole === 'staff' && p !== 'APEX-99') return location.reload();
            if (STATE.currentRole === 'create') {
                localStorage.setItem('u_' + u, p);
                log(`NEW USER: ${u}`);
                return location.reload();
            }
            if (STATE.currentRole === 'guest' && localStorage.getItem('u_' + u) !== p) return location.reload();
            
            localStorage.setItem('mh_activeUser', u);
            localStorage.setItem('mh_verified', 'true');
            log(`LOGIN: ${u} as ${STATE.currentRole}`);
            window.location.href = 'dashboard.html';
        }, 2200);
    };

    // --- OPERATIONS ---
    window.book = (id) => {
        const item = STATE.inventory.find(i => i.id === id);
        item.status = 'occupied';
        STATE.cart.push({...item});
        STATE.queue.push({guest: STATE.activeUser, item: item.name, id: Date.now()});
        log(`${STATE.activeUser} ACQUIRED ${item.name}`);
        save(); location.reload();
    };

    window.toggleMaint = (id) => {
        const item = STATE.inventory.find(i => i.id === id);
        item.status = (item.status === 'maintenance') ? 'available' : 'maintenance';
        log(`STATUS CHANGE: ${item.name} -> ${item.status}`);
        save(); location.reload();
    };

    window.softReset = () => {
        localStorage.removeItem('mh_inv');
        localStorage.removeItem('mh_cart');
        localStorage.removeItem('mh_queue');
        log("ADMIN: CACHE PURGED");
        location.reload();
    };

    window.resetPin = () => {
        const target = prompt("GUEST ID:").toUpperCase();
        if(localStorage.getItem('u_' + target)) {
            localStorage.setItem('u_' + target, prompt("NEW PIN:"));
            log(`ADMIN: PIN RESET FOR ${target}`);
            alert("Updated.");
        } else alert("Not Found.");
    };

    function save() {
        localStorage.setItem('mh_inv', JSON.stringify(STATE.inventory));
        localStorage.setItem('mh_cart', JSON.stringify(STATE.cart));
        localStorage.setItem('mh_queue', JSON.stringify(STATE.queue));
    }

    window.onload = () => {
        if (STATE.inventory.length === 0) {
            const data = [
                {id:'S1', cat:'suite', name:'Presidential Suite', p:180000, img:'1578683010236-d716f9a3f461'},
                {id:'D1', cat:'dining', name:'Horizon Burger', p:1800, img:'1568901346375-23c9450c58cd'},
                {id:'A1', cat:'amenities', name:'Zen Spa', p:12000, img:'1544161515-4ab6ce6db874'}
            ];
            STATE.inventory = data.map(d => ({...d, status:'available', img:`https://images.unsplash.com/photo-${d.img}?w=600`}));
            save();
        }

        ['suite', 'dining', 'amenities', 'event'].forEach(cat => {
            const el = $(cat + '-grid');
            if(!el) return;
            el.innerHTML = STATE.inventory.filter(i => i.cat === cat).map(i => `
                <div class="card">
                    <span class="status-badge ${i.status==='available'?'avail':(i.status==='maintenance'?'maint':'occu')}">${i.status}</span>
                    <img src="${i.img}">
                    <div style="padding:20px;">
                        <h4 class="logo-text" style="font-size:10px;">${i.name}</h4>
                        <p style="color:var(--gold); margin:10px 0;">KSH ${i.p.toLocaleString()}</p>
                        ${i.status === 'available' ? `<button class="btn" onclick="book('${i.id}')">ACQUIRE</button>` : ''}
                        ${(STATE.currentRole==='staff' || STATE.currentRole==='admin') ? `<button class="btn" style="border-color:#444; color:#666;" onclick="toggleMaint('${i.id}')">MAINTENANCE</button>` : ''}
                    </div>
                </div>`).join('');
        });

        if($('user-name')) $('user-name').innerText = STATE.activeUser;
        if($('cart-count')) $('cart-count').innerText = `(${STATE.cart.length})`;
    };
})();