$('#frmcookies button').click(function(e) {
    $.ajax({
        type: 'POST',
        url: this.form.action,
        data: {
            COOKIES: $(this).val(),
        },
        dataType: 'text',

        success: function(data) {
            var cookiebar = $('#cookiebar');
            var height = cookiebar.height();

            cookiebar.css({
                bottom: '-' + height + 'px'
            });

            setTimeout(function () {
                cookiebar.remove();
            }, 1000);
        }
    });

    e.preventDefault(); // avoid to execute the actual submit of the form.
});
