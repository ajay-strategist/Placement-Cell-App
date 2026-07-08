// auth.js
// Handles login form submission

document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('loginForm');
    const loginAlert = document.getElementById('loginAlert');
    const submitBtn = loginForm ? loginForm.querySelector('button[type="submit"]') : null;

    // Show loading state while Google Sheets data loads
    if (submitBtn) {
        submitBtn.textContent = 'Connecting...';
        submitBtn.disabled = true;
    }

    // Wait for DB to be ready before allowing login
    await db.ready;

    if (submitBtn) {
        submitBtn.textContent = 'Login';
        submitBtn.disabled = false;
    }
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            let role = document.getElementById('role').value;

            if (!username || !password) {
                showAlert('Please fill in all fields.', 'danger');
                return;
            }

            const response = db.validateLogin(username, password, role);

            if (response.success) {
                // Automatically route to coordinator portal if student is coordinator
                if (role === 'student' && (response.user.isCoordinator === true || response.user.isCoordinator === 'true')) {
                    role = 'studentCoordinator';
                }
                // Automatically route to teacher coordinator portal if teacher is coordinator
                if (role === 'teacher' && (response.user.isCoordinator === true || response.user.isCoordinator === 'true')) {
                    role = 'teacherCoordinator';
                }

                sessionStorage.setItem('currentUser', JSON.stringify(response.user));
                sessionStorage.setItem('userRole', role);
                sessionStorage.setItem('userName', response.user.name || response.user.regNo || username);

                showAlert('Login successful! Redirecting...', 'success');
                
                setTimeout(() => {
                    if (role === 'admin') {
                        window.location.href = 'admin.html';
                    } else if (role === 'teacherCoordinator') {
                        window.location.href = 'admin.html';
                    } else if (role === 'studentCoordinator') {
                        window.location.href = 'coordinator.html';
                    } else if (role === 'student') {
                        window.location.href = 'student.html';
                    } else if (role === 'teacher') {
                        window.location.href = 'teacher.html';
                    }
                }, 1000);
            } else {
                showAlert(response.message, 'danger');
            }
        });
    }

    // Role Selection Tabs
    const tabs = document.querySelectorAll('.login-tab');
    const roleInput = document.getElementById('role');
    const usernameLabel = document.querySelector('label[for="username"]');
    const usernameInput = document.getElementById('username');

    function updateUsernameField(role) {
        if (!usernameInput || !usernameLabel) return;
        if (role === 'student') {
            usernameLabel.textContent = 'Register Number';
            usernameInput.placeholder = 'Enter Register Number';
        } else if (role === 'teacher') {
            usernameLabel.textContent = 'Phone Number';
            usernameInput.placeholder = 'Enter Phone Number';
        } else {
            usernameLabel.textContent = 'Username';
            usernameInput.placeholder = 'Enter Admin Username';
        }
    }

    if (tabs) {
        updateUsernameField(roleInput.value);
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                roleInput.value = tab.dataset.role;
                updateUsernameField(tab.dataset.role);
            });
        });
    }

    function showAlert(message, type) {
        loginAlert.textContent = message;
        loginAlert.className = `alert alert-${type}`;
        loginAlert.classList.remove('hidden');
    }
});

// Utility to check session on protected pages
function checkAuth(allowedRoles) {
    const userRole = sessionStorage.getItem('userRole');
    if (!userRole) {
        window.location.href = 'index.html';
        return;
    }
    if (Array.isArray(allowedRoles)) {
        if (!allowedRoles.includes(userRole)) {
            window.location.href = 'index.html';
        }
    } else {
        if (userRole !== allowedRoles) {
            window.location.href = 'index.html';
        }
    }
}

function logout() {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userName');
    window.location.href = 'index.html';
}
