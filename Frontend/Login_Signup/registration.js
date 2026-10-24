(() => {
    const accountsKey = "pawfectDemoAccounts";
    const pendingKey = "pawfectPendingRegistration";
    const form = document.getElementById("registration-form");

    if (!form) {
        return;
    }

    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmInput = document.getElementById("confirm-password");
    const message = document.getElementById("registration-message");

    function showMessage(text, isError = true) {
        message.textContent = text;
        message.classList.toggle("is-error", isError);
        message.hidden = false;
    }

    function readAccounts() {
        const stored = localStorage.getItem(accountsKey);
        const accounts = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(accounts)) {
            throw new Error("Stored demo accounts have an invalid format.");
        }
        return accounts;
    }

    function randomHex(length) {
        const bytes = crypto.getRandomValues(new Uint8Array(length));
        return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
    }

    async function hashPassword(password, salt) {
        if (!crypto.subtle) {
            throw new Error("Password hashing needs a secure browser context. Open this project through localhost.");
        }
        const data = new TextEncoder().encode(`${salt}:${password}`);
        const digest = await crypto.subtle.digest("SHA-256", data);
        return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
    }

    function makeOtp() {
        const value = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
        return value.toString().padStart(6, "0");
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();
        message.hidden = true;

        const name = nameInput.value.trim();
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;
        const confirmPassword = confirmInput.value;

        if (!name || !email || !password || !confirmPassword) {
            showMessage("Please complete every field.");
            return;
        }
        if (!emailInput.validity.valid) {
            showMessage("Enter a valid email address.");
            emailInput.focus();
            return;
        }
        if (password.length < 8) {
            showMessage("Your password must contain at least 8 characters.");
            passwordInput.focus();
            return;
        }
        if (password !== confirmPassword) {
            showMessage("The passwords do not match.");
            confirmInput.focus();
            return;
        }

        try {
            const accounts = readAccounts();
            if (accounts.some(account => account.email === email)) {
                showMessage("A demo account already exists for this email. Please log in.");
                return;
            }

            const salt = randomHex(16);
            const passwordHash = await hashPassword(password, salt);
            const pending = {
                name,
                email,
                salt,
                passwordHash,
                code: makeOtp(),
                expiresAt: Date.now() + 60000,
                attempts: 0
            };
            sessionStorage.setItem(pendingKey, JSON.stringify(pending));
            window.location.href = "otp.html";
        } catch (error) {
            showMessage(`Could not start demo registration: ${error.message}`);
        }
    });
})();