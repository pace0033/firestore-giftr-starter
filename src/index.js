import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBq5jD2uud2icF5lXZ13LAcGr9zvk_v75Q",
  authDomain: "fire-giftr-17910.firebaseapp.com",
  projectId: "fire-giftr-17910",
  storageBucket: "fire-giftr-17910.appspot.com",
  messagingSenderId: "953551576185",
  appId: "1:953551576185:web:28a3e5fbc53d5d733a08a8",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// get a reference to the database
const db = getFirestore(app);
// App constants
const people = [];

document.addEventListener("DOMContentLoaded", async () => {
  // TODO: overlay currently active by default, remove later
  document.querySelector(".overlay").classList.remove("active");
  addClickListeners();
  // Get people from Firestore
  await getPeople();
});

function addClickListeners() {
  //set up the dom events
  document
    .getElementById("btnCancelPerson")
    .addEventListener("click", hideOverlay);
  document
    .getElementById("btnCancelIdea")
    .addEventListener("click", hideOverlay);
  document.querySelector(".overlay").addEventListener("click", hideOverlay);

  document
    .getElementById("btnAddPerson")
    .addEventListener("click", showOverlay);
  document.getElementById("btnAddIdea").addEventListener("click", showOverlay);
}
function hideOverlay(ev) {
  ev.preventDefault();
  document.querySelector(".overlay").classList.remove("active");
  document
    .querySelectorAll(".overlay dialog")
    .forEach((dialog) => dialog.classList.remove("active"));
}
function showOverlay(ev) {
  ev.preventDefault();
  document.querySelector(".overlay").classList.add("active");
  const id = ev.target.id === "btnAddPerson" ? "dlgPerson" : "dlgIdea";
  //TODO: check that person is selected before adding an idea
  document.getElementById(id).classList.add("active");
}

/* --- PEOPLE FUNCTIONS --- */
async function getPeople() {
  const collectionRef = collection(db, "people");
  const peopleSnapshot = await getDocs(collectionRef);

  // Populate people array with database results
  peopleSnapshot.forEach((person) => {
    const id = person.id;
    const data = person.data();
    people.push({ id, ...data });
  });

  buildPeople(people);
}

function buildPeople(peopleArray) {
  const ul = document.querySelector(".person-list");
  const months = [
    "January",
    "Feburary",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  ul.innerHTML = people
    .map((person) => {
      const birthMonth = months[person["birth-month"] - 1];
      const birthDay = person["birth-day"];
      const dob = `${birthMonth} ${birthDay}`;

      return `<li data-id=${person.id} class="person">
      <p class="name">${person.name}</p>
      <p class="dob">${dob}</p>
    </li>`;
    })
    .join("");
}
