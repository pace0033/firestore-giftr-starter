import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where,
} from "firebase/firestore";

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
  document.getElementById("btnOkay").addEventListener("click", hideOverlay);

  document
    .getElementById("btnAddPerson")
    .addEventListener("click", showOverlay);
  document.getElementById("btnAddIdea").addEventListener("click", showOverlay);
  document
    .getElementById("btnSavePerson")
    .addEventListener("click", savePerson);
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

async function savePerson(ev) {
  // Function called when user clicks save button from Add Person dialog
  ev.preventDefault();
  // DOM input elements
  let name = document.getElementById("name").value;
  let month = document.getElementById("month").value;
  let day = document.getElementById("day").value;
  // Exit the function if any input fields are empty
  if (!name || !month || !day) return;

  const person = {
    name,
    "birth-month": month,
    "birth-day": day,
  };

  try {
    const docRef = await addDoc(collection(db, "people"), person);
    console.log(`New doc added to people collection with ID: ${docRef.id}`);

    // Clear form fields
    document.getElementById("name").value = "";
    document.getElementById("month").value = "";
    document.getElementById("day").value = "";
    // Show a success message to the user
    const successDialog = document.getElementById("dlgSuccess");
    const successMessage = document.querySelector(".success-message");
    successMessage.innerHTML = `Person ${name} added to database`;
    successDialog.classList.add("active");
    // Add id field to person object to pass in parameter
    person.id = docRef.id;
    // TODO: Update the DOM using the new object
  } catch (error) {
    console.error(`Error adding document: ${error}`);
  }
}

/* --- GIFT IDEA FUNCTION --- */
async function getIdeas(id) {
  const personRef = doc(collection(db, "people"), id);
  const docs = query(
    collection(db, "gift-ideas"),
    where("person-id", "==", personRef)
  );
  const giftsSnapshot = await getDocs(docs);

  giftsSnapshot.forEach((gift) => {
    const data = gift.data();
  });
}
