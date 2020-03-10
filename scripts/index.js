(function () {
    "use strict";

    document.addEventListener("deviceready", onDeviceReady, false);

    function onDeviceReady() {
        // NOTE: All your Cordova code should be in onDeviceReady()

        // Handle the Cordova pause and resume events
        document.addEventListener("pause", onPause, false );
        document.addEventListener("resume", onResume, false );
        
        console.log("Device ready!");

        // ========================= Variables (Objects)
        // Create Objects representing the Forms (using jQuery)
        const $elFmSignUp = $("#fmSignUp"),
            $elFmLogIn = $("#fmLogIn"),
            $elFmSaveComic = $("#fmSaveComic");
        // Create Objects for the all Pop Up messages
        const $elPopErrorSignUpMismatch = $("#popErrorSignUpMismatch"),
            $elPopErrorSignUpExists = $("#popErrorSignUpExists"),
            $elPopErrorSignUpWeak = $("#popErrorSignUpWeak"),
            $elPopSuccessSignUpWelcome = $("#popSuccessSignUpWelcome"),
            $elPopErrorLogInNotExists = $("#popErrorLogInNotExists"),
            $elPopErrorLogInWrongPassword = $("#popErrorLogInWrongPassword"),
            $elPopErrorLogInTooMany = $("#popErrorLogInTooMany"),
            $elPopSuccessComicSaved = $("#popSuccessComicSaved"),
            $elPopErrorComicExists = $("#popErrorComicExists"),
            $elPopSuccessCollectionDeleted = $("#popSuccessCollectionDeleted");
        // Anchor(s) to change some HTML Element dynamically
        var $elUserEmail = $(".userEmail");
        // Misc buttons
        const $elBtnLogOut = $("#btnLogOut"),
            $elBtnDeleteCollection = $("#btnDeleteCollection"),
            $elBtnContactUs = $("#btnContactUs"),
            $elBtnShare = $("#btnShare");
        // Variable to keep track of Who Is Logged In
        var uid = localStorage.getItem("whoIsLoggedIn");
        // Create a variable to manage the database(s)
        var mydb;
        // Object for the placeholder to show comics in pgViewComics
        var $elDivViewComics = $("#divViewComics");
        // Variables for the Edit/Delete Comic button
        const $elBtnDeleteComic   = $("#btnDeleteComic"),
            $elBtnEditComic     = $("#btnEditComic");
        // Global variable keeping track of which comic we're working with
        var comicWIP;
        // Variables for the Edit comic
        const $elFmEditComicInfo      = $("#fmEditComicInfo"),
            $elBtnEditComicCancel   = $("#btnEditComicCancel");
        // Variable for the barcode scanner
        const $elBtnBarcode = $("#btnBarcode");
        // Variable for camera feature
        const $elBtnPicture = $("#btnPicture");
        
        // Function to initialize a Database
        function fnInitDB() {
            console.log("fnInitDB() is running");

            // Variable to keep track of which user logged in for, their DB
            let currentDB = localStorage.getItem("whoIsLoggedIn");

            // Then use that variable to create/load a Database
            mydb = new PouchDB(currentDB);

            // Return this value to the rest of the app
            return mydb;
        } // END fnInitDB()

        // ========================= Check Who Is Logged In (Auto-log in)
        if (uid === "" || uid === null || uid === undefined) {
            console.log("No User is logged in, keep them at #pgWelcome");
        } else {
            console.log("A User IS logged in, move them to #pgHome");
            fnInitDB(); // User detected, so load/create their Db
            fnViewComicsPrep(); // And display their comics
            $elUserEmail.html(uid.toLowerCase()); // Show their email at bottom
            $(":mobile-pagecontainer").pagecontainer("change", "#pgHome", { "transition": "flip" });
        } // END If..Else check who is logged in

        // ========================= Functions
        // Function to deal with a user creating an account, from its <form>
        function fnSignUp(event) {
            event.preventDefault(); // Stop the refresh of a Form submittal
            console.log("fnSignUp() is running");
            // Variables for the Input Fields of the fmSignUp Form
            let $elInEmailSignUp = $("#inEmailSignUp"),
                $elInPasswordSignUp = $("#inPasswordSignUp"),
                $elInPasswordConfirmSignUp = $("#inPasswordSignUpConfirm");

            console.log("Their email is: " + $elInEmailSignUp.val());
            console.log("Their password is: " + $elInPasswordSignUp.val());
            console.log("Their confirmation is: " + $elInPasswordConfirmSignUp.val());

            let strongPasword = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{7,})");

            // Conditional Statement to test if the User's password is as strong as the pattern in our strongPassword Object
            if (strongPasword.test($elInPasswordSignUp.val())) {

                // Conditional Statement to check if Passwords match
                if ($elInPasswordSignUp.val() !== $elInPasswordConfirmSignUp.val()) {
                    console.log("Paswords DO NOT match");
                    $elInPasswordSignUp.val(""); // Clear the Input so they try again
                    $elInPasswordConfirmSignUp.val("");
                    $elPopErrorSignUpMismatch.popup(); // Prep the popup
                    $elPopErrorSignUpMismatch.popup("open", { "transition": "flip" }); // Show the popup
                } else {
                    console.log("Password DO match!");

                    // Read the email that the User typed, and store it in a simplified way
                    let $tmpValInEmailSignUp = $elInEmailSignUp.val().toUpperCase(),
                        $tmpValInPasswordSignUp = $elInPasswordSignUp.val();

                    // Then check if the email has been previously stored in localStorage
                    if (localStorage.getItem($tmpValInEmailSignUp) === null) {
                        // User does not exist, so store their info
                        console.log("New User detected");
                        localStorage.setItem($tmpValInEmailSignUp, $tmpValInPasswordSignUp);
                        $elPopSuccessSignUpWelcome.popup();
                        $elPopSuccessSignUpWelcome.popup("open", { "transition": "flip" });
                        $elFmSignUp[0].reset();
                    } else {
                        // User DOES exist, so give them a message
                        console.log("Returning User detected");
                        $elPopErrorSignUpExists.popup();
                        $elPopErrorSignUpExists.popup("open", { "transition": "slideup" });
                    } // End If..Else checking if email (User) already exists
                } // END If..Else Passwords match
            } else {
                console.log("Password IS NOT strong enough");
                $elPopErrorSignUpWeak.popup();
                $elPopErrorSignUpWeak.popup("open", { "transition": "flip" });
            } // END If...Else checking password strength
        } // END fnSignUp()

        // Function to deal with Logging In
        function fnLogIn(event) {
            event.preventDefault();
            console.log("fnLogIn() is running");

            var $elInEmailLogIn = $("#inEmailLogIn"),  // Stores a ref to the whole <input>
                $elInPasswordLogIn = $("#inPasswordLogIn"),
                $tmpValInEmailLogIn = $elInEmailLogIn.val().toUpperCase(), // Stores only the Value of the <input> as Uppercase
                $tmpValInPasswordLogIn = $elInPasswordLogIn.val();

            console.log("About to log in with email: " + $tmpValInEmailLogIn);
            console.log("With password of: " + $tmpValInPasswordLogIn);

            if (localStorage.getItem($tmpValInEmailLogIn) === null) {
                console.log("User does NOT exist!");
                $elPopErrorLogInNotExists.popup();
                $elPopErrorLogInNotExists.popup("open", { "transition": "flow" });
            } else {
                console.log("User DOES exist!");
                // Compare the Password in that <input> vs getting the data of a localStorage location
                if ($tmpValInPasswordLogIn === localStorage.getItem($tmpValInEmailLogIn)) {
                    console.log("Passwords DO match!");
                    $elUserEmail.html($elInEmailLogIn.val()); // Identify, on-screen, who is currently logged in
                    localStorage.setItem("whoIsLoggedIn", $tmpValInEmailLogIn);  // To-do: Keep track, internally, who is currenlty loged in
                    fnInitDB(); // And create their database
                    fnViewComicsPrep(); // And show their comics
                    $(":mobile-pagecontainer").pagecontainer("change", "#pgHome", { "transition": "flip" }); // Move the User to #pgHome, via jQM
                } else {
                    console.log("Passwords DO NOT match!!");
                    $elPopErrorLogInWrongPassword.popup();
                    $elPopErrorLogInWrongPassword.popup("open", { "transition": "fade" });
                } // END If..Else checking if Passwords match
            } // END If..Else checking if User exists
        } // END fnLogIn()

        // Function to deal with logging out of our app
        function fnLogOut() {
            console.log("fnLogOut() is running");
            // Conditional Statement to confirm a Log Out
            switch (window.confirm("Are you sure you want to log out?")) {
                case true:
                    console.log("User wants to log out");
                    // Clear any forms that may not be clear
                    $elFmLogIn[0].reset();
                    $elFmSignUp[0].reset();
                    localStorage.setItem("whoIsLoggedIn", ""); // To-do: Update the "who is logged in mechanism"
                    $(":mobile-pagecontainer").pagecontainer("change", "#pgWelcome", { "transition": "fade" });
                    navigator.notification.beep(1);
                    break;
                case false:
                    console.log("User DOES NOT want to log out");
                    break;
                case "Maybe":
                    console.log("User is undecided");
                    break;
                default:
                    console.log("Unknown choice! Contact trashcan@example.com");
                    break;
            } // END switch() for confirming Log Out
        } // END fnLogOut()

        // Function to get the first word of the Comic
        function fnGetFirstWord(comicName) {
            console.log("fnGetFirstWord() is running");
            console.log("Comic to process is: " + comicName);
            
            if (comicName.indexOf(" ") === -1) {
                // The comic is only one word
                console.log("Return the comic as-is");
                return comicName;
            } else {
                // The comic is multiple words
                console.log("A multi-word comic, only return the first word");
                // .substring(0, 3);  // .substring(START, END);
                return comicName.substring(0, comicName.indexOf(" "));
            } // END If...Else to detect if multiple words
        } // END fnGetFirstWord(comicName)

        // Function to gather comic data and prep it
        function fnPrepComic() {
            console.log("fnPrepComic() is running");

            // Get the data in the fmSaveComic Form
            let $valInTitle = $("#inTitle").val(),
                $valInNumber = $("#inNumber").val(),
                $valInYear = $("#inYear").val(),
                $valInPublisher = $("#inPublisher").val(),
                $valInNotes = $("#inNotes").val(),
                $valInBarcode = $("#inBarcode").val(),
                $valInPicture = $("#inPicture").val();

            // Create temporary versions of the Title of the comic (for an _id)
            let tmpID0 = $valInTitle + $valInYear + $valInNumber,   // Raw version of the ID
                tmpID1 = fnGetFirstWord($valInTitle.toUpperCase()), // Just the first word of the Title
                tmpID2 = $valInTitle.toUpperCase(),                 // Uppercased version of Title
                tmpID3 = "";                                        // Empty string for later

            console.log(tmpID1);

            // Conditional statement to deal with the reserved word
            switch (tmpID1) {
                case "THE":
                    console.log("Comic has 'THE' keyword");
                    // Strip the reserved word from the Title
                    // .replace("String to replace", "Replace with") default: replace 1st instance ONLY
                    tmpID3 = tmpID2.replace("THE ", "");
                    console.log("tmpID3: " + tmpID3);
                    break;
                case "A":
                    console.log("Comic has 'A' keyword");
                    tmpID3 = tmpID2.replace("A ", "");
                    console.log("tmpID3: " + tmpID3);
                    break;
                default:
                    console.log("Comic has no keyword");
                    tmpID3 = tmpID2;
                    console.log("tmpID3: " + tmpID3);
                    break;
            } // END switch() checking reserved word

            var tmpComic = {
                "_id": tmpID3.replace(/\W/g, "") + $valInYear + $valInNumber,  
                "title": $valInTitle,
                "number": $valInNumber,
                "year": $valInYear,
                "publisher": $valInPublisher,
                "notes": $valInNotes,
                "barcode": $valInBarcode,
                "picture": $valInPicture
            };

            console.log("tmpComic's _id is: " + tmpComic._id);

            return tmpComic;
        }  // END fnPrepComic()

        // Function to Save a comic book
        function fnSaveComic(event) {
            event.preventDefault();
            console.log("fnSaveComic() is running");

            var aComic = fnPrepComic();
            console.log(aComic.title); 
            
            mydb.put(aComic, function (failure, success) {
                if (failure) {
                    console.log("Some error: " + failure);
                    // Deal with failure messages:
                    switch (failure.status) {
                        case 409:
                            console.log("This _id already exists: " + aComic._id);
                            $elPopErrorComicExists.popup();
                            $elPopErrorComicExists.popup("open", { "transition": "flip" });
                            break;
                        // To-do: case xyz:
                        default:
                            console.log("Some error: " + failure.status);
                            $elPopErrorComicExists.popup();
                            $elPopErrorComicExists.popup("open", { "transition": "flip" });
                            break;
                    }
                } else {
                    console.log("No error: " + success.ok);
                    fnViewComicsPrep(); // After saving a comic, display it
                    $elFmSaveComic[0].reset();
                    $elPopSuccessComicSaved.popup();
                    $elPopSuccessComicSaved.popup("open", { "transition": "flip" });
                } // END If..Else for Failure/Success of .put()
            }); // END .put() a comic
        } // END fnSaveComic()

        // Function to delete the whole database 
        function fnDeleteCollection() {
            console.log("fnDeleteCollection() is running");
            navigator.vibrate(750); // Haptic feedback
            // First Confirm delection
            if (window.confirm("You are about to delete everyting. Are you sure?")) {
                console.log("They confirmed deletion");
                if (window.confirm("NO WAY BACK ARE YOU SURE??!")) {
                    console.log("They really, really confirmed");
                    mydb.destroy(function (failure, success) {
                        if (failure) {
                            console.log("Error deleting dB: " + failure);
                        } else {
                            console.log("Database was deleted: " + success.ok);
                            $elPopSuccessCollectionDeleted.popup();
                            $elPopSuccessCollectionDeleted.popup("open", { "transition": "flip" });
                            fnInitDB(); // Re-initialize their Db
                            fnViewComicsPrep(); // Refresh comic table
                        } // END If..Else for .destroy()
                    }); // END .destroy()
                } else {
                    console.log("They chickened out");
                } // END If..Else for one more confirmation
            } else {
                console.log("They don't actually want to delete");
            } // END If..Else confirmiation of deletion
        } // END fnDeleteCollection()

        // Function to view comics
        function fnViewComicsPrep() {
            console.log("fnViewComicsPrep() is running");

            mydb.allDocs({ "ascending": true, "include_docs": true }, function (failure, success) {
                if (failure) {
                    console.log("Error retriving comics: " + failure);
                } else {
                    console.log("Getting comics: " + success);
                    // Conditional statement to check if Db is empty or not
                    if (success.rows[0] === undefined) {
                        console.log("No comics to display...");
                        $elDivViewComics.html("No comics, yet. Go save some!");
                    } else {
                        console.log("Displaying comics:");
                        console.log(success.rows);
                        console.log("There are " + success.rows.length + " number of comics saved");
                        // Then pass this data to the function that DISPLAYS it on-screen
                        fnViewComicsTable(success.rows);
                    } // END If..Else Db is empty or not
                } // END If..Else .allDocs()
            }); // END .allDocs()
        } // END fnViewComicsPrep()

        // Function to show the comics in a simple table
        function fnViewComicsTable(data) {
            console.log("fnViewComicsTable() is running");
            // Variable with the Tabular data
            let str = "<table> <tr> <th>Name</th> <th>#</th> <th>&nbsp;</th> </tr>";
                // Conditional statement to loop X number of times, based on how many comics
                for (var i = 0; i < data.length; i++) {
                    str += "<tr data-id='" + data[i].doc._id + "'> <td>" + data[i].doc.title + "</td> <td>" +
                        data[i].doc.number + "</td > <td class='btnShowComicsInfo'>&#x1F4AC;</td> </tr > ";
            } // END For Loop as we loop through our data
                str += "</table>";
            $elDivViewComics.html(str);
        } // END fnViewComicsTable()

        // Function to view the More comics info
        function fnViewComicsInfo(thisComic) {
            console.log("fnViewComicsInfo() is running");

            console.log("The current comic is: " + thisComic.data("id"));

            // Variable storing the data-id (aka _id) of the currently-clicked comic
            let tmpComic = thisComic.data("id");

            // Then pass that info back to the rest of the app
            comicWIP = tmpComic;

            // Get one item from the Db
            mydb.get(tmpComic, function (failure, success) {
                if (failure) {
                    console.log("Error getting the comic: " + failure);
                } else {
                    console.log("Success, we got the comic: " + success.title);
                    $("#divViewComicsInfo p:eq(0)").html("<strong>Title</strong>: " + success.title);
                    $("#divViewComicsInfo p:eq(1)").html("<strong>Number</strong>: " + success.number);
                    $("#divViewComicsInfo p:eq(2)").html("<strong>Year</strong>: " + success.year);
                    $("#divViewComicsInfo p:eq(3)").html("<strong>Publisher</strong>: " + success.publisher);
                    $("#divViewComicsInfo p:eq(4)").html("<strong>Notes</strong>: " + success.notes);
                    $("#divViewComicsInfo p:eq(5)").html("<strong>Barcode</strong>: " + success.barcode);
                    $("#divViewComicsInfo p:eq(6) img").attr("src", success.picture);
                    // To-do: display image
                } // END If..Else .get()
            }); // END .get() the comic

            $(":mobile-pagecontainer").pagecontainer("change", "#pgComicViewInfo", {"role":"dialog"});
        } // END fnViewComicsInfo()

        // Function to delete the current comic
        function fnDeleteComic() {
            console.log("fnDeleteComic() is running");
            console.log("Comic to delete is: " + comicWIP);

            mydb.get(comicWIP, function (failure, success) {
                if (failure) {
                    console.log("Error, comic doesn't exist: " + failure);
                } else {
                    console.log("Success, comic does exist: " + success);
                    // User confirmation to delete this comic:
                    if (window.confirm("Are you sure you want to DELETE this comic?")) {
                        console.log("They DO WANT to delete");
                        mydb.remove(success, function (failure, success) {
                            if (failure) {
                                console.log("Error in deleting the comic: " + failure);
                            } else {
                                console.log("Success in deleting the comic: " + success.ok);
                                fnViewComicsPrep();
                                $("#pgComicViewInfo").dialog("close");
                            } // END If..Else .remove()
                        }); // END .remove()
                    } else {
                        console.log("They DON'T want to delete");
                    } // END If..Else confirming delete
                } // END If..Else .get()
            }); // END .get()
        } // END fnDeleteComic()

        // Function to Edit a comic
        function fnEditComic() {
            console.log("fnEditComic() is running");
            console.log("Comic about to edit: " + comicWIP);

            // Populate Form fields to edit
            mydb.get(comicWIP, function (failure, success) {
                if (failure) {
                    console.log("Error getting comic: " + failure);
                } else {
                    console.log("Successfully got comic: " + success);
                    // .val() JS method can read OR write values into an <input>/<textarea>
                    $("#inTitleEdit").val(success.title);
                    $("#inNumberEdit").val(success.number);
                    $("#inYearEdit").val(success.year);
                    $("#inPublisherEdit").val(success.publisher);
                    $("#inNotesEdit").val(success.notes);
                    // To-do: update barcode
                } // END If..else .get()
            }); // END .get()

            // Then make popup appear
            $(":mobile-pagecontainer").pagecontainer("change", "#pgComicViewEdit", {"role":"dialog"});
        } // END fnEditComic()

        // Function to close the popup, they dont' want to edit
        function fnEditComicCancel() {
            console.log("fnEditComicCancel() is running");
            // To-do vibrate
            // To-do sound
            $("#pgComicViewEdit").dialog("close"); // Close the popup
        } // END fnEditComicCancel()

        // Function to edit the DB entry and update on-screen
        function fnEditComicUpdate(event) {
            console.log("fnEditComicUpdate(event) is running");
            event.preventDefault();
            
            let $valInTitleEdit = $("#inTitleEdit").val(),
                $valInNumberEdit = $("#inNumberEdit").val(),
                $valInYearEdit = $("#inYearEdit").val(),
                $valInPublisherEdit = $("#inPublisherEdit").val(),
                $valInNotesEdit = $("#inNotesEdit").val();

            console.log("About to update: ", $valInTitleEdit, $valInNumberEdit, $valInYearEdit,
                $valInPublisherEdit, $valInNotesEdit);

            mydb.get(comicWIP, function (failure, success) {
                if (failure) {
                    console.log("Error retrieving comic: " + failure);
                } else {
                    console.log("Comic does exist: " + success._id);
                    mydb.put({
                        "_id": success._id,
                        "title": $valInTitleEdit,
                        "number": $valInNumberEdit,
                        "year": $valInYearEdit,
                        "publisher": $valInPublisherEdit,
                        "notes": $valInNotesEdit,
                        "_rev": success._rev
                    }, function (failure, success) {
                        if (failure) {
                            console.log("Couldn't update comic: " + failure);
                        } else {
                            console.log("SUCCESS in updating comic: " + success.ok);
                            $("#divViewComicsInfo p:eq(0)").html("<strong>Title</strong>: " + $valInTitleEdit);
                            $("#divViewComicsInfo p:eq(1)").html("Number: "                 + $valInNumberEdit);
                            $("#divViewComicsInfo p:eq(2)").html("Year: "                   + $valInYearEdit);
                            $("#divViewComicsInfo p:eq(3)").html("Publisher: "              + $valInPublisherEdit);
                            $("#divViewComicsInfo p:eq(4)").html("Notes: "                  + $valInNotesEdit);
                            fnViewComicsPrep();
                            $("#pgComicViewEdit").dialog("close"); // Close the popup
                        } // END If..Else .put() latest data
                    }); // END .put() latest data
                } // END If..Else .get() to check comic exists
            }); // END .get() to check comic exists
        } // END fnEditComicUpdate(event)

        // Function to scan a barcode via // https://github.com/phonegap/phonegap-plugin-barcodescanner
        function fnBarcode() {
            console.log("fnBarcode() is running");
            
            cordova.plugins.barcodeScanner.scan(
                function (success) {
                    console.log("Type of barcode: " + success.format);
                    console.log("Data in the barcode: " + success.text);
                    $("#inBarcode").val(success.text);
                }, 
                function (failure) {
                    window.alert("Error! " + failure);
                }, 
                {
                    "prompt": "Place barcode in scan area",
                    "resultDisplayDuration": 2000,
                    "orientation": "landscape",
                    "disableSuccessBeep": false
                } 
            ); // END .scan()
        } // END fnBarcode()

        // Funtion to take a photo of the comic via Cordova Camera plugin
        function fnPicture() {
            console.log("fnPicture() is running");

            navigator.camera.getPicture(
                function (success) {
                    $("#inPicture").val(success);
                },
                function (failure) {
                    window.alert("Photo failed: " + failure);
                },
                {
                    "quality": 55,
                    "saveToPhotoAlbum": true,
                    "targetWidth": 768,
                    "targetHeight": 1024
                } 
            ); // END .getPicture
        } // END fnPicture()

        // Function to share to social media. Depends on apps on THEIR device
		// Plugin: https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin
		// Might need version 5.4.0
        function fnShare() {
            console.log("fnShare() is running");

            // If you omit any "field", add null 
            window.plugins.socialsharing.share(
                "Check out the CBDb app!", // Message (string)
                "Download CBDb today", // Subject (string) [Optional, based on app]
                ["www/images/IMG_20170203_084111252_HDR.jpg"], // Attachments (Array of Strings)
                "http://victorapps.com", // URL (String)
                function (success) { console.log("Share succes: " + success); }, // Success
                function (failure) { console.log("Share failure: " + failure); } // Failure (no final comma)
            ); // END .share()
        } // END fnShare()

        // ========================= Event Listeners
        // Create Listeners to pay attention to interaction
        $elFmSignUp.submit(function (event) { fnSignUp(event); }); // .addEventListener("submit");
        $elFmLogIn.submit(function (event) { fnLogIn(event); });
        $elBtnLogOut.on("click", fnLogOut); // jQ version of .addEventListener("click");
        
		$elFmSaveComic.submit(function (event) { fnSaveComic(event); });
        
		$elBtnDeleteCollection.on("click", fnDeleteCollection);
		
        $elDivViewComics.on("click", ".btnShowComicsInfo", function () { fnViewComicsInfo($(this).parent()); });
        $elBtnDeleteComic.on("click", fnDeleteComic);
        $elBtnEditComic.on("click", fnEditComic);
        $elBtnEditComicCancel.on("click", fnEditComicCancel);
        $elFmEditComicInfo.submit(function (event) { fnEditComicUpdate(event); });
        
		$elBtnBarcode.on("click", fnBarcode);
        $elBtnPicture.on("click", fnPicture);
        $elBtnShare.on("click", fnShare);
    } // END onDeviceReady()

    function onPause() {
        // TODO: This application has been suspended. Save application state here.
        console.log("App was paused");
    } // END onPause()

    function onResume() {
        // TODO: This application has been reactivated. Restore application state here.
        console.log("App was resumed");
    } // END onResume()
	
	/*
		Name:	 Victor Campos <vcampos@sdccd.edu>
		Project: CBDb (The Comic Book Database App)
		Date: 	 2020-01-16
		Version: 1.0
		Desc:	 An app for multiple users to keep track of a comic book collection.
	*/
})();