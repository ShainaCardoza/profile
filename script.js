document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const contactForm = document.getElementById('unified-contact-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const messageInput = document.getElementById('message');
    const contactListContainer = document.getElementById('contact-list-container');
    const submitBtn = document.getElementById('submit-btn');

    // State
    let contacts = JSON.parse(localStorage.getItem('contacts')) || [];
    let isEditing = false;
    let currentEditId = null;

    // Initialize
    renderContacts();

    // Event Listeners
    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmit);
    }

    // Functions
    async function handleFormSubmit(e) {
        e.preventDefault();

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();
        const message = messageInput ? messageInput.value.trim() : '';

        if (!validateInputs(name, email, phone)) {
            return;
        }

        // Logic split: Editing specific contact VS Sending new message
        if (isEditing) {
            // If editing, we only update the local contact list
            updateContact(currentEditId, { name, email, phone });
            alert('Contact updated successfully!');
        } else {
            // SENDING MESSAGE (Formspree) + SAVING CONTACT

            // 1. Send to Formspree
            const formData = new FormData(contactForm);

            try {
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    alert('Message sent successfully!');

                    // 2. Save Contact Locally (Only if not already in list to avoid duplicates? OR just add it)
                    // The prompt implies we should store the contact.
                    addContact({ id: Date.now(), name, email, phone });

                    resetForm();
                } else {
                    alert('Oops! There was a problem submitting your form.');
                }
            } catch (error) {
                alert('Oops! There was a problem submitting your form.');
                console.error('Formspree error:', error);
            }
        }
    }

    function ValidateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function validateInputs(name, email, phone) {
        if (!name || !email || !phone) {
            alert('Name, Email, and Phone are required.');
            return false;
        }
        if (!ValidateEmail(email)) {
            alert('Please enter a valid email address.');
            return false;
        }
        return true;
    }

    function addContact(contact) {
        contacts.push(contact);
        saveContacts();
        renderContacts();
    }

    function updateContact(id, updatedInfo) {
        contacts = contacts.map(contact =>
            contact.id === id ? { ...contact, ...updatedInfo } : contact
        );
        saveContacts();
        renderContacts();
        resetForm();
    }

    function deleteContact(id) {
        if (confirm('Are you sure you want to delete this contact?')) {
            contacts = contacts.filter(contact => contact.id !== id);
            saveContacts();
            renderContacts();
        }
    }

    function editContact(id) {
        const contact = contacts.find(c => c.id === id);
        if (contact) {
            nameInput.value = contact.name;
            emailInput.value = contact.email;
            phoneInput.value = contact.phone;
            // Message isn't stored in contact list, so leave it or clear it
            if (messageInput) messageInput.value = '';

            isEditing = true;
            currentEditId = id;
            submitBtn.textContent = 'Update Contact';

            // Scroll to form
            contactForm.scrollIntoView({ behavior: 'smooth' });
        }
    }

    function saveContacts() {
        localStorage.setItem('contacts', JSON.stringify(contacts));
    }

    function renderContacts() {
        if (!contactListContainer) return;

        contactListContainer.innerHTML = '';

        if (contacts.length === 0) {
            contactListContainer.innerHTML = '<div style="color: var(--color-text-muted); padding: 1rem; grid-column: 1/-1; text-align: center;">No contacts added yet. Send a message to add one!</div>';
            return;
        }

        contacts.forEach(contact => {
            const card = document.createElement('div');
            card.className = 'contact-item-card'; // New class / reusable class
            // Using inline styles or re-using existing classes to ensure it looks okay without massive CSS changes
            card.style.background = 'rgba(30, 41, 59, 0.5)';
            card.style.padding = '1.5rem';
            card.style.borderRadius = '10px';
            card.style.border = '1px solid rgba(255, 255, 255, 0.05)';

            card.innerHTML = `
                <h4 style="color: var(--color-primary); margin-bottom: 0.5rem; font-size: 1.2rem;">${escapeHtml(contact.name)}</h4>
                <div style="margin-bottom: 0.5rem; color: var(--color-text-muted);">
                    <span>&#9993;</span> ${escapeHtml(contact.email)}
                </div>
                <div style="margin-bottom: 1rem; color: var(--color-text-muted);">
                    <span>&#9742;</span> ${escapeHtml(contact.phone)}
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-sm" style="padding: 0.4rem 1rem; font-size: 0.9rem;" onclick="window.editContactHandler(${contact.id})">Edit</button>
                    <button class="btn btn-sm btn-outline" style="padding: 0.4rem 1rem; font-size: 0.9rem; border-color: #ef4444; color: #ef4444;" onclick="window.deleteContactHandler(${contact.id})">Delete</button>
                </div>
            `;
            contactListContainer.appendChild(card);
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function resetForm() {
        contactForm.reset();
        isEditing = false;
        currentEditId = null;
        submitBtn.textContent = 'Send Message';
    }

    // Expose handlers to global scope for inline onclicks
    window.editContactHandler = editContact;
    window.deleteContactHandler = deleteContact;
});
