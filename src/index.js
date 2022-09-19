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
let selectedPersonId = null;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  addClickListeners();
  // Get people from Firestore
  await getPeople();
}
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
  document.getElementById("btnSaveIdea").addEventListener("click", saveIdea);
  document
    .querySelector(".person-list")
    .addEventListener("click", handleSelectPerson);
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

  selectedPersonId = buildPeople(people);
  //select the matching <li> by clicking on a list item
  let li = document.querySelector(`[data-id="${selectedPersonId}"]`);
  li.click();
}

function buildPeople(peopleArray) {
  const ul = document.querySelector(".person-list");

  ul.innerHTML = people
    .map((person) => {
      const birthMonth = months[person["birth-month"] - 1];
      const birthDay = person["birth-day"];
      const dob = `${birthMonth} ${birthDay}`;

      return `<li data-id=${person.id} class="person">
      <div class="person-info">
        <p class="name">${person.name}</p>
        <p class="dob">${dob}</p>
      </div>
      <div class="person-buttons">
        <button class="edit">Edit</button>
        <button class="delete">Delete</button>
      </div>
    </li>`;
    })
    .join("");

  // return the first Person's unique ID
  return peopleArray[0].id;
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
    // Save person to in-memory array
    people.push(person);
    // Update the DOM using the new object
    showPerson(person);
  } catch (error) {
    console.error(`Error adding document: ${error}`);
  }
}

function showPerson(person) {
  const birthMonth = months[person["birth-month"] - 1];
  const birthDay = person["birth-day"];
  const dob = `${birthMonth} ${birthDay}`;

  let li = document.querySelector(`[data-id="${person.id}"]`);
  if (li) {
    // If we're updating the DOM for an element that already exists
    li.outerHTML = `<li data-id="${person.id}" class="person">
          <div class="person-info">
            <p class="name">${person.name}</p>
            <p class="dob">${dob}</p>
          </div>
          <div class="person-buttons">
            <button class="edit">Edit</button>
            <button class="delete">Delete</button>
          </div>
          </li>`;
  } else {
    // If this is a new entry, create new li and add to the person-list ul
    li = `<li data-id="${person.id}" class="person">
            <div class="person-info">
              <p class="name">${person.name}</p>
              <p class="dob">${dob}</p>
            </div>
            <div class="person-buttons">
              <button class="edit">Edit</button>
              <button class="delete">Delete</button>
            </div>
          </li>`;
    document.querySelector("ul.person-list").innerHTML += li;
  }
}

// TODO: Look at this later to understand how it works
function handleSelectPerson(ev) {
  //ev.target; - could be the button OR anything in the ul.
  const li = ev.target.closest(".person"); //see if there is a parent <li class="person">
  const id = li ? li.getAttribute("data-id") : null; // if li exists then the user clicked inside an <li>

  if (id) {
    //user clicked inside li
    selectedPersonId = id;
    //did they click the li content OR an edit button OR a delete button?
    if (ev.target.classList.contains("edit")) {
      //EDIT the doc using the id to get a docRef
      //show the dialog form to EDIT the doc (same form as ADD)
      //Load all the Person document details into the form from docRef
    } else if (ev.target.classList.contains("delete")) {
      //DELETE the doc using the id to get a docRef
      //do a confirmation before deleting
    } else {
      //content inside the <li> but NOT a <button> was clicked
      //remove any previously selected styles
      document.querySelector("li.selected")?.classList.remove("selected");
      //Highlight the newly selected person
      li.classList.add("selected");
      //and load all the gift idea documents for that person
      getIdeas(id);
    }
  } else {
    //clicked a button not inside <li class="person">
    //Show the dialog form to ADD the doc (same form as EDIT)
    //showOverlay function can be called from here or with the click listener in DOMContentLoaded, not both
  }
}

/* --- GIFT IDEA FUNCTION --- */
async function getIdeas(id) {
  const personRef = doc(collection(db, "people"), id);
  const docs = query(
    collection(db, "gift-ideas"),
    where("person-id", "==", personRef)
  );
  const ideasSnapshot = await getDocs(docs);
  const ideas = [];

  ideasSnapshot.forEach((idea) => {
    const data = idea.data();
    const id = idea.id;

    const ideaObj = {
      id,
      idea: data.idea,
      location: data.location,
      bought: data.bought,
      personId: data["person-id"].id,
      personRef: data["person-id"],
    };

    ideas.push(ideaObj);
  });
  buildIdeas(ideas);
}

function buildIdeas(ideas) {
  // ideas will be an array filled with idea objects
  // derived from our database info
  const ideaList = document.querySelector(".idea-list");
  // Only update DOM if the database returned at least one idea
  if (ideas.length) {
    ideaList.innerHTML = ideas
      .map((idea) => {
        return `<li class="idea" data-id="${idea.id}">
            <label for="chk-${idea.id}"
              ><input type="checkbox" id="chk-${idea.id}" /> Bought</label
            >
            <div class="idea-container">
              <div class="idea-info">
                <p class="title">${idea.idea}</p>
                <p class="location">${idea.location}</p>
              </div>
              <div class="idea-buttons">
                <button class="edit">Edit</button>
                <button class="delete">Delete</button>
              </div>
            </div>
          </li>`;
      })
      .join("");
  } else {
    ideaList.innerHTML =
      "<li>No gift ideas added yet for selected person.</li>";
  }
  //TODO: add listener for 'change' or 'input' event on EVERY checkbox '.idea [type="checkbox"]'
  // which will call a function to update the `bought` value for the document
}

async function saveIdea(ev) {
  // Function called when user clicks save button from Add Idea dialog
  // DOM input elements
  let title = document.getElementById("title").value;
  let location = document.getElementById("location").value;
  // Exit the function if any input fields are empty
  if (!title || !location) return;

  const personRef = doc(db, `/people/${selectedPersonId}`);
  const idea = {
    location,
    idea: title,
    bought: false,
    "person-id": personRef,
  };

  try {
    const docRef = await addDoc(collection(db, "gift-ideas"), idea);
    console.log("Document written with ID: ", docRef.id);
    idea.id = docRef.id;
    //1. clear the form fields
    title = "";
    location = "";
    //2. hide the dialog and the overlay by clicking on overlay
    hideOverlay(ev);
    //3. TODO: display a message to the user about success

    //4. ADD the new HTML to the <ul> using the new object
    //just recall the method to show all ideas for the selected person
    getIdeas(selectedPersonId);
  } catch (err) {
    console.error("Error adding document: ", err);
    //do you want to stay on the dialog?
    //display a mesage to the user about the problem
  }
  //TODO: update this function to work as an UPDATE method too
}
