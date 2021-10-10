<?php

/**
 * @file
 * Contains Drupal\vih_subscription\Form\CommonFormUtils.
 */

namespace Drupal\vih_subscription\Form;

use Drupal\Core\Url;
use Drupal\Core\Link;

class CommonFormUtils {

  /**
   * Return link to the terms and conditions page by nid
   *
   * @param int $nid
   * @param string $text
   * @return string
   */
  static function getTermsAndConditionsLink($nid, $text = 'terms and conditions') {

    $options = [
      'attributes' => [
        'target' => '_blank',
        'class' => ['use-ajax'],
        'data-dialog-class' => 'terms-and-conditions',
        'data-dialog-type' => 'modal',
      ]
    ];

    $terms_and_conditions_url = Url::fromRoute('vih_subscription.vih_node_modal', array('node' => $nid), $options);
    $terms_and_conditions_link = Link::fromTextAndUrl(t($text), $terms_and_conditions_url);
    $terms_and_conditions_link = $terms_and_conditions_link->toRenderable();
    $terms_and_conditions_link = render($terms_and_conditions_link);

    return $terms_and_conditions_link;
  }

  /**
   * Return link to the personal information page by nid
   *
   * @param int $nid
   * @param string $text
   * @return string
   */
  static function getPersonalInformationLink($nid, $text = 'treatment of personal information') {
    $options = [
      'attributes' => [
        'target' => '_blank',
        'class' => ['use-ajax'],
        'data-dialog-class' => 'terms-and-conditions-personal-information',
        'data-dialog-type' => 'modal',
      ]
    ];

    $personal_information_url = Url::fromRoute('vih_subscription.vih_node_modal', array('node' => $nid), $options);
    $personal_information_link = Link::fromTextAndUrl(t($text), $personal_information_url);
    $personal_information_link = $personal_information_link->toRenderable();
    $personal_information_link = render($personal_information_link);

    return $personal_information_link;
  }

  /**
   * Return link to the additional GDPR text
   *
   * @param string $text
   * @return string
   */
  static function getGdprReadMoreText($nid, $text = 'Read more') {
    $options = [
      'attributes' => [
        'target' => '_blank',
        'class' => ['use-ajax'],
        'data-dialog-class' => 'terms-and-conditions',
        'data-dialog-type' => 'modal',
      ]
    ];

    $gdpr_url = Url::fromRoute('vih_subscription.vih_node_modal', array('node' => $nid), $options);
    $gdpr_link = Link::fromTextAndUrl(t($text), $gdpr_url);
    $gdpr_link = $gdpr_link->toRenderable();
    $gdpr_link = render($gdpr_link);
    return $gdpr_link;
  }

}
