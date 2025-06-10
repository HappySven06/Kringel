document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('[data-popup="logout"]').forEach(button => {
    button.addEventListener("click", () => {
      showPopup("Logi välja", "Kas oled kindel, et soovid valja logida?", [
        { 
          text: "Jah", 
          action: () => {
            window.location.href = "login.html";
          } 
        },
        { text: "Ei", cancel: true }
      ]);
    });
  });
});
