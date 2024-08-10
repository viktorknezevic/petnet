document.addEventListener('DOMContentLoaded', () => {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeModal = document.querySelector('.modal .close');

    if (settingsBtn && settingsModal && closeModal) {
        settingsBtn.addEventListener('click', () => {
            settingsModal.style.display = 'flex';
        });

        closeModal.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target === settingsModal) {
                settingsModal.style.display = 'none';
            }
        });
    }
});
