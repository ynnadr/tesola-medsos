document.addEventListener('DOMContentLoaded', function() {
    
    // --- ELEMEN DOM ---
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearEl = document.getElementById('month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    
    // Modal Elements
    const modal = document.getElementById('content-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalListView = document.getElementById('modal-list-view');
    const addNewContentBtn = document.getElementById('add-new-content-btn');
    const closeBtn = document.querySelector('.close-button');
    
    // Form Elements
    const editForm = document.getElementById('edit-form');
    const saveContentBtn = document.getElementById('save-content-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    
    let contentData = [];
    let currentDate = new Date(2025, 6, 1); // Juli 2025

    // --- FETCH DATA & INISIALISASI ---
    async function initializeCalendar() {
        try {
            const response = await fetch('content.json');
            if (!response.ok) throw new Error('Network response was not ok');
            contentData = await response.json();
            renderCalendar();
        } catch (error) {
            console.error('Error loading content data:', error);
            calendarGrid.innerHTML = '<p style="color: red; text-align: center; grid-column: 1 / -1;">Gagal memuat data konten. Pastikan file content.json ada.</p>';
        }
    }

    // --- FUNGSI RENDER KALENDER ---
    function renderCalendar() {
        calendarGrid.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthName = new Date(year, month).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        monthYearEl.textContent = monthName;

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarGrid.insertAdjacentHTML('beforeend', '<div class="calendar-day padding-day"></div>');
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            dayEl.dataset.date = dateString;

            let contentHTML = `<div class="day-number">${day}</div><div class="day-content-wrapper">`;
            const postsForDay = contentData.filter(post => post.date === dateString).sort((a,b) => a.time.localeCompare(b.time));

            postsForDay.forEach(post => {
                contentHTML += `
                    <div class="content-post" data-platform="${post.platform}">
                        <div class="post-platform" data-platform="${post.platform}">${post.platform} ${post.type}</div>
                        <div>${post.time} - ${post.idea}</div>
                    </div>
                `;
            });
            contentHTML += '</div>';
            dayEl.innerHTML = contentHTML;

            // Tambahkan event listener untuk membuka modal saat tanggal diklik
            dayEl.addEventListener('click', () => showModalForDate(dateString));
            
            calendarGrid.appendChild(dayEl);
        }
    }

    // --- FUNGSI MODAL & FORM ---
    function showModalForDate(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        modalTitle.textContent = `Konten untuk ${date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}`;
        
        // Tampilkan daftar konten yang sudah ada
        const postsForDay = contentData.filter(p => p.date === dateString).sort((a,b) => a.time.localeCompare(b.time));
        modalListView.innerHTML = '';
        if (postsForDay.length > 0) {
            postsForDay.forEach(post => {
                const itemEl = document.createElement('div');
                itemEl.className = 'modal-list-item';
                itemEl.innerHTML = `
                    <span class="modal-list-item-info">${post.time} - ${post.platform} - ${post.idea}</span>
                    <div>
                        <button class="edit-button" data-id="${post.id}">✏️</button>
                        <button class="delete-button" data-id="${post.id}">🗑️</button>
                    </div>
                `;
                modalListView.appendChild(itemEl);
            });
        } else {
            modalListView.innerHTML = '<p>Belum ada konten untuk tanggal ini.</p>';
        }

        // Setup tombol edit dan hapus
        document.querySelectorAll('.edit-button').forEach(btn => btn.addEventListener('click', (e) => showEditForm(e.target.dataset.id)));
        document.querySelectorAll('.delete-button').forEach(btn => btn.addEventListener('click', (e) => deleteContent(e.target.dataset.id)));
        
        // Setup tombol tambah baru
        addNewContentBtn.onclick = () => showEditForm(null, dateString);

        // Tampilkan modal dan reset tampilan form
        modal.style.display = 'block';
        editForm.style.display = 'none';
        modalListView.style.display = 'block';
        addNewContentBtn.style.display = 'block';
    }

    function showEditForm(postId, dateForNewPost) {
        editForm.reset();
        const isNew = postId === null;
        
        if (isNew) {
            document.getElementById('edit-id').value = '';
            document.getElementById('edit-date').value = dateForNewPost;
        } else {
            const post = contentData.find(p => p.id == postId);
            if (!post) return;
            document.getElementById('edit-id').value = post.id;
            document.getElementById('edit-date').value = post.date;
            document.getElementById('edit-platform').value = post.platform;
            document.getElementById('edit-type').value = post.type;
            document.getElementById('edit-time').value = post.time;
            document.getElementById('edit-idea').value = post.idea;
            document.getElementById('edit-caption').value = post.caption;
            document.getElementById('edit-visual').value = post.visual;
            document.getElementById('edit-cta').value = post.cta;
            document.getElementById('edit-hashtags').value = post.hashtags;
        }

        modalListView.style.display = 'none';
        addNewContentBtn.style.display = 'none';
        editForm.style.display = 'block';
    }

    function saveContent(event) {
        event.preventDefault();
        const id = document.getElementById('edit-id').value;
        const postData = {
            date: document.getElementById('edit-date').value,
            platform: document.getElementById('edit-platform').value,
            type: document.getElementById('edit-type').value,
            time: document.getElementById('edit-time').value,
            idea: document.getElementById('edit-idea').value,
            caption: document.getElementById('edit-caption').value,
            visual: document.getElementById('edit-visual').value,
            cta: document.getElementById('edit-cta').value,
            hashtags: document.getElementById('edit-hashtags').value,
        };

        if (id) { // Edit
            const index = contentData.findIndex(p => p.id == id);
            contentData[index] = { ...contentData[index], ...postData };
        } else { // Tambah Baru
            postData.id = Date.now(); // Generate ID unik baru
            contentData.push(postData);
        }
        
        renderCalendar();
        modal.style.display = 'none';
        alert('Konten berhasil disimpan! (Note: Perubahan tidak disimpan permanen ke file .json)');
    }

    function deleteContent(postId) {
        if (confirm('Apakah Anda yakin ingin menghapus konten ini?')) {
            contentData = contentData.filter(p => p.id != postId);
            renderCalendar();
            modal.style.display = 'none';
            alert('Konten berhasil dihapus! (Note: Perubahan tidak disimpan permanen ke file .json)');
        }
    }

    // --- EVENT LISTENERS ---
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target == modal) modal.style.display = 'none';
    });
    
    editForm.addEventListener('submit', saveContent);
    cancelEditBtn.addEventListener('click', () => {
        editForm.style.display = 'none';
        modalListView.style.display = 'block';
        addNewContentBtn.style.display = 'block';
    });

    // --- INISIASI ---
    initializeCalendar();
});
