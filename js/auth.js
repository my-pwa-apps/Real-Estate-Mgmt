// Authentication functions

// Check if user is logged in
function checkAuth() {
  return new Promise((resolve, reject) => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        resolve(user);
      } else {
        // Redirect to login if not authenticated
        if (
          !window.location.pathname.endsWith("index.html") &&
          !window.location.pathname.endsWith("/")
        ) {
          window.location.href = "index.html";
        }
        reject("Not authenticated");
      }
    });
  });
}

// Login function
async function login(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(
      email,
      password,
    );
    return userCredential.user;
  } catch (error) {
    throw error;
  }
}

// Logout function
async function logout() {
  try {
    await auth.signOut();
    window.location.href = "index.html";
  } catch (error) {
    console.error("Logout error:", error);
    showToast("Er is een fout opgetreden bij het uitloggen", "error");
  }
}

// Setup logout button if it exists
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
});

// Login form handler
if (document.getElementById("loginForm")) {
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("errorMessage");
    const loginBtn = document.getElementById("loginBtn");

    // Disable button during login
    loginBtn.disabled = true;
    loginBtn.textContent = "Inloggen...";
    errorMessage.classList.remove("show");

    try {
      await login(email, password);
      window.location.href = "dashboard.html";
    } catch (error) {
      console.error("Login error:", error);
      errorMessage.textContent =
        "Ongeldige inloggegevens. Probeer het opnieuw.";
      errorMessage.classList.add("show");
      loginBtn.disabled = false;
      loginBtn.textContent = "Inloggen";
    }
  });
}

// Protect pages (check authentication on load)
if (
  !window.location.pathname.endsWith("index.html") &&
  !window.location.pathname.endsWith("/")
) {
  checkAuth()
    .then((user) => {
      console.log("User authenticated:", user.email);
    })
    .catch((error) => {
      console.log("User not authenticated");
    });
}
