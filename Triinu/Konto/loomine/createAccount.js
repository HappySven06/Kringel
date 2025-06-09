document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("createForm");

  form.addEventListener("submit", function (event) {
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirm_password.value;

    if (!email || !password || !confirmPassword) {
      alert("Kõik väljad peavad olema täidetud.");
      event.preventDefault();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Palun sisesta kehtiv email.");
      event.preventDefault();
      return;
    }

    if (password !== confirmPassword) {
      alert("Paroolid ei kattu.");
      event.preventDefault();
      return;
    }

    if (password.length < 8) {
      alert("Parool peab olema vähemalt 8 tähemärki.");
      event.preventDefault();
    }
  });
});

function toggleVisibility(icon) {
  const input = icon.previousElementSibling;
  input.type = input.type === "password" ? "text" : "password";
  icon.textContent = icon.textContent === "👁" ? "🙈" : "👁";
}

function openPdfPopup() {
  document.getElementById("pdfPopup").style.display = "flex";
}

function closePdfPopup() {
  document.getElementById("pdfPopup").style.display = "none";
}
