(function ($, Drupal, drupalSettings) {
  'use strict';

  Drupal.behaviors.haveNoCpr = {
    attach: function (context, settings) {
      $.fn.haveNoCpr = function (data) {

        $('#edit-nocpr').change(function () {
          if ($(this).filter(':checked').val() == 1) {
            $('.form-item.form-item-cpr').hide();
            $('.form-item.form-item-birthdate').show();
          } else {
            $('.form-item.form-item-cpr').show();
            $('.form-item.form-item-birthdate').hide();
          }
        });
        if ($('#edit-nocpr').filter(':checked').val() == 1) {
          $('.form-item.form-item-cpr').hide();
          $('.form-item.form-item-birthdate').show();
        } else {
          $('.form-item.form-item-cpr').show();
          $('.form-item.form-item-birthdate').hide();
        }
        $('.form-item.form-item-birthdate').removeClass('form-inline');

      };
      $.fn.haveNoCpr();
    }

  };
})(jQuery, Drupal, drupalSettings);
