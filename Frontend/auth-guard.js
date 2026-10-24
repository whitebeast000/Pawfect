(() => {
    const sessionKey = "pawfectDemoAuthSession";
    const accountsKey = "pawfectDemoAccounts";
    const loginUrl = new URL("Login_Signup/login.html", document.currentScript.src);

    function hasValidSession() {
        try {
            const session = JSON.parse(sessionStorage.getItem(sessionKey));
            if (
                !session ||
                session.purpose !== "pawfect-demo-login" ||
                session.version !== 1 ||
                typeof session.email !== "string" ||
                !Number.isFinite(session.issuedAt)
            ) {
                return false;
            }

            const storedAccounts = localStorage.getItem(accountsKey);
            const accounts = storedAccounts ? JSON.parse(storedAccounts) : [];
            return Array.isArray(accounts) && accounts.some(account =>
                account &&
                account.email === session.email &&
                typeof account.salt === "string" &&
                typeof account.passwordHash === "string"
            );
        } catch (error) {
            console.error("Could not validate the Pawfect demo session.", error);
            return false;
        }
    }

    function requireSession() {
        if (hasValidSession()) {
            return true;
        }

        const requestedUrl = new URL(window.location.href);
        const next = `${requestedUrl.pathname}${requestedUrl.search}${requestedUrl.hash}`;
        loginUrl.searchParams.set("next", next);
        window.location.replace(loginUrl.href);
        return false;
    }

    if (!requireSession()) {
        return;
    }

    window.addEventListener("pageshow", requireSession);
    window.addEventListener("popstate", requireSession);
    window.addEventListener("storage", event => {
        if (event.key === accountsKey || event.key === sessionKey) {
            requireSession();
        }
    });
})();
