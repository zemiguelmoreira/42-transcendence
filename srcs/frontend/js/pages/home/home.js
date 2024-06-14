// generateNavBar(isLoggedIn());

const btn = document.getElementById("testeBtn");
console.log(btn);

btn.addEventListener("click", function () {
  fetch("/api/users/teste/")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      console.log(data);
      document.getElementById("response").innerHTML = JSON.stringify(
        data,
        null,
        2
      );
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
      document.getElementById("response").innerHTML = "Error: " + error.message;
    });
});
