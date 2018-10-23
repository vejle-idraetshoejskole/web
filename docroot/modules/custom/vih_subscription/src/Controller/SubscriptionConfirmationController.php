<?php

namespace Drupal\vih_subscription\Controller;


use Drupal\bellcom_quickpay_integration\Misc\BellcomQuickpayClient;
use Drupal\Component\Utility\Crypt;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Url;
use Drupal\node\NodeInterface;
use Drupal\vih_subscription\Misc\VihSubscriptionUtils;

class SubscriptionConfirmationController extends ControllerBase{

  /**
   * {@inheritdoc}
   */
  public function content(NodeInterface $subject, NodeInterface $order, $checksum) {
    if (Crypt::hashEquals($checksum, VihSubscriptionUtils::generateChecksum($subject, $order))) {

      $orderPrice = null;
      $backLink = null;

      $successUrl = Url::fromRoute('vih_subscription.subscription_successful_redirect', [
        'subject' => $subject->id(),
        'order' => $order->id(),
        'checksum' => VihSubscriptionUtils::generateChecksum($subject, $order)
      ]);
      $successUrl->setAbsolute();

      // when cancelling, redirect to the subject
      $cancelUrl = $subject->toUrl();
      $cancelUrl->setAbsolute();

      if ($subject->getType() == 'vih_long_cource') {
        //there is not payment integrated for long course, therefore paymentlink = successUrl
        $paymentLink = $successUrl;

        $backLink = Url::fromRoute('vih_subscription.long_course_order_create', [
          'course' => $subject->id(),
          'order' => $order->id(),
          'checksum' => $checksum
        ]);
      } elseif ($subject->getType() == 'vih_short_course' || $subject->getType() == 'event') {
        if ($subject->getType() == 'vih_short_course') {
          $orderPrice = $order->field_vih_sco_price->value;
          $backLink = Url::fromRoute('vih_subscription.short_course_order_create', [
            'course' => $subject->id(),
            'order' => $order->id(),
            'checksum' => $checksum
          ]);
        } elseif ($subject->getType() == 'event') {
          $orderPrice = $order->field_vih_eo_price->value;
          $backLink = Url::fromRoute('vih_subscription.event_order_create', [
            'event' => $subject->id(),
            'order' => $order->id(),
            'checksum' => $checksum
          ]);
        }


        if ($orderPrice != 0) {
          //generating quickpay payment URL
          $client = new BellcomQuickpayClient();
          $paymentLink = $client->getPaymentLink($order, $subject, $orderPrice, $successUrl->toString(), $cancelUrl->toString());
        } else {
          //there is not payment integrated for long course, therefore paymentlink = successUrl
          $paymentLink = $successUrl;
        }
      }

      //the actual content comes from template file: templates/vih_subscription_confirmation_page.html.twig
      $build = array(
        '#theme' => 'vih_subscription_confirmation_page',
        '#paymentLink' => $paymentLink,
        '#backLink' => $backLink->setAbsolute()->toString(),
        '#order' => node_view($order, 'teaser'),
        '#course-type' => $subject->getType(),
      );

      return $build;
    } else {
      return $this->redirect('vih_subscription.subscription_error_redirect');
    }
  }

  public function getTitle() {
    return $this->t('Bekræft venligst din ordre');
  }
} 