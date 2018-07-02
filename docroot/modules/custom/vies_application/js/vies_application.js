(function ($, Drupal, drupalSettings) {
  'use strict';

  Drupal.behaviors.questionInlineEntityForm = {
    attach: function (context, drupalSettings) {
      $('.questions-inline-form-type').once().change(function() {
        var _this = $(this);
        var $answer_container = _this.parents('.questions-inline-form').find('.field--name-field-vies-answer');
        if (_this.val() == 'textfield'
          || _this.val() == 'textarea') {
          $answer_container.hide();
        }
        else {
          $answer_container.show();
        }
      }).change();
    }
  };
})(jQuery, Drupal, drupalSettings);
