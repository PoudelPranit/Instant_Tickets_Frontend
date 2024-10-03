//server base domain url 
const domainUrl = "http://localhost:4000/instanttickets";  // if local test, pls use this 

var debug = true;
var authenticated = false;


$(document).ready(function () {



	/**
		----------------------SIGNUP START----------------------
	**/
	// Handle form submission when the "Submit" button is clicked
	$('#confirmRegiButton').on('click', function (event) {
		event.preventDefault();  // Prevent default behavior of the anchor tag

		// Capture form data
		var formData = {
			firstName: $.trim($('input[name="firstName"]').val()),
			lastName: $.trim($('input[name="lastName"]').val()),
			contact: $.trim($('input[name="contact"]').val()),
			email: $.trim($('input[name="email"]').val()),
			address: $.trim($('input[name="address"]').val()),
			password: $.trim($('input[name="password"]').val())
		};

		// Check if all required fields are filled
		if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.contact || !formData.address) {
			alert("Please fill in all required fields.");
			return;
		}
		if (formData.email === "admin@gmail.com" && formData.password === "admin") {
			alert("This email is already registered in the system, try different email");
			return;
		}

		// Make the AJAX POST request to create a new user
		$.ajax({
			url: domainUrl + "/createuser",  // Adjust this URL to match your server setup
			type: "POST",
			data: JSON.stringify(formData),  // Convert form data to JSON
			contentType: "application/json",  // Send data as JSON
			success: function (response) {
				if (response.message === "success") {
					alert(response.message);
					$.mobile.changePage("#loginPage");  // Redirect to homepage after successful signup
				}
				// else {
				//     alert(response.message);  // Show failure message from the server
				// }
			},
			error: function (xhr, status, error) {
				alert(xhr.responseJSON.message);
				alert("Failed to create user: " + error);  // Handle errors from the server
			}
		});
	});

	/**
		----------------------Signup end----------------------
	**/



	/**
		----------------------Login start----------------------
	**/

	$('#loginButton').click(function () {
		localStorage.removeItem("inputData");

		$("#loginForm").submit();

		if (localStorage.inputData != null) {

			var login_value = JSON.parse(localStorage.getItem("inputData"));
			$.ajax({
				url: domainUrl + "/loginuser",
				type: "POST",
				data: JSON.stringify(login_value),  // Send the data as a JSON string
				contentType: "application/json",    // Specify the content type as JSON
				success: function (data, status) {
					if (data) {
						alert("Login success");
						authenticated = true;
						localStorage.setItem("userInfo", JSON.stringify({}));
						localStorage.setItem("userInfo", JSON.stringify(data));
						//localStorage.setItem("userInfo", JSON.stringify(data[0]));

						if (data.email === "admin@gmail.com" && data.password === "admin") {
							$.mobile.changePage("#manageEventPage");
						}
						else {
							$.mobile.changePage("#homePage");
						}

					} else {
						alert("Login failed");
					}
					$("#loginForm").trigger('reset');
				},
				error: function (xhr, status, error) {
					console.error("Error: " + error);
					alert("An error occurred: " + xhr.responseText);
				}
			});

		}

	})


	$("#loginForm").validate({ // JQuery validation plugin
		focusInvalid: false,
		onkeyup: false,
		submitHandler: function (form) {
			authenticated = false;

			var formData = $(form).serializeArray();
			var inputData = {
				email: $(form).find('input[name="email"]').val(),
				password: $(form).find('input[name="password"]').val()
			};
			// Store the inputData object in localStorage as a string
			localStorage.setItem("inputData", JSON.stringify({}));
			localStorage.setItem("inputData", JSON.stringify(inputData));
			// Now print the parsed data in an alert
			alert(JSON.stringify(inputData, null, 2));


		},
		/* Validation rules */
		rules: {
			email: {
				required: true,
				email: true
			},
			password: {
				required: true,
				rangelength: [3, 10]
			}
		},
		/* Validation message */
		messages: {
			email: {
				required: "please enter your email",
				email: "The email format is incorrect  "
			},
			password: {
				required: "It cannot be empty",
				rangelength: $.validator.format("Minimum Password Length:{0}, Maximum Password Length:{1}。")

			}
		},
	});

	/**
	--------------------------login end--------------------------
	**/







	/**
	--------------------------home page start--------------------------
	**/
	$(document).on("pagebeforeshow", "#homePage", function () {
		// Fetch all events from the backend
		$.get(domainUrl + "/viewallevent", function (data, status) {
			if (status === "success") {
				console.log(data); // Log the full response to ensure it's received correctly
				populateEventList(data.allEvent);  // Access the nested allEvent array and pass it to the function
			} else {
				alert("Error retrieving events. Please try again.");
			}
		}).fail(function (xhr, status, error) {
			console.log("Failed with status: " + status + ", error: " + error);
			alert("An error occurred while retrieving events: " + error);
		});
	});

	// Function to dynamically populate the event list with event details
	function populateEventList(events) {
		var $eventListHome = $('#eventListHome'); // Target the event list UL
		$eventListHome.empty(); // Clear any existing list items

		if (events.length === 0) {
			$eventListHome.append('<li>No events found.</li>');
		} else {
			events.forEach(function (event) {
				var listItem = `
					<li style="background-color: white; border: 1px solid #ddd; padding: 10px; margin-bottom: 10px;">
						<h3>Performer: ${event.performer}</h3>
						<p>Venue: ${event.venue}</p>
						<p>Date: ${event.date}</p>
						<p>Time: ${event.time}</p>
						<p>Tickets Available: ${event.ticketCount}</p>
						<p>Price: $${event.price}</p>
						<a href="#" class="ui-btn ui-shadow ui-corner-all ui-btn-inline book-now-btn" data-event-id="${event._id}" data-ticket-price="${event.price}" data-ticket-count="${event.ticketCount}">
							Book Now
						</a>
					</li>
					<div style="margin-top: 15px; margin-bottom: 15px; background-color: black;">
					</div>

				`;
				$eventListHome.append(listItem); // Append each event to the list
			});
		}

		// Refresh the list view (needed for jQuery Mobile styling)
		$eventListHome.listview('refresh');

		// Add event listeners to the "Book Now" buttons
		$('.book-now-btn').on('click', function () {
			var eventId = $(this).data('event-id');
			var ticketPrice = $(this).data('ticket-price');
			var availableTicketCount = $(this).data('ticket-count');

			// Fetch user info from localStorage
			var userInfo = JSON.parse(localStorage.getItem("userInfo"));
			if (!userInfo) {
				alert("Please log in to book tickets.");
				return;
			}
			var userId = userInfo._id; // Get userId from localStorage (assuming _id is the user's ID)

			// Set the form's hidden fields and ticket price
			$('#eventId').val(eventId);
			$('#userId').val(userId);
			$('#ticketPrice').val(ticketPrice);
			$('#availableTickets').val(availableTicketCount); // Set available tickets as non-editable
			$('#ticketOrder').val(1);  // Default to 1 ticket
			$('#totalAmount').val(ticketPrice);  // Initially set the total price to the price of 1 ticket

			// Navigate to the booking page
			$.mobile.changePage("#bookTicketPage");
		});

		// Calculate total amount based on the number of tickets ordered
		$('#ticketOrder').on('input', function () {
			var ticketOrder = $(this).val();  // Get the number of tickets the user wants to book
			var ticketPrice = $('#ticketPrice').val();  // Get the price per ticket
			var totalAmount = ticketOrder * ticketPrice;  // Calculate total amount
			$('#totalAmount').val(totalAmount);  // Update total amount in the form
		});

		// Handle form submission
		$('#bookTicketForm').off('submit').submit(function (event) {
			event.preventDefault();  // Prevent default form submission
			// Get form data
			var formData = {
				eventId: $('#eventId').val(),
				userId: $('#userId').val(),
				ticketCount: $('#ticketOrder').val(),  // Get ticket order count from the input
				ticketPrice: $('#ticketPrice').val(),
				totalAmount: $('#totalAmount').val()
			};

			var checkpoint = $('#availableTickets').val();
			if (parseInt(formData.ticketCount) > parseInt(checkpoint)) {
				alert("You trying to book" + formData.ticketCount);
				alert("available" + checkpoint);
				return;
			}
			// Make the booking request to the backend
			$.ajax({
				url: domainUrl + "/createticket",
				type: "POST",
				data: JSON.stringify(formData),
				contentType: "application/json",
				success: function (response) {
					// Check if the response contains the success indication
					if (response) {
						alert("Booking successful!");
						// Clear the form fields after successful entry
						$('#bookTicketForm')[0].reset();
						$('#totalAmountLabel').text('');  // Clear the total amount label
						$.mobile.changePage("#homePage");  // Navigate back to home page after booking
					} else {
						alert("Booking failed: Unexpected response.");
					}
				},
				error: function (xhr, status, error) {
					// Handle failure
					alert("Booking failed: " + error);
				}
			});
		});
	}


	/**
	--------------------------homepage  end--------------------------
	**/





	/**
		--------------------------VIEW BOOKING HISTORY  START--------------------------
		**/

	$(document).on("pagebeforeshow", "#bookingHistoryPage", function () {
		// Fetch the user info from localStorage
		var userInfo = JSON.parse(localStorage.getItem("userInfo"));

		// Check if the user is logged in
		if (!userInfo) {
			alert("Please log in to view booking history.");
			return;
		}

		var userId = userInfo._id; // Get the logged-in user's ID
		var $historyList = $('#historyList'); // Target the booking history list

		// Clear existing booking history
		$historyList.empty();

		// Make a request to the server to get booking history for the user
		$.ajax({
			url: domainUrl + "/viewticket/" + userId, // Endpoint to fetch booking history
			type: "GET",
			contentType: "application/json",
			success: function (response) {
				// Check if the user has any bookings

				if (response && response.ticketHistory && response.ticketHistory.length > 0) {
					response.ticketHistory.forEach(function (booking) {
						var listItem = `
							<li style="margin-bottom: 20px; background-color: white; padding: 10px; border-radius: 5px;">
								<h3>Event ID : ${booking.eventId}</h3>
								<p>Ticket ID : ${booking._id}</p>
								<p>Booked Tickets : ${booking.ticketCount}</p>
								<p>Price per Ticket : ${booking.ticketPrice}</p>
								<p>Total Amount Paid : $${booking.totalAmount}</p>
								
								<!-- Edit booking button -->
								<a href="#" class="ui-btn ui-shadow ui-corner-all ui-btn-inline edit-booking-btn" 
								  data-ticket-id="${booking._id}" data-event-id="${booking.eventId}" data-ticket-count="${booking.ticketCount}" data-ticket-price="${booking.ticketPrice}"  data-ticket-amount="${booking.totalAmount}">Edit Booking</a>
								
								<!-- Cancel booking button -->
								<a href="#" class="ui-btn ui-shadow ui-corner-all ui-btn-inline cancel-booking-btn" 
								   data-ticket-id="${booking._id}" data-event-id="${booking.eventId}" data-ticket-count="${booking.ticketCount}" data-ticket-price="${booking.totalAmount}"  data-ticket-amount="${booking.ticketAmount}">Cancel Booking</a>
							</li>
						`;
						$historyList.append(listItem); // Append each booking to the list
					});

					// Handle the Edit booking button click event
					$('.edit-booking-btn').on('click', function () {


						var ticketId = $(this).data('ticket-id');  // Get the ticketId from the button's data attribute
						var eventId = $(this).data('event-id');
						var ticketCount = $(this).data('ticket-count');
						var ticketPrice = $(this).data('ticket-price');
						var totalAmount = $(this).data('ticket-amount');

						alert("Edit booking for ticket ID: " + ticketId + "eventId " + eventId + ticketCount + ticketPrice + totalAmount);

						var ticketData = {
							ticketId: ticketId,
							eventId: eventId,
							ticketCount: ticketCount,
							ticketPrice: ticketPrice,
							totalAmount: totalAmount
						};

						// Save the updated array back to localStorage
						localStorage.setItem("ticketData", JSON.stringify({}));
						localStorage.setItem('ticketData', JSON.stringify(ticketData));
						$.mobile.changePage("#updateTicketPage");

						// Add your logic for editing the booking here
					});

					// Handle the Cancel booking button click event
					$('.cancel-booking-btn').on('click', function () {
						var ticketId = $(this).data('ticket-id');  // Get the ticketId from the button's data attribute
						var eventId = $(this).data('event-id');
						var ticketCount = $(this).data('ticket-count');
						var ticketPrice = $(this).data('ticket-price');
						var totalAmount = $(this).data('ticket-amount');
						if (confirm("Are you sure you want to cancel this booking?")) {
							// Add your logic for canceling the booking here
							alert("Edit booking for ticket ID: " + ticketId + "eventId " + eventId + ticketCount + ticketPrice + totalAmount);
							$.ajax({
								url: domainUrl + "/deleteticket/" + ticketId + "/" + eventId,
								type: "DELETE",
								contentType: "application/json",
								success: function (response) {
									// Check if the response contains the success indication
									if (response) {
										alert("Delete successful!");
										// Clear the form fields after successful entry
										//$.mobile.changePage("#bookingHistoryPage");  // Navigate
										$.mobile.changePage("#bookingHistoryPage", { allowSamePageTransition: true });

									} else {
										alert("Delete failed: Unexpected response.");
									}
								},
								error: function (xhr, status, error) {
									// Handle failure
									alert("Booking failed: " + error);
								}
							});
						}
					});
				} else {
					$historyList.append('<li>No booking history found.</li>');
				}


				// Refresh the list view (needed for jQuery Mobile styling)
				$historyList.listview('refresh');
			},
			error: function (xhr, status, error) {
				console.error("Failed to fetch booking history:", error);
				alert("Failed to load booking history. Please try again.");
			}
		});
	});



	/**
		--------------------------VIEW BOOKING HISTORY  END--------------------------
		**/










	/**
	--------------------------UPDATE Booking START-------------------------
	**/

	$(document).on("pagebeforeshow", "#updateTicketPage", function () {
		// Retrieve ticketData from localStorage
		var ticketData = JSON.parse(localStorage.getItem('ticketData'));
		console.log(ticketData);  // Debug to check the data

		if (!ticketData) {
			alert("Ticket data not found! error with server");
			$.mobile.changePage("#homePage");
			return;
		}

		// Populate the form fields with the ticket data
		$('#ticketIda').val(ticketData.ticketId);
		$('#eventIda').val(ticketData.eventId);
		$('#ticketCounta').val(ticketData.ticketCount);
		$('#ticketPricea').val(ticketData.ticketPrice);
		$('#totalAmounta').val(ticketData.totalAmount);


		// Automatically calculate total amount when ticket count changes
		$('#ticketCounta').on('input', function () {
			var ticketCount = parseInt($(this).val()) || 0;  // Get ticket count or default to 0
			var ticketPrice = parseInt($('#ticketPricea').val()) || 0;  // Get ticket price or default to 0
			var totalAmount = ticketCount * ticketPrice;  // Calculate total amount

			$('#totalAmounta').val(totalAmount);  // Update total amount field
		});
	});

	// Handle form submission to update the ticket
	$('#updateBookingForm').on('submit', function (event) {
		event.preventDefault();  // Prevent default form submission

		// Get updated form data
		var updatedTicketData = {
			ticketId: $('#ticketIda').val(),
			eventId: $('#eventIda').val(),
			ticketCount: $('#ticketCounta').val(),
			ticketPrice: $('#ticketPricea').val(),
			totalAmount: $('#totalAmounta').val()
		};
		var updatedTicketCount = parseInt($('#ticketCounta').val(), 10);  // Convert the value to a number

		// Create the data object in the required format
		var dataToSend = {
			updatedTicketCount: updatedTicketCount  // Create the key-value pair with numeric value
		};

		var userInfo = JSON.parse(localStorage.getItem("userInfo"));
		var userId = userInfo._id;
		// Make an AJAX POST request to update the ticket
		$.ajax({
			url: domainUrl + "/updateticket/" + updatedTicketData.eventId + "/" + updatedTicketData.ticketId + "/" + userId,  // URL to update the ticket
			type: "PUT",
			data: JSON.stringify(dataToSend),
			contentType: "application/json",
			success: function (response) {
				if (response.message === "success") {
					alert(response.message);  // Display success message
					$.mobile.changePage("#homePage");  // Redirect to home page after successful update
				}
				else if (response.message !== "success") {
					alert(response.message);
				}

				// alert("Ticket updated successfully!");
				// $.mobile.changePage("#homePage");  // Redirect to home page after successful update
			},
			error: function (xhr, status, error) {
				//alert("Server error");
				alert(xhr.responseJSON.message);
			}


		});
	});

	/**
			--------------------------UPDATE Booking END-------------------------
			**/
















	/**
		--------------------------UPDATE PROFILE START-------------------------
		**/


	$(document).on("pagebeforeshow", "#updateProfilePage", function () {
		// Fetch the user info from localStorage and populate the form fields
		var userInfo = JSON.parse(localStorage.getItem("userInfo"));


		if (userInfo) {
			$('#firstName').val(userInfo.firstName);
			$('#lastName').val(userInfo.lastName);
			$('#contact').val(userInfo.contact);
			$('#email').val(userInfo.email);
			$('#address').val(userInfo.address);
			$('#password').val(userInfo.password);
		} else {
			alert("You need to be logged in to update your profile.");
			$.mobile.changePage("#loginPage");
		}

	});

	// Handle the update profile form submission
	$('#updateProfileButton').on('click', function (event) {

		event.preventDefault();

		var userInfo = JSON.parse(localStorage.getItem("userInfo"));
		var userId = userInfo._id;
		var updatedProfile = {
			_id: userId,
			firstName: $('#firstName').val(),
			lastName: $('#lastName').val(),
			contact: $('#contact').val(),
			email: $('#email').val(),
			address: $('#address').val(),
			password: $('#password').val()
		};

		// Send the updated profile to the server
		$.ajax({
			url: domainUrl + "/updateuser/" + userId,  // Endpoint to update profile
			type: "PUT",
			contentType: "application/json",
			data: JSON.stringify(updatedProfile),
			success: function (response) {
				var updatedUser = response.updatedUser;
				alert(updatedUser, "userdta");
				// Store the updated user info in localStorage			
				localStorage.setItem("userInfo", JSON.stringify({}));
				localStorage.setItem("userInfo", JSON.stringify(updatedProfile));
				alert("Profile updated successfully!");
				$.mobile.changePage("#homePage");  // Navigate back to home page after update
			},
			error: function (xhr, status, error) {
				alert("Failed to update profile. Please try again.");
				console.error("Error updating profile: ", error);
			}
		});
	});

	/**
	--------------------------UPDATE PROFILE END-------------------------
	**/





	/**
	--------------------------create event start-------------------------
	**/

	// Handle form submission for creating an event
	$('#createEventForm').on('submit', function (event) {
		event.preventDefault();  // Prevent default form submission

		// Capture form data
		var formData = {
			performer: $('#performer').val(),
			venue: $('#venue').val(),
			date: $('#date').val(),
			time: $('#time').val(),
			ticketCount: $('#ticketCount').val(),
			price: $('#price').val()
		};

		// Check if all required fields are filled
		if (!formData.performer || !formData.venue || !formData.date || !formData.time || !formData.ticketCount || !formData.price) {
			alert("Please fill in all required fields.");
			return;
		}

		// Make the AJAX POST request to create a new event
		$.ajax({
			url: domainUrl + "/createevent",  // Adjust this URL to match your server setup
			type: "POST",
			data: JSON.stringify(formData),  // Convert form data to JSON
			contentType: "application/json",  // Send data as JSON
			success: function (response) {
				if (response.message === "success") {
					alert("Event created successfully!");
					$.mobile.changePage("#manageEventPage");  // Redirect to homepage after successful event creation
				} else {
					alert("Failed to create event: " + response.message);  // Show failure message from the server
				}
			},
			error: function (xhr, status, error) {
				alert("Server error: " + error);  // Handle server errors
			}
		});
	});

	/**
	--------------------------CREATE EVENT END------------------------
	**/




	/**
	--------------------------MANAGE EVENT PAGE START------------------------
	**/

	$(document).on("pagebeforeshow", "#manageEventPage", function () {
		$.get(domainUrl + "/viewallevent", function (data, status) {
			if (status === "success") {
				console.log(data); // Log the full response to ensure it's received correctly
				populateEventListAdmin(data.allEvent);  // Access the nested allEvent array and pass it to the function
			} else {
				alert("Error retrieving events. Please try again.");
			}
		}).fail(function (xhr, status, error) {
			console.log("Failed with status: " + status + ", error: " + error);
			alert("An error occurred while retrieving events: " + error);
		});
	});
	
	function populateEventListAdmin(events) {
		var $eventListAdmin = $('#eventListAdmin'); // Target the event list UL
		$eventListAdmin.empty(); // Clear any existing list items
	
		if (events.length === 0) {
			//alert("here no event");
			$eventListAdmin.append('<li >No events found.</li>');
		} else {
			//alert("here  event");
			events.forEach(function (event) {
				var listItem = `
					<li style="background-color: white; border: 1px solid #ddd; padding: 10px; margin-bottom: 10px;">
						<h3>Performer: ${event.performer}</h3>
						<p>Venue: ${event.venue}</p>
						<p>Date: ${event.date}</p>
						<p>Time: ${event.time}</p>
						<p>Tickets Available: ${event.ticketCount}</p>
						<p>Price: $${event.price}</p>
						<a href="#" class="ui-btn ui-shadow ui-corner-all ui-btn-inline delete-btn-admin" 
						   style="background-color: red; color: white;" 
						   data-event-id="${event._id}">
						   Delete
						</a>
					</li>
				`;
				$eventListAdmin.append(listItem); // Append each event to the list
			});
		}
	
		$('.delete-btn-admin').on('click', function () {
			var eventId = $(this).data('event-id');

			alert(eventId);
		});
		// Refresh the list view (needed for jQuery Mobile styling)
		//$eventList.listview('refresh');
	}
	

	/**
	--------------------------MANAGE EVENT PAGE END------------------------
	**/




});



