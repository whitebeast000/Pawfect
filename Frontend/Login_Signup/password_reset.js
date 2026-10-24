(() => {
    const accountsKey = "pawfectDemoAccounts";
    const resetKey = "pawfectPendingPasswordReset";
    const resetPurpose = "password-reset";
    const verifiedLifetime = 10 * 60 * 1000;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const step = document.body.dataset.resetStep;
    let timer;

    function showMessage(element, text, isError = true) {
        element.textContent = text;
        element.classList.toggle("is-error", isError);
        element.hidden = false;
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

    function makeOtp() {
        const value = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
        return value.toString().padStart(6, "0");
    }

    async function hashPassword(password, salt) {
        if (!crypto.subtle) {
            throw new Error("Password hashing needs a secure browser context. Open this project through localhost.");
        }
        const data = new TextEncoder().encode(`${salt}:${password}`);
        const digest = await crypto.subtle.digest("SHA-256", data);
        return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
    }

    function readResetState() {
        const stored = sessionStorage.getItem(resetKey);
        return stored ? JSON.parse(stored) : null;
    }

    function validResetState(state, expectedStage) {
        return Boolean(
            state &&
            state.purpose === resetPurpose &&
            state.stage === expectedStage &&
            typeof state.email === "string" &&
            emailPattern.test(state.email)
        );
    }

    function clearResetState() {
        sessionStorage.removeItem(resetKey);
    }

    function findAccount(accounts, email) {
        return accounts.find(account => account && account.email === email);
    }

    function maskEmail(email) {
        const [local, domain] = email.split("@");
        const visible = local[0] || "";
        return `${visible}${"*".repeat(Math.max(3, local.length - visible.length))}@${domain}`;
    }

    function initializeEmailStep() {
        const form = document.getElementById("reset-email-form");
        const emailInput = document.getElementById("reset-email");
        const message = document.getElementById("reset-email-message");

        clearResetState();
        form.addEventListener("submit", event => {
            event.preventDefault();
            message.hidden = true;
            const email = emailInput.value.trim().toLowerCase();
            if (!email) {
                showMessage(message, "Enter your email address.");
                return;
            }
            if (!emailInput.validity.valid || !emailPattern.test(email)) {
                showMessage(message, "Enter a valid email address.");
                emailInput.focus();
                return;
            }

            try {
                clearResetState();
                const account = findAccount(readAccounts(), email);
                if (!account) {
                    showMessage(
                        message,
                        "If this email belongs to a registered demo account, you can continue with the simulated reset flow.",
                        false
                    );
                    return;
                }

                const resetState = {
                    purpose: resetPurpose,
                    stage: "otp",
                    email: account.email,
                    code: makeOtp(),
                    expiresAt: Date.now() + 60000,
                    attempts: 0
                };
                sessionStorage.setItem(resetKey, JSON.stringify(resetState));
                window.location.href = "reset_otp.html";
            } catch (error) {
                showMessage(message, `Could not start the demo password reset: ${error.message}`);
            }
        });
    }

    function initializeOtpStep() {
        const form = document.getElementById("reset-otp-form");
        const message = document.getElementById("reset-otp-message");
        const inputs = Array.from(document.querySelectorAll(".otp-input"));
        const countdown = document.getElementById("reset-countdown");
        const resendButton = document.getElementById("reset-resend-button");
        const verifyButton = document.getElementById("reset-verify-button");
        const showCodeButton = document.getElementById("reset-show-code-button");
        const devCode = document.getElementById("reset-dev-code");
        const devCodeValue = document.getElementById("reset-dev-code-value");
        let resetState;

        function redirectToEmailStep() {
            clearResetState();
            window.location.replace("forgot_password.html");
        }

        function saveResetState() {
            sessionStorage.setItem(resetKey, JSON.stringify(resetState));
        }

        function updateCodeHelper() {
            devCodeValue.textContent = resetState.code;
        }

        function updateCountdown() {
            const remaining = Math.max(0, Math.ceil((resetState.expiresAt - Date.now()) / 1000));
            countdown.textContent = String(remaining);
            resendButton.disabled = remaining > 0;
            if (remaining === 0) {
                showMessage(
                    message,
                    resetState.attempts >= 5
                        ? "This code has reached its five-attempt limit. Resend a code to continue."
                        : "This code has expired. Resend a code to continue."
                );
                window.clearInterval(timer);
                timer = undefined;
            }
        }

        function clearInputs() {
            inputs.forEach(input => {
                input.value = "";
            });
            inputs[0].focus();
        }

        function verifyCode() {
            if (Date.now() >= resetState.expiresAt) {
                updateCountdown();
                return;
            }
            if (resetState.attempts >= 5) {
                showMessage(message, "This code has reached its five-attempt limit. Resend a code when the timer ends.");
                return;
            }

            const entered = inputs.map(input => input.value).join("");
            if (!/^\d{6}$/.test(entered)) {
                showMessage(message, "Enter all six digits of the verification code.");
                return;
            }
            if (entered !== resetState.code) {
                resetState.attempts += 1;
                try {
                    saveResetState();
                } catch (error) {
                    showMessage(message, `Could not save the verification attempt: ${error.message}`);
                    return;
                }
                clearInputs();
                showMessage(
                    message,
                    resetState.attempts >= 5
                        ? "Incorrect code. You have used all five attempts. Resend a code when the timer ends."
                        : `Incorrect code. ${5 - resetState.attempts} attempt${resetState.attempts === 4 ? "" : "s"} remaining.`
                );
                return;
            }

            try {
                if (!findAccount(readAccounts(), resetState.email)) {
                    redirectToEmailStep();
                    return;
                }
                resetState.stage = "verified";
                resetState.verifiedAt = Date.now();
                delete resetState.code;
                delete resetState.expiresAt;
                delete resetState.attempts;
                saveResetState();
                window.location.href = "new_password.html";
            } catch (error) {
                showMessage(message, `Could not verify the demo reset code: ${error.message}`);
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

        try {
            resetState = readResetState();
            if (
                !validResetState(resetState, "otp") ||
                !/^\d{6}$/.test(resetState.code) ||
                !Number.isFinite(resetState.expiresAt) ||
                !Number.isInteger(resetState.attempts) ||
                resetState.attempts < 0 ||
                resetState.attempts > 5
            ) {
                redirectToEmailStep();
                return;
            }
            if (!findAccount(readAccounts(), resetState.email)) {
                redirectToEmailStep();
                return;
            }
        } catch (error) {
            clearResetState();
            window.location.replace("forgot_password.html");
            return;
        }

        document.getElementById("reset-masked-email").textContent = maskEmail(resetState.email);
        updateCodeHelper();
        inputs.forEach((input, index) => {
            input.addEventListener("input", handleInput);
            input.addEventListener("paste", handlePaste);
            input.addEventListener("keydown", event => {
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
            if (Date.now() < resetState.expiresAt) {
                return;
            }
            try {
                if (!findAccount(readAccounts(), resetState.email)) {
                    redirectToEmailStep();
                    return;
                }
                resetState.code = makeOtp();
                resetState.expiresAt = Date.now() + 60000;
                resetState.attempts = 0;
                saveResetState();
                updateCodeHelper();
                clearInputs();
                message.hidden = true;
                timer = window.setInterval(updateCountdown, 250);
                updateCountdown();
            } catch (error) {
                showMessage(message, `Could not issue a new demo code: ${error.message}`);
            }
        });

        updateCountdown();
        if (!timer && Date.now() < resetState.expiresAt) {
            timer = window.setInterval(updateCountdown, 250);
        }
        inputs[0].focus();
    }

    function initializePasswordStep() {
        const form = document.getElementById("new-password-form");
        const passwordInput = document.getElementById("new-password");
        const confirmInput = document.getElementById("confirm-new-password");
        const message = document.getElementById("new-password-message");

        let resetState;
        try {
            resetState = readResetState();
            if (
                !validResetState(resetState, "verified") ||
                !Number.isFinite(resetState.verifiedAt) ||
                Date.now() - resetState.verifiedAt > verifiedLifetime ||
                !findAccount(readAccounts(), resetState.email)
            ) {
                clearResetState();
                window.location.replace("forgot_password.html");
                return;
            }
        } catch (error) {
            clearResetState();
            window.location.replace("forgot_password.html");
            return;
        }

        form.addEventListener("submit", async event => {
            event.preventDefault();
            message.hidden = true;
            const password = passwordInput.value;
            const confirmPassword = confirmInput.value;
            if (!password || !confirmPassword) {
                showMessage(message, "Complete both password fields.");
                return;
            }
            if (password.length < 8) {
                showMessage(message, "Your password must contain at least 8 characters.");
                passwordInput.focus();
                return;
            }
            if (password !== confirmPassword) {
                showMessage(message, "The passwords do not match.");
                confirmInput.focus();
                return;
            }

            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            try {
                const currentState = readResetState();
                if (
                    !validResetState(currentState, "verified") ||
                    currentState.email !== resetState.email ||
                    !Number.isFinite(currentState.verifiedAt) ||
                    Date.now() - currentState.verifiedAt > verifiedLifetime
                ) {
                    clearResetState();
                    window.location.replace("forgot_password.html");
                    return;
                }

                const accounts = readAccounts();
                const accountIndex = accounts.findIndex(account => account && account.email === resetState.email);
                if (accountIndex < 0) {
                    clearResetState();
                    window.location.replace("forgot_password.html");
                    return;
                }
                const salt = randomHex(16);
                const passwordHash = await hashPassword(password, salt);
                accounts[accountIndex] = { ...accounts[accountIndex], salt, passwordHash };
                localStorage.setItem(accountsKey, JSON.stringify(accounts));
                clearResetState();
                window.location.replace("login.html");
            } catch (error) {
                showMessage(message, `Could not update the demo password: ${error.message}`);
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    if (step === "email") {
        initializeEmailStep();
    } else if (step === "otp") {
        initializeOtpStep();
    } else if (step === "password") {
        initializePasswordStep();
    }

    window.addEventListener("pagehide", () => {
        if (timer) {
            window.clearInterval(timer);
        }
    });
})();
