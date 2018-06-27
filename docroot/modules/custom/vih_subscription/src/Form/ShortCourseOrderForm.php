<?php
/**
 * @file
 * Contains \Drupal\vih_subscription\Form\ShortCourseOrderForm.
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
class ShortCourseOrderForm extends FormBase {
  protected $course;
  protected $courseOrder;
  protected $price;

  /**
   * Returns page title
   */
  public function getTitle() {
    return $this->t('Tilmelding');
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'vih-subscription-short-course-order-form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, NodeInterface $course = NULL, NodeInterface $order = NULL, $checksum = NULL) {
    $form['#attached']['library'][] = 'vih_subscription/vih-subscription-terms-and-conditions-modal';
    $form['#attached']['library'][] = 'vih_subscription/vih-subscription-suboptions-container';

    //START VARIABLES INIT //
    $course = \Drupal::service('entity.repository')->getTranslationFromContext($course);

    $this->course = $course;
    $this->price = $course->field_vih_sc_price->value;

    $optionGroups = array();
    $optionGroupOptions = array();
    $optionGroupOptionsPrices = array();
    $optionGroupSuboptions = array();

    foreach ($course->field_vih_sc_option_groups->referencedEntities() as $optionGroupDelta => $optionGroup) {
      $optionGroup = \Drupal::service('entity.repository')->getTranslationFromContext($optionGroup);

      $optionGroups[$optionGroupDelta] = $optionGroup->field_vih_og_title->value;

      foreach ($optionGroup->field_vih_og_options->referencedEntities() as $optionDelta => $option) {
        $option = \Drupal::service('entity.repository')->getTranslationFromContext($option);

        $optionGroupOptions[$optionGroupDelta][$optionDelta] = $option->field_vih_option_title->value;

        $additionalPrice = $option->field_vih_option_price_addition->value;
        if (isset($additionalPrice) && floatval($additionalPrice) !== 0.00) {
          $optionGroupOptionsPrices[$optionGroupDelta][$optionDelta] = $additionalPrice;
        }

        foreach ($option->field_vih_option_suboptions as $suboptionDelta => $suboption) {
          $optionGroupSuboptions[$optionGroupDelta][$optionDelta][$suboptionDelta] = $suboption->value;
        }
      }
    }
    $form_state->set('optionGroups', $optionGroups);
    $form_state->set('optionGroupOptions', $optionGroupOptions);
    $form_state->set('optionGroupOptionsPrices', $optionGroupOptionsPrices);
    $form_state->set('optionGroupSuboptions', $optionGroupSuboptions);

    $addedParticipants = $form_state->get('addedParticipants');
    $form['#addedParticipants'] = empty($addedParticipants);

    if ($order != NULL) {
      if (Crypt::hashEquals($checksum, VihSubscriptionUtils::generateChecksum($course, $order))) {
        $this->courseOrder = $order;
        $this->price = $this->courseOrder->field_vih_sco_price->value;

        if (!isset($addedParticipants)) {
          //preloading data
          $this->populateData($this->courseOrder, $form, $form_state);
          $addedParticipants = $form_state->get('addedParticipants');
        }
      }
    }

    //checking the limits
    $personsLimit = $course->field_vih_sc_persons_limit->value;
    $personsSubscribed = VihSubscriptionUtils::calculateSubscribedPeopleNumber($course);

    if ($personsLimit == 0) { //unlimited
      $personsLimit = PHP_INT_MAX;
    }
    //END VARIABLES INIT //

    //START GENERAL DATA //
    if(!empty($addedParticipants)){
      $form['price'] = array(
      '#markup' => 'DKK ' . number_format($this->price, 0, ',', '.'),
    );
    } else {
      $form['price'] = array(
        '#markup' => 'DKK ' . '0' ,
      );
    }

    $form['status_messages'] = [
      '#type' => 'status_messages',
      '#weight' => -10,
      '#prefix' => '<div id="messages">',
      '#suffix' => '</div>'
    ];

    $form['#course'] = array(
      'title' => $course->getTitle(),
      'url' => $course->toUrl()
    );
    //END GENERAL DATA //

    //START ADD NEW PARTICIPANT CONTAINER//
    $form['newParticipantContainer'] = [
      '#type' => 'container',
      '#prefix' => '<div id="new-participant-container-wrapper">',
      '#suffix' => '</div>',
      '#tree' => TRUE
    ];

    $form['availableOptionsContainer'] = array(
      '#type' => 'container',
      '#prefix' => '<div id="available-options-container-wrapper">',
      '#suffix' => '</div>',
      '#tree' => TRUE
    );

    $participant_form = $form_state->get('participantForm');
    // Show participant form if no participant added.
    if (empty($addedParticipants)) {
      $participant_form = TRUE;
    }

    if ($participant_form) {
      if (count($addedParticipants) + $personsSubscribed < $personsLimit) {
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
        $form['newParticipantContainer']['newParticipantFieldset']['cpr'] = array(
          '#type' => 'textfield',
          '#title' => $this->t('CPR'),
          '#placeholder' => $this->t('CPR'),
          '#required' => TRUE,
          '#pattern' => '[0-9]{10}',
        );

        if (empty($addedParticipants)) {
          //Do not collapse form if no participants added
          $collapse_toggle_class = 'class = "hidden"';
          $collapsed_elements_class = 'class = "collapse in"';
          //Disable submit button and hide extra submit button if no participants added
          $form['actions']['submit']['#attributes']['class'][] = 'disabled';
          $form['extra_actions']['submit']['#attributes']['class'][] = 'hidden';
        }
        else {
          // Collapse form if any participants added.
          $collapse_toggle_class = NULL;
          $collapsed_elements_class = 'class = "collapse"';
        }
        $form['newParticipantContainer']['newParticipantFieldset']['email'] = array(
          '#type' => 'textfield',
          '#title' => $this->t('E-mail address'),
          '#placeholder' => $this->t('E-mail address'),
          '#required' => TRUE,
          '#prefix' => '<a data-toggle="collapse" data-target="#participant-form-collapse" id="participant-form-collapse-switch" ' .
            $collapse_toggle_class . ' >' . t('Change address or email') .
            '</a><div id="participant-form-collapse" ' . $collapsed_elements_class . ' >',
        );
        $form['newParticipantContainer']['newParticipantFieldset']['newsletter'] = array(
          '#type' => 'checkbox',
          '#title' => $this->t('Get updates from the school'),
        );
        $form['newParticipantContainer']['newParticipantFieldset']['address'] = array(
          '#type' => 'textfield',
          '#title' => $this->t('Address'),
          '#placeholder' => $this->t('Address'),
          '#required' => TRUE,
        );
        $form['newParticipantContainer']['newParticipantFieldset']['house']['houseNumber'] = array(
          '#type' => 'textfield',
          '#title' => $this->t('House no.'),
          '#placeholder' => $this->t('House no.'),
          '#required' => TRUE,
          '#prefix' => '<div class="row"><div class="col-xs-4">',
          '#suffix' => '</div>',
        );
        $form['newParticipantContainer']['newParticipantFieldset']['house']['houseLetter'] = array(
          '#type' => 'textfield',
          '#title' => $this->t('House letter'),
          '#placeholder' => $this->t('House letter'),
          '#prefix' => '<div class="col-xs-4">',
          '#suffix' => '</div>',
        );
        $form['newParticipantContainer']['newParticipantFieldset']['house']['houseFloor'] = array(
          '#type' => 'textfield',
          '#title' => $this->t('Floor'),
          '#placeholder' => $this->t('Floor'),
          '#prefix' => '<div class="col-xs-4">',
          '#suffix' => '</div></div>',
        );
        $form['newParticipantContainer']['newParticipantFieldset']['zip'] = array(
          '#type' => 'textfield',
          '#title' => $this->t('Zipcode'),
          '#placeholder' => $this->t('Zipcode'),
          '#required' => TRUE,
          '#prefix' => '<div class="row"><div class="col-xs-12 col-sm-4">',
          '#suffix' => '</div>',
        );
        $form['newParticipantContainer']['newParticipantFieldset']['city'] = array(
          '#type' => 'textfield',
          '#title' => $this->t('City'),
          '#placeholder' => $this->t('City'),
          '#required' => TRUE,
          '#prefix' => '<div class="col-xs-12 col-sm-8">',
          '#suffix' => '</div></div>',
        );
        $form['newParticipantContainer']['newParticipantFieldset']['country'] = array(
          '#type' => 'select',
          '#title' => $this->t('Country'),
          '#options' => CourseOrderOptionsList::getNationalityList(),
          '#default_value' => 'DK',
          '#required' => TRUE,
        );
        $form['newParticipantContainer']['newParticipantFieldset']['comment'] = array(
          '#type' => 'textarea',
          '#title' => $this->t('Comment'),
          '#placeholder' => $this->t('Comment'),
          '#rows' => 3,
          '#suffix' => '</div>',
        );

        //START AVAILABLE OPTIONS CONTAINER //
        $form['availableOptionsContainer'] = array(
          '#type' => 'markup',
          '#prefix' => '<div id="available-options-container-wrapper">',
          '#suffix' => '</div>',
          '#tree' => TRUE
        );

        foreach ($optionGroups as $optionGroupDelta => $optionGroupName) {
          $form['availableOptionsContainer']['optionGroups'][$optionGroupDelta]['option'] = array(
            '#title' => $optionGroupName,
            '#type' => 'radios',
            '#options' => $this->getOptionGroupOptionsWithPrice($form_state, $optionGroupDelta),
            '#empty_value' => -1,
            '#required' => TRUE
          );

          // Disabled options which reached the limit.
          foreach ($this->getOptionGroupOptionsDisabled($form_state, $optionGroupDelta) as $disabledOption) {
            $form['availableOptionsContainer']['optionGroups'][$optionGroupDelta]['option'][$disabledOption]['#disabled'] = TRUE;
          }

          //adding suboptions, if any
          foreach ($optionGroupOptions[$optionGroupDelta] as $optionDelta => $optionName) {
            if (isset($optionGroupSuboptions[$optionGroupDelta][$optionDelta])) {
              $form['availableOptionsContainer']['optionGroups'][$optionGroupDelta]['options'][$optionDelta]['suboptions-container'] = array(
                '#type' => 'container',
                '#states' => array(
                  'visible' => array(
                    ':input[name="availableOptionsContainer[optionGroups][' . $optionGroupDelta . '][option]"]' => array('value' => $optionDelta),
                  ),
                ),
                '#attributes' => array(
                  'class' => array('vih-suboptions-container'),
                  'data-option-group-delta' => $optionGroupDelta,
                  'data-option-delta' => $optionDelta,
                ),
              );

              $form['availableOptionsContainer']['optionGroups'][$optionGroupDelta]['options'][$optionDelta]['suboptions-container']['suboption'] = array(
                '#type' => 'radios',
                '#title' => $optionName,
                '#options' => $optionGroupSuboptions[$optionGroupDelta][$optionDelta],
                '#empty_value' => -1,
                '#default_value' => 0
              );
            }
          }
        }

        $form['availableOptionsContainer']['addParticipantOptions'] = array(
          '#id' => 'add-participant-options',
          '#name' => 'add-participant-options',
          '#type' => 'submit',
          '#value' => $this->t('Submit'),
          '#submit' => array('::addParticipantOptions'),
          '#ajax' => [
            'callback' => '::ajaxAddRemoveParticipantOptionsCallback',
            'progress' => array(
              'type' => 'none'
            )
          ],
          '#limit_validation_errors' => array(
            ['newParticipantContainer', 'newParticipantFieldset'],
            ['availableOptionsContainer']
          ),
        );
      }
      else {
        $form['newParticipantContainer']['message'] = array(
          '#markup' => $this->t('Denne begivenhed kan ikke allokere flere deltagere')
        );
      }
    }
    else {
      $form['availableOptionsContainer']['addParticipantOptions'] = [
        '#id' => 'add-participant-options',
        '#name' => 'add-participant-options',
        '#type' => 'submit',
        '#value' => $this->t('Add'),
        '#submit' => ['::editParticipantOptions'],
        '#ajax' => [
          'callback' => '::ajaxAddRemoveParticipantOptionsCallback',
          'progress' => [
            'type' => 'none'
          ]
        ],
        '#limit_validation_errors' => [],
      ];
    }
    //END AVAILABLE OPTIONS CONTAINER //
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
          '#id' => 'edit-participant-options-' . $addedParticipantDelta,
          '#name' => 'edit-participant-options-' . $addedParticipantDelta,
          '#type' => 'submit',
          '#value' => $this->t('Edit'),
          '#submit' => array('::editParticipantOptions'),
          '#attributes' => array('class' => array('btn-primary', 'btn-sm')),
          '#ajax' => [
            'callback' => '::ajaxAddRemoveParticipantOptionsCallback',
            'progress' => array(
              'type' => 'none'
            )
          ],
          '#participantOptionsDelta' => $addedParticipantDelta,
          '#limit_validation_errors' => array()
        ];

        $form['addedParticipantsContainer']['controlButtons']['removeButton-' . $addedParticipantDelta] = [
          '#id' => 'remove-participant-options-' . $addedParticipantDelta,
          '#name' => 'remove-participant-options-' . $addedParticipantDelta,
          '#type' => 'submit',
          '#value' => $this->t('Remove'),
          '#submit' => array('::removeParticipantOptions'),
          '#attributes' => array('class' => array('btn-danger', 'btn-sm')),
          '#ajax' => [
            'callback' => '::ajaxAddRemoveParticipantOptionsCallback',
            'progress' => array(
              'type' => 'none'
            )
          ],
          '#participantOptionsDelta' => $addedParticipantDelta,
          '#limit_validation_errors' => array()
        ];
      }
    }
    // END added participants container

    //START OTHER GENERAL DATA //
    $config = $this->config(SubscriptionsGeneralSettingsForm::$configName);

    $form['#registration_text'] = (\Drupal::languageManager()->getCurrentLanguage()
        ->getId() === 'en') ? $config->get('vih_subscription_short_course_registration_page_text_en') : $config->get('vih_subscription_short_course_registration_page_text_da');

    if (!empty($terms_and_conditions_page_id = $config->get('vih_subscription_short_course_terms_and_conditions_page'))) {
      $terms_and_conditions_link = CommonFormUtils::getTermsAndConditionsLink($terms_and_conditions_page_id);
      $form['terms_and_conditions'] = array(
        '#type' => 'checkboxes',
        '#options' => array('accepted' => $this->t('I agree to the @terms_and_conditions', array('@terms_and_conditions' => $terms_and_conditions_link))),
        '#title' => $this->t('Terms and conditions'),
        '#required' => TRUE,
        '#attributes' => [
          'required' => ''
        ],
      );
    }

    // Making sure that default value stays if it's there
    if (!isset($form['order_comment'])) {
      $form['order_comment'] = array();
    }
    $form['order_comment'] += array(
      '#type' => 'textarea',
      '#title' => $this->t('Comment'),
      '#placeholder' => $this->t('Comment'),
      '#rows' => 3,
    );
    //END OTHER GENERAL DATA //

    //START FORM CONTROLS //
    $form['actions'] = [
      '#type' => 'actions',
    ];
    $form['actions']['submit'] = array(
      '#type' => 'submit',
      '#id' => 'vih-course-submit',
      '#value' => $this->t('Continue'),
      '#attributes' => array('class' => array('btn-success')),
      '#limit_validation_errors' => array(
        ['newParticipantContainer', 'newParticipantFieldset', 'firstName'],
        ['newParticipantContainer', 'newParticipantFieldset', 'lastName'],
        ['newParticipantContainer', 'newParticipantFieldset', 'email'],
        ['newParticipantContainer', 'newParticipantFieldset', 'cpr'],
        ['terms_and_conditions'],
        ['order_comment']
      ),
      '#submit' => array('::submitForm')
    );
    
    $form['extra_actions']['submit'] = array(
      '#type' => 'submit',
      '#id' => 'vih-course-submit-extra',
      '#value' => $this->t('Continue'),
      '#attributes' => array('class' => array('btn-success')),
      '#limit_validation_errors' => array(
        ['newParticipantContainer', 'newParticipantFieldset', 'firstName'],
        ['newParticipantContainer', 'newParticipantFieldset', 'lastName'],
        ['newParticipantContainer', 'newParticipantFieldset', 'email'],
        ['newParticipantContainer', 'newParticipantFieldset', 'cpr'],
        ['terms_and_conditions'],
        ['order_comment']
      ),
      '#submit' => array('::submitForm')
    );

    //Disable submit button and hide extra submit button if no participants added
    if(empty($addedParticipants)){
      $form['actions']['submit']['#attributes']['class'][] = 'disabled';
      $form['extra_actions']['submit']['#attributes']['class'][] = 'hidden';
    }
    //END FORM CONTROLS //

    $form['#theme'] = 'vih_subscription_short_course_order_form';
    $form_state->setCached(FALSE);

    return $form;
  }

  /**
   * Callback function that adds participant and the selected options to the participants list.
   *
   * @param array $form
   * @param FormStateInterface $form_state
   */
  public function addParticipantOptions(array &$form, FormStateInterface $form_state) {
    $userInput = $form_state->getUserInput();

    if ($form_state->hasAnyErrors()) {
      $response = new AjaxResponse();
      $response->addCommand(new ReplaceCommand('#status_messages', $form['status_messages']));
      return $response;
    }

    //variables to get option names from
    $optionGroups = $form_state->get('optionGroups');
    $optionGroupOptions = $form_state->get('optionGroupOptions');
    $optionGroupOptionsPrices = $form_state->get('optionGroupOptionsPrices');
    $optionGroupSuboptions = $form_state->get('optionGroupSuboptions');

    //existing list of added participants
    $addedParticipants = $form_state->get('addedParticipants');

    //filling personal information
    $participant = array();
    $participant['firstName'] = $userInput['newParticipantContainer']['newParticipantFieldset']['firstName'];
    $participant['lastName'] = $userInput['newParticipantContainer']['newParticipantFieldset']['lastName'];
    $participant['email'] = $userInput['newParticipantContainer']['newParticipantFieldset']['email'];
    $participant['cpr'] = $userInput['newParticipantContainer']['newParticipantFieldset']['cpr'];
    $participant['address'] = $userInput['newParticipantContainer']['newParticipantFieldset']['address'];
    $participant['house']['houseNumber'] = $userInput['newParticipantContainer']['newParticipantFieldset']['house']['houseNumber'];
    $participant['house']['houseLetter'] = $userInput['newParticipantContainer']['newParticipantFieldset']['house']['houseLetter'];
    $participant['house']['houseFloor'] = $userInput['newParticipantContainer']['newParticipantFieldset']['house']['houseFloor'];
    $participant['city'] = $userInput['newParticipantContainer']['newParticipantFieldset']['city'];
    $participant['zip'] = $userInput['newParticipantContainer']['newParticipantFieldset']['zip'];
    $participant['country'] = $userInput['newParticipantContainer']['newParticipantFieldset']['country'];
    $participant['newsletter'] = $userInput['newParticipantContainer']['newParticipantFieldset']['newsletter'];
    $participant['comment'] = $userInput['newParticipantContainer']['newParticipantFieldset']['comment'];

    //filling ordered options
    $participant['orderedOptions'] = array();
    foreach ($userInput['availableOptionsContainer']['optionGroups'] as $optionGroupDelta => $optionGroupSelection) {
      $optionDelta = $optionGroupSelection['option'];
      $optionName = NULL;
      $optionPrice = NULL;
      $subOptionDelta = NULL;
      $subOptionName = NULL;
      $subOptionDelta = NULL;

      if (isset($optionDelta)) {
        $optionName = $optionGroupOptions[$optionGroupDelta][$optionDelta];
        if (isset($optionGroupOptionsPrices[$optionGroupDelta][$optionDelta])) {
          $optionPrice = $optionGroupOptionsPrices[$optionGroupDelta][$optionDelta];
        }
        if (isset($optionGroupSelection['options'][$optionDelta])) {
          $subOptionDelta = $optionGroupSelection['options'][$optionDelta]['suboptions-container']['suboption'];
          if (isset($subOptionDelta)) {
            $subOptionName = $optionGroupSuboptions[$optionGroupDelta][$optionDelta][$subOptionDelta];
          }
        }
      }

      $participant['orderedOptions'][$optionGroupDelta] = array(
        'optionGroup' => [
          'delta' => $optionGroupDelta,
          'name' => $optionGroups[$optionGroupDelta]
        ],
        'option' => [
          'delta' => $optionDelta,
          'name' => $optionName,
          'additionalPrice' => $optionPrice
        ],
        'suboption' => [
          'delta' => $subOptionDelta,
          'name' => $subOptionName
        ]
      );
    }
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
  function editParticipantOptions(array &$form, FormStateInterface $form_state) {
    $userInput = $form_state->getUserInput();

    //getting triggering element
    $triggeringElement = $form_state->getTriggeringElement();
    $addedParticipants = $form_state->get('addedParticipants');

    if (isset($triggeringElement['#participantOptionsDelta'])) {
      $participantToEdit = $addedParticipants[$triggeringElement['#participantOptionsDelta']];
      //unsetting the participant
      unset($addedParticipants[$triggeringElement['#participantOptionsDelta']]);
      $form_state->set('addedParticipants', $addedParticipants);

      //filling personal information
      $userInput['newParticipantContainer']['newParticipantFieldset']['firstName'] = $participantToEdit['firstName'];
      $userInput['newParticipantContainer']['newParticipantFieldset']['lastName'] = $participantToEdit['lastName'];
      $userInput['newParticipantContainer']['newParticipantFieldset']['email'] = $participantToEdit['email'];
      $userInput['newParticipantContainer']['newParticipantFieldset']['cpr'] = $participantToEdit['cpr'];
      $userInput['newParticipantContainer']['newParticipantFieldset']['address'] = $participantToEdit['address'];
      $userInput['newParticipantContainer']['newParticipantFieldset']['house']['houseNumber'] = $participantToEdit['house']['houseNumber'];
      $userInput['newParticipantContainer']['newParticipantFieldset']['house']['houseLetter'] = $participantToEdit['house']['houseLetter'];
      $userInput['newParticipantContainer']['newParticipantFieldset']['house']['houseFloor'] = $participantToEdit['house']['houseFloor'];
      $userInput['newParticipantContainer']['newParticipantFieldset']['city'] = $participantToEdit['city'];
      $userInput['newParticipantContainer']['newParticipantFieldset']['zip'] = $participantToEdit['zip'];
      $userInput['newParticipantContainer']['newParticipantFieldset']['country'] = $participantToEdit['country'];
      $userInput['newParticipantContainer']['newParticipantFieldset']['newsletter'] = $participantToEdit['newsletter'];
      $userInput['newParticipantContainer']['newParticipantFieldset']['comment'] = $participantToEdit['comment'];

      //filling options
      foreach ($participantToEdit['orderedOptions'] as $optionGroupDelta => $orderedOption) {
        $optionDelta = $orderedOption['option']['delta'];
        $subOptionDelta = NULL;
        if (isset($orderedOption['suboption']['delta'])) {
          $subOptionDelta = $orderedOption['suboption']['delta'];
        }

        $userInput['availableOptionsContainer']['optionGroups'][$optionGroupDelta] = [
          'option' => $optionDelta,
          'options' => [
            $optionDelta => [
              'suboptions-container' => [
                'suboption' => $subOptionDelta
              ]
            ]
          ]
        ];
      }

      $form_state->setUserInput($userInput);
    }
    else {
      // Setting data from first (main) participant as a default values for
      // new participant.
      $main_participant = array();
      if (count($addedParticipants) >= 1) {
        $main_participant = array_shift($addedParticipants);
      }
      if (!empty($main_participant)) {
        $userInput['newParticipantContainer']['newParticipantFieldset']['email'] = $main_participant['email'];
        $userInput['newParticipantContainer']['newParticipantFieldset']['address'] = $main_participant['address'];
        $userInput['newParticipantContainer']['newParticipantFieldset']['house']['houseNumber'] = $main_participant['house']['houseNumber'];
        $userInput['newParticipantContainer']['newParticipantFieldset']['house']['houseLetter'] = $main_participant['house']['houseLetter'];
        $userInput['newParticipantContainer']['newParticipantFieldset']['house']['houseFloor'] = $main_participant['house']['houseFloor'];
        $userInput['newParticipantContainer']['newParticipantFieldset']['city'] = $main_participant['city'];
        $userInput['newParticipantContainer']['newParticipantFieldset']['zip'] = $main_participant['zip'];
        $userInput['newParticipantContainer']['newParticipantFieldset']['country'] = $main_participant['country'];
        $userInput['newParticipantContainer']['newParticipantFieldset']['newsletter'] = $main_participant['newsletter'];
        $userInput['newParticipantContainer']['newParticipantFieldset']['comment'] = $main_participant['comment'];
        $form_state->setUserInput($userInput);
      }
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
  function removeParticipantOptions(array &$form, FormStateInterface $form_state) {
    //getting triggering element
    $triggeringElement = $form_state->getTriggeringElement();
    $addedParticipants = $form_state->get('addedParticipants');
    //unsetting the participant
    unset($addedParticipants[$triggeringElement['#participantOptionsDelta']]);
    $form_state->set('addedParticipants', $addedParticipants);

    //rebuilding form
    $form_state->setRebuild();
  }

  /**
   * Ajax callback function that fetches the refreshed version of added participants with options, resets add new participant form part
   * as well as updated the total course price
   *
   * @param array $form
   * @param FormStateInterface $form_state
   * @return AjaxResponse
   */
  public function ajaxAddRemoveParticipantOptionsCallback(array &$form, FormStateInterface $form_state) {
    $response = new AjaxResponse();

    //checking for any errors
    if ($form_state->hasAnyErrors()) {
      $response->addCommand(new HtmlCommand('#status_messages', $form['status_messages']));
      //redrawing elements
      $response->addCommand(new ReplaceCommand('#new-participant-container-wrapper', $form['newParticipantContainer']));
      $response->addCommand(new ReplaceCommand('#available-options-container-wrapper', $form['availableOptionsContainer']));
      return $response;
    }

    //resetting elements
    $response->addCommand(new ReplaceCommand('#new-participant-container-wrapper', $form['newParticipantContainer']));
    $response->addCommand(new ReplaceCommand('#available-options-container-wrapper', $form['availableOptionsContainer']));

    //updating the price
    $response->addCommand(new HtmlCommand('#vih-course-price', 'DKK ' . number_format($this->calculatePrice($form_state), 0, ',', '.')));

    //updating added participants
    $response->addCommand(new ReplaceCommand('#added-participants-container-wrapper', $form['addedParticipantsContainer']));

    //resetting the error, if any
    $response->addCommand(new HtmlCommand('#status_messages', $form['status_messages']));
    
    //move suboptions containers to the right places in DOM
    $response->addCommand(new InvokeCommand(NULL, 'moveSuboptionsContainer'));
    
    //Enable submit button and show extra submit button if participants added
    if (!empty($form['addedParticipantsContainer']['#addedParticipants'])) {
      $response->addCommand(new InvokeCommand('#vih-course-submit-extra', 'removeClass', ['hidden']));
      $response->addCommand(new InvokeCommand('#vih-course-submit', 'removeClass', ['disabled']));
      $response->addCommand(new InvokeCommand('#form-bottom-wrapper', 'removeClass', ['hidden']));
    }
    else {
      //Disable submit button and hide extra submit button if no participants added
      $response->addCommand(new InvokeCommand('#vih-course-submit-extra', 'addClass', ['hidden']));
      $response->addCommand(new InvokeCommand('#form-bottom-wrapper', 'addClass', ['hidden']));
      $response->addCommand(new InvokeCommand('#vih-course-submit', 'addClass', ['disabled']));
    }

    return $response;
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
    $triggeringElement = $form_state->getTriggeringElement();

    // Add participant button.
    if ($triggeringElement['#id'] == 'add-participant-options') {
      $userInput = $form_state->getUserInput();

      // Checking that we don't have any option selected of option that reached the stock value limit.
      foreach ($this->course->field_vih_sc_option_groups->referencedEntities() as $optionGroupDelta => $optionGroup) {
        $selectedOptionDelta = $userInput['availableOptionsContainer']['optionGroups'][$optionGroupDelta]['option'];

        if (in_array($selectedOptionDelta, $this->getOptionGroupOptionsDisabled($form_state, $optionGroupDelta))) {
          $form_state->setError($form['availableOptionsContainer']['optionGroups'][$optionGroupDelta]['option'], $this->t('This option exceeds limit and cannot be selected'));
        }
      }
    }

    //submit button
    if ($triggeringElement['#id'] == 'vih-course-submit' or $triggeringElement['#id'] == 'vih-course-submit-extra') {
      $form_state->clearErrors();

      $addedParticipants = $form_state->get('addedParticipants');
      //not added participants
      if (!count($addedParticipants)) {
        $form_state->setError($form['newParticipantContainer']['newParticipantFieldset']['firstName'], $this->t('Please add, at least, one participant'));
        $form_state->setError($form['newParticipantContainer']['newParticipantFieldset']['lastName'], $this->t('Please add, at least, one participant'));
        $form_state->setError($form['newParticipantContainer']['newParticipantFieldset']['email'], $this->t('Please add, at least, one participant'));
        $form_state->setError($form['newParticipantContainer']['newParticipantFieldset']['cpr'], $this->t('Please add, at least, one participant'));
      }
      $config = $this->config(SubscriptionsGeneralSettingsForm::$configName);
      if (empty($form_state->getValue('terms_and_conditions')['accepted']) && !empty($config->get('vih_subscription_short_course_terms_and_conditions_page'))) {
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
      $optionGroups = $this->course->field_vih_sc_option_groups->referencedEntities();

      foreach ($addedParticipants as $addedParticipant) {

        //going though options
        $orderedOptions = array();

        foreach ($addedParticipant['orderedOptions'] as $optionGroupDelta => $orderedOption) {
          $optionDelta = $orderedOption['option']['delta'];
          $subOptionDelta = NULL;

          //option group
          $optionGroup = $optionGroups[$optionGroupDelta];

          //option
          $options = $optionGroup->field_vih_og_options->referencedEntities();
          $option = $options[$optionDelta];

          //suboption
          $suboption = NULL;
          if ($option && isset($orderedOption['suboption']['delta'])) {
            $suboptions = $option->field_vih_option_suboptions;
            $suboption = $suboptions[$orderedOption['suboption']['delta']]->value;
          }

          $orderedOption = Paragraph::create([
            'type' => 'vih_ordered_option',
            'field_vih_oo_group_name' => $optionGroup->field_vih_og_title->value,
            'field_vih_oo_option_name' => $option->field_vih_option_title->value,
            'field_vih_oo_price_addition' => $option->field_vih_option_price_addition->value,
            'field_vih_oo_suboption' => $suboption,
          ]);
          $orderedOptions[] = $orderedOption;
        }

        //Get birthdate from CPR
        // We need to convert 2 digit year to 4 digit year, not to get 2065 instead of 1965
        $birthdate_year = \DateTime::createFromFormat('y', substr($addedParticipant['cpr'], 4, 2));
        if ($birthdate_year > date('Y')) {
          $birthdate_year = \DateTime::createFromFormat('Y', '19' . substr($addedParticipant['cpr'], 4, 2));
        }

        $birthdate = substr($addedParticipant['cpr'], 0, 4) . $birthdate_year->format('Y');
        $birthdate = \DateTime::createFromFormat('dmY', $birthdate)->format('Y-m-d');
        $adress_arr = [];
        foreach ([
          $addedParticipant['address'],
          $addedParticipant['house']['houseNumber'],
          $addedParticipant['house']['houseLetter'],
          $addedParticipant['house']['houseFloor'],
                 ] as $val) {
          if (!empty($val)) {
            $adress_arr[] = $val;
          }
        }

        //creating participant paragraph
        $subscribedParticipant = Paragraph::create([
          'type' => 'vih_ordered_course_person',
          'field_vih_ocp_first_name' => $addedParticipant['firstName'],
          'field_vih_ocp_last_name' => $addedParticipant['lastName'],
          'field_vih_ocp_email' => $addedParticipant['email'],
          'field_vih_ocp_cpr' => $addedParticipant['cpr'],
          //CPR will be deleted from database immediately, after order is confirmed
          'field_vih_ocp_address' => implode('; ', $adress_arr),
          'field_vih_ocp_city' => $addedParticipant['city'],
          'field_vih_ocp_zip' => $addedParticipant['zip'],
          'field_vih_ocp_country' => $addedParticipant['country'],
          'field_vih_ocp_newsletter' => $addedParticipant['newsletter'],
          'field_vih_ocp_comment' => $addedParticipant['comment'],
          'field_vih_ocp_birthdate' => $birthdate,
          'field_vih_ocp_ordered_options' => $orderedOptions
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
    if ($this->courseOrder == NULL) {
      //creating the Course Order
      $this->courseOrder = Node::create(array(
        'type' => 'vih_short_course_order',
        'status' => 1, //We restrict direct access to the node in site_preprocess_node hook
        'title' => $this->course->getTitle() . ' - kursus tilmelding - ' . $firstParticipantName . ' - '
          . \Drupal::service('date.formatter')->format(time(), 'short'),
        'field_vih_sco_persons' => $subscribedParticipants,
        'field_vih_sco_course' => $this->course->id(),
        'field_vih_sco_status' => 'pending',
        'field_vih_sco_price' => $orderPrice,
        'field_vih_sco_comment' => $form_state->getValue('order_comment')
      ));
    }
    else {
      //removing old participants paragraphs, and replacing with new ones
      $subscribedPersonsIds = $this->courseOrder->get('field_vih_sco_persons')->getValue();

      foreach ($subscribedPersonsIds as $subscribedPersonId) {
        $subscribedPerson = Paragraph::load($subscribedPersonId['target_id']);

        if ($subscribedPerson) {
          //removing added options
          $orderedOptionsIds = $subscribedPerson->get('field_vih_ocp_ordered_options')->getValue();

          foreach ($orderedOptionsIds as $orderedOptionId) {
            $orderedOption = Paragraph::load($orderedOptionId['target_id']);

            if ($orderedOption) {
              $orderedOption->delete;
            }
          }

          //finally removing the subscribed person itself
          $subscribedPerson->delete();
        }
      }
      //adding new participants
      $this->courseOrder->set('field_vih_sco_persons', $subscribedParticipants);

      $this->courseOrder->set('field_vih_sco_price', $orderPrice);
      $this->courseOrder->set('field_vih_sco_comment', $form_state->getValue('order_comment'));
    }

    //saving the order (works for both new/edited)
    $this->courseOrder->save();

    //redirecting to confirmation page
    $form_state->setRedirect('vih_subscription.subscription_confirmation_redirect', [
      'subject' => $this->course->id(),
      'order' => $this->courseOrder->id(),
      'checksum' => VihSubscriptionUtils::generateChecksum($this->course, $this->courseOrder)
    ]);
  }

  /**
   * Traverses through the selected options and calculates the total price for the course.
   *
   * @param FormStateInterface $form_state
   * @return mixed
   */
  private function calculatePrice(FormStateInterface $form_state) {
    $base_price = $this->course->field_vih_sc_price->value;

    $addedParticipants = $form_state->get('addedParticipants');

    if (count($addedParticipants) > 0) {
      //calculating persons
      $base_price *= count($addedParticipants);

      //calculating options
      $optionGroups = $this->course->field_vih_sc_option_groups->referencedEntities();
      foreach ($addedParticipants as $addedParticipant) {
        foreach ($addedParticipant['orderedOptions'] as $orderedOption) {
          if (isset($orderedOption['option']['delta'])) {
            $selectedOptionGroup = $optionGroups[$orderedOption['optionGroup']['delta']];

            $options = $selectedOptionGroup->field_vih_og_options->referencedEntities();
            $selectedOption = $options[$orderedOption['option']['delta']];

            $base_price += $selectedOption->field_vih_option_price_addition->value;
          }
        }
      }
    }

    $this->price = $base_price;
    return $this->price;
  }

  /**
   * Populate the data into the form the existing courseOrder
   *
   * @param NodeInterface $courseOrder
   * @param $form
   * @param $form_state
   */
  private function populateData(NodeInterface $courseOrder, &$form, &$form_state) {
    //variables that are used for extracing ordered options information
    $optionGroups = $form_state->get('optionGroups');
    $optionGroupOptions = $form_state->get('optionGroupOptions');
    $optionGroupSuboptions = $form_state->get('optionGroupSuboptions');

    $addedParticipants = array();

    //subscribed persons
    $subscribedPersonsIds = $courseOrder->get('field_vih_sco_persons')->getValue();
    foreach ($subscribedPersonsIds as $index => $subscribedPersonId) {
      $subscribedPerson = Paragraph::load($subscribedPersonId['target_id']);

      //filling personal information
      $address_parts = explode('; ', $subscribedPerson->field_vih_ocp_address->value);

      $participant = array();
      $participant['firstName'] = $subscribedPerson->field_vih_ocp_first_name->value;
      $participant['lastName'] = $subscribedPerson->field_vih_ocp_last_name->value;
      $participant['email'] = $subscribedPerson->field_vih_ocp_email->value;
      $participant['cpr'] = $subscribedPerson->field_vih_ocp_cpr->value;
      $participant['address'] = $address_parts[0];
      $participant['house']['houseNumber'] = !empty($address_parts[1]) ? $address_parts[1] : '';
      $participant['house']['houseLetter'] = !empty($address_parts[2]) ? $address_parts[2] : '';
      $participant['house']['houseFloor'] = !empty($address_parts[3]) ? $address_parts[3] : '';
      $participant['city'] = $subscribedPerson->field_vih_ocp_city->value;
      $participant['zip'] = $subscribedPerson->field_vih_ocp_zip->value;
      $participant['country'] = $subscribedPerson->field_vih_ocp_country->value;
      $participant['newsletter'] = $subscribedPerson->field_vih_ocp_newsletter->value;
      $participant['comment'] = $subscribedPerson->field_vih_ocp_comment->value;

      //filling ordered options information
      $orderedOptionsIds = $subscribedPerson->get('field_vih_ocp_ordered_options')->getValue();
      foreach ($orderedOptionsIds as $orderedOptionId) {
        $orderedOption = Paragraph::load($orderedOptionId['target_id']);

        $optionGroupId = array_search($orderedOption->field_vih_oo_group_name->value, $optionGroups);
        $optionId = array_search($orderedOption->field_vih_oo_option_name->value, $optionGroupOptions[$optionGroupId]);
        $additionalPrice = $orderedOption->field_vih_oo_price_addition->value;

        $suboptionId = NULL;
        $suboptionName = NULL;
        if (!empty($optionGroupSuboptions[$optionGroupId][$optionId])) {
          $suboptionId = array_search($orderedOption->field_vih_oo_suboption->value, $optionGroupSuboptions[$optionGroupId][$optionId]);
          $suboptionName = $optionGroupSuboptions[$optionGroupId][$optionId][$suboptionId];
        }

        $participant['orderedOptions'][$optionGroupId] = [
          'optionGroup' => [
            'delta' => $optionGroupId,
            'name' => $optionGroups[$optionGroupId]
          ],
          'option' => [
            'delta' => $optionId,
            'name' => $optionGroupOptions[$optionGroupId][$optionId],
            'additionalPrice' => $additionalPrice,
          ],
          'suboption' => [
            'delta' => $suboptionId,
            'name' => $suboptionName
          ]
        ];
      }

      $addedParticipants[] = $participant;
    }
    $form_state->set('addedParticipants', $addedParticipants);

    $form['order_comment']['#default_value'] = $courseOrder->field_vih_sco_comment->value;
  }

  /**
   * Calculates how many time has a certain option has been already used.
   *
   * Adds up the newly added participants (to this course) to the others orders' option usages.
   *
   * @param $form_state
   * @param $optionGroup
   * @param $option
   */
  private function calculateOptionCurrentUsageCount($form_state, $optionGroupDelta, $optionGroup, $optionDelta, $option) {
    $count = 0;
    $addedParticipants = $form_state->get('addedParticipants');

    if (isset($addedParticipants)) {
      foreach($addedParticipants as $addedParticipant) {
        if (isset($addedParticipant['orderedOptions'])) {
          if (intval($addedParticipant['orderedOptions'][$optionGroupDelta]['option']['delta']) == $optionDelta) {
            $count++;
          }
        }
      }
    }

    $count += VihSubscriptionUtils::calculateOptionUsageCount($this->course, $optionGroup, $option);

    return $count;
  }

  /**
   * Returns a list of deltas of options for a single option group, that reached or exceeded the limit of their stock amount.
   *
   * @param $form_state
   * @param $optionGroupDelta
   *
   * @return array
   */
  private function getOptionGroupOptionsDisabled($form_state, $optionGroupDelta) {
    $optionGroupOptionsDisabled = array();

    $optionGroup = $this->course->field_vih_sc_option_groups->referencedEntities()[$optionGroupDelta];

    foreach ($optionGroup->field_vih_og_options->referencedEntities() as $optionDelta => $option) {
      $option = \Drupal::service('entity.repository')->getTranslationFromContext($option);

      $stockAmount = $option->field_vih_option_stock_amount->value;
      if ($stockAmount) {
        $optionCurrentUsageCount = $this->calculateOptionCurrentUsageCount($form_state, $optionGroupDelta, $optionGroup, $optionDelta, $option);
        if ($optionCurrentUsageCount >= $stockAmount) {
          $optionGroupOptionsDisabled[$optionDelta] = $optionDelta;
        }
      }
    }

    return $optionGroupOptionsDisabled;
  }

  /**
   * Returns a list of options for a single options group. Options are mapped as delta => Option name with price and stock value
   *
   * @param $form_state
   * @param $optionGroupDelta
   */
  private function getOptionGroupOptionsWithPrice($form_state, $optionGroupDelta) {
    $optionGroupOptionsWithPrice = array();

    $optionGroup = $this->course->field_vih_sc_option_groups->referencedEntities()[$optionGroupDelta];

    foreach ($optionGroup->field_vih_og_options->referencedEntities() as $optionDelta => $option) {
      $option = \Drupal::service('entity.repository')->getTranslationFromContext($option);

      $optionGroupOptionsWithPrice[$optionDelta] = $option->field_vih_option_title->value;

      $additionalPrice = $option->field_vih_option_price_addition->value;
      if (isset($additionalPrice) && floatval($additionalPrice) !== 0.00) {
        $optionGroupOptionsWithPrice[$optionDelta] .= " (+ kr. $additionalPrice)";
      }

      $stockAmount = $option->field_vih_option_stock_amount->value;
      if ($stockAmount) {
        $optionCurrentUsageCount = $this->calculateOptionCurrentUsageCount($form_state, $optionGroupDelta, $optionGroup, $optionDelta, $option);
        $remainingAmount = $stockAmount - $optionCurrentUsageCount;

        $optionGroupOptionsWithPrice[$optionDelta] .= ' ' . $this->t("@remaining available", ['@remaining' => $remainingAmount]);
      }
    }

    return $optionGroupOptionsWithPrice;
  }
}
