$(document).ready(function () {
    // Get the current route
    var currentRoute = window.location.pathname;

    // Loop through each navigation link
    $('.app-menu .nav-link').each(function () {
        // Check if the link href matches the current route
        if ($(this).attr('href') === currentRoute) {
            // Add the 'active' class to the link
            $(this).addClass('active');
        } else {
            // Remove the 'active' class from other links
            $(this).removeClass('active');
        }
     });
    });