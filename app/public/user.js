document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const showRegister = document.getElementById('show-register');
  const showLogin = document.getElementById('show-login');
  const authSection = document.getElementById('auth-section');
  const userSection = document.getElementById('user-section');
  const alertSection = document.getElementById('alert-section');
  const logoutBtn = document.getElementById('logout-btn');
  const bioForm = document.getElementById('bio-form');
  const bioFirstName = document.getElementById('bio-first-name');
  const bioLastName = document.getElementById('bio-last-name');
  const bioEmail = document.getElementById('bio-email');
  const bioBio = document.getElementById('bio-bio');
  const showForgot = document.getElementById('show-forgot');
  const forgotFormSection = document.getElementById('forgot-form-section');
  const forgotForm = document.getElementById('forgot-form');
  const showLogin2 = document.getElementById('show-login2');

  // Show/hide forms
  showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-form-section').style.display = 'none';
    document.getElementById('register-form-section').style.display = '';
    clearAlert();
  });
  showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('register-form-section').style.display = 'none';
    document.getElementById('login-form-section').style.display = '';
    clearAlert();
  });
  showForgot.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-form-section').style.display = 'none';
    forgotFormSection.style.display = '';
    clearAlert();
  });
  showLogin2.addEventListener('click', (e) => {
    e.preventDefault();
    forgotFormSection.style.display = 'none';
    document.getElementById('login-form-section').style.display = '';
    clearAlert();
  });

  // Registration
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();
    const first_name = document.getElementById('register-first-name').value;
    const last_name = document.getElementById('register-last-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const bio = document.getElementById('register-bio').value;
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name, last_name, email, password, bio })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      showAlert('Registration successful! You are now logged in.', 'success');
      await loadUser();
    } catch (err) {
      showAlert(err.message, 'danger');
    }
  });

  // Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      showAlert('Login successful!', 'success');
      await loadUser();
    } catch (err) {
      showAlert(err.message, 'danger');
    }
  });

  // Logout
  logoutBtn.addEventListener('click', async () => {
    clearAlert();
    await fetch('/api/logout', { method: 'POST' });
    authSection.style.display = '';
    userSection.style.display = 'none';
    showAlert('Logged out.', 'info');
  });

  // Load user info
  async function loadUser() {
    try {
      const res = await fetch('/api/me');
      if (!res.ok) throw new Error('Not logged in');
      const data = await res.json();
      const user = data.user;
      bioFirstName.value = user.first_name;
      bioLastName.value = user.last_name;
      bioEmail.value = user.email;
      bioBio.value = user.bio || '';
      authSection.style.display = 'none';
      userSection.style.display = '';
      clearAlert();
    } catch {
      authSection.style.display = '';
      userSection.style.display = 'none';
    }
  }

  // Save bio changes
  bioForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();
    const first_name = bioFirstName.value;
    const last_name = bioLastName.value;
    const bio = bioBio.value;
    try {
      const res = await fetch('/api/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name, last_name, bio })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      showAlert('Profile updated!', 'success');
    } catch (err) {
      showAlert(err.message, 'danger');
    }
  });

  // Forgot password
  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();
    const email = document.getElementById('forgot-email').value;
    try {
      const res = await fetch('/api/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      showAlert(data.message, 'info');
    } catch (err) {
      showAlert('Error sending reset link.', 'danger');
    }
  });

  // Alert helpers
  function showAlert(msg, type) {
    alertSection.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  }
  function clearAlert() {
    alertSection.innerHTML = '';
  }

  // On page load, try to load user
  loadUser();
}); 