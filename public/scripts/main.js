var rhit = rhit || {};

/** globals */
rhit.variableName = "";
n = new Date();
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
rhit.fbBudgetChangeManager = null;
rhit.fbBudgetMoreInfoManager = null;

function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.BudgetListPageController = class {
	constructor() {
		rhit.fbBudgetManager.beginListening(this.updateList.bind(this));
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
					<button id="moreInfo" class="dropdown-item moreInfo" type="button"><i class="material-icons">edit</i>&nbsp;&nbsp;&nbsp;&nbsp;More Info</button>
					<button id="budgetEdit" class="dropdown-item budgetEdit" type="button"><i class="material-icons">edit</i>&nbsp;&nbsp;&nbsp;&nbsp;Edit</button>
					<button id="budgetDelete" class="dropdown-item budgetDelete" type="button"><i class="material-icons">delete</i>&nbsp;&nbsp;&nbsp;&nbsp;Delete</button>
				</div>
			</span>
	  	</div>
	  <br>`)
	}

	updateList() {
		// console.log("update the page for budgets");

		// console.log(`Num budgets = ${rhit.fbBudgetManager.length}`);
		// console.log(y);

		const newList = htmlToElement('<div id="BudgetOverview-Label"></div>')

		let total = 0;

		for (let i = 0; i < rhit.fbBudgetManager.length; i++) {
			const budget = rhit.fbBudgetManager.getBudgetAtIndex(i);
			// console.log("printing all expenses");
			total = 0;
			for (let j = 0; j < rhit.fbBudgetManager.expenseLength; j++) {
				const expense = rhit.fbBudgetManager.getExpenseAtIndex(j);
				if (expense.budgetName == budget.category) {
					// console.log(expense, budget);
					total += parseInt(expense.amount);
				}
			}

			const newBudget = this._createBudget(budget, total);

			newBudget.querySelector(".budgetEdit").onclick = (event) => {
				// console.log("editing budget");
				window.location.href = `/budgetEdit.html?id=${budget.id}`;
			}
			newBudget.querySelector(".budgetDelete").onclick = (event) => {
				// console.log("deleting budget");
				rhit.fbBudgetManager.delete(budget.id).then((event) => {
					this.updateList();
				});
			}
			newBudget.querySelector(".moreInfo").onclick = (event) => {
				window.location.href = `/budgetMoreInfo.html?id=${budget.category}`;
			}
			newList.appendChild(newBudget);
		}

		const oldBudget = document.querySelector("#BudgetOverview-Label");
		oldBudget.removeAttribute("id");
		oldBudget.hidden = true;
		oldBudget.parentElement.appendChild(newList);

		const dateHolder = rhit.fbBudgetManager.oldestExpense;
		// console.log("dateHolder: " + dateHolder);
		const timeDiff = n.getTime() - dateHolder.getTime();
		const diffInDays = parseInt(timeDiff / (1000 * 3600 * 24));
		const avgSpending = rhit.fbBudgetManager.totalExpensesAmount / diffInDays;

		// console.log("ttl budgets: " + rhit.fbBudgetManager.totalBudgetsAmount);
		// console.log("ttl expenses: " + rhit.fbBudgetManager.totalExpensesAmount);

		document.querySelector("#budgetTitle").innerHTML =
			`<h2>$${rhit.fbBudgetManager.totalBudgetsAmount-rhit.fbBudgetManager.totalExpensesAmount} left in account<h2>
		<h3>You are currently spending $${avgSpending.toFixed(2)} per day.</h3> <h3>${Math.round(rhit.fbBudgetManager.totalBudgetsAmount/avgSpending)} days left before running out of money</h3>`
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

		if (this._uid) {
			query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
		}

		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			// console.log("Budget page Update");

			this._documentSnapshots = querySnapshot.docs;

			querySnapshot.forEach((doc) => {
				// console.log(doc.data);
			})

		})

		query = this._expenseRef.limit(30);
		if (this._uid) {
			query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
		}
		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._expenseSnapshots = querySnapshot.docs;

			querySnapshot.forEach((doc) => {
				// console.log(doc.data);
			})
			changeListener();
		})

	}

	stopListening() {
		this._unsubscribe();
	}

	delete(id) {
		return this._ref.doc(id).delete();
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

	get totalBudgetsAmount() {
		let total = 0;
		for (let i = 0; i < this._documentSnapshots.length; i++) {
			total += parseInt(this.getBudgetAtIndex(i).amount);
		}
		return total;
	}

	get totalExpensesAmount() {
		let totalExp = 0;
		for (let i = 0; i < this._expenseSnapshots.length; i++) {
			if (this.getExpenseAtIndex(i).budgetName != "") totalExp += parseInt(this.getExpenseAtIndex(i).amount);
		}
		return totalExp;
	}

	get oldestExpense() {
		return this.getExpenseAtIndex(this._expenseSnapshots.length - 1).date.toDate();
	}

	totalExpenseForBudget(budgetName) {
		// console.log("total expense per budget");
		let total = 0;
		for (let i = 0; i < this._expenseSnapshots.length; i++) {
			// console.log("expense[budgetCategory]: " + this.getExpenseAtIndex(i).budgetName);
			if (this.getExpenseAtIndex(i).budgetName == budgetName) {
				total += parseInt(this.getExpenseAtIndex(i).amount);
			}

		}
		return total;
	}
}

rhit.Budget = class {
	constructor(id, category, amount) {
		this.id = id;
		this.category = category;
		this.amount = amount;
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

rhit.BudgetMoreInfoController = class {
	constructor() {

		rhit.fbBudgetMoreInfoManager.beginListening(this.updateList.bind(this));
	}

	updateList() {
		// console.log("I need to update the list of the moreInfo page");
		// console.log(`Num expenses = ${rhit.fbBudgetMoreInfoManager.length}`);
		// console.log(`Example expense = `, rhit.fbBudgetMoreInfoManager.getExpenseAtIndex(0));

		const newList = htmlToElement(`<div id="wrapper-moreInfo"></div>`);

		for (let i = 0; i < rhit.fbBudgetMoreInfoManager.length; i++) {
			const exp = rhit.fbBudgetMoreInfoManager.getExpenseAtIndex(i);
			const newExpense = this._createExpense(exp);
			// console.log(newExpense);

			newList.appendChild(newExpense);
		}

		const oldList = document.querySelector("#wrapper-moreInfo");
		oldList.removeAttribute("id");

		oldList.hidden = true;

		oldList.parentElement.appendChild(newList);
	}

	_createExpense(expense) {
		let category = expense.category;
		let amount = expense.amount;
		let date = null;
		if (expense.date) {
			date = expense.date;
		} else {
			date = firebase.firestore.Timestamp.now();
			// console.log("DATE FOR EXPENSE DNE");
		}
		return htmlToElement(`
		<div id="ExpenseOverview-Label">
			<span>${category}: $${amount} </span>  
			
			<span class="expenseRightSideWrapper">
				<span class="expenseDate">${date.toDate().getMonth()+1}/${date.toDate().getDate()}/${date.toDate().getFullYear()}</span>
	
				<span class="dropdown pull-xs-right expense-option-menu">
					<button class="btn bmd-btn-icon dropdown-toggle" type="button" id="lr1" data-toggle="dropdown">
						<i class="material-icons">more_horiz</i>
					</button>
					<div class="dropdown-menu dropdown-menu-right" aria-labelledby="lr1">
						<button "id="expenseEdit1" class="dropdown-item expenseEdit" type="button" onclick="window.location.href = '/expenseEdit.html?id=${expense.id}'"><i class="material-icons">edit</i>&nbsp;&nbsp;&nbsp;&nbsp;Edit</button>
						<button id="expenseDelete" class="dropdown-item expenseDelete" type="button"><i class="material-icons">delete</i>&nbsp;&nbsp;&nbsp;&nbsp;Delete</button>
					</div>
				</span>
			</span>
		</div>
		<hr>`);
	}

}

rhit.BudgetMoreInfoManager = class {
	constructor(uid, categoryName) {
		this._documentSnapshot = [];
		this._ref = firebase.firestore().collection(rhit.FB_EXPENSE_COLLECTION);
		this._unsubscribe = null;
		this._uid = uid;
		this._categoryName = categoryName;
	}

	beginListening(changeListener) {
		let query = this._ref.limit(30).where(rhit.FB_KEY_BUDGETID, "==", this._categoryName);

		if (this._uid) {
			query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
		}

		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._documentSnapshot = querySnapshot.docs;

			querySnapshot.forEach((doc) => {
				// console.log(doc);
			});
			changeListener();
		});
	}

	stopListening() {
		this._unsubscribe();
	}

	get length() {
		return this._documentSnapshot.length;
	}

	getExpenseAtIndex(index) {
		const docSnapshot = this._documentSnapshot[index];
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

rhit.ExpenseListPageController = class {
	constructor() {
		rhit.fbExpenseManager.beginListening(this.updateList.bind(this));
		// console.log("after onclicks have been made");
	}

	_createExpense(expense) {
		let category = expense.category;
		let amount = expense.amount;
		let date = null;
		if (expense.date) {
			date = expense.date;
		} else {
			date = firebase.firestore.Timestamp.now();
			// console.log("DATE FOR EXPENSE DNE");
		}
		return htmlToElement(`
		<div id="ExpenseOverview-Label">
			<span>${category}: $${amount} </span>  
			
			<span class="expenseRightSideWrapper">
				<span class="expenseDate">${date.toDate().getMonth() + 1}/${date.toDate().getDate()}/${date.toDate().getFullYear()}</span>
	
				<span class="dropdown pull-xs-right expense-option-menu">
					<button class="btn bmd-btn-icon dropdown-toggle" type="button" id="lr1" data-toggle="dropdown">
						<i class="material-icons">more_horiz</i>
					</button>
					<div class="dropdown-menu dropdown-menu-right" aria-labelledby="lr1">
						<button "id="expenseEdit1" class="dropdown-item expenseEdit" type="button" onclick="window.location.href = '/expenseEdit.html?id=${expense.id}'"><i class="material-icons">edit</i>&nbsp;&nbsp;&nbsp;&nbsp;Edit</button>
						<button id="expenseDelete" class="dropdown-item expenseDelete" type="button"><i class="material-icons">delete</i>&nbsp;&nbsp;&nbsp;&nbsp;Delete</button>
					</div>
				</span>
			</span>
		</div>
		<hr>`);
	}

	updateList() {
		const newList = htmlToElement(`<div id="wrapper-expenses"></div>`);

		for (let i = 0; i < rhit.fbExpenseManager.length; i++) {
			const exp = rhit.fbExpenseManager.getExpenseAtIndex(i);
			const newExpense = this._createExpense(exp);

			newExpense.querySelector(".expenseEdit").onclick = (event) => {
				// console.log(i, "edit");
				window.location.href = `/expenseEdit.html?id=${exp.id}`;
			}
			newExpense.querySelector(".expenseDelete").onclick = (event) => {
				// console.log(i, "delete");
				rhit.fbExpenseManager.delete(exp.id).then(() => {
					// console.log("deleting" + exp.id);

				}).catch(error => console.error("error removing document", error));
			}



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
		let query = this._ref.limit(30);

		if (this._uid) {
			query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
		}

		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;

			querySnapshot.forEach((doc) => {});

			changeListener();
		});
	}

	stopListening() {
		this._unsubscribe();
	}

	delete(id) {
		return this._ref.doc(id).delete();
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

		// console.log(`making single expense manager for ${this._uid}`);
	}
	add(amount, category, date, budgetName) {
		// console.log(amount, category, date, budgetName);

		this._ref.add({
				[rhit.FB_KEY_AMOUNT]: amount,
				[rhit.FB_KEY_CATEGORY]: category,
				[rhit.FB_KEY_AUTHOR]: rhit.fbAuthManager.uid,
				[rhit.FB_KEY_DATE]: date,
				[rhit.FB_KEY_BUDGETID]: budgetName,
			})
			.then(function (docRef) {
				// console.log("document written with id: ", docRef);
				window.location.href = "main.html";
			})
			.catch(function (error) {
				console.error("Error adding to document: ", error);
			})
	}


	beginListening(changeListener) {
		let query = this._ref.limit(30);

		if (this._uid) {
			query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
		}

		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			// console.log("expensemanager update");

			this._documentSnapshots = querySnapshot.docs;

			querySnapshot.forEach((doc) => {
				// console.log(doc.data());
			});

			changeListener();
		});

		query = this._budgetRef.limit(30);

		if (this._uid) {
			query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
		}

		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._budgetSnapshots = querySnapshot.docs;

			querySnapshot.forEach((doc) => {
				// console.log(doc.data);
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
			// console.log(document.querySelector("#addExpenseDate").value);

			date = date.getTime() * 0.001;
			date += 43200; //add 12 hours
			// console.log(date);
			date = new firebase.firestore.Timestamp(date, 0);

			// console.log(date);
			// console.log(date.toDate());

			// console.log("!!amount", !!!amount);
			// console.log("!!category", !!category);
			// console.log("!!date", !!document.querySelector("#addExpenseDate").value);
			if ((amount && category && !!document.querySelector("#addExpenseDate").value)) {
				// console.log("good to submit");
				rhit.fbSingleExpenseManager.add(amount, category, date, budgetName);

			} else {
				console.error("add all to submit");
				//TODO: Add alert to notify user
			}
		}

		document.querySelector("#cancelAddExpense").onclick = (event) => {
			window.location.href = "main.html";
		}

		rhit.fbSingleExpenseManager.beginListening(this.updateList.bind(this));
	}

	_createBudgetDropdown(budget) {
		if (!budget) {
			return htmlToElement(`<option value="">No Budget</option>`);
		}
		let category = budget.category;
		let amount = budget.amount;

		return htmlToElement(`<option value="${category}">${category}</option>`);
	}

	updateList() {
		const newList = htmlToElement(`<select name="budgets" id="budgets" class="dropdown-toggle"></select>`);
		newList.appendChild(this._createBudgetDropdown(null));

		for (let i = 0; i < rhit.fbSingleExpenseManager.budgetLength; i++) {
			const budget = rhit.fbSingleExpenseManager.getBudgetAtIndex(i);
			const newbudgetDropdown = this._createBudgetDropdown(budget);

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

		// console.log(`making single budget manager for ${this._uid}`);
	}
	add(amount, category) {
		// console.log(amount, category);

		this._ref.add({
				[rhit.FB_KEY_AMOUNT]: amount,
				[rhit.FB_KEY_CATEGORY]: category,
				[rhit.FB_KEY_AUTHOR]: rhit.fbAuthManager.uid,
			})
			.then(function (docRef) {
				// console.log("document written with id: ", docRef);
				window.location.href = "budgetOverview.html";
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

			if (amount != "" && category != "") {
				// console.log(`${amount}, ${category}`);
				rhit.fbSingleBudgetManager.add(amount, category);

			} else {
				console.error("enter all budget categories");
				//TODO: add alert to user
			}
		}
		document.querySelector("#cancelAddBudget").onclick = (event) => {
			window.location.href = "budgetOverview.html";
		}
	}
}

rhit.FbExpenseChangeManager = class {
	constructor(expenseId) {
		this._documentSnapshot = {};
		this._unsubscribe = null;
		this._ref = firebase.firestore().collection(rhit.FB_EXPENSE_COLLECTION).doc(expenseId);

		// console.log(`Listening to ${this._ref.path}`);
	}

	beginListening(changeListener) {
		this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				console.log("Docuemnt data: ", doc.data());
				this._documentSnapshot = doc;
				changeListener();
			} else {
				// console.log("No such document");
			}
		})
	}

	stopListening() {
		this._unsubscribe();
	}

	update(amount, category) {
		// console.log("update quote");

		this._ref.update({
				[rhit.FB_KEY_AMOUNT]: amount,
				[rhit.FB_KEY_CATEGORY]: category,
			})
			.then(() => {
				// console.log("document succesfully updated");
				window.location.href = "expenseHistory.html";
			})
			.catch(function (error) {
				// console.error("Error updating document: ", error);
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

rhit.FbBudgetChangeManager = class {
	constructor(budgetId) {
		this._documentSnapshot = {};
		this._unsubscribe = null;
		this._ref = firebase.firestore().collection(rhit.FB_BUDGET_COLLECTION).doc(budgetId);

		// console.log(`Listening to ${this._ref.path}`);
	}

	beginListening(changeListener) {
		this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				// console.log("Docuemnt data: ", doc.data());
				this._documentSnapshot = doc;
				changeListener();
			} else {
				// console.log("No such document");
			}
		})
	}

	stopListening() {
		this._unsubscribe();
	}

	update(amount, category) {
		// console.log("update quote");

		this._ref.update({
				[rhit.FB_KEY_AMOUNT]: amount,
				[rhit.FB_KEY_CATEGORY]: category,
			})
			.then(() => {
				// console.log("document succesfully updated");
				window.location.href = "budgetOverview.html";
			})
			.catch(function (error) {
				// console.error("Error updating document: ", error);
			})
	}

	get amount() {
		return this._documentSnapshot.get(rhit.FB_KEY_AMOUNT);
	}

	get category() {
		return this._documentSnapshot.get(rhit.FB_KEY_CATEGORY);
	}
}

rhit.ExpenseChangePageController = class {
	constructor() {
		// console.log("made expenseChangePageController");

		document.querySelector("#submitEditExpense").onclick = (event) => {
			const amount = document.querySelector("#editExpenseAmount").value;
			const category = document.querySelector("#editExpenseCategory").value;
			rhit.fbExpenseChangeManager.update(amount, category);
		}

		document.querySelector("#cancelEditExpense").onclick = (event) => {
			window.location.href = "expenseHistory.html";
		}

		rhit.fbExpenseChangeManager.beginListening(this.updateView.bind(this));
	}

	updateView() {
		// console.log("updating expense solo page");

		document.querySelector("#editExpenseAmount").value = rhit.fbExpenseChangeManager.amount;
		document.querySelector("#editExpenseCategory").value = rhit.fbExpenseChangeManager.category;
		// console.log(rhit.fbExpenseChangeManager.date);
		let year = rhit.fbExpenseChangeManager.date.toDate().getFullYear();
		let month = rhit.fbExpenseChangeManager.date.toDate().getMonth() + 1;
		if (month.toString().length == 1) month = "0" + month;
		let day = rhit.fbExpenseChangeManager.date.toDate().getDate();
		if (day.toString().length == 1) day = "0" + day;
		let temp = year + "-" + month + "-" + day;
		// console.log(temp);
		// console.log(year, month, day);
		document.querySelector("#editExpenseDate").value = temp;
	}
}

rhit.BudgetChangeController = class {
	constructor() {
		// console.log("made budgetChangeController");

		document.querySelector("#submitEditBudget").onclick = (event) => {
			const amount = document.querySelector("#editBudgetAmount").value;
			const category = document.querySelector("#editBudgetCategory").value;
			rhit.fbBudgetChangeManager.update(amount, category);
			// console.log(amount, category);
		}
		document.querySelector("#cancelEditBudget").onclick = (event) => {
			window.location.href = "budgetOverview.html";
		}

		rhit.fbBudgetChangeManager.beginListening(this.updateView.bind(this));
	}

	updateView() {
		// console.log("updating expense solo page");

		document.querySelector("#editBudgetAmount").value = rhit.fbBudgetChangeManager.amount;
		document.querySelector("#editBudgetCategory").value = rhit.fbBudgetChangeManager.category;
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

rhit.OverviewController = class {
	constructor() {
		rhit.fbBudgetManager.beginListening(this.updateList.bind(this));
		this._labels = [];
		this._data = [];
		this._backgroundColors = [];
		this._tempColors = ["#FF6384", "#4BC0C0", "#FFCE56", "#E7E9ED", "#36A2EB"]
	}

	updateList() {


		const newList = htmlToElement(`<div class="modal-body"></div>`);

		for (let i = 0; i < rhit.fbBudgetManager.length; i++) {
			const budget = rhit.fbBudgetManager.getBudgetAtIndex(i);
			// console.log(budget.category);

			this._labels.push(budget.category);
			this._data.push(budget.amount);
			this._backgroundColors.push(this._tempColors[i]);

			const newBudget = this._createBudget(budget, rhit.fbBudgetManager.totalExpenseForBudget(budget.category));

			newList.appendChild(newBudget);
		}

		const oldList = document.querySelector(".modal-body");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		oldList.parentElement.appendChild(newList);














		// console.log("labels: " + this._labels);
		// console.log("data: " + this._data);

		// console.log("this._label length" + this._labels.length)



		// console.log("this_labels in ready function: " + this._labels);
		var chartDiv = $("#barChart");
		var myChart = new Chart(chartDiv, {
			type: 'pie',
			data: {
				labels: this._labels,
				datasets: [{
					data: this._data,
					backgroundColor: this._tempColors,
				}]
			},
			options: {
				title: {
					display: false,
					text: 'Pie Chart'
				},
				legend: {
					display: true,
					position: 'right',
					align: 'start',
					fullsize: true,
				},
				responsive: true,
				maintainAspectRatio: true,
			}
		});

		// console.log(rhit.fbBudgetManager.totalBudgetsAmount);

		document.querySelector("#overviewStatus").innerHTML = `${rhit.fbAuthManager.uid}, you have $${rhit.fbBudgetManager.totalBudgetsAmount-rhit.fbBudgetManager.totalExpensesAmount} left in your budgets`


	}


	_createBudget(budget, amt) {
		let category = budget.category;
		let amount = budget.amount;

		return htmlToElement(`
		<div> ${category}: $ ${amt} / ${amount}
		</div>`);
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
			this._user = user;
			changeListener();
		});
	}

	signIn() {
		Rosefire.signIn("70e641ae-bd99-4014-b214-e680668ac0cc", (err, rfUser) => {
			if (err) {
				// console.log("Rosefire error!", err);
				return;
			}
			// console.log("Rosefire success!", rfUser);

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

		sessionStorage.setItem('showMainPopup', true);
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
	if (document.querySelector("#login") && rhit.fbAuthManager.isSignedIn) {
		// console.log("redirecting to /main.html");

		window.location.href = "/main.html";



	}

	if (!document.querySelector("#login") && !rhit.fbAuthManager.isSignedIn) {
		// console.log("not logged in and on main site");
		// console.log('redirecting to index.html');
		window.location.href = "/index.html";
	}

}

rhit.initializePage = function () {
	const urlParams = new URLSearchParams(window.location.search);

	if (document.querySelector("#loginPage")) {
		new rhit.LoginPageController();
	}

	if (document.querySelector(".sidebar")) {
		document.querySelector("#greetUser").innerHTML = `Hello, ${rhit.fbAuthManager.uid}`;
	}

	// only run js for sidemenu if it exists on the page
	if (document.querySelector(".hideable")) {
		let hide = document.querySelector(".hideable");
		hide.addEventListener("click", function () {
			document.querySelector("body").classList.toggle("active");
		})
	}

	if (document.querySelector("#budgetOverviewPage")) {
		// console.log("you are on the budget list page");

		rhit.fbBudgetManager = new rhit.FbBudgetManager(this.fbAuthManager.uid);

		new rhit.BudgetListPageController();
	}

	if (document.querySelector("#expensePage")) {
		// console.log("you are on the expense page");
		rhit.fbExpenseManager = new rhit.FbExpenseManager(rhit.fbAuthManager.uid);
		// console.log("after expense page has been made");

		new rhit.ExpenseListPageController();
	}

	if (document.querySelector("#expenseCreationPage")) {
		// console.log("you are on the expense creation page");
		rhit.fbSingleExpenseManager = new rhit.FbSingleExpenseManager(rhit.fbAuthManager.uid);

		new rhit.FbExpenseAddController();
	}

	if (document.querySelector("#budgetCreationPage")) {
		// console.log("you are on the budget creation page");

		rhit.fbSingleBudgetManager = new rhit.FbSingleBudgetManager(rhit.fbAuthManager.uid);

		new rhit.FbBudgetController();
	}

	if (document.querySelector("#expenseEditPage")) {
		// console.log("you are on the expenseEdit page");

		const queryString = window.location.search;
		// console.log(queryString);
		const urlParams = new URLSearchParams(queryString);
		const expenseId = urlParams.get("id");

		// console.log(`Detail page for ${expenseId}`);

		if (!expenseId) {
			// console.log("ERROR!!! MISSING MOVIE QUOTE ID");
		}
		rhit.fbExpenseChangeManager = new rhit.FbExpenseChangeManager(expenseId);
		new rhit.ExpenseChangePageController();
	}

	if (document.querySelector("#budgetEditPage")) {
		// console.log("on budget edit page");

		const queryString = window.location.search;
		// console.log(queryString);
		const urlParams = new URLSearchParams(queryString);
		const budgetId = urlParams.get("id");

		// console.log(`Detail page for ${budgetId}`);

		if (!budgetId) {
			// console.log("Missing budget id");
		}
		rhit.fbBudgetChangeManager = new rhit.FbBudgetChangeManager(budgetId);
		new rhit.BudgetChangeController();
	}

	if (document.querySelector("#moreInfo")) {
		const queryString = window.location.search;
		// console.log(queryString);
		const urlParams = new URLSearchParams(queryString);
		const budgetCategory = urlParams.get("id");

		// console.log("more info for " + budgetCategory);
		document.querySelector("#expenseTitle").innerHTML += " - " + budgetCategory;


		rhit.fbBudgetMoreInfoManager = new rhit.BudgetMoreInfoManager(this.fbAuthManager.uid, budgetCategory);

		new rhit.BudgetMoreInfoController();

	}


	if (document.querySelector("#mainPage")) {
		rhit.fbBudgetManager = new rhit.FbBudgetManager(rhit.fbAuthManager.uid);

		document.querySelector("#expenseCreation").onclick = (event) => {
			window.location.href = "expenseCreation.html";
		}
		document.querySelector("#budgetOverview").onclick = (event) => {
			window.location.href = "budgetOverview.html";
		}
		document.querySelector("#expenseHistory").onclick = (event) => {
			window.location.href = "expenseHistory.html";
		}


		new rhit.OverviewController();
		if (sessionStorage.getItem('showMainPopup') == 'true') {
			$('#myModal').modal('show');
			sessionStorage.setItem('showMainPopup', false)
		}
	}

	if (document.getElementById("date")) document.getElementById("date").innerHTML = m + "/" + d + "/" + y;

}

/* Main */
/** function and class syntax examples */
rhit.main = function () {

	if (document.querySelector("#logoutClick")) {
		document.querySelector("#logoutClick").onclick = (event) => {
			// console.log("sign out");
			rhit.fbAuthManager.signOut();
		}
	}

	rhit.fbAuthManager = new rhit.AuthManager();
	rhit.fbAuthManager.beginListening((event) => {

		rhit.checkForRedirects();

		rhit.initializePage();


	});

};

rhit.main();
