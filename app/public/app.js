document.addEventListener('DOMContentLoaded', () => {
  const userForm = document.getElementById('user-form');
  const userIdInput = document.getElementById('user-id');
  const firstNameInput = document.getElementById('first-name');
  const lastNameInput = document.getElementById('last-name');
  const emailInput = document.getElementById('email');
  const bioInput = document.getElementById('bio');
  const usersTableBody = document.getElementById('users-table-body');
  const formTitle = document.getElementById('form-title');
  const cancelBtn = document.getElementById('cancel-btn');

  // Load all users when page loads
  loadUsers();

  // Handle form submission
  userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userData = {
      first_name: firstNameInput.value,
      last_name: lastNameInput.value,
      email: emailInput.value,
      bio: bioInput.value
    };

    try {
      if (userIdInput.value) {
        // Update existing user
        await fetch(`/api/users/${userIdInput.value}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });
      } else {
        // Create new user
        await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });
      }
      
      resetForm();
      loadUsers();
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while saving the user.');
    }
  });

  // Handle cancel button click
  cancelBtn.addEventListener('click', resetForm);

  function resetForm() {
    userForm.reset();
    userIdInput.value = '';
    formTitle.textContent = 'Add New User';
    cancelBtn.classList.add('d-none');
  }

  async function loadUsers() {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      displayUsers(data.users);
    } catch (error) {
      console.error('Error loading users:', error);
      usersTableBody.innerHTML = '<tr><td colspan="3">Error loading users</td></tr>';
    }
  }

  function displayUsers(users) {
    usersTableBody.innerHTML = '';
    
    if (users.length === 0) {
      usersTableBody.innerHTML = '<tr><td colspan="3">No users found</td></tr>';
      return;
    }
    
    users.forEach(user => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${user.first_name} ${user.last_name}</td>
        <td>${user.email}</td>
        <td class="action-buttons">
          <button class="btn btn-sm btn-info edit-btn" data-id="${user.id}">Edit</button>
          <button class="btn btn-sm btn-danger delete-btn" data-id="${user.id}">Delete</button>
        </td>
      `;
      usersTableBody.appendChild(row);
    });
    
    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(button => {
      button.addEventListener('click', editUser);
    });
    
    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', deleteUser);
    });
  }

  async function editUser(e) {
    const userId = e.target.getAttribute('data-id');
    
    try {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      const user = data.user;
      
      // Populate the form
      userIdInput.value = user.id;
      firstNameInput.value = user.first_name;
      lastNameInput.value = user.last_name;
      emailInput.value = user.email;
      bioInput.value = user.bio || '';
      
      // Update UI
      formTitle.textContent = 'Edit User';
      cancelBtn.classList.remove('d-none');
      
      // Scroll to the form
      userForm.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Error fetching user:', error);
      alert('Error loading user data');
    }
  }

  async function deleteUser(e) {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    const userId = e.target.getAttribute('data-id');
    
    try {
      await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  }
});