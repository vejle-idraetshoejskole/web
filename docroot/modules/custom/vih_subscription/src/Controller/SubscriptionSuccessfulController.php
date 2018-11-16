<?php

namespace Drupal\vih_subscription\Controller;

use Drupal\Component\Utility\Crypt;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Datetime\DateFormatter;
use Drupal\Core\Routing\TrustedRedirectResponse;
use Drupal\Core\Site\Settings;
use Drupal\Core\Url;
use Drupal\node\NodeInterface;
use Drupal\paragraphs\Entity\Paragraph;
use Drupal\vih_subscription\Form\EdbbrugsenSettingsForm;
use Drupal\vih_subscription\Form\SubscriptionsGeneralSettingsForm;
use Drupal\vih_subscription\Misc\EDBBrugsenIntegration;
use Drupal\vih_subscription\Misc\VihSubscriptionUtils;
use Symfony\Component\HttpFoundation\RedirectResponse;

/**
 * An example controller.
 */
class SubscriptionSuccessfulController extends ControllerBase {

  /**
   * {@inheritdoc}
   */
  public function content(NodeInterface $subject, NodeInterface $order, $checksum) {
    if (Crypt::hashEquals($checksum, VihSubscriptionUtils::generateChecksum($subject, $order))) {
      $this->registerOrder($subject, $order);

      $order_type = $order->type->entity->get('type');
      $config = $this->config(SubscriptionsGeneralSettingsForm::$configName);
      $redirection_page_id = NULL;
      switch ($order_type) {
        case "vih_short_course_order":
          $redirection_page_id = $config->get('vih_subscription_short_course_redirection_page');
          break;
        case "vih_long_course_order":
          $redirection_page_id = $config->get('vih_subscription_long_course_redirection_page');
          break;
        case "vih_event_order":
          $redirection_page_id = $config->get('vih_subscription_event_redirection_page');
          break;
      }
      if (!empty($redirection_page_id)) {
        $redirect_url = Url::fromRoute('entity.node.canonical', array('node' => $redirection_page_id));
        $response = new RedirectResponse($redirect_url->toString());
        return $response->send();
      }
      else {
        //the actual content comes from template file: templates/vih_subscription_thank_you_page.html.twig
        $build = array(
          '#theme' => 'vih_subscription_thank_you_page'
        );
        return $build;
      }
    }
    else {
      return $this->redirect('vih_subscription.subscription_error_redirect');
    }
  }

  /**
   * {@inheritdoc}
   */
  public function _sendConfirmationEmail(NodeInterface $subject, NodeInterface $order) {
    $currentLangId = \Drupal::languageManager()->getCurrentLanguage()->getId();
    $notificationsConfig = \Drupal::configFactory()->getEditable(SubscriptionsGeneralSettingsForm::$configName);
    $message = array();
    $node_view = node_view($order, 'email_teaser', $currentLangId);
    $order_rendered = render($node_view)->__toString();

    if ($subject->getType() == 'vih_long_cource') {
      $start_course_date = $subject->field_vih_lc_start_date->date->getTimestamp();
      $end_course_date = $subject->field_vih_lc_end_date->date->getTimestamp();
      // course date
      $courseDate = NULL;
      if ($start_course_date) {
        $courseDate = \Drupal::service('date.formatter')->format($start_course_date, "long_w_a_time");
      }
      if ($end_course_date) {
        if (!(empty($courseDate))) {
          $courseDate .= ' - ';
        }
        $courseDate .= \Drupal::service('date.formatter')->format($end_course_date, "long_w_a_time");
      }

      $replacement = [
        $subject->getTitle(),
        $order->field_vih_lco_first_name->value . ' ' . $order->field_vih_lco_last_name->value,
        !empty($courseDate) ? mb_strtolower($courseDate) : '',
        '<a href="' . $subject->toUrl()->setAbsolute()->toString() . '"target=_blank >' . $subject->toUrl()
            ->setAbsolute()->toString() . '</a>',
        $order->id(),
        $order_rendered,
      ];

      $notification_template = $notificationsConfig->get('vih_subscription_long_course_notifications_body_' . $currentLangId);
      $notification_template = preg_replace("/\r\n|\r|\n/", '<br/>', $notification_template);

      $message = [
        'to' => $order->field_vih_lco_email->value,
        'Bcc' => $notificationsConfig->get('vih_subscription_long_course_notifications_bcc_' . $currentLangId),
        'subject' => $notificationsConfig->get('vih_subscription_long_course_notifications_subject_' . $currentLangId),
        'body' => $notification_template,
      ];
    }
    elseif ($subject->getType() == 'vih_short_course') {
      $allParticipants = $order->get('field_vih_sco_persons')->getValue();
      if (!empty($allParticipants)) {
        //getting first participant
        $firstParticipantTargetId = $allParticipants[0]['target_id'];
        $firstParticipantParagraph = Paragraph ::load($firstParticipantTargetId);

        // first participant values
        $firstName = $firstParticipantParagraph->field_vih_ocp_first_name->value;
        $lastName = $firstParticipantParagraph->field_vih_ocp_last_name->value;
        $email = $firstParticipantParagraph->field_vih_ocp_email->value;

        //course date
        $courseDate = NULL;
        if ($subject->field_vih_sc_start_date->value) {
          $courseDate = \Drupal::service('date.formatter')
            ->format($subject->field_vih_sc_start_date->date->getTimestamp(), "long");
        }
        if ($subject->field_vih_sc_end_date->value) {
          if (!(empty($courseDate))) {
            $courseDate .= ' - ';
          }
          $courseDate .= \Drupal::service('date.formatter')
            ->format($subject->field_vih_sc_end_date->date->getTimestamp(), "long");
        }
        $notification_template = $notificationsConfig->get('vih_subscription_short_course_notifications_body_' . $currentLangId);
        $notification_template = preg_replace("/\r\n|\r|\n/", '<br/>', $notification_template);

        $message = [
          'to' => $email,
          'Bcc' => $notificationsConfig->get('vih_subscription_short_course_notifications_bcc_' . $currentLangId),
          'subject' => $notificationsConfig->get('vih_subscription_short_course_notifications_subject_' . $currentLangId),
          'body' => $notification_template,
        ];

        $replacement = [
          $subject->getTitle(),
          $firstName . ' ' . $lastName,
          !empty($courseDate) ? mb_strtolower($courseDate) : '',
          '<a href="' . $subject->toUrl()->setAbsolute()->toString() . '"target=_blank >' . $subject->toUrl()
              ->setAbsolute()->toString() . '</a>',
          $order->id(),
          $order_rendered,
        ];
      }
    }
    elseif ($subject->getType() == 'event') {
      $allParticipants = $order->get('field_vih_eo_persons')->getValue();
      if (!empty($allParticipants)) {
        //getting first participant
        $firstParticipantTargetId = $allParticipants[0]['target_id'];
        $firstParticipantParagraph = Paragraph ::load($firstParticipantTargetId);

        // first participant values
        $firstName = $firstParticipantParagraph->field_vih_oe_first_name->value;
        $lastName = $firstParticipantParagraph->field_vih_oe_last_name->value;
        $email = $firstParticipantParagraph->field_vih_oe_email->value;

        //event date
        $eventDate = NULL;
        if ($subject->field_vih_event_start_date->value) {
          $eventDate = \Drupal::service('date.formatter')
            ->format($subject->field_vih_event_start_date->date->getTimestamp(), "long");
        }
        if ($subject->field_vih_event_end_date->value) {
          if (!(empty($eventDate))) {
            $eventDate .= ' - ';
          }
          $eventDate .= \Drupal::service('date.formatter')
            ->format($subject->field_vih_event_end_date->date->getTimestamp(), "long");
        }
        $notification_template = $notificationsConfig->get('vih_subscription_event_notifications_body_' . $currentLangId);
        $notification_template = preg_replace("/\r\n|\r|\n/", '<br/>', $notification_template);

        $message = [
          'to' => $email,
          'Bcc' => $notificationsConfig->get('vih_subscription_event_notifications_bcc_' . $currentLangId),
          'subject' => $notificationsConfig->get('vih_subscription_event_notifications_subject_' . $currentLangId),
          'body' => $notification_template,
        ];

        $replacement = [
          $subject->getTitle(),
          $firstName . ' ' . $lastName,
          !empty($eventDate) ? mb_strtolower($eventDate) : '',
          '<a href="' . $subject->toUrl()->setAbsolute()->toString() . '"target=_blank >' . $subject->toUrl()
              ->setAbsolute()->toString() . '</a>',
          $order->id(),
          $order_rendered,
        ];
      }
    }

    // Add logo to message body.
    if (_detect_site() === 'vies') {
      $logo = '<div style="background-color:#FF8100; width:100%; text-align:center">'
          . '<img src="'
          . \Drupal::request()->getSchemeAndHttpHost()
          . '/themes/custom/site/dist/images/layout-header-logo-vies.png" alt="VIES logo" />'
          . '</div><br>';
    }
    else {
      $logo = '<div style="background-color:#009bec; width:100%; text-align:center">'
          . '<img src="'
          . \Drupal::request()->getSchemeAndHttpHost()
          . '/themes/custom/site/dist/images/layout-header-logo-vih.png" alt="VIH logo" />'
          . '</div><br>';
    }

    $message['body'] = $logo . $message['body'];
    $token = ['@subject_name', '@person_name', '@date', '@url', '@order_id', '@order'];
    if (!empty($message)) {
      VihSubscriptionUtils::makeReplacements($message, $token, $replacement);
      VihSubscriptionUtils::sendMail($message);
    }
  }

  /**
   * {@inheritdoc}
   */
  public function resend(NodeInterface $subject, NodeInterface $order) {
    $this->_sendConfirmationEmail($subject, $order);
    $build = array(
      '#theme' => 'vih-subscription-email-resend-page'
    );
    return $build;
  }

  public function getTitle() {
    return $this->t('Tak for din tilmelding');
  }
  /**
   * Wrapper function register order:
   * Sending notification email, changing order status, registering on EDB system
   *
   * @param NodeInterface $subject
   * @param NodeInterface $order
   */
  private function registerOrder(NodeInterface $subject, NodeInterface $order) {
    $currentLangId = \Drupal::languageManager()->getCurrentLanguage()->getId();
    $notificationsConfig = \Drupal::configFactory()->getEditable(SubscriptionsGeneralSettingsForm::$configName);

    if ($subject->getType() == 'vih_long_cource') {
      // Mailchimp integration
      if ($order->field_vih_lco_newsletter->value) {
        $email = $order->field_vih_lco_email->value;
        $firstName = $order->field_vih_lco_first_name->value;
        $lastName = $order->field_vih_lco_last_name->value;

        VihSubscriptionUtils::subscribeToMailchimp($firstName, $lastName, $email, $currentLangId);
      }
      if ($order->field_vih_lco_adult_newsletter->value) {
        $adultEmail = $order->field_vih_lco_adult_email->value;
        $adultFirstName = $order->field_vih_lco_adult_first_name->value;
        $adultLastName = $order->field_vih_lco_adult_last_name->value;

        VihSubscriptionUtils::subscribeToMailchimp($adultFirstName, $adultLastName, $adultEmail, $currentLangId);
      }

      //EDBBrugsen Integration
      $edbBrugsenConfig = \Drupal::configFactory()->getEditable(EdbbrugsenSettingsForm::$configName);
      if ($edbBrugsenConfig->get('active')) {
        $username = $edbBrugsenConfig->get('username');
        $password = $edbBrugsenConfig->get('password');
        $school_code = $edbBrugsenConfig->get('school_code');
        $book_number = $edbBrugsenConfig->get('book_number');

        $studentCpr = $order->field_vih_lco_cpr->value;

        $edbBrugsenIntegration = new EDBBrugsenIntegration($username, $password, $school_code, $book_number);
        $registration = $edbBrugsenIntegration->convertLongCourseToRegistration($order);
        $registration = $edbBrugsenIntegration->addStudentCprNr($registration, $studentCpr);

        $synchReply = $edbBrugsenIntegration->addRegistration($registration);

        $order->set('field_vih_lco_edb_synched', $synchReply['status']);
        $order->set('field_vih_lco_edb_synch_message', $synchReply['message']);
      }

      //updating course order status
      $order->set('field_vih_lco_status', 'confirmed');
      //deleting CPR from order
      $order->set('field_vih_lco_cpr', '');
      $order->save();
    }
    elseif ($subject->getType() == 'vih_short_course') {

      $order_persons = $order->field_vih_sco_persons->referencedEntities();
      foreach ($order_persons as $order_person) {
        // Mailchimp integration.
        if ($order_person->field_vih_ocp_newsletter->value) {
          $email = $order_person->field_vih_ocp_email->value;
          $firstName = $order_person->field_vih_ocp_first_name->value;
          $lastName = $order_person->field_vih_ocp_last_name->value;

          VihSubscriptionUtils::subscribeToMailchimp($firstName, $lastName, $email, $currentLangId);
        }

        // EDBBrugsen Integration.
        $edbBrugsenConfig = \Drupal::configFactory()->getEditable(EdbbrugsenSettingsForm::$configName);
        if ($edbBrugsenConfig->get('active')) {
          $username = $edbBrugsenConfig->get('username');
          $password = $edbBrugsenConfig->get('password');
          $school_code = $edbBrugsenConfig->get('school_code');
          $book_number = $edbBrugsenConfig->get('book_number');

          $edbBrugsenIntegration = new EDBBrugsenIntegration($username, $password, $school_code, $book_number);
          $registration = $edbBrugsenIntegration->convertShortCourseOrderPersonToRegistration($order, $order_person);
          if (!empty($order_person->field_vih_ocp_cpr->getValue()[0]['value'])) {
            $registration = $edbBrugsenIntegration->addStudentCprNr($registration, $order_person->field_vih_ocp_cpr->getValue()[0]['value']);
          }

          $synchReply = $edbBrugsenIntegration->addRegistration($registration);

          $order->set('field_vih_sco_edb_synched', $synchReply['status']);
          $order->set('field_vih_sco_edb_synch_message', $synchReply['message']);

          //deleting CPR from order person
          $order_person->set('field_vih_ocp_cpr', '');
          $order_person->save();
        }
      }

      //updating course order status
      $order->set('field_vih_sco_status', 'confirmed');
      $order->save();
    }
    elseif ($subject->getType() == 'event') {


      //updating event order status
      $order->set('field_vih_eo_status', 'confirmed');
      $order->save();
    }


  }
}

/**
 * Detects which site are used.
 */
function _detect_site() {
  if (strpos($_SERVER['SERVER_NAME'], 'vies') !== false) {
    return 'vies';
  }

  return 'vih';
}
