<?php
/**
 * @file
 * Contains \Drupal\vih_subscription\Form\EventOrderForm.
 */

namespace Drupal\vih_subscription\Form;

use Drupal\bellcom_quickpay_integration\Misc\BellcomQuickpayClient;
use Drupal\Component\Utility\Crypt;
use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\HtmlCommand;
use Drupal\Core\Ajax\InvokeCommand;
use Drupal\Core\Ajax\ReplaceCommand;
use Drupal\Core\Field\Plugin\Field\FieldFormatter;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Routing\TrustedRedirectResponse;
use Drupal\Core\Url;
use Drupal\node\Entity\Node;
use Drupal\node\NodeInterface;
use Drupal\paragraphs\Entity\Paragraph;
use Drupal\vih_subscription\Misc\VihSubscriptionUtils;

/**
 * Implements an example form.
 */
class EventOrderForm extends FormBase {

  protected $event;
  protected $eventOrder;
  protected $price;

  /**
   * Returns page title
   */
  public function getTitle($event) {
    return $this->t('Sign up @label', ['@label' => $event->label()]);
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'vih-subscription-event-order-form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, NodeInterface $event = NULL, NodeInterface $order = NULL, $checksum = NULL) {
    $form['#attached']['library'][] = 'vih_subscription/vih-subscription-terms-and-conditions-modal';    
    //START VARIABLES INIT //
    $this->event = $event;
    $this->price = $event->field_vih_event_price->value;

    $addedParticipants = $form_state->get('addedParticipants');

    if ($order != NULL) {
      if (Crypt::hashEquals($checksum, VihSubscriptionUtils::generateChecksum($event, $order))) {
        $this->eventOrder = $order;
        $this->price = $this->eventOrder->field_vih_eo_price->value;

        if (!isset($addedParticipants)) {
          //preloading data
          $this->populateData($this->eventOrder, $form, $form_state);
          $addedParticipants = $form_state->get('addedParticipants');
        }
      }
    }

    $personsLimit = $event->field_vih_event_persons_limit->value;
    $personsSubscribed = VihSubscriptionUtils::calculateSubscribedPeopleNumber($event);
    if ($personsLimit == 0) { //unlimited
      $personsLimit = PHP_INT_MAX;
    }
    //END VARIABLES INIT //

    //START GENERAL DATA //
    if(!empty($addedParticipants)){
      $form['price'] = array(
        '#markup' => 'DKK ' . number_format($this->price, 0, ',', '.'),
      );
    }

    $form['status_messages'] = [
      '#type' => 'status_messages',
      '#weight' => -10,
      '#prefix' => '<div id="status_messages">',
      '#suffix' => '</div>'
    ];

    $form['#event'] = array(
      'title' => $event->getTitle(),
      'url' => $event->toUrl()
    );
    //END GENERAL DATA //

    //START ADD NEW PARTICIPANT CONTAINER//
    $form['newParticipantContainer'] = [
      '#type' => 'container',
      '#prefix' => '<div id="new-participant-container-wrapper">',
      '#suffix' => '</div>',
      '#tree' => TRUE
    ];

    $participant_form = $form_state->get('participantForm');
    // Show participant form if no participant added.
    if (empty($addedParticipants)) {
      $participant_form = TRUE;
    }
    $readable_price = (!isset($this->price) || $this->price == 0) ? $this->t('Gratis') : '+ DKK ' . number_format($this->price, 0, ',', '.');

    if ($participant_form) {
      if (count($addedParticipants) + $personsSubscribed < $personsLimit) { //not allowing to have more fieldsets that the event have capacity for
        $form['newParticipantContainer']['newParticipantFieldset'] = [
          '#type' => 'container',
          '#attributes' => ['class' => ['partial__body']],
          '#prefix' => '<div class="partial__heading"><h4 class="partial__heading__title">' . $this->t('Personlige oplysninger') . '</h4></div>',
        ];
        $form['newParticipantContainer']['newParticipantFieldset']['firstName'] = array(
          '#type' => 'textfield',
          '#title' => $this->t('Firstname'),
          '#placeholder' => $this->t('Firstname'),
          '#required' => TRUE,
          '#prefix' => '<div class="row"><div class="col-xs-12 col-sm-6">',
          '#suffix' => '</div>',
        );
        $form['newParticipantContainer']['newParticipantFieldset']['lastName'] = array(
          '#type' => 'textfield',
          '#title' => $this->t('Lastname'),
          '#placeholder' => $this->t('Lastname'),
          '#required' => TRUE,
          '#prefix' => '<div class="col-xs-12 col-sm-6">',
          '#suffix' => '</div></div>',
        );
        $form['newParticipantContainer']['newParticipantFieldset']['email'] = array(
          '#type' => 'textfield',
          '#title' => $this->t('E-mail address'),
          '#placeholder' => $this->t('E-mail address'),
          '#required' => TRUE,
        );

        $form['newParticipantContainer']['addParticipant'] = array(
          '#id' => 'add-participant',
          '#name' => 'add-participant',
          '#type' => 'submit',
          '#value' => $this->t('Add'),
          '#submit' => array('::addParticipant'),
          '#ajax' => [
            'callback' => '::ajaxAddRemoveParticipantCallback',
            'progress' => [
              'type' => 'none',
            ],
          ],
          '#suffix' => '&nbsp;&nbsp;&nbsp;&nbsp;<strong>' . $readable_price . '</strong>',
        );
      }
      else {
        $form['newParticipantContainer']['message'] = array(
          '#markup' => $this->t('Denne begivenhed kan ikke allokere flere deltagere')
        );
      }
    }
    else {
      $form['newParticipantContainer']['addParticipant'] = [
        '#type' => 'submit',
        '#value' => $this->t('Add another'),
        '#submit' => ['::editParticipant'],
        '#attributes' => ['class' => ['btn-success']],
        '#ajax' => [
          'callback' => '::ajaxAddRemoveParticipantCallback',
          'progress' => [
            'type' => 'none'
          ]
        ],
        '#limit_validation_errors' => [],
      ];
    }
    //END ADD NEW PARTICIPANT CONTAINER //

    // START added participants container //
    $form['addedParticipantsContainer'] = array(
      '#type' => 'container',
      '#prefix' => '<div id="added-participants-container-wrapper">',
      '#suffix' => '</div>',
      '#theme' => 'vih_subscription_added_participant',
      '#addedParticipants' => $addedParticipants
    );

    //adding edit/remove buttons
    if ($addedParticipants && is_array($addedParticipants)) {

      foreach ($addedParticipants as $addedParticipantDelta => $addedParticipant) {

        $form['addedParticipantsContainer']['controlButtons']['editButton-' . $addedParticipantDelta] = [
          '#id' => 'edit-participant-' . $addedParticipantDelta,
          '#name' => 'edit-participant-' . $addedParticipantDelta,
          '#type' => 'submit',
          '#value' => $this->t('Edit'),
          '#submit' => array('::editParticipant'),
          '#attributes' => array('class' => array('btn-primary', 'btn-sm')),
          '#ajax' => [
            'callback' => '::ajaxAddRemoveParticipantCallback',
            'progress' => array(
              'type' => 'none'
            )
          ],
          '#participantDelta' => $addedParticipantDelta,
          '#limit_validation_errors' => array()
        ];

        $form['addedParticipantsContainer']['controlButtons']['removeButton-' . $addedParticipantDelta] = [
          '#id' => 'remove-participant-' . $addedParticipantDelta,
          '#name' => 'remove-participant-' . $addedParticipantDelta,
          '#type' => 'submit',
          '#value' => $this->t('Remove'),
          '#submit' => array('::removeParticipant'),
          '#attributes' => array('class' => array('btn-danger', 'btn-sm')),
          '#ajax' => [
            'callback' => '::ajaxAddRemoveParticipantCallback',
            'progress' => array(
              'type' => 'none'
            )
          ],
          '#participantDelta' => $addedParticipantDelta,
          '#limit_validation_errors' => array()
        ];
      }
    }
    // END added participants container

    //START FORM CONTROLS //
    $form['actions'] = [
      '#type' => 'actions',
    ];
    $form['actions']['submit'] = array(
      '#type' => 'submit',
      '#id' => 'vih-event-submit',
      '#value' => $this->t('Continue registration'),
      '#attributes' => array('class' => array('btn-success')),
      '#limit_validation_errors' => array(
        ['newParticipantContainer', 'newParticipantFieldset', 'firstName'],
        ['newParticipantContainer', 'newParticipantFieldset', 'lastName'],
        ['newParticipantContainer', 'newParticipantFieldset', 'email'],
        ['terms_and_conditions'],
      ),
      '#submit' => array('::submitForm')
    );

    // Disable submit if no participants added.
    if(empty($addedParticipants)){
      $form['actions']['submit']['#attributes']['class'][] = 'disabled';
    }
    //END FORM CONTROLS //

    $form['#theme'] = 'vih_subscription_event_order_form';
    $form_state->setCached(FALSE);

    $config = $this->config(SubscriptionsGeneralSettingsForm::$configName);

    $form['#registration_text'] = (\Drupal::languageManager()->getCurrentLanguage()
        ->getId() === 'en') ? $config->get('vih_subscription_event_registration_page_text_en') : $config->get('vih_subscription_event_registration_page_text_da');

    if (!empty($terms_and_conditions_page_id = $config->get('vih_subscription_event_terms_and_conditions_page'))) {
      $terms_and_conditions_link = CommonFormUtils::getTermsAndConditionsLink($terms_and_conditions_page_id);
      $form['terms_and_conditions'] = array(
        '#type' => 'checkboxes',
        '#options' => array('accepted' => $this->t('I agree to the @terms_and_conditions', array('@terms_and_conditions' => $terms_and_conditions_link))),
        '#title' => $this->t('Terms and conditions'),
      );
    }

    $form['#addedParticipants'] = empty($addedParticipants);

    return $form;
  }

  /**
   * Callback function that adds participant to the participants list.
   *
   * @param array $form
   * @param FormStateInterface $form_state
   */
  public function addParticipant(array &$form, FormStateInterface $form_state) {
    $userInput = $form_state->getUserInput();

    if ($form_state->hasAnyErrors()) {
      $response = new AjaxResponse();
      $response->addCommand(new ReplaceCommand('#status_messages', $form['status_messages']));
      return $response;
    }

    //existing list of added participants
    $addedParticipants = $form_state->get('addedParticipants');

    //filling personal information
    $participant = array();
    $participant['firstName'] = $userInput['newParticipantContainer']['newParticipantFieldset']['firstName'];
    $participant['lastName'] = $userInput['newParticipantContainer']['newParticipantFieldset']['lastName'];
    $participant['email'] = $userInput['newParticipantContainer']['newParticipantFieldset']['email'];

    $addedParticipants[] = $participant;

    $form_state->set('addedParticipants', $addedParticipants);

    // Clearing form
    $clean_keys = $form_state->getCleanValueKeys();
    $clean_keys[] = 'ajax_page_state';
    foreach ($userInput as $key => $item) {
      if (!in_array($key, $clean_keys) && substr($key, 0, 1) !== '_') {
        unset($userInput[$key]);
      }
    }

    $form_state->set('participantForm', NULL);
    $form_state->setUserInput($userInput);
    $form_state->setRebuild();
  }

  /**
   * Callback function that populates the newParticipant fields with the certain participant values, and removes that participant from the list of added participants.
   *
   * @param array $form
   * @param FormStateInterface $form_state
   */
  function editParticipant(array &$form, FormStateInterface $form_state) {
    $userInput = $form_state->getUserInput();

    // Getting triggering element.
    $triggeringElement = $form_state->getTriggeringElement();
    $addedParticipants = $form_state->get('addedParticipants');
    if (isset($triggeringElement['#participantDelta'])) {
      $participantToEdit = $addedParticipants[$triggeringElement['#participantDelta']];

      // Unsetting the participant.
      unset($addedParticipants[$triggeringElement['#participantDelta']]);
      $form_state->set('addedParticipants', $addedParticipants);

      //filling personal information
      $userInput['newParticipantContainer']['newParticipantFieldset']['firstName'] = $participantToEdit['firstName'];
      $userInput['newParticipantContainer']['newParticipantFieldset']['lastName'] = $participantToEdit['lastName'];
      $userInput['newParticipantContainer']['newParticipantFieldset']['email'] = $participantToEdit['email'];

      $form_state->setUserInput($userInput);
    }

    $form_state->set('participantForm', TRUE);
    $form_state->setRebuild();
  }

  /**
   * Callback function that removes a certain participant from the list of added participants.
   *
   * @param array $form
   * @param FormStateInterface $form_state
   */
  function removeParticipant(array &$form, FormStateInterface $form_state) {
    //getting triggering element
    $triggeringElement = $form_state->getTriggeringElement();
    $addedParticipants = $form_state->get('addedParticipants');
    //unsetting the participant
    unset($addedParticipants[$triggeringElement['#participantDelta']]);
    $form_state->set('addedParticipants', $addedParticipants);

    //rebuilding form
    $form_state->setRebuild();
  }

  /**
   * Ajax callback function that fetches the refreshed version of added participants, resets add new participant form part
   * as well as updated the total event price
   *
   * @param array $form
   * @param FormStateInterface $form_state
   * @return AjaxResponse
   */
  public function ajaxAddRemoveParticipantCallback(array &$form, FormStateInterface $form_state) {
    $response = new AjaxResponse();

    //checking for any errors
    if ($form_state->hasAnyErrors()) {
      $response->addCommand(new HtmlCommand('#status_messages', $form['status_messages']));
      //redrawing elements
      $response->addCommand(new ReplaceCommand('#new-participant-container-wrapper', $form['newParticipantContainer']));
      return $response;
    }

    //resetting elements
    $response->addCommand(new ReplaceCommand('#new-participant-container-wrapper', $form['newParticipantContainer']));

    //updating the price
    $calculatedPrice = $this->calculatePrice($form_state);
    if ($calculatedPrice == 0) {
      $response->addCommand(new InvokeCommand('.boxy--price', 'addClass', ['hidden']));
    } else {
      $response->addCommand(new InvokeCommand('.boxy--price.hidden', 'removeClass', ['hidden']));
    }

    $response->addCommand(new HtmlCommand('#vih-event-price', 'DKK ' . number_format($calculatedPrice, 0, ',', '.')));

    //updating added participants
    $response->addCommand(new ReplaceCommand('#added-participants-container-wrapper', $form['addedParticipantsContainer']));

    //resetting the error, if any
    $response->addCommand(new HtmlCommand('#status_messages', $form['status_messages']));
    
    // Enable submit button if participants added.
    if (!empty($form['addedParticipantsContainer']['#addedParticipants'])) {
      $response->addCommand(new InvokeCommand('#vih-event-submit', 'removeClass', ['disabled']));
      $response->addCommand(new InvokeCommand('#form-bottom-wrapper', 'removeClass', ['hidden']));
    }
    else {
      // Disable submit button if no participants added.
      $response->addCommand(new InvokeCommand('#vih-event-submit', 'addClass', ['disabled']));
      $response->addCommand(new InvokeCommand('#form-bottom-wrapper', 'addClass', ['hidden']));
    }

    return $response;
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
    $triggeringElement = $form_state->getTriggeringElement();

    //submit button
    if ($triggeringElement['#id'] == 'vih-event-submit') {
      $form_state->clearErrors();

      $addedParticipants = $form_state->get('addedParticipants');
      //not added participants
      if (!count($addedParticipants)) {
        $form_state->setError($form['newParticipantContainer']['newParticipantFieldset']['firstName'], $this->t('Please add, at least, one participant'));
        $form_state->setError($form['newParticipantContainer']['newParticipantFieldset']['lastName'], $this->t('Please add, at least, one participant'));
        $form_state->setError($form['newParticipantContainer']['newParticipantFieldset']['email'], $this->t('Please add, at least, one participant'));
      }
      $config = $this->config(SubscriptionsGeneralSettingsForm::$configName);
      if(empty($form_state->getValue('terms_and_conditions')['accepted']) && !empty($config->get('vih_subscription_event_terms_and_conditions_page'))){
        $form_state->setError($form['terms_and_conditions'], $this->t('Before you can proceed you must accept the terms and conditions'));
      }
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    //collection subscribed participants information
    $subscribedParticipants = array();
    $firstParticipantName = '';
    $addedParticipants = $form_state->get('addedParticipants');

    if (isset($addedParticipants) && !empty($addedParticipants)) {
      foreach ($addedParticipants as $addedParticipant) {

        //creating participant paragraph
        $subscribedParticipant = Paragraph::create([
          'type' => 'vih_ordered_event_person',
          'field_vih_oe_first_name' => $addedParticipant['firstName'],
          'field_vih_oe_last_name' => $addedParticipant['lastName'],
          'field_vih_oe_email' => $addedParticipant['email'],
        ]);
        $subscribedParticipant->save();
        $subscribedParticipants[] = $subscribedParticipant;

        //saving first participant name to use in order title
        if (empty($firstParticipantName)) {
          $firstParticipantName = $addedParticipant['firstName'] . ' ' . $addedParticipant['lastName'];
        }
      }
    }

    //calculating the price
    $orderPrice = $this->calculatePrice($form_state);

    //checking if we need to create a new order or edit the existing
    if ($this->eventOrder == NULL) {
      $this->eventOrder = Node::create(array(
        'type' => 'vih_event_order',
        'status' => 1, //We restrict direct access to the node in site_preprocess_node hook
        'title' => $this->event->getTitle() . ' - begivenhed tilmelding - ' . $firstParticipantName . ' - '
          . \Drupal::service('date.formatter')->format(time(), 'short'),
        'field_vih_eo_persons' => $subscribedParticipants,
        'field_vih_eo_event' => $this->event->id(),
        'field_vih_eo_status' => 'pending',
        'field_vih_eo_price' => $orderPrice,
      ));
      $this->eventOrder->setPromoted(FALSE);
    } else {
      //removing old participants paragraphs, and replacing with new ones
      $subscribedPersonsIds = $this->eventOrder->get('field_vih_eo_persons')->getValue();

      foreach ($subscribedPersonsIds as $subscribedPersonId) {
        $subscribedPerson = Paragraph::load($subscribedPersonId['target_id']);

        if ($subscribedPerson) {
         $subscribedPerson->delete();
        }
      }
      //adding new participants
      $this->eventOrder->set('field_vih_eo_persons', $subscribedParticipants);

      $this->eventOrder->set('field_vih_eo_price', $orderPrice);
    }

    //saving the order (works for both new/edited)
    $this->eventOrder->save();

    //redirecting to confirmation page
    $form_state->setRedirect('vih_subscription.subscription_confirmation_redirect', [
      'subject' => $this->event->id(),
      'order' => $this->eventOrder->id(),
      'checksum' => VihSubscriptionUtils::generateChecksum($this->event, $this->eventOrder)
    ]);
  }

  /**
   * Traverses through the selected options and calculates the total price for the event.
   *
   * @param FormStateInterface $form_state
   * @return mixed
   */
  private function calculatePrice(FormStateInterface $form_state) {
    $base_price = $this->event->field_vih_event_price->value;

    $addedParticipants = $form_state->get('addedParticipants');
    //calculating persons
    $base_price *= count($addedParticipants);

    $this->price = $base_price;
    return $this->price;
  }

  /**
   * Populate the data into the form the existing eventOrder
   *
   * @param NodeInterface $eventOrder
   * @param $form
   * @param $form_state
   */
  private function populateData(NodeInterface $eventOrder, &$form, $form_state) {
    $addedParticipants = array();

    //subscribed persons
    $subscribedPersonsIds = $eventOrder->get('field_vih_eo_persons')->getValue();
    foreach ($subscribedPersonsIds as $index => $subscribedPersonId) {
      $subscribedPerson = Paragraph::load($subscribedPersonId['target_id']);

      //filling personal information
      $participant = array();
      $participant['firstName'] = $subscribedPerson->field_vih_oe_first_name->value;
      $participant['lastName'] = $subscribedPerson->field_vih_oe_last_name->value;
      $participant['email'] = $subscribedPerson->field_vih_oe_email->value;

      $addedParticipants[] = $participant;
    }

    $form_state->set('addedParticipants', $addedParticipants);
  }
}
