(() => {
    const pendingKey = "pawfectPendingRegistration";
    const accountsKey = "pawfectDemoAccounts";
    const form = document.getElementById("otp-form");
    const message = document.getElementById("otp-message");
    const inputs = Array.from(document.querySelectorAll(".otp-input"));
    const countdown = document.getElementById("countdown");
    const resendButton = document.getElementById("resend-button");
    const verifyButton = document.getElementById("verify-button");
    const showCodeButton = document.getElementById("show-code-button");
    const devCode = document.getElementById("dev-code");
    const devCodeValue = document.getElementById("dev-code-value");
    let pending;
    let timer;
    let verifying = false;

    function showMessage(text, isError = true) {
        message.textContent = text;
        message.classList.toggle("is-error", isError);
        message.hidden = false;
    }

    function readPending() {
        const stored = sessionStorage.getItem(pendingKey);
        return stored ? JSON.parse(stored) : null;
    }

    function savePending() {
        sessionStorage.setItem(pendingKey, JSON.stringify(pending));
    }

    function randomCode() {
        const value = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
        return value.toString().padStart(6, "0");
    }

    function maskEmail(email) {
        const [local, domain] = email.split("@");
        const visible = local.length > 1 ? local[0] : "";
        return `${visible}${"*".repeat(Math.max(3, local.length - visible.length))}@${domain}`;
    }

    function updateCodeHelper() {
        devCodeValue.textContent = pending.code;
    }

    function updateCountdown() {
        const remaining = Math.max(0, Math.ceil((pending.expiresAt - Date.now()) / 1000));
        countdown.textContent = String(remaining);
        resendButton.disabled = remaining > 0;
        if (remaining === 0) {
            showMessage(
                pending.attempts >= 5
                    ? "This code has reached its five-attempt limit. Request a new code to continue."
                    : "This code has expired. Request a new code to continue."
            );
            clearInterval(timer);
            timer = undefined;
        }
    }

    function clearInputs() {
        inputs.forEach(input => {
            input.value = "";
        });
        inputs[0].focus();
    }

    function readAccounts() {
        const stored = localStorage.getItem(accountsKey);
        const accounts = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(accounts)) {
            throw new Error("Stored demo accounts have an invalid format.");
        }
        return accounts;
    }

    async function completeRegistration() {
        const accounts = readAccounts();
        if (accounts.some(account => account.email === pending.email)) {
            showMessage("A demo account was already created for this email. Please log in.");
            return false;
        }

        accounts.push({
            name: pending.name,
            email: pending.email,
            salt: pending.salt,
            passwordHash: pending.passwordHash
        });
        localStorage.setItem(accountsKey, JSON.stringify(accounts));
        sessionStorage.removeItem(pendingKey);
        window.location.href = "login.html?registered=1";
        return true;
    }

    async function verifyCode() {
        if (verifying || !pending) {
            return;
        }
        if (Date.now() >= pending.expiresAt) {
            updateCountdown();
            showMessage("This code has expired. Request a new code to continue.");
            return;
        }
        if (pending.attempts >= 5) {
            showMessage("This code has reached its five-attempt limit. Request a new code when the timer ends.");
            return;
        }

        const entered = inputs.map(input => input.value).join("");
        if (!/^\d{6}$/.test(entered)) {
            showMessage("Enter all six digits of the verification code.");
            return;
        }
        if (entered !== pending.code) {
            pending.attempts += 1;
            try {
                savePending();
            } catch (error) {
                showMessage(`Could not save the verification attempt: ${error.message}`);
                return;
            }
            clearInputs();
            showMessage(
                pending.attempts >= 5
                    ? "Incorrect code. You have used all five attempts. Request a new code when the timer ends."
                    : `Incorrect code. ${5 - pending.attempts} attempt${pending.attempts === 4 ? "" : "s"} remaining.`
            );
            return;
        }

        verifying = true;
        verifyButton.disabled = true;
        try {
            await completeRegistration();
        } catch (error) {
            showMessage(`Could not complete demo registration: ${error.message}`);
            verifying = false;
            verifyButton.disabled = false;
        }
    }

    function handleInput(event) {
        const input = event.currentTarget;
        input.value = input.value.replace(/\D/g, "").slice(-1);
        if (input.value) {
            const index = inputs.indexOf(input);
            if (index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        }
        message.hidden = true;
        if (inputs.every(box => box.value)) {
            verifyCode();
        }
    }

    function handlePaste(event) {
        const pasted = event.clipboardData.getData("text").trim();
        if (!/^\d{6}$/.test(pasted)) {
            return;
        }
        event.preventDefault();
        inputs.forEach((input, index) => {
            input.value = pasted[index];
        });
        message.hidden = true;
        inputs[inputs.length - 1].focus();
        verifyCode();
    }

    function initialize() {
        try {
            pending = readPending();
            if (!pending || !/^\d{6}$/.test(pending.code)) {
                verifyButton.disabled = true;
                resendButton.disabled = true;
                showMessage("There is no pending registration in this tab. Start again from the registration page.");
                return;
            }
        } catch (error) {
            verifyButton.disabled = true;
            resendButton.disabled = true;
            showMessage(`Could not load the pending demo registration: ${error.message}`);
            return;
        }

        document.getElementById("masked-email").textContent = maskEmail(pending.email);
        updateCodeHelper();
        inputs.forEach(input => {
            input.addEventListener("input", handleInput);
            input.addEventListener("paste", handlePaste);
            input.addEventListener("keydown", event => {
                const index = inputs.indexOf(input);
                if (event.key === "Backspace" && !input.value && index > 0) {
                    inputs[index - 1].focus();
                } else if (event.key === "ArrowLeft" && index > 0) {
                    inputs[index - 1].focus();
                } else if (event.key === "ArrowRight" && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            });
        });

        form.addEventListener("submit", event => {
            event.preventDefault();
            verifyCode();
        });

        showCodeButton.addEventListener("click", () => {
            const isVisible = !devCode.hidden;
            devCode.hidden = isVisible;
            showCodeButton.setAttribute("aria-expanded", String(!isVisible));
            showCodeButton.textContent = isVisible ? "Show development OTP" : "Hide development OTP";
        });

        resendButton.addEventListener("click", () => {
            if (Date.now() < pending.expiresAt) {
                return;
            }
            pending.code = randomCode();
            pending.expiresAt = Date.now() + 60000;
            pending.attempts = 0;
            try {
                savePending();
                updateCodeHelper();
                clearInputs();
                message.hidden = true;
                timer = window.setInterval(updateCountdown, 250);
                updateCountdown();
            } catch (error) {
                showMessage(`Could not issue a new demo code: ${error.message}`);
            }
        });

        updateCountdown();
        if (!timer && Date.now() < pending.expiresAt) {
            timer = window.setInterval(updateCountdown, 250);
        }
        inputs[0].focus();
    }

    initialize();
})();
