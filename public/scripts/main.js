var rhit = rhit || {};

/** globals */
rhit.variableName = "";
rhit.fbAuthManger = null;

/** function and class syntax examples */
rhit.functionName = function () {
	/** function body */
};

rhit.ClassName = class {
	constructor() {

	}

	methodName() {

	}
}

rhit.LoginPageController = class {
	constructor() {
		document.querySelector("#loginBtn").onclick = (event) => {
			rhit.fbAuthManger.signIn();
		};
	}
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
		Rosefire.signIn("0add59d9-0ffe-47b7-b3c3-4c40a8eaec62", (err, rfUser) => {
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

rhit.checkForRedirects = function(){
	if(document.querySelector("#loginPage") && rhit.fbAuthManger.isSignedIn){
		window.location.href = "/main.html";
	}

	if(!document.querySelector("#loginPage") && !rhit.fbAuthManger.isSignedIn){
		window.location.href = "/";
	}

}

rhit.initializePage = function(){
	const urlParams = new URLSearchParams(window.location.search);
	if(document.querySelector("#mainPage")){
		console.log("You are on the main page");
		//rhit.fbMovieQuoteManager = new rhit.FbMovieQuotesManager();
		const uid = urlParams.get("uid");
		//rhit.fbMovieQuoteManager = new rhit.FbMovieQuotesManager(uid);
		new rhit.MainPageController();
	}

	if(document.querySelector("#")){}
}

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");

	rhit.fbAuthManger = new rhit.AuthManager();
	rhit.fbAuthManger.beginListening((event) => {
		console.log("We are listening now. Using AuthManager.");
		console.log("isSigned: ", rhit.fbAuthManger.isSignedIn);

		rhit.checkForRedirects();

		rhit.initializePage();
	});

	if(document.querySelector("#loginPage")){
		new rhit.LoginPageController();
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



};

rhit.main();
