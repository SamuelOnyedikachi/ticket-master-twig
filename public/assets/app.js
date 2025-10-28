(function () {
  const SESSION_KEY = 'ticketapp_session';
  const TICKETS_KEY = 'TicketMaster_tickets';
  let ticketChart = null; // To hold the chart instance

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  let toastTimer;
  function showToast(msg) {
    const t = $('#toast');
    if (!t) return console.warn('Toast element not found');
    clearTimeout(toastTimer);
    t.textContent = msg;
    t.classList.remove('opacity-0', 'translate-y-4');

    toastTimer = setTimeout(() => {
      t.classList.add('opacity-0', 'translate-y-4');
    }, 2000);
  }

  // Custom Confirmation Modal
  function showConfirm(message, onConfirm) {
    const modal = $('#confirmModal');
    const modalBody = $('#confirmModalBody');
    const confirmBtn = $('#confirmModalConfirm');
    const cancelBtn = $('#confirmModalCancel');
    const modalContent = modal.querySelector('div');

    if (!modal || !modalBody || !confirmBtn || !cancelBtn) return;

    modalBody.textContent = message;
    modal.classList.remove('hidden');
    setTimeout(() => {
      modalContent.classList.remove('opacity-0', 'scale-95');
    }, 10);

    const close = () => {
      modalContent.classList.add('opacity-0', 'scale-95');
      setTimeout(() => modal.classList.add('hidden'), 200);
    };

    confirmBtn.onclick = () => {
      onConfirm();
      close();
    };
    cancelBtn.onclick = close;
    modal.onclick = (e) => {
      if (e.target === modal) close();
    };
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch (e) {
      return null;
    }
  }
  function setSession(data) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  }
  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function getTickets() {
    try {
      return JSON.parse(localStorage.getItem(TICKETS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  function setTickets(arr) {
    localStorage.setItem(TICKETS_KEY, JSON.stringify(arr));
  }

  // ===== Helper: Refresh Dashboard if visible =====
  function refreshDashboardIfVisible() {
    const kpiTotal = document.getElementById('kpiTotal');
    if (kpiTotal) {
      initDashboard();
    }
  }

  // ===== Guards & Navigation =====
  function applyGuards() {
    const session = getSession();
    const isAuthed = !!session;

    const userLine = $('#userLine');
    if (userLine)
      userLine.textContent = isAuthed ? `Logged in as ${session.email}` : '';

    $$('[data-guard="auth-only"]').forEach(
      (el) => (el.style.display = isAuthed ? '' : 'none')
    );
    $$('[data-guard="guest-only"]').forEach(
      (el) => (el.style.display = isAuthed ? 'none' : '')
    );

    const logoutBtn = $('#logoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        clearSession();
        showToast('Logged out');
        window.location.href = '?page=landing';
      };
    }

    // The mobile logout button is a separate element
    const mobileLogoutBtn = $('#mobileLogoutBtn');
    if (mobileLogoutBtn) {
      mobileLogoutBtn.onclick = () => {
        $('#logoutBtn').click(); // Trigger the main logout button's logic
      };
    }

    const url = new URL(window.location.href);
    const page = url.searchParams.get('page') || 'landing';
    const protectedPages = ['dashboard', 'tickets', 'trash'];
    if (protectedPages.includes(page) && !isAuthed) {
      showToast('Your session has expired — please log in again.'); // Task-specific message
      window.location.href = '?page=login';
    }
  }

  // ===== Inline Errors =====
  function setFieldError(form, name, message = '') {
    const f = form.querySelector(`[name="${name}"]`);
    const err = form.querySelector(`[data-error-for="${name}"]`); // Use data-error-for
    if (err) err.textContent = message;
    if (f) f.setAttribute('aria-invalid', message ? 'true' : 'false');
  }
  function clearErrors(form) {
    $$('[data-error-for]', form).forEach((e) => (e.textContent = ''));
    $$('input,select,textarea', form).forEach((f) =>
      f.removeAttribute('aria-invalid')
    );
  }

  // ===== Auth Pages =====
  function initAuthPages() {
    const loginForm = $('#loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(loginForm);
        const email = (fd.get('email') || '').trim();
        const password = (fd.get('password') || '').trim();

        setFieldError(loginForm, 'email', '');
        setFieldError(loginForm, 'password', '');

        let valid = true;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setFieldError(loginForm, 'email', 'Enter a valid email.');
          valid = false;
        }
        if (!password || password.length < 6) {
          setFieldError(
            loginForm,
            'password',
            'Password must be at least 6 characters.'
          );
          valid = false;
        }
        if (!valid) {
          showToast('Invalid credentials');
          return;
        }

        setSession({ email, token: 'fake-token' });
        showToast('Login successful');
        window.location.href = '?page=dashboard';
      });
    }

    const signupForm = $('#signupForm');
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(signupForm);
        const email = (fd.get('email') || '').trim();
        const password = (fd.get('password') || '').trim();

        setFieldError(signupForm, 'email', '');
        setFieldError(signupForm, 'password', '');

        let valid = true;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setFieldError(signupForm, 'email', 'Enter a valid email.');
          valid = false;
        }
        if (!password || password.length < 6) {
          setFieldError(
            signupForm,
            'password',
            'Password must be at least 6 characters.'
          );
          valid = false;
        }
        if (!valid) {
          showToast('Please fix the errors');
          return;
        }

        setSession({ email, token: 'fake-token' });
        showToast('Account created');
        window.location.href = '?page=dashboard';
      });
    }
  }

  // ===== Chart =====
  function renderTicketChart(open, inProgress, closed) {
    const ctx = $('#ticketChart');
    if (!ctx) return;

    // Destroy existing chart to prevent conflicts
    if (ticketChart) {
      ticketChart.destroy();
    }

    const hasData = open > 0 || inProgress > 0 || closed > 0;

    const isDark = document.documentElement.classList.contains('dark');
    const legendColor = isDark ? '#d1d5db' : '#374151'; // gray-300 and gray-700

    ticketChart = new Chart(ctx.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Open', 'In Progress', 'Closed'],
        datasets: [
          {
            label: 'Ticket Status',
            data: hasData ? [open, inProgress, closed] : [1], // Show a gray circle if no data
            backgroundColor: hasData
              ? ['#22c55e', '#f97316', '#6b7280'] // green-500, orange-500, gray-500
              : ['#e5e7eb'],
            borderColor: isDark ? '#000' : '#fff',
            borderWidth: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: legendColor },
          },
        },
      },
    });
  }

  // ===== Dashboard KPIs =====
  function initDashboard() {
    const totalEl = $('#kpiTotal');
    if (!totalEl) return; // not on dashboard page

    const allTickets = getTickets();
    const activeTickets = allTickets.filter((t) => !t.isDeleted);

    const openCount = activeTickets.filter((t) => t.status === 'open').length;
    const inProgressCount = activeTickets.filter(
      (t) => t.status === 'in_progress'
    ).length;
    const closedCount = activeTickets.filter(
      (t) => t.status === 'closed'
    ).length;
    const deletedCount = allTickets.length - activeTickets.length;

    $('#kpiTotal').textContent = activeTickets.length;
    $('#kpiOpen').textContent = openCount;
    $('#kpiInProgress').textContent = inProgressCount;
    $('#kpiClosed').textContent = closedCount;
    $('#kpiDeleted').textContent = deletedCount;

    // Render the chart
    renderTicketChart(openCount, inProgressCount, closedCount);
    renderRecentTickets();
  }

  // ===== Render Recent Tickets on Dashboard =====
  function renderRecentTickets() {
    const list = $('#recentTicketsList');
    if (!list) return;

    const recentTickets = getTickets()
      .filter((t) => !t.isDeleted)
      .sort((a, b) => b.id - a.id) // Sort by newest first
      .slice(0, 3); // Get the top 3

    list.innerHTML = '';

    if (recentTickets.length === 0) {
      list.innerHTML =
        '<p class="text-gray-500 dark:text-gray-400 col-span-full text-center py-4">No active tickets yet.</p>';
      return;
    }

    recentTickets.forEach((t) => {
      const card = document.createElement('div');
      // Note: No hover effect for these dashboard cards to keep it simple
      card.className = 'card p-4 flex flex-col gap-3';
      card.innerHTML = `
        <div class="flex justify-between items-start">
          <h4 class="font-bold text-indigo-600 dark:text-indigo-400">${escapeHTML(
            t.title
          )}</h4>
          <span class="chip ${t.status}">${t.status.replace('_', ' ')}</span>
        </div>
        <p class="text-gray-600 dark:text-gray-400 text-sm truncate">${escapeHTML(
          t.description || 'No description'
        )}</p>`;
      list.appendChild(card);
    });
  }

  // ===== Ticket Management =====
  function escapeHTML(s) {
    return s.replace(
      /[&<>"']/g,
      (c) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        }[c])
    );
  }

  function renderTickets() {
    const list = $('#ticketsList');
    if (!list) return;
    const tickets = getTickets().filter((t) => !t.isDeleted); // Only show non-deleted tickets
    list.innerHTML = '';

    if (tickets.length === 0) {
      list.innerHTML =
        '<p class="text-gray-500 dark:text-gray-400 col-span-full text-center">No tickets yet. Create one above.</p>';
      return;
    }

    tickets.forEach((t) => {
      const card = document.createElement('div');
      card.className = 'card p-4 flex flex-col gap-3';
      card.innerHTML = `
        <div class="flex justify-between items-start">
          <h4 class="font-bold text-indigo-600 dark:text-indigo-400">${escapeHTML(
            t.title
          )}</h4>
          <span class="chip ${t.status}">${t.status.replace('_', ' ')}</span>
        </div>
        ${
          t.description
            ? `<p class="text-gray-600 dark:text-gray-400">${escapeHTML(
                t.description
              )}</p>`
            : ''
        }
        <div class="mt-auto pt-3 flex gap-2">
          <button class="py-1 px-3 text-sm font-medium text-white rounded-md shadow-sm transition-colors duration-200 bg-green-500 hover:bg-green-600" data-edit="${
            t.id
          }">Edit</button>
          <button class="py-1 px-3 text-sm font-medium text-white rounded-md shadow-sm transition-colors duration-200 bg-red-500 hover:bg-red-600" data-del="${
            t.id
          }">Trash</button>
        </div>
      `;
      list.appendChild(card);
    });

    $$('#ticketsList [data-edit]').forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-edit');
        loadTicketIntoForm(id);
      };
    });
    $$('#ticketsList [data-del]').forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-del');
        showConfirm('Move this ticket to the trash?', () => {
          const all = getTickets();
          const idx = all.findIndex((t) => String(t.id) === String(id));
          if (idx > -1) all[idx].isDeleted = true;
          setTickets(all);
          showToast('Ticket moved to trash');
          renderTickets();
          refreshDashboardIfVisible(); // update if dashboard is open
        });
      };
    });
  }

  function loadTicketIntoForm(id) {
    const form = $('#ticketForm');
    if (!form) return;
    const t = getTickets().find((x) => String(x.id) === String(id));
    if (!t) return;
    form.querySelector('[name="id"]').value = t.id;
    form.querySelector('[name="title"]').value = t.title;
    form.querySelector('[name="status"]').value = t.status;
    form.querySelector('[name="description"]').value = t.description || '';
    $('#formTitle').textContent = `Edit Ticket: ${t.title}`;
  }

  function initTicketsPage() {
    const form = $('#ticketForm');
    if (!form) return;

    renderTickets();

    $('#resetFormBtn').onclick = () => {
      form.reset();
      form.querySelector('[name="id"]').value = '';
      $('#formTitle').textContent = 'Create Ticket'; // Reset title
      clearErrors(form);
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      clearErrors(form);

      const fd = new FormData(form);
      const id = (fd.get('id') || '').trim();
      const title = (fd.get('title') || '').trim();
      const status = (fd.get('status') || '').trim();
      const description = (fd.get('description') || '').trim();

      let ok = true;
      if (!title) {
        setFieldError(form, 'title', 'Title is required.');
        ok = false;
      } else if (title.length > 100) {
        setFieldError(form, 'title', 'Max length is 100 characters.');
        ok = false;
      }
      const allowed = ['open', 'in_progress', 'closed'];
      if (!status || !allowed.includes(status)) {
        setFieldError(
          form,
          'status',
          'Status must be open, in_progress, or closed.'
        );
        ok = false;
      }
      if (description.length > 500) {
        setFieldError(form, 'description', 'Max length is 500 characters.');
        ok = false;
      }
      if (!ok) {
        showToast('Please fix the errors');
        return;
      }

      const all = getTickets();

      if (id) {
        const idx = all.findIndex((t) => String(t.id) === String(id));
        if (idx > -1) {
          all[idx] = { ...all[idx], title, status, description };
          setTickets(all);
          showToast('Ticket updated');
        } else {
          showToast('Failed to update ticket. Please retry.');
        }
      } else {
        const newTicket = {
          id: Date.now(),
          title,
          status,
          description,
          isDeleted: false,
        };
        all.push(newTicket);
        setTickets(all);
        showToast('Ticket created');
      }

      form.reset();
      form.querySelector('[name="id"]').value = '';
      $('#formTitle').textContent = 'Create Ticket';
      renderTickets();
      refreshDashboardIfVisible(); // keep dashboard synced
    });
  }

  // ===== Trash Page =====
  function renderDeletedTickets() {
    const list = $('#deletedTicketsList');
    if (!list) return;

    const deletedTickets = getTickets().filter((t) => t.isDeleted);
    list.innerHTML = '';

    if (deletedTickets.length === 0) {
      list.innerHTML =
        '<p class="text-gray-500 dark:text-gray-400 col-span-full text-center">The trash is empty.</p>';
      return;
    }

    deletedTickets.forEach((t) => {
      const card = document.createElement('div');
      card.className =
        'card p-4 flex flex-col gap-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400';
      card.innerHTML = `
        <div class="flex justify-between items-start">
          <h4 class="font-bold text-red-800 dark:text-red-300">${escapeHTML(
            t.title
          )}</h4>
          <span class="chip ${t.status}">${t.status.replace('_', ' ')}</span>
        </div>
        ${
          t.description
            ? `<p class="text-gray-600 dark:text-gray-400">${escapeHTML(
                t.description
              )}</p>`
            : ''
        }
        <div class="mt-auto pt-3 flex gap-2">
          <button class="py-1 px-3 text-sm font-medium text-white rounded-md shadow-sm transition-colors duration-200 bg-indigo-500 hover:bg-indigo-600" data-restore="${
            t.id
          }">Restore</button>
          <button class="py-1 px-3 text-sm font-medium text-white rounded-md shadow-sm transition-colors duration-200 bg-red-500 hover:bg-red-600" data-del-perm="${
            t.id
          }">Delete Permanently</button>
        </div>
      `;
      list.appendChild(card);
    });

    // Attach event listeners for restore
    $$('#deletedTicketsList [data-restore]').forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-restore');
        const all = getTickets();
        const idx = all.findIndex((t) => String(t.id) === String(id));
        if (idx > -1) all[idx].isDeleted = false;
        setTickets(all);
        showToast('Ticket restored');
        renderDeletedTickets();
        refreshDashboardIfVisible();
      };
    });

    // Attach event listeners for permanent delete
    $$('#deletedTicketsList [data-del-perm]').forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-del-perm');
        showConfirm(
          'This will permanently delete the ticket. Are you sure?',
          () => {
            const all = getTickets().filter((t) => String(t.id) !== String(id));
            setTickets(all);
            showToast('Ticket permanently deleted');
            renderDeletedTickets();
            refreshDashboardIfVisible();
          }
        );
      };
    });
  }

  function initTrashPage() {
    if (!$('#deletedTicketsList')) return;

    renderDeletedTickets();

    const emptyTrashBtn = $('#emptyTrashBtn');
    if (emptyTrashBtn) {
      emptyTrashBtn.onclick = () => {
        const deletedCount = getTickets().filter((t) => t.isDeleted).length;
        if (deletedCount === 0) {
          showToast('Trash is already empty.');
          return;
        }
        showConfirm(
          `This will permanently delete ${deletedCount} ticket(s). Are you sure?`,
          () => {
            const all = getTickets().filter((t) => !t.isDeleted);
            setTickets(all);
            showToast('Trash has been emptied.');
            renderDeletedTickets();
            refreshDashboardIfVisible();
          }
        );
      };
    }
  }

  // ===== Dark Mode Toggle =====
  function initDarkMode() {
    const toggle = $('#darkModeToggle');
    const sunIcon = $('#sunIcon');
    const moonIcon = $('#moonIcon');
    const isDark = localStorage.getItem('theme') === 'dark';

    const setMode = (dark) => {
      document.documentElement.classList.toggle('dark', dark);
      sunIcon.classList.toggle('hidden', dark);
      moonIcon.classList.toggle('hidden', !dark);
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    };

    // Set initial mode
    setMode(isDark);

    toggle.addEventListener('click', () => {
      setMode(!document.documentElement.classList.contains('dark'));
    });

    // Also respect OS preference if no theme is set
    if (
      localStorage.getItem('theme') === null &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      setMode(true);
    }
  }

  // ===== Mobile Menu =====
  function initMobileMenu() {
    const menuBtn = $('#mobileMenuBtn');
    const mobileMenu = $('#mobileMenu');

    if (menuBtn && mobileMenu) {
      menuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        menuBtn.setAttribute(
          'aria-expanded',
          !mobileMenu.classList.contains('hidden')
        );
      });
    }
  }

  // ===== Boot =====
  document.addEventListener('DOMContentLoaded', () => {
    applyGuards();
    initAuthPages();
    initTrashPage();
    initTicketsPage();

    // detect which page we’re on
    const url = new URL(window.location.href);
    const page = url.searchParams.get('page') || 'landing';
    if (page === 'dashboard') {
      // delay ensures localStorage is ready
      setTimeout(() => initDashboard(), 100);
    } else {
      initDashboard();
    }

    initDarkMode();
    initMobileMenu();

    // live sync if data changes in localStorage
    window.addEventListener('storage', (e) => {
      if (e.key === TICKETS_KEY) initDashboard();
    });
  });
})();
