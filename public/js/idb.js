// variable to hold db connection
let db;

// connection to IndexedDB database 'budget_tracker' version 1
const request = indexedDB.open('budget_tracker', 1);

// event that emits on database version change
request.onupgradeneeded = function(event) {
  
  const db = event.target.result;
  
  // create an object store (table)
  db.createObjectStore('new_transaction', { autoIncrement: true });
};

request.onsuccess = function(event) {
  db = event.target.result;

  if (navigator.onLine) {
    uploadTransactions();
  }
};

request.onerror = function(event) {
  console.log(event.target.errorCode);
};

// executed when there is no internet connection
function saveRecord(record) {
  // open a new database transaction
  const dbTransaction = db.transaction(['new_transaction'], 'readwrite');

  // access the object store
  const transactionObjectStore = dbTransaction.objectStore('new_transaction');

  // add record to object store
  transactionObjectStore.add(record);
};

function uploadTransactions() {
  const dbTransaction = db.transaction(['new_transaction'], 'readwrite');

  const transactionObjectStore = dbTransaction.objectStore('new_transaction');

  const getAll = transactionObjectStore.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json/'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          const dbTransaction = db.transaction(['new_transaction'], 'readwrite');

          const transactionObjectStore = dbTransaction.objectStore('new_transaction');
          // clear all items from the object store
          transactionObjectStore.clear();

          alert('All saved transactions have been submitted!');
        })
        .catch(err => {
          console.log(err);
        });
    }
  }
};

window.addEventListener('online', uploadTransactions)