import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where,
  updateDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

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
// connect to firebase auth service
const auth = getAuth(app);
// Global variables
let people = [];
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
  console.log(auth);
  addListeners();
  // Get people from Firestore
  await getPeople();
}

function addListeners() {
  //set up the dom click events
  document
    .getElementById("btnCancelPerson")
    .addEventListener("click", hideOverlay);
  document
    .getElementById("btnCancelIdea")
    .addEventListener("click", hideOverlay);
  document
    .getElementById("btnAddPerson")
    .addEventListener("click", showAddOverlay);
  document
    .getElementById("btnAddIdea")
    .addEventListener("click", showAddOverlay);
  document
    .getElementById("btnSavePerson")
    .addEventListener("click", savePerson);
  document.getElementById("btnSaveIdea").addEventListener("click", saveIdea);
  document
    .querySelector(".person-list")
    .addEventListener("click", handleSelectPerson);
  document
    .getElementById("btnConfirmDelete")
    .addEventListener("click", deleteDocument);
  document
    .getElementById("btnCancelDelete")
    .addEventListener("click", hideOverlay);
  document.getElementById("btnLogin").addEventListener("click", logInHandler);
  document
    .getElementById("btnSignout")
    .addEventListener("click", signOutHandler);

  // set up the onSnapshot listeners
  // listen for changes to people collection
  onSnapshot(collection(db, "people"), handlePeopleChanges);
  // listen for changes gift-ideas collection
  onSnapshot(collection(db, "gift-ideas"), handleGiftIdeaChanges);
}
function hideOverlay(ev) {
  ev.preventDefault();
  document.querySelector(".overlay").classList.remove("active");
  document
    .querySelectorAll(".overlay dialog")
    .forEach((dialog) => dialog.classList.remove("active"));
}
function showAddOverlay(ev) {
  ev.preventDefault();
  document.querySelector(".overlay").classList.add("active");
  let id;
  if (ev.target.id === "btnAddPerson") {
    id = "dlgPerson";
    // Set dialog title back to "Add" terminology
    const h2 = document.querySelector("#dlgPerson h2");
    h2.textContent = "Add Person";
    // Clear the form inputs
    // DOM form input elements
    document.getElementById("name").value = "";
    document.getElementById("month").value = "";
    document.getElementById("day").value = "";
    // Remove any pre-existing data-id attribute
    document.getElementById("btnSavePerson").dataset.id = "";
  } else {
    id = "dlgIdea";
    // Set dialog title back to "Add" terminology
    const h2 = document.querySelector("#dlgIdea h2");
    h2.textContent = "Add Idea";
    // Clear the form inputs
    // DOM form input elements
    document.getElementById("title").value = "";
    document.getElementById("location").value = "";
    // Remove any pre-existing data-id attribute
    document.getElementById("btnSaveIdea").dataset.id = "";
  }
  //TODO: check that person is selected before adding an idea
  document.getElementById(id).classList.add("active");
}
function showSuccessDialog(message) {
  // Show a success message to the user
  const successDialog = document.getElementById("dlgSuccess");
  const successMessage = document.querySelector(".success-message");
  successMessage.innerHTML = message;
  successDialog.classList.add("active");

  // Hide the overlay
  const overlay = document.querySelector(".overlay");
  overlay.classList.remove("active");

  // Hide the success message after 4 seconds
  setTimeout(() => {
    successDialog.classList.remove("active");
    successDialog.classList.add("hidden");
  }, 4000);
}

/* --- AUTH HANDLERS --- */
async function logInHandler(ev) {
  ev.preventDefault();
  console.log("login button clicked");

  // Hide login button and show signout button
  ev.target.classList.add("hidden");
  document.getElementById("btnSignout").classList.remove("hidden");
}

async function signOutHandler(ev) {
  ev.preventDefault();
  console.log("sign out button clicked");

  // Hide signout button and show login button
  ev.target.classList.add("hidden");
  document.getElementById("btnLogin").classList.remove("hidden");
}

/* --- ONSNAPSHOT CALLBACKS --- */
// TODO: Finish modified and added handlers for both collections
function handlePeopleChanges(snapshot) {
  snapshot.docChanges().forEach((change) => {
    const id = change.doc.id;
    if (change.type === "added") {
      // NOTE: All documents in collection fire as "added" on load
      const person = change.doc.data();
      person.id = id;
      const li = document.querySelector(`li[data-id="${id}"]`);
      // If a li for the person doesn't exist yet, make one
      if (!li) showPerson(person);
    } else if (change.type === "modified") {
      const person = change.doc.data();
      person.id = id;
      // Update the DOM
      showPerson(person);
    } else if (change.type === "removed") {
      // remove li of deleted person from the DOM
      const li = document.querySelector(`[data-id="${id}"]`);
      li.outerHTML = "";
    }
  });
}

function handleGiftIdeaChanges(snapshot) {
  snapshot.docChanges().forEach((change) => {
    const id = change.doc.id;
    if (change.type === "added") {
      const personId = change.doc.data()["person-id"].id;
      const li = document.querySelector(`.idea-list li[data-id="${id}"]`);
      // If the ID of the person's gift idea is current selected person in UI
      // And if there is no li that already exists for the idea
      if (personId === selectedPersonId && !li) {
        // Call getIdeas on the DB to easily rebuild the entire ideas list
        getIdeas(personId);
      }
    } else if (change.type === "modified") {
      // need to find li with the doc id
      const li = document.querySelector(`[data-id="${id}"]`);
      const data = change.doc.data();
      // update the DOM
      li.innerHTML = `
            <label for="chk-${id}">
              <input type="checkbox" id="chk-${id}"
                ${data.bought ? "checked" : ""} /> Bought
            </label>
            <div class="idea-container">
              <div class="idea-info">
                <p class="title">${data.idea}</p>
                <p class="location">${data.location}</p>
              </div>
              <div class="idea-buttons">
                <button class="edit">Edit</button>
                <button class="delete">Delete</button>
              </div>
            </div>
      `;
    } else if (change.type === "removed") {
      // remove li of deleted person from the DOM
      const id = change.doc.id;
      const li = document.querySelector(`[data-id="${id}"]`);
      if (li) li.outerHTML = "";
    }
  });
}

/* --- PEOPLE FUNCTIONS --- */
async function getPeople() {
  const collectionRef = collection(db, "people");
  const peopleSnapshot = await getDocs(collectionRef);

  // reset the people array if it's not empty
  if (people.length) people = [];

  // Populate people array with database results
  peopleSnapshot.forEach((person) => {
    const id = person.id;
    const data = person.data();
    people.push({ id, ...data });
  });

  // If a person hasn't been selected yet, select the first person
  selectedPersonId = buildPeople(people);

  //select the <li> for the selected person by clicking on a list item
  if (selectedPersonId) {
    let li = document.querySelector(`[data-id="${selectedPersonId}"]`);
    li.click();
  }
}

function buildPeople(peopleArray) {
  const ul = document.querySelector(".person-list");

  if (peopleArray.length) {
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
          <button class="edit">
           Edit
          </button>
          <button class="delete">
            Delete
        </button>
        </div>
      </li>`;
      })
      .join("");
    // return the first Person's unique ID
    return peopleArray[0].id;
  } else {
    ul.innerHTML = '<li class="empty">No people added yet.</li>';
  }
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
  const collectionRef = collection(db, "people");

  // Check if save button has a data-id or not
  const id = ev.target.dataset.id;
  if (id) {
    // If there's a document ID, update pre-existing document
    try {
      const docRef = doc(collectionRef, id);
      await updateDoc(docRef, person);
      console.log(`Updated pre-existing database entry for ${person.name}`);
      // Hide edit person dialog box
      document.getElementById("dlgPerson").classList.remove("active");
      // Show success message
      const message = `Successfully updated ${person.name}'s entry.`;
      showSuccessDialog(message);
    } catch (error) {
      console.error(`Error updating document: ${error}`);
    }
  } else {
    // If no document ID, we are creating a new document
    try {
      const docRef = await addDoc(collectionRef, person);
      console.log(`New doc added to people collection with ID: ${docRef.id}`);
      // Hide add person dialog box
      document.getElementById("dlgPerson").classList.remove("active");
      // Show success message
      const message = `${name} added to your list of people.`;
      showSuccessDialog(message);
      // Add id field to person object to pass in parameter
      person.id = docRef.id;
      // Save person to in-memory array
      people.push(person);
      // Update the DOM using the new object
      showPerson(person);
    } catch (error) {
      console.error(`Error adding new document: ${error}`);
    }
  }
}

function showPerson(person) {
  // check if the people list ul has default empty text li
  const emptyLi = document.querySelector(".person-list li.empty");
  // Remove the empty text li
  if (emptyLi) {
    emptyLi.outerHTML = "";
  }

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

async function handleSelectPerson(ev) {
  //see if there is a parent <li class="person">
  const li = ev.target.closest(".person");

  if (li) {
    // set selectedPersonId to id data-attribute from li
    const id = li.getAttribute("data-id");
    // select the li user clicked
    li.click();
    selectedPersonId = id;

    if (ev.target.classList.contains("edit")) {
      //EDIT the doc using the id to get a docRef
      const docRef = doc(collection(db, "people"), id);
      try {
        // Get data from Firestore
        const doc = await getDoc(docRef);
        const data = doc.data();
        //show the dialog form to EDIT the doc (same form as ADD)
        document.querySelector(".overlay").classList.add("active");
        document.getElementById("dlgPerson").classList.add("active");
        const title = document.querySelector("#dlgPerson h2");
        title.textContent = "Edit Person";
        // DOM form input elements
        const nameInput = document.getElementById("name");
        const monthInput = document.getElementById("month");
        const dayInput = document.getElementById("day");
        // Load all the Person document details into the form from docRef
        nameInput.value = data.name;
        monthInput.value = data["birth-month"];
        dayInput.value = data["birth-day"];
        // Store person ID into Save button data attribute
        document.getElementById("btnSavePerson").dataset.id = doc.id;
      } catch (error) {
        console.error(`Error fetching document during edit: ${error}`);
      }
    } else if (ev.target.classList.contains("delete")) {
      //do a confirmation before deleting
      confirmDelete("people", id);
    } else {
      //content inside the <li> but NOT a <button> was clicked
      selectedPersonId = id;
      //remove any previously selected styles
      document.querySelector("li.selected")?.classList.remove("selected");
      //Highlight the newly selected person
      li.classList.add("selected");
      //and load all the gift idea documents for that person
      getIdeas(id);
    }
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
              ><input type="checkbox" id="chk-${idea.id}"
              ${idea.bought ? "checked" : ""} /> Bought</label
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
      '<li class="empty">No gift ideas added yet for selected person.</li>';
  }
  // Add click listener for ideas list
  document
    .querySelector(".idea-list")
    .addEventListener("click", ideaClickHandler);
}

async function ideaClickHandler(ev) {
  // listen for checkbox changes
  // listen for edit and delete button clicks
  // otherwise ignore
  //see if there is a parent <li class="person">
  const li = ev.target.closest(".idea");

  if (li) {
    // User clicked inside an idea li
    const id = li.getAttribute("data-id");
    if (ev.target.classList.contains("edit")) {
      //EDIT the doc using the id to get a docRef
      const docRef = doc(collection(db, "gift-ideas"), id);
      try {
        // Get data from Firestore
        const doc = await getDoc(docRef);
        const data = doc.data();
        //show the dialog form to EDIT the doc (same form as ADD)
        document.querySelector(".overlay").classList.add("active");
        document.getElementById("dlgIdea").classList.add("active");
        const title = document.querySelector("#dlgIdea h2");
        title.textContent = "Edit Idea";
        // DOM form input elements
        const ideaInput = document.getElementById("title");
        const locationInput = document.getElementById("location");
        // Load all the Person document details into the form from docRef
        ideaInput.value = data.idea;
        locationInput.value = data.location;
        // Store doc ID into Save button data attribute
        document.getElementById("btnSaveIdea").dataset.id = doc.id;
      } catch (error) {
        console.error(`Error fetching idea document during edit: ${error}`);
      }
    } else if (ev.target.classList.contains("delete")) {
      //do a confirmation before deleting
      confirmDelete("gift-ideas", id);
    } else if (ev.target.type === "checkbox") {
      // Returns a boolean if the checkbox has been checked
      const bought = ev.target.checked;
      await setBoughtStatus(id, bought);
    }
  }
}

async function setBoughtStatus(id, bought) {
  // get the doc reference
  const docRef = doc(collection(db, "gift-ideas"), id);
  // create update object with bought property
  const docUpdate = { bought };

  try {
    await updateDoc(docRef, docUpdate);
    console.log(`Successfully updated document ID #: ${id}`);
    console.log(`Bought status set to ${bought}`);
  } catch (error) {
    console.error(`Error updating bought status on document: ${error}`);
  }
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

  // Check if save button has a data-id or not
  const id = ev.target.dataset.id;
  if (id) {
    // If there's a data-id attribute, update doc
    console.log("inside the update doc saveIdea() conditional");
    try {
      const docRef = doc(collection(db, "gift-ideas"), id);
      await updateDoc(docRef, idea);
      console.log(`Updated pre-existing database entry for ${idea.idea}`);
      // Hide edit person dialog box
      document.getElementById("dlgIdea").classList.remove("active");
      // Show success message
      const message = `Successfully updated entry for ${idea.idea}.`;
      showSuccessDialog(message);
    } catch (error) {
      console.error(`Error updating document: ${error}`);
    }
  } else {
    // Else we are creating a new doc
    try {
      const docRef = await addDoc(collection(db, "gift-ideas"), idea);
      console.log("Document written with ID: ", docRef.id);
      // Hide the add idea dialog
      document.getElementById("dlgIdea").classList.remove("active");
      // Show a success message to the user
      const message = `${idea.idea} added to list of gift ideas.`;
      showSuccessDialog(message);

      // Update the DOM
      getIdeas(selectedPersonId);
    } catch (err) {
      console.error("Error adding document: ", err);
      //do you want to stay on the dialog?
      //display a mesage to the user about the problem
    }
  }
}

/* --- DELETE FUNCTIONS --- */
function confirmDelete(collection, id) {
  // Store the collection and id in data attributes for click handler
  const deleteButton = document.getElementById("btnConfirmDelete");
  deleteButton.dataset.id = id;
  deleteButton.dataset.collection = collection;

  // set overlay active
  const overlay = document.querySelector(".overlay");
  overlay.classList.add("active");
  // set delete dialog active
  const deleteDialog = document.getElementById("dlgDelete");
  deleteDialog.classList.add("active");
}

async function deleteDocument(ev) {
  // Hide the overlay
  hideOverlay(ev);
  //DELETE the doc using the id to get a docRef
  const id = ev.target.dataset.id;
  const collectionName = ev.target.dataset.collection;
  const docRef = doc(db, collectionName, id);
  try {
    await deleteDoc(docRef);
    console.log(`Successfully deleted document ID #: ${docRef.id}`);
    // remove old data attributes from delete button
    ev.target.dataset.id = "";
    ev.target.dataset.collection = "";
    // If deleting person user currently has selected in UI
    // update selectedPersonId to first person in list
    if (collectionName === "people" && selectedPersonId === id) {
      const firstPersonLi = document.querySelector(".person-list").firstChild;
      // If there is an li inside the person list ul
      if (firstPersonLi) {
        const firstPersonId = firstPersonLi.dataset.id;
        // set selectedPersonId to first li ID and click it
        selectedPersonId = firstPersonId;
        firstPersonLi.click();
      }
    }
    checkForEmptyList(collectionName);
  } catch (error) {
    console.error(`Error deleting document: ${error}`);
  }
}

function checkForEmptyList(collection) {
  const classSelector = collection === "people" ? ".person-list" : ".idea-list";
  const ul = document.querySelector(classSelector);
  // If there are no items in list, add empty message
  if (!ul.hasChildNodes()) {
    const items = collection === "people" ? "people" : "gift ideas";
    const li = `<li class="empty">No ${items} added yet.</li>`;
    ul.innerHTML = li;
  }
}
