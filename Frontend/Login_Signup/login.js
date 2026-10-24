(() => {
    const accountsKey = "pawfectDemoAccounts";
    const sessionKey = "pawfectDemoAuthSession";
    const form = document.getElementById("login-form");

    if (!form) {
        return;
    }

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const message = document.getElementById("login-message");
    const submitButton = form.querySelector('button[type="submit"]');
    let submitting = false;

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

    async function hashPassword(password, salt) {
        if (!crypto.subtle) {
            throw new Error("Demo login needs a secure browser context. Open this project through localhost.");
        }
        const data = new TextEncoder().encode(`${salt}:${password}`);
        const digest = await crypto.subtle.digest("SHA-256", data);
        return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
    }

    function getPostLoginUrl() {
        const internalPaths = new Set([
            "Appointments/Appointmentconfirmed.html",
            "Appointments/Appointments.html",
            "Appointments/Reschedule.html",
            "Articles/Articles.html",
            "DailyCare/Addtask.html",
            "DailyCare/DailyCare.html",
            "Dashboard/Addpet.html",
            "Dashboard/Dashboard.html",
            "Diary/Diary.html",
            "Health/Health.html",
            "MyPet/MyPet.html",
            "Profile/Profile.html",
            "Reminders/Newreminder.html",
            "Reminders/Reminders.html"
        ]);
        const appRoot = new URL("../", window.location.href);
        const dashboardUrl = new URL("Dashboard/Dashboard.html", appRoot);
        const requested = new URLSearchParams(window.location.search).get("next");
        if (!requested) {
            return dashboardUrl.href;
        }

        try {
            const destination = new URL(requested, window.location.origin);
            const relativePath = destination.pathname.startsWith(appRoot.pathname)
                ? destination.pathname.slice(appRoot.pathname.length)
                : "";
            if (destination.origin === window.location.origin && internalPaths.has(relativePath)) {
                return destination.href;
            }
        } catch (error) {
            return dashboardUrl.href;
        }
        return dashboardUrl.href;
    }

    if (new URLSearchParams(window.location.search).get("registered") === "1") {
        showMessage("Your demo account is registered. Please log in.", false);
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (submitting) {
            return;
        }
        message.hidden = true;

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        if (!email || !password) {
            showMessage("Enter your email and password.");
            return;
        }
        if (!emailInput.validity.valid) {
            showMessage("Enter a valid email address.");
            emailInput.focus();
            return;
        }

        submitting = true;
        submitButton.disabled = true;
        try {
            const account = readAccounts().find(item => item.email === email);
            if (!account) {
                showMessage("No registered demo account was found for this email.");
                return;
            }

            const passwordHash = await hashPassword(password, account.salt);
            if (passwordHash !== account.passwordHash) {
                showMessage("The email or password is incorrect.");
                return;
            }

            sessionStorage.setItem(sessionKey, JSON.stringify({
                purpose: "pawfect-demo-login",
                version: 1,
                email: account.email,
                issuedAt: Date.now()
            }));
            window.location.replace(getPostLoginUrl());
        } catch (error) {
            showMessage(`Could not complete demo login: ${error.message}`);
        } finally {
            submitting = false;
            submitButton.disabled = false;
        }
    });
})();
