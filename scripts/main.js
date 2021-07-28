/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * PUT_YOUR_NAME_HERE
 */

/** namespace. */
var rhit = rhit || {};

/** globals */
rhit.variableName = "";

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

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");

// only run js for sidemenu if it exists on the page
if(document.querySelector(".hideable")){
	let hide = document.querySelector(".hideable");
	hide.addEventListener("click", function() {
		document.querySelector("body").classList.toggle("active");
	})
}
if(document.querySelector("#loginPage")) {
	let forgotLogin = document.querySelector("#createAccountBtn").onclick  = (params) => {
		window.location.href = "accountCreation.html";
	};

}



};

rhit.main();
