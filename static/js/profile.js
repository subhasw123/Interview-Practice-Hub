/* Career Profile — full save/load */
(function () {

    // ─── Graduation Year Dropdown ─────────────────────────────────────────
    const gradYear = document.getElementById('grad-year');
    const currentYear = new Date().getFullYear();
    for (let y = currentYear + 5; y >= currentYear - 15; y--) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        gradYear.appendChild(opt);
    }

    // ─── Toast Helper ─────────────────────────────────────────────────────
    const toast = document.getElementById('toast');
    function showToast(msg, isError) {
        toast.textContent = msg;
        toast.style.background = isError ? '#e53e3e' : '#4f46e5';
        toast.classList.add('show');
        clearTimeout(showToast._t);
        showToast._t = setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ─── Completion Ring variables (declared early so updateCompletion is always ready) ───
    var CIRC = 326.7;
    var circle = document.getElementById('completion-circle');
    var pctLabel = document.getElementById('completion-pct');

    // ─── Photo Preview ────────────────────────────────────────────────────
    const photoInput = document.getElementById('photo-input');
    const avatar = document.getElementById('avatar-preview');
    photoInput.addEventListener('change', function (e) {
        var file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { showToast('Please select an image', true); return; }
        if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB', true); return; }
        var reader = new FileReader();
        reader.onload = function (ev) {
            avatar.innerHTML = '<img src="' + ev.target.result + '" alt="Profile photo" />';
            updateCompletion();
        };
        reader.readAsDataURL(file);
    });

    // ─── Resume Preview ───────────────────────────────────────────────────
    const resumeInput = document.getElementById('resume-input');
    const resumeName = document.getElementById('resume-name');
    const resumeBtnLabel = document.getElementById('resume-btn-label');
    resumeInput.addEventListener('change', function (e) {
        var file = e.target.files[0];
        if (!file) return;
        if (!/\.(pdf|docx)$/i.test(file.name)) { showToast('Only PDF or DOCX allowed', true); return; }
        if (file.size > 5 * 1024 * 1024) { showToast('Resume must be under 5MB', true); return; }
        resumeName.textContent = file.name;
        resumeBtnLabel.textContent = 'Replace Resume';
        updateCompletion();
    });

    // ─── Skills ───────────────────────────────────────────────────────────
    const skillInput = document.getElementById('skill-input');
    const addSkillBtn = document.getElementById('add-skill');
    const chipsWrap = document.getElementById('skill-chips');
    const skillsCount = document.getElementById('skills-count');
    const skillEmpty = document.getElementById('skill-empty');
    var skills = [];

    function renderSkills() {
        chipsWrap.innerHTML = '';
        skills.forEach(function (s, i) {
            var chip = document.createElement('span');
            chip.className = 'chip';
            chip.innerHTML = s + '<button type="button" aria-label="Remove ' + s + '">&times;</button>';
            chip.querySelector('button').addEventListener('click', function () {
                skills.splice(i, 1);
                renderSkills();
                updateCompletion();
            });
            chipsWrap.appendChild(chip);
        });
        skillsCount.textContent = skills.length + ' skill' + (skills.length !== 1 ? 's' : '');
        skillEmpty.style.display = skills.length ? 'none' : 'block';
    }

    function addSkill() {
        var v = skillInput.value.trim();
        if (!v) return;
        if (skills.find(function (s) { return s.toLowerCase() === v.toLowerCase(); })) {
            showToast('Skill already added', true);
            return;
        }
        skills.push(v);
        skillInput.value = '';
        renderSkills();
        updateCompletion();
    }

    addSkillBtn.addEventListener('click', addSkill);
    skillInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); addSkill(); }
    });
    renderSkills();

    // ─── About Counter ────────────────────────────────────────────────────
    const about = document.getElementById('about');
    const aboutCount = document.getElementById('about-count');
    about.addEventListener('input', function () {
        aboutCount.textContent = about.value.length;
        updateCompletion();
    });

    // ─── Certifications ───────────────────────────────────────────────────
    const certList = document.getElementById('cert-list');
    const addCertBtn = document.getElementById('add-cert');

    function addCert(data) {
        var item = document.createElement('div');
        item.className = 'cert-item';
        item.innerHTML =
            '<input type="text" placeholder="Certificate Name" value="' + (data && data.name ? data.name : '') + '" />' +
            '<input type="text" placeholder="Organization" value="' + (data && data.organization ? data.organization : '') + '" />' +
            '<input type="number" placeholder="Year" min="1990" max="' + (currentYear + 1) + '" value="' + (data && data.year ? data.year : '') + '" />' +
            '<button type="button" class="cert-remove" aria-label="Remove">&times;</button>';
        item.querySelector('.cert-remove').addEventListener('click', function () {
            item.remove();
            updateCompletion();
        });
        item.querySelectorAll('input').forEach(function (i) {
            i.addEventListener('input', updateCompletion);
        });
        certList.appendChild(item);
        updateCompletion();
    }

    addCertBtn.addEventListener('click', function () { addCert(); });
    addCert(); // default empty row

    // ─── Languages Toggle ─────────────────────────────────────────────────
    const otherCheck = document.getElementById('lang-other-check');
    const otherInput = document.getElementById('lang-other');
    otherCheck.addEventListener('change', function () {
        otherInput.style.display = otherCheck.checked ? 'block' : 'none';
        updateCompletion();
    });
    document.querySelectorAll('#lang-grid input[type="checkbox"]').forEach(function (cb) {
        cb.addEventListener('change', updateCompletion);
    });

    // ─── Completion Ring ──────────────────────────────────────────────────

    function updateCompletion() {
        var trackables = document.querySelectorAll('[data-track]');
        var filled = 0;
        var total = trackables.length;
        trackables.forEach(function (el) {
            if (el.value && el.value.trim()) filled++;
        });
        total += 5;
        if (avatar.querySelector('img')) filled++;
        if (resumeInput.files && resumeInput.files[0]) filled++;
        if (skills.length > 0) filled++;
        if (document.querySelectorAll('#lang-grid input:checked').length) filled++;
        var anyCert = Array.from(certList.querySelectorAll('.cert-item input:first-child')).some(function (i) { return i.value.trim(); });
        if (anyCert) filled++;
        var pct = Math.min(100, Math.round((filled / total) * 100));
        pctLabel.textContent = pct + '%';
        circle.style.strokeDashoffset = CIRC - (CIRC * pct) / 100;
    }

    document.querySelectorAll('[data-track]').forEach(function (el) {
        el.addEventListener('input', updateCompletion);
        el.addEventListener('change', updateCompletion);
    });
    updateCompletion();

    // ─── Load existing profile from server ───────────────────────────────
    fetch('/api/profile', { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (p) {
            if (!p) return;
            function setVal(id, val) {
                var el = document.getElementById(id);
                if (el && val) el.value = val;
            }
            setVal('fullname', p.fullname);
            setVal('phone', p.phone);
            setVal('city', p.city);
            setVal('country', p.country);
            setVal('college', p.college);
            setVal('degree', p.degree);
            setVal('branch', p.branch);
            setVal('grad-year', p.grad_year);
            setVal('cgpa', p.cgpa);
            setVal('target-role', p.target_role);
            setVal('experience', p.experience);
            setVal('worktype', p.worktype);
            setVal('pref-location', p.pref_location);
            setVal('about', p.about);
            if (p.about) aboutCount.textContent = p.about.length;
            // Social
            if (p.social) {
                setVal('linkedin', p.social.linkedin);
                setVal('github', p.social.github);
                setVal('portfolio', p.social.portfolio);
                setVal('leetcode', p.social.leetcode);
                setVal('hackerrank', p.social.hackerrank);
            }
            // Skills
            if (p.skills && p.skills.length) {
                skills = p.skills.slice();
                renderSkills();
            }
            // Languages
            if (p.languages && p.languages.length) {
                document.querySelectorAll('#lang-grid input[type="checkbox"]').forEach(function (cb) {
                    if (p.languages.indexOf(cb.value) !== -1) cb.checked = true;
                });
            }
            // Certifications
            if (p.certifications && p.certifications.length) {
                certList.innerHTML = '';
                p.certifications.forEach(function (c) { addCert(c); });
            }
            // Avatar
            if (p.avatar) {
                avatar.innerHTML = '<img src="/static/' + p.avatar + '" alt="Profile photo" />';
            }
            updateCompletion();
        })
        .catch(function (err) {
            console.warn('Could not load profile:', err);
        });

    // ─── Save Button ──────────────────────────────────────────────────────
    document.getElementById('save-btn').addEventListener('click', function () {
        var data = {
            fullname: document.getElementById('fullname').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            city: document.getElementById('city').value.trim(),
            country: document.getElementById('country').value,
            college: document.getElementById('college').value.trim(),
            degree: document.getElementById('degree').value,
            branch: document.getElementById('branch').value.trim(),
            grad_year: document.getElementById('grad-year').value,
            cgpa: document.getElementById('cgpa').value,
            target_role: document.getElementById('target-role').value,
            experience: document.getElementById('experience').value,
            worktype: document.getElementById('worktype').value,
            pref_location: document.getElementById('pref-location').value.trim(),
            about: document.getElementById('about').value.trim(),
            skills: skills,
            social: {
                linkedin: document.getElementById('linkedin').value.trim(),
                github: document.getElementById('github').value.trim(),
                portfolio: document.getElementById('portfolio').value.trim(),
                leetcode: document.getElementById('leetcode').value.trim(),
                hackerrank: document.getElementById('hackerrank').value.trim()
            },
            certifications: Array.from(certList.querySelectorAll('.cert-item')).map(function (item) {
                var inputs = item.querySelectorAll('input');
                return {
                    name: inputs[0] ? inputs[0].value.trim() : '',
                    organization: inputs[1] ? inputs[1].value.trim() : '',
                    year: inputs[2] ? inputs[2].value.trim() : ''
                };
            }),
            languages: (function () {
                var langs = Array.from(document.querySelectorAll('#lang-grid input[type="checkbox"]:checked')).map(function (cb) { return cb.value; });
                var oth = document.getElementById('lang-other').value.trim();
                if (oth) langs.push(oth);
                return langs;
            })()
        };

        if (!data.fullname) {
            showToast('⚠️ Please enter your full name first', true);
            return;
        }

        var saveBtn = document.getElementById('save-btn');
        var origText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving…';

        fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(data)
        })
        .then(function (response) {
            if (response.status === 401 || response.status === 302) {
                showToast('Session expired. Please log in again.', true);
                setTimeout(function () { window.location.href = '/login'; }, 2000);
                return null;
            }
            return response.json();
        })
        .then(function (result) {
            if (!result) return;
            if (result.success) {
                showToast('✅ Profile saved successfully!');
            } else {
                showToast('❌ ' + (result.message || 'Save failed'), true);
            }
        })
        .catch(function (err) {
            console.error('Save error:', err);
            showToast('❌ Network error — could not save', true);
        })
        .finally(function () {
            saveBtn.disabled = false;
            saveBtn.textContent = origText;
        });
    });

    // ─── Cancel Button ────────────────────────────────────────────────────
    document.getElementById('cancel-btn').addEventListener('click', function () {
        showToast('Changes discarded');
    });

})();
