// Login Page Logic with Entra ID SSO and Demo Mode

document.addEventListener("DOMContentLoaded", async () => {
  const entraLoginBtn = document.getElementById("entraLoginBtn");
  const demoModeBtn = document.getElementById("demoModeBtn");
  const errorMessage = document.getElementById("errorMessage");

  // Initialize Entra ID auth
  try {
    initializeEntraAuth();

    // Handle redirect if returning from login
    const user = await handleEntraRedirect();
    if (user) {
      // Already logged in via redirect, go to dashboard
      window.location.href = "dashboard.html";
      return;
    }
  } catch (error) {
    console.error("Error initializing auth:", error);
  }

  // Check if already logged in
  try {
    const user = await checkEntraAuth();
    if (user && !isDemoMode()) {
      // Already logged in, redirect to dashboard
      window.location.href = "dashboard.html";
      return;
    }
  } catch (error) {
    console.log("Not logged in");
  }

  // Entra ID SSO Login
  entraLoginBtn.addEventListener("click", async () => {
    try {
      errorMessage.textContent = "";
      errorMessage.style.display = "none";
      entraLoginBtn.disabled = true;
      entraLoginBtn.innerHTML =
        '<span class="icon"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg></span> Inloggen...';

      // Disable demo mode if active
      if (isDemoMode()) {
        disableDemoMode();
      }

      // Use popup for desktop, redirect for mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      const user = await signInWithEntraId(isMobile);

      if (user) {
        // Success - redirect to dashboard
        window.location.href = "dashboard.html";
      } else if (isMobile) {
        // Redirect flow - will be handled by redirect promise
        // No action needed here
      }
    } catch (error) {
      console.error("Login error:", error);

      errorMessage.textContent =
        "Inloggen mislukt: " + (error.message || "Onbekende fout");
      errorMessage.style.display = "block";

      entraLoginBtn.disabled = false;
      entraLoginBtn.innerHTML =
        '<span class="icon"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></span> Inloggen met Microsoft 365';
    }
  });

  // Demo Mode
  demoModeBtn.addEventListener("click", () => {
    try {
      errorMessage.textContent = "";
      errorMessage.style.display = "none";

      // Enable demo mode
      enableDemoMode();

      // Show success message
      const successMsg = document.createElement("div");
      successMsg.className = "success-message";
      successMsg.textContent =
        '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M21.801 10A10 10 0 1 1 17 3.335"></path><path d="m9 11 3 3L22 4"></path></svg> Demo modus geactiveerd! U wordt doorgestuurd...';
      successMsg.style.cssText =
        "background: #28a745; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;";

      errorMessage.parentNode.insertBefore(successMsg, errorMessage);

      // Redirect to dashboard after short delay
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    } catch (error) {
      console.error("Demo mode error:", error);

      errorMessage.textContent =
        "Demo modus activeren mislukt: " + error.message;
      errorMessage.style.display = "block";
    }
  });
});
