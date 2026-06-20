document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const emailError = document.getElementById("emailError");
  const passError = document.getElementById("passError");

  let isValid = true;

  // Validación Email
  if (email.value.trim() === "") {
    emailError.classList.remove("hidden");
    isValid = false;
  } else {
    emailError.classList.add("hidden");
  }

  // Validación Password
  if (password.value.trim() === "") {
    passError.classList.remove("hidden");
    isValid = false;
  } else {
    passError.classList.add("hidden");
  }

  if (isValid) {
    console.log("Formulario válido, enviando datos...");
    // Aquí iría tu lógica de autenticación (LPL-10)
  }
});
    