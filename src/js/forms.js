var $lastUsedForm = null;


// -----------------------------------------------
// Recaptcha handling
// -----------------------------------------------

window.onCompleted = function(responseToken) {
    // console.log('captcha completed.');
    $lastUsedForm.submit();
    // console.log('wait to check for "captcha completed" in the console.');
};

$('form[data-recaptcha]').submit(function(e) {
    // console.log('validation completed.');
    $lastUsedForm = $(this);

    if (!grecaptcha.getResponse()) {
        // console.log('captcha not yet completed.');
        e.preventDefault();
        grecaptcha.execute();
    } /*else {
        console.log('form really submitted.');
    }*/
});



// -----------------------------------------------
// Input fields error handling
// -----------------------------------------------

$('form input:required, form textarea:required, form select:required').on('invalid', function  (e) {
    $(this).addClass('invalid');
});

$('form input, form textarea, form select').on('input', function  (e) {
    if ($(this).is(':valid')) {
        $(this).removeClass('invalid');
    }
});



// -----------------------------------------------
// Pre fill form fields
// -----------------------------------------------

/* eslint-disable no-unused-vars */
function fillInContactForm () {
    $('#contact_remark').val('Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quam, recusandae.');
    $('#contact_company').val('Foobar the company');
    $('#contact_first_name').val('Foo');
    $('#contact_last_name').val('Bar');
    $('#contact_email').val('test@test.com');
    $('#contact_phone').val('050123456');
}

function fillInQuoteForm () {
    $('#quote_company').val('Foobar the company');
    $('#quote_first_name').val('Foo');
    $('#quote_last_name').val('Bar');
    $('#quote_email').val('test@test.com');
    $('#quote_phone').val('050123456');
    $('#quote_location').val('Loppem');
    $('#quote_remark').val('Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quam, recusandae.');
}
