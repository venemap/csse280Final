var rhit = rhit || {};

/** globals */
rhit.variableName = "";
n =  new Date();
y = n.getFullYear();
m = n.getMonth() + 1;
d = n.getDate();

rhit.FB_BUDGET_COLLECTION = "Budget"
rhit.FB_KEY_AMOUNT = "Amount";
rhit.FB_KEY_CATEGORY = "Category";
rhit.FB_EXPENSE_COLLECTION = "Expenses";
rhit.FB_KEY_DATE = "Date";
rhit.FB_KEY_AUTHOR = "Author";
rhit.FB_KEY_BUDGETID = "BudgetName"
rhit.fbExpenseChangeManager = null;
rhit.fbBudgetManager = null;
rhit.fbSingleBudgetManager = null;
rhit.fbExpenseManager = null;
rhit.fbSingleExpenseManager = null;
rhit.fbAuthManager = null;

function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.Budget = class {
	constructor(id, category, amount) {
		this.id = id;
		this.category = category;
		this.amount = amount;
	}
}

rhit.BudgetListPageController = class {
	constructor() {

		document.querySelector("#budgetDelete").addEventListener("click", event => {
			rhit.fbBudgetManager.delete().then(() => {
				console.log("Document successfully deleted!");
				window.location.href = "#";
			}).catch(error => console.error("Error removing document: ", error));
		});


		rhit.fbBudgetManager.beginListening(this.updateList.bind(this));

		// if(document.querySelector("#logoutClick")) {
		// 	document.querySelector("#logoutClick").onclick = (event) => {
		// 		console.log("sign out");
		// 		firebase.auth().signOut();
		// 	}
		// }
	}

	_createBudget(budget, total) {
		return htmlToElement(`
		<div id="BudgetOverview-Label">
			<span>${budget.category}: $${total}/${budget.amount}</span>
  
			<span class="dropdown pull-xs-right budget-option-menu">
				<button class="btn bmd-btn-icon dropdown-toggle" type="button" id="lr1" data-toggle="dropdown">
					<i class="material-icons">more_horiz</i>
				</button>
				<div class="dropdown-menu dropdown-menu-right" aria-labelledby="lr1">
					<button id="budgetEdit" class="dropdown-item" type="button"><i class="material-icons">edit</i>&nbsp;&nbsp;&nbsp;&nbsp;Edit</button>
					<button id="budgetDelete" class="dropdown-item" type="button"><i class="material-icons">delete</i>&nbsp;&nbsp;&nbsp;&nbsp;Delete</button>
				</div>
			</span>
	  	</div>
	  <br>`)
	}

	updateList() {
		console.log("update the page for budgets");

		console.log(`Num budgets = ${rhit.fbBudgetManager.length}`);
		console.log(`Example Budget: `, rhit.fbBudgetManager.getBudgetAtIndex(0));

		const newList = htmlToElement('<div id="BudgetOverview-Label"></div>')

		let total = 0;

		for (let i = 0; i < rhit.fbBudgetManager.length; i++) {
			const budget = rhit.fbBudgetManager.getBudgetAtIndex(i);
			console.log("printing all expenses");
			total = 0;
			for (let j = 0; j < rhit.fbBudgetManager.expenseLength; j++) {
				const expense = rhit.fbBudgetManager.getExpenseAtIndex(j);
				if (expense.budgetName == budget.category){
					console.log(expense, budget);
					total += parseInt(expense.amount);
				}
				

			}

			const newBudget = this._createBudget(budget, total);

			// newBudget.onclick = (event) => {
			// 	console.log(`You clicked on ${budget.id}`);

			// 	window.location.href = `/budgetEdit.html?id=${budget.id}`
			// }

			newList.appendChild(newBudget);


		}
		
		const oldBudget = document.querySelector("#BudgetOverview-Label");
		oldBudget.removeAttribute("id");

		oldBudget.hidden = true;
		oldBudget.parentElement.appendChild(newList);

	}

}

rhit.FbBudgetManager = class {
	constructor(uid) {
		this._documentSnapshots = [];
		this._expenseSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_BUDGET_COLLECTION);
		this._ref2 = firebase.firestore().collection(rhit.FB_BUDGET_COLLECTION).doc(uid);
		this._expenseRef = firebase.firestore().collection(rhit.FB_EXPENSE_COLLECTION);
		this._unsubscribe = null;
		this._uid = uid;
	}

	beginListening(changeListener) {
		let query = this._ref.limit(30);

		if(this._uid) {
			query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
		}

		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			console.log("Budget page Update");

			this._documentSnapshots = querySnapshot.docs;

			querySnapshot.forEach((doc) => {
				console.log(doc.data);
			})

			changeListener();
		})

		query = this._expenseRef.limit(30);
		if(this._uid) {
			query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
		}
		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._expenseSnapshots = querySnapshot.docs;

			querySnapshot.forEach((doc) => {
				console.log(doc.data);
			})
			changeListener();
		})
		
	}

	stopListening() {
		this._unsubscribe();
	}

	delete(){
		return this._ref2.delete();
	}

	get length() {
		return this._documentSnapshots.length;
	}

	getBudgetAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const budget = new rhit.Budget(
			docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_CATEGORY),
			docSnapshot.get(rhit.FB_KEY_AMOUNT),
		);
		return budget;
	}

	get expenseLength() {
		return this._expenseSnapshots.length;
	}

	getExpenseAtIndex(index) {
		const docSnapshot = this._expenseSnapshots[index];
		const exp = new rhit.Expense(
			docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_CATEGORY),
			docSnapshot.get(rhit.FB_KEY_AMOUNT),
			docSnapshot.get(rhit.FB_KEY_DATE),
			docSnapshot.get(rhit.FB_KEY_BUDGETID),
		);
		return exp;
	}
}

rhit.Expense = class {
	constructor(id, category, amount, date, budgetName) {
		this.id = id;
		this.category = category;
		this.amount = amount;
		this.date = date;
		this.budgetName = budgetName;
	}
}

rhit.ExpenseListPageController = class {
	constructor() {
		document.querySelector("#expenseDelete").addEventListener("click", event => {
			rhit.fbExpenseManager.delete().then(() => {
				console.log("Document successfully deleted!");
				window.location.href = "#";
			}).catch(error => console.error("Error removing document: ", error));
		});

		rhit.fbExpenseManager.beginListening(this.updateList.bind(this));
	}

	_createExpense(expense) {
		let category = expense.category;
		let amount = expense.amount;
		let date = null;
		if (expense.date) {
			date = expense.date;
		} else {
			//date = Date.now();
			date = firebase.firestore.Timestamp.now();
			console.log("DATE FOR EXPENSE DNE");
		}
		return htmlToElement(`
		<div id="ExpenseOverview-Label">
			<span>${category} $${amount} </span>  
			
			<span class="expenseRightSideWrapper">
			<span class="expenseDate">${date.toDate().getMonth()}/${date.toDate().getDay()}/${date.toDate().getFullYear()}</span>
  
			<span class="dropdown pull-xs-right expense-option-menu">
		  		<button class="btn bmd-btn-icon dropdown-toggle" type="button" id="lr1" data-toggle="dropdown">
					<i class="material-icons">more_horiz</i>
		  		</button>
		  		<div class="dropdown-menu dropdown-menu-right" aria-labelledby="lr1">
					<button class="dropdown-item" type="button"><i class="material-icons">edit</i>&nbsp;&nbsp;&nbsp;&nbsp;Edit</button>
					<button class="dropdown-item" type="button"><i class="material-icons">delete</i>&nbsp;&nbsp;&nbsp;&nbsp;Delete</button>
		  		</div>
			</span>
			</span>
		</div>
		<hr>`
		);
	}

	updateList() {
		console.log("I need to update the list of the expense page");
		console.log(`Num expenses = ${rhit.fbExpenseManager.length}`);
		console.log(`Example expense = `, rhit.fbExpenseManager.getExpenseAtIndex(0));

		const newList = htmlToElement(`<div id="wrapper-expenses"></div>`);

		for (let i = 0; i < rhit.fbExpenseManager.length; i++) {
			const exp = rhit.fbExpenseManager.getExpenseAtIndex(i);
			const newExpense = this._createExpense(exp);

			// newExpense.onclick = (event) => {
			// 	console.log(`you clicked on ${exp.id}`);

			// 	window.location.href = `/expenseEdit.html?id=${exp.id}`;
			// }

			newList.appendChild(newExpense);
		}

		const oldList = document.querySelector("#wrapper-expenses");
		oldList.removeAttribute("id");

		oldList.hidden = true;

		oldList.parentElement.appendChild(newList);
	}
}

rhit.FbExpenseManager = class {
	constructor(uid) {
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_EXPENSE_COLLECTION);
		this._ref2 = firebase.firestore().collection(rhit.FB_EXPENSE_COLLECTION).doc(uid);
		this._unsubscribe = null;
		this._uid = uid;

	}

	beginListening(changeListener) {
		console.log("beginning to listen for budgets to fill dropdown");
		let query = this._ref.limit(30);

		if(this._uid) {
			query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
		}

		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			console.log("expensemanager update");

			this._documentSnapshots = querySnapshot.docs;

			querySnapshot.forEach((doc) => {
				console.log(doc.data());
			});

			changeListener();
		});
	}

	stopListening() {
		this._unsubscribe();
	}

	delete() {
		return this._ref.delete();
	}

	get length() {
		return this._documentSnapshots.length;
	}
	getExpenseAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const exp = new rhit.Expense(
			docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_CATEGORY),
			docSnapshot.get(rhit.FB_KEY_AMOUNT),
			docSnapshot.get(rhit.FB_KEY_DATE),
			docSnapshot.get(rhit.FB_KEY_BUDGETID),
		);
		return exp;
	}


}

rhit.FbSingleExpenseManager = class {
	constructor(uid) {
		this._documentSnapshots = [];
		this._budgetSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_EXPENSE_COLLECTION);
		this._budgetRef = firebase.firestore().collection(rhit.FB_BUDGET_COLLECTION);
		this._unsubscribe = null;
		this._uid = uid;

		console.log(`making single expense manager for ${this._uid}`);
	}
	add(amount, category, date, budgetName) {
		console.log(amount, category, date, budgetName);

		this._ref.add({
				[rhit.FB_KEY_AMOUNT]: amount,
				[rhit.FB_KEY_CATEGORY]: category,
				[rhit.FB_KEY_AUTHOR]: rhit.fbAuthManager.uid,
				[rhit.FB_KEY_DATE]: date,
				[rhit.FB_KEY_BUDGETID]: budgetName,
			})
			.then(function (docRef) {
				console.log("document written with id: ", docRef);
			})
			.catch(function (error) {
				console.error("Error adding to document: ", error);
			})
	}


	beginListening(changeListener) {
		let query = this._ref.limit(30);

		if(this._uid) {
			query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
		}

		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			console.log("expensemanager update");

			this._documentSnapshots = querySnapshot.docs;

			querySnapshot.forEach((doc) => {
				console.log(doc.data());
			});

			changeListener();
		});

		query = this._budgetRef.limit(30);

		if(this._uid) {
			query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
		}

		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._budgetSnapshots = querySnapshot.docs;

			querySnapshot.forEach((doc) => {
				console.log(doc.data);
			})
			changeListener();
		})
	}

	get budgetLength() {
		return this._budgetSnapshots.length;
	}

	getBudgetAtIndex(index) {
		const docSnapshot = this._budgetSnapshots[index];
		const budget = new rhit.Budget(
			docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_CATEGORY),
			docSnapshot.get(rhit.FB_KEY_AMOUNT),
		)
		return budget;
	}
}

rhit.FbExpenseAddController = class {
	constructor() {
		document.querySelector("#submitAddExpense").onclick = (event) => {
			const amount = document.querySelector("#addExpenseAmount").value;
			const category = document.querySelector("#addExpenseCategory").value;
			const budgetName = document.querySelector("#budgets").value;
			let date = new Date(document.querySelector("#addExpenseDate").value);

			console.log(date);
			console.log(date.getTime() * 0.001);

			date = date.getTime() * 0.001;
			date = new firebase.firestore.Timestamp(date, 0);

			console.log(date);


			rhit.fbSingleExpenseManager.add(amount, category, date, budgetName);
		}
		rhit.fbSingleExpenseManager.beginListening(this.updateList.bind(this));
	}

	_createBudgetDropdown(budget) {
		if(!budget){
			return htmlToElement(`<option value="">No Budget</option>`);
		}
		let category = budget.category;
		let amount = budget.amount;

		return htmlToElement(`<option value="${category}">${category}</option>`);
	}

	updateList() {
		console.log("I need to update the dropdown on the expense page");
		console.log(`Num budgets = ${rhit.fbSingleExpenseManager.budgetLength}`);
		console.log(`Example expense = `, rhit.fbSingleExpenseManager.getBudgetAtIndex(0));

		const newList = htmlToElement(`<select name="budgets" id="budgets" class="dropdown-toggle"></select>`);
		newList.appendChild(this._createBudgetDropdown(null));

		for (let i = 0; i < rhit.fbSingleExpenseManager.budgetLength; i++) {
			const budget = rhit.fbSingleExpenseManager.getBudgetAtIndex(i);
			const newbudgetDropdown = this._createBudgetDropdown(budget);

			newbudgetDropdown.onclick = (event) => {
				console.log(`you clicked on ${budget.id}`);

				// window.location.href = `/expenseEdit.html?id=${exp.id}`;
			}

			newList.appendChild(newbudgetDropdown);
		}

		const oldList = document.querySelector("#budgets");
		oldList.removeAttribute("id");

		oldList.hidden = true;

		oldList.parentElement.appendChild(newList);
	}
}

rhit.FbSingleBudgetManager = class {
	constructor(uid) {
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_BUDGET_COLLECTION);
		this._unsubscribe = null;
		this._uid = uid;

		console.log(`making single budget manager for ${this._uid}`);
	}
	add(amount, category) {
		console.log(amount, category);

		this._ref.add({
				[rhit.FB_KEY_AMOUNT]: amount,
				[rhit.FB_KEY_CATEGORY]: category,
				[rhit.FB_KEY_AUTHOR]: rhit.fbAuthManager.uid,
			})
			.then(function (docRef) {
				console.log("document written with id: ", docRef);
			})
			.catch(function (error) {
				console.error("Error adding to document: ", error);
			})
	}
}

rhit.FbBudgetController = class {
	constructor() {
		document.querySelector("#submitAddBudget").onclick = (event) => {
			const amount = document.querySelector("#addBudgetAmount").value;
			const category = document.querySelector("#addBudgetCategory").value;

			if(amount != "" && category != ""){
				rhit.fbSingleBudgetManager.add(amount, category);

				window.location.href = "budgetOverview.html";
			}
		}
	}
}

rhit.FbExpenseChangeManager = class {
	constructor(expenseId) {
		this._documentSnapshot = {};
		this._unsubscribe = null;
		this._ref = firebase.firestore().collection(rhit.FB_EXPENSE_COLLECTION).doc(expenseId);

		console.log(`Listening to ${this._ref.path}`);
	}

	beginListening(changeListener) {
		this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				console.log("Docuemnt data: ", doc.data());
				this._documentSnapshot = doc;
				changeListener();
			} else {
				console.log("No such document");
			}
		})
	}

	stopListening() {
		this._unsubscribe();
	}

	update(amount, category) {
		console.log("update quote");

		this._ref.update({
				[rhit.FB_KEY_AMOUNT]: amount,
				[rhit.FB_KEY_CATEGORY]: category,
			})
			.then(() => {
				console.log("document succesfully updated");
			})
			.catch(function (error) {
				console.error("Error updating document: ", error);
			})
	}

	get amount() {
		return this._documentSnapshot.get(rhit.FB_KEY_AMOUNT);
	}

	get category() {
		return this._documentSnapshot.get(rhit.FB_KEY_CATEGORY);
	}

	get date() {
		return this._documentSnapshot.get(rhit.FB_KEY_DATE);
	}
}

rhit.ExpenseChangePageController = class {
	constructor() {
		console.log("made expenseChangePageController");

		document.querySelector("#submitEditExpense").onclick = (event) => {
			const amount = document.querySelector("#editExpenseAmount").value;
			const category = document.querySelector("#editExpenseCategory").value;
			rhit.fbExpenseChangeManager.update(amount, category);
		}

		rhit.fbExpenseChangeManager.beginListening(this.updateView.bind(this));
	}

	updateView() {
		console.log("updating expense solo page");

		document.querySelector("#editExpenseAmount").value = rhit.fbExpenseChangeManager.amount;
		document.querySelector("#editExpenseCategory").value = rhit.fbExpenseChangeManager.category;
		document.querySelector("#editExpenseDate").value = rhit.fbExpenseChangeManager.date;
	}
}

rhit.LoginPageController = class {
	constructor() {
		document.querySelector("#loginBtn").onclick = (event) => {
			rhit.fbAuthManager.signIn();
		};

		rhit.startFireBaseUI();
	}
}

rhit.startFireBaseUI = function () {
	// FirebaseUI config.
	var uiConfig = {
		signInSuccessUrl: '/main.html',
		signInOptions: [
			// Leave the lines as is for the providers you want to offer your users.
			firebase.auth.GoogleAuthProvider.PROVIDER_ID
		],
		// tosUrl and privacyPolicyUrl accept either url string or a callback
		// function.
		// Terms of service url/callback.
		tosUrl: '<your-tos-url>',
		// Privacy policy url/callback.
		privacyPolicyUrl: function () {
			window.location.assign('<your-privacy-policy-url>');
		}
	};

	// Initialize the FirebaseUI Widget using Firebase.
	var ui = new firebaseui.auth.AuthUI(firebase.auth());
	// The start method will wait until the DOM is loaded.
	ui.start('#firebaseui-auth-container', uiConfig);
}

rhit.AuthManager = class {
	constructor() {
		this._user = null;
	}

	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			console.log("auth state changing");
			this._user = user;
			changeListener();
		});
	}

	signIn() {
		Rosefire.signIn("70e641ae-bd99-4014-b214-e680668ac0cc", (err, rfUser) => {
			if (err) {
				console.log("Rosefire error!", err);
				return;
			}
			console.log("Rosefire success!", rfUser);

			firebase.auth().signInWithCustomToken(rfUser.token).catch(function (error) {
				//Handle errors here
				const errorCode = error.code;
				const errorMessage = error.message;
				if (errorCode === 'auth/invalid-custom-token') {
					alert('The token you provided is not valid.')
				} else {
					console.error("Custom auth log in error", errorCode, errorMessage);
				}
			});
		});
	}

	signOut() {
		firebase.auth().signOut().catch(function (error) {
			console.log("Sign out error.");
		});
	}

	get isSignedIn() {
		return !!this._user;
	}

	get uid() {
		return this._user.uid;
	}
}

rhit.checkForRedirects = function () {
	console.log("checking for redirects");
	if (document.querySelector("#login") && rhit.fbAuthManager.isSignedIn) {


		window.location.href = "/main.html";


		$(document).ready( function () {
			$('#myModal').modal('show');
		  });
		  console.log("redirecting to main");
		window.onload = function() {
			$('#myModal').modal('show');
		  };


	}

	if (!document.querySelector("#login") && !rhit.fbAuthManager.isSignedIn) {
		console.log("not logged in and on main site");
		window.location.href = "/login.html";
	}

}

rhit.initializePage = function () {
	const urlParams = new URLSearchParams(window.location.search);
	
	if (document.querySelector("#loginPage")) {
		new rhit.LoginPageController();
	}

	if (document.querySelector(".sidebar")) {
		console.log("sidebar is presetn");
		document.querySelector("#greetUser").innerHTML = `Hello, ${rhit.fbAuthManager.uid}`;
	}

	// only run js for sidemenu if it exists on the page
	if (document.querySelector(".hideable")) {
		let hide = document.querySelector(".hideable");
		hide.addEventListener("click", function () {
			document.querySelector("body").classList.toggle("active");
		})
	}
	if (document.querySelector("#loginPage")) {
		let forgotLogin = document.querySelector("#createAccountBtn").onclick = (params) => {
			window.location.href = "accountCreation.html";
		};

	}

	if (document.querySelector("#budgetOverviewPage")) {
		console.log("you are on the budget list page");

		rhit.fbBudgetManager = new rhit.FbBudgetManager(this.fbAuthManager.uid);

		new rhit.BudgetListPageController();
	}

	if (document.querySelector("#expensePage")) {
		console.log("you are on the expense page");
		rhit.fbExpenseManager = new rhit.FbExpenseManager(rhit.fbAuthManager.uid);

		new rhit.ExpenseListPageController();
	}

	if (document.querySelector("#expenseCreationPage")) {
		console.log("you are on the expense creation page");
		rhit.fbSingleExpenseManager = new rhit.FbSingleExpenseManager(rhit.fbAuthManager.uid);

		new rhit.FbExpenseAddController();
	}

	if (document.querySelector("#budgetCreationPage")) {
		console.log("you are on the budget creation page");

		rhit.fbSingleBudgetManager = new rhit.FbSingleBudgetManager(rhit.fbAuthManager.uid);

		new rhit.FbBudgetController();
	}

	if (document.querySelector("#expenseEditPage")) {
		console.log("you are on the expenseEdit page");

		const queryString = window.location.search;
		console.log(queryString);
		const urlParams = new URLSearchParams(queryString);
		const expenseId = urlParams.get("id");

		console.log(`Detail page for ${expenseId}`);

		if (!expenseId) {
			console.log("ERROR!!! MISSING MOVIE QUOTE ID");
			window.location.href = "/";
		}



		rhit.fbExpenseChangeManager = new rhit.FbExpenseChangeManager(expenseId);
		//new rhit.DetailPageController();
		new rhit.ExpenseChangePageController();
	}

	if(document.querySelector("#mainPage")){
		$('#myModal').modal('show');
		document.querySelector("#expenseCreation").onclick = (event) => {
			window.location.href = "expenseCreation.html";
		}
		document.querySelector("#budgetOverview").onclick = (event) => {
			window.location.href = "budgetOverview.html";
		}
		document.querySelector("#expenseHistory").onclick = (event) => {
			window.location.href = "expenseHistory.html";
		}
	}
}

/* Main */
/** function and class syntax examples */
rhit.main = function () {

	if (document.querySelector("#logoutClick")) {
		document.querySelector("#logoutClick").onclick = (event) => {
			console.log("sign out");
			rhit.fbAuthManager.signOut();
		}
	}


	console.log("making new authmanager");
	rhit.fbAuthManager = new rhit.AuthManager();
	rhit.fbAuthManager.beginListening((event) => {
		console.log("We are listening now. Using AuthManager.");
		console.log("isSigned: ", rhit.fbAuthManager.isSignedIn);

		rhit.checkForRedirects();

		rhit.initializePage();

		document.getElementById("date").innerHTML = m + "/" + d + "/" + y;

	});

	





};

rhit.main();
