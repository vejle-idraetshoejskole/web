<?php

namespace Drupal\vies_application\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Url;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Drupal\vih_subscription\Form\SubscriptionsGeneralSettingsForm;
use Drupal\node\Entity\Node;

/**
 * Application controller.
 */
class ApplicationController extends ControllerBase {

  /**
   * Success page callback.
   */
  public function success() {
    $config = \Drupal::config(SubscriptionsGeneralSettingsForm::$configName);
    $redirection_page_id = $config->get('vih_subscription_aplication_success_page');
    if (!empty($redirection_page_id)) {
      $redirect_url = Url::fromRoute('entity.node.canonical', array('node' => $redirection_page_id));
      $response = new RedirectResponse($redirect_url->toString());
      return $response->send();
    }
  }

  /**
   * Error page callback.
   */
  public function error() {
    $build['page'] = [
      '#theme' => 'vies_application_submit_message',
      '#title' => 'Åh - en fejl opstod!',
      '#message' => 'Send venligst din ansøgning til os via mail',
    ];

    return $build;
  }
}
