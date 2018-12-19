<?php

namespace Drupal\vies_application\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Url;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Drupal\vih_subscription\Form\SubscriptionsGeneralSettingsForm;
use Drupal\vih_subscription\Misc\VihSubscriptionUtils;
use Drupal\vies_application\ApplicationHandler;
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
  
  /**
   * Resend email callback.
   */
  public function resend(Node $order) {

        // Send email.
    $node_view = node_view($order, 'email_teaser');
    $application_rendered = render($node_view)->__toString();
    $config = \Drupal::config(SubscriptionsGeneralSettingsForm::$configName);
    $mail_bcc = $config->get('vih_subscription_application_notifications_bcc_da');
    $mail_subject = $config->get('vih_subscription_application_notifications_subject_da');
    $mail_body = $config->get('vih_subscription_application_notifications_body_da');
    $token = ['@subject_name', '@class_name', '@person_name', '@url', '@application'];
    $message = [
      'to' => $order->field_vies_email->value,
      'subject' => $mail_subject,
      'body' => $mail_body,
      'Bcc' => $mail_bcc,
    ];
    $application_url = Url::fromRoute('vies_application.application_form')->setAbsolute()->toString();
    $replacement = [
      $order->get('field_vies_course')->referencedEntities()[0]->getTitle(),
      $order->get('field_vies_class')->referencedEntities()[0]->getName(),
      $order->field_vies_first_name->value . ' ' . $order->field_vies_last_name->value,
      '<a href="' . $application_url . '"target=_blank >' . $application_url . '</a>',
      $application_rendered,
    ];

    // Add logo to message body.
        $logo = '<div style="background-color:#ff6400; width:100%; text-align:center">'
      . '<img src="'
      . \Drupal::request()->getSchemeAndHttpHost()
      . '/themes/custom/site/dist/images/layout-header-logo-vies.png" alt="VIH" />'
      . '</div><br>';
    $message['body'] = $logo . $message['body'];
    if (!empty($message)) {
      VihSubscriptionUtils::makeReplacements($message, $token, $replacement);
      $result = VihSubscriptionUtils::sendMail($message);
    }

    if ($result == true) {
        drupal_set_message(t('Mail sent to %mail% successfully.', array('%mail%' => $order->field_vies_email->value)), 'status', TRUE);
      }
      else {
        drupal_set_message(t('Mail send error. Not sended to %mail%.', array('%mail%' => $order->field_vies_email->value)), 'error', TRUE);
      }
    
    return new RedirectResponse('/node/' . $order->id() );
  }
}
