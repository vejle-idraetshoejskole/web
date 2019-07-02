<?php

/**
 * @file
 * Contains \Drupal\vih_subscription\Misc\VihSubscriptionUtils.
 */

namespace Drupal\vih_subscription\Misc;

use Drupal\Component\Utility\Crypt;
use Drupal\Core\Site\Settings;
use Drupal\node\Entity\Node;
use Drupal\node\NodeInterface;
use Drupal\vih_subscription\Form\SubscriptionsGeneralSettingsForm;

class VihSubscriptionUtils {
  /**
   * Simply send mail function
   *
   * @param array $message with keys
   * - to
   * - from
   * - Cc
   * - Bcc
   * - body
   * - sender
   * - subject
   *
   * @return BOOLEAN
   */
  public static function sendMail($message) {
    return \Drupal::service('plugin.manager.mail')->mail('vih_subscription', 'order', $message['to'], \Drupal::languageManager()->getDefaultLanguage()->getId(), $message);
  }

  /**
   * Replaces the certain text with the provided substitution text in both message subject and body
   *
   * @param $message
   * @param $token
   * @param $replacement
   */
  public static function makeReplacements(&$message, $token, $replacement) {
    foreach($message as $key => &$value){
      $value = nl2br($value);
    }
    $message['subject'] = str_replace($token, $replacement, $message['subject']);
    $message['body'] = str_replace($token, $replacement, $message['body']);
  }

  /**
   * Generates a checksum for a pair of subject-order, can be used to validate that the request is valid.
   *
   * @param NodeInterface $subject
   * @param NodeInterface $order
   *
   * @return string
   */
  public static function generateChecksum(NodeInterface $subject, NodeInterface $order) {
    return Crypt::hashBase64($subject->id() . $order->id() . Settings::getHashSalt());
  }

  /**
   * Returns a boolean if more people can subscribe to that subject.
   *
   * @param NodeInterface $subject
   *
   * @return boolean
   */
  public static function acceptsMoreSubscriptions(NodeInterface $subject) {
    if ($subject->getType() == 'vih_long_cource') {
      //0 for unlimited
      if ($subject->field_vih_course_persons_limit->value == 0) {
        return TRUE;
      }
      else {
        return ($subject->field_vih_course_persons_limit->value > VihSubscriptionUtils::calculateSubscribedPeopleNumber($subject));
      }
    }
    elseif ($subject->getType() == 'vih_short_course') {
      //0 for unlimited
      if ($subject->field_vih_sc_persons_limit->value == 0) {
        return TRUE;
      }
      else {
        return ($subject->field_vih_sc_persons_limit->value > VihSubscriptionUtils::calculateSubscribedPeopleNumber($subject));
      }
    }
    elseif ($subject->getType() == 'event') {
      //0 for unlimited
      if ($subject->field_vih_event_persons_limit->value == 0) {
        return TRUE;
      }
      else {
        return ($subject->field_vih_event_persons_limit->value > VihSubscriptionUtils::calculateSubscribedPeopleNumber($subject));
      }
    }
  }

  /**
   * Returns if the subject is outdated (is expired).
   *
   * @param NodeInterface $subject
   *
   * @return boolean
   */
  public static function isOutdated(NodeInterface $subject) {
    if ($subject->getType() == 'vih_long_cource') {
      //Is outdated
      $end_course_date = '';
      foreach ($subject->field_vih_course_periods->referencedEntities() as $period) {
        if ($period->field_vih_cp_end_date->value) {
          $curr_end_date = $period->field_vih_cp_end_date;
        }

        if ($end_course_date) {
          if ($curr_end_date->date->getTimestamp() > $end_course_date->date->getTimestamp()) {
            $end_course_date = $curr_end_date;
          }
        }
        else {
          $end_course_date = $curr_end_date;
        }
      }
      if (empty($end_course_date) or $end_course_date->date->getTimestamp() < time()) {
        return TRUE;
      }
      return FALSE;
    }
    elseif ($subject->getType() == 'vih_short_course') {
      // Is outdated
      if (empty($subject->field_vih_sc_end_date) or $subject->field_vih_sc_end_date->date->getTimestamp() < time()) {
        return TRUE;
      }
      return FALSE;
    }
    elseif ($subject->getType() == 'event') {
      // Is outdated
      if (empty($subject->field_vih_event_end_date) or $subject->field_vih_event_end_date->date->getTimestamp() < time()) {
        return TRUE;
      }
      return FALSE;
    }
  }

  /**
   * Calculates the number of people that have already subscribed to this subject
   *
   * @param NodeInterface $event
   *
   * @return int
   */
  public static function calculateSubscribedPeopleNumber(NodeInterface $subject) {
    if ($subject->getType() == 'vih_long_cource') {
      $courseOrderNids = \Drupal::entityQuery('node')
        ->condition('type', 'vih_long_course_order')
        //->condition('status', '1')new nodes are saved as unpublished
        ->condition('field_vih_lco_course', $subject->id())
        ->condition('field_vih_lco_status', 'confirmed')
        ->execute();

      //TODO: how many people is each order?
      return count($courseOrderNids);
    }
    elseif ($subject->getType() == 'vih_short_course') {
      $courseOrderNids = \Drupal::entityQuery('node')
        ->condition('type', 'vih_short_course_order')
        //->condition('status', '1')new nodes are saved as unpublished
        ->condition('field_vih_sco_course', $subject->id())
        ->condition('field_vih_sco_status', 'confirmed')
        ->execute();

      $courseOrders = Node::loadMultiple($courseOrderNids);
      $subscribedPeopleNumber = 0;
      foreach ($courseOrders as $courseOrder) {
        $subscribedPeopleNumber += count($courseOrder->get('field_vih_sco_persons')->getValue());
      }

      return $subscribedPeopleNumber;
    }
    elseif ($subject->getType() == 'event') {
      $eventOrderNids = \Drupal::entityQuery('node')
        ->condition('type', 'vih_event_order')
        //->condition('status', '1')new nodes are saved as unpublished
        ->condition('field_vih_eo_event', $subject->id())
        ->condition('field_vih_eo_status', 'confirmed')
        ->execute();

      $eventOrders = Node::loadMultiple($eventOrderNids);
      $subscribedPeopleNumber = 0;
      foreach ($eventOrders as $eventOrder) {
        $subscribedPeopleNumber += count($eventOrder->get('field_vih_eo_persons')->getValue());
      }

      return $subscribedPeopleNumber;
    }
  }

  /**
   * Creates a subscription to mailchimp
   *
   * @param $firstName
   * @param $lastName
   * @param $email
   * @param $lang
   *
   * @throws \Exception
   */
  public static function subscribeToMailchimp($firstName, $lastName, $email, $lang = 'da') {
    // Getting all lists.
    $lists = mailchimp_get_lists(NULL, NULL);

    // List ID from config.
    $config = \Drupal::config(SubscriptionsGeneralSettingsForm::$configName);
    $list_id = $config->get('vih_subscription_mailchimp_list_id_' . $lang);

    try {
      if (!$firstName || !$lastName || !$email) {
        throw new \Exception("Some of the mandatory parameters are not provided. Received first name: $firstName, last name: $lastName, email: $email");
      }
      if (empty($lists)) {
        throw new \Exception('No available mailchimp list can be be found');
      }

      $list = $lists[$list_id];
      if (!$list) {
        throw new \Exception('No available mailchimp list can be be found');
      }

      if ($list_id) {
        $merge_vars = array(
          'EMAIL' => $email,
          'FNAME' => $firstName,
          'LNAME' => $lastName
        );
        mailchimp_subscribe($list_id, $merge_vars['EMAIL'], $merge_vars, FALSE, FALSE);
      }
    } catch (\Exception $e) {
      \Drupal::logger('vih_subscription')->error($e->getMessage());
    }
  }

  /**
   * Calculates usage of a single option in all course orders marked as confirmed.
   *
   * @param $course
   * @param $optionGroup
   * @param $option
   *
   * @return int
   */
  public static function calculateOptionUsageCount($course, $optionGroup, $option, $status = 'confirmed') {
    $optionGroupTitleDa = NULL;
    $optionGroupTitleEn = NULL;
    if ($optionGroup->hasTranslation('da')) {
      $optionGroupTitleDa = $optionGroup->getTranslation('da')->field_vih_og_title->value;
    }
    if ($optionGroup->hasTranslation('en')) {
      $optionGroupTitleEn = $optionGroup->getTranslation('en')->field_vih_og_title->value;
    }

    $optionTitleDa = NULL;
    $optionTitleEn = NULL;

    if ($option->hasTranslation('da')) {
      $optionTitleDa = $option->getTranslation('da')->field_vih_option_title->value;
    }
    if ($option->hasTranslation('en')) {
      $optionTitleEn = $option->getTranslation('en')->field_vih_option_title->value;
    }

    $courseOrderNids = \Drupal::entityQuery('node')
      ->condition('type', 'vih_short_course_order')
      //->condition('status', '1')new nodes are saved as unpublished
      ->condition('field_vih_sco_course', $course->id())
      ->condition('field_vih_sco_status', $status)
      ->execute();

    $courseOrders = Node::loadMultiple($courseOrderNids);

    $count = 0;
    foreach ($courseOrders as $courseOrder) {
      foreach ($courseOrder->field_vih_sco_persons->referencedEntities() as $orderedPerson) {
        foreach ($orderedPerson->field_vih_ocp_ordered_options->referencedEntities() as $orderedOption) {
          if ((($optionGroupTitleDa && $orderedOption->field_vih_oo_group_name->value === $optionGroupTitleDa) ||
              ($optionGroupTitleEn && $orderedOption->field_vih_oo_group_name->value === $optionGroupTitleEn))
            &&
            (($optionTitleDa && $orderedOption->field_vih_oo_option_name->value === $optionTitleDa) || ($optionTitleEn && $orderedOption->field_vih_oo_option_name->value === $optionTitleEn))
          ) {
            $count++;
          }
        }
      }
    }

    return $count;
  }

  /**
   * Helper function to format address nicely.
   *
   * @param $addressArr , formatted like
   * array (
   *    'address' => streetname,
   *    'houseNumber' => houseNumber,
   *    'houseLetter' => houseLetter,
   *    'houseFloor' => houseFloor,
   * )
   *
   * @return string
   */
  public static function formatAddressToString($addressArr) {
    $address = empty($addressArr['address']) ? '' : $addressArr['address'];
    if (isset($addressArr['houseNumber']) && !empty(trim($addressArr['houseNumber']))) {
      $address .= ' ' . $addressArr['houseNumber'];
    }
    if (isset($addressArr['houseLetter']) && !empty(trim($addressArr['houseLetter']))) {
      $address .= ', ' . $addressArr['houseLetter'];
    }
    if (isset($addressArr['houseFloor']) && !empty(trim($addressArr['houseFloor']))) {
      $address .= ', ' . $addressArr['houseFloor'];
    }

    return $address;
  }
}
