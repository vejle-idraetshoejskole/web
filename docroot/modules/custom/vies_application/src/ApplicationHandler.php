<?php

namespace Drupal\vies_application;

use Drupal\node\Entity\Node;
use Drupal\taxonomy\Entity\Term;
use Drupal\paragraphs\Entity\Paragraph;
use Drupal\Core\Url;
use Drupal\vih_subscription\Form\EdbbrugsenSettingsForm;
use Drupal\vih_subscription\Form\SubscriptionsGeneralSettingsForm;
use Drupal\vih_subscription\Misc\VihSubscriptionUtils;
use Drupal\vih_subscription\Misc\EDBBrugsenIntegration;
use Drupal\Core\StringTranslation\StringTranslationTrait;

/**
 * Application handler.
 */
class ApplicationHandler {
  use StringTranslationTrait;

  /**
   * Application data.
   */
  private $data;

  /**
   * Application node.
   */
  private $application;

  /**
   * About school questions.
   */
  public static $aboutSchool = [
    'schoolFrom'             => 'Hvilken skole kommer du fra?',
    'schoolHowItsGoing'      => 'Hvordan har du det med at gå i skole?',
    'schoolSubjects'         => 'Hvilke fag kan du godt lide og hvorfor?',
  ];

  /**
   * After school questions.
   */
  public static $afterSchool = [
    'afterSchoolExpectation' => 'Vejle Idrætsefterskole er det rigtige sted for mig, fordi...',
    'afterSchoolHeardFrom'   => 'Hvor har du hørt om Vejle Idrætsefterskole?',
    'afterSchoolComment'     => 'Kommentar',
  ];

  /**
   * Gender key labels definition.
   */
  public static $gender = [
    'm' => 'Mand',
    'f' => 'Kvinde',
  ];

  /**
   * Adult type.
   */
  public static $adultType = [
    'mor' => 'Mor',
    'far' => 'Far',
    'andre'  => 'Andre',
  ];

  /**
   * Construct.
   *
   * @param array $data
   *   Application data.
   */
  public function __construct(array $data) {
    $this->data = $data;
    $this->prepareData();
  }

  /**
   * Full process application function.
   */
  public function process() {
    if ($this->saveData()) {
      $this->sendNotification();
      $this->registerOrder();

      return TRUE;
    }
    return FALSE;
  }

  /**
   * Helper function to prepare data,.
   */
  private function prepareData() {
    $course = Node::load($this->data['course']);
    $this->data['courseTitle'] = $course->getTitle();

    $pattern = '/^course-period-(\d)-courseSlot-(\d)-availableClasses$/';
    $this->data['classes'] = [];
    foreach (preg_grep($pattern, array_keys($this->data)) as $key) {
      $this->data['classes'][] = $this->data[$key];
    }

    $period = Node::load($this->data['period']);
    $period_title = explode(' ', $period->getTitle());
    $this->data['Elev.Klasse'] = substr(trim($period_title[0]), 0, 2);

    $class = Term::load($this->data['classes'][0]);
    $this->data['classTitle'] = $class->getName();

    if(0 <> $this->data['nocpr']){
      $this->data['birthday'] = $this->data['birthdate'];
    }else{
      //Get birthdate from CPR
          // We need to convert 2 digit year to 4 digit year, not to get 2065 instead of 1965
          $birthdate_year = \DateTime::createFromFormat('y', substr($this->data['cpr'], 4, 2));
          if ($birthdate_year->format('Y') > date('Y')) {
            $birthdate_year = \DateTime::createFromFormat('Y', '19' . substr($this->data['cpr'], 4, 2));
          }
          $this->data['birthday'] = substr($this->data['cpr'], 0, 4) . $birthdate_year->format('Y');
          $this->data['birthday'] = \DateTime::createFromFormat('dmY', $this->data['birthday'])->format('Y-m-d');
        }

    $this->data['fullAddress'] = VihSubscriptionUtils::formatAddressToString($this->data);
    foreach ($this->data['parents'] as $key => $parent) {
      $this->data['parents'][$key]['fullAddress'] = VihSubscriptionUtils::formatAddressToString($parent);
    }

    // Classes questions.
    foreach ($this->data['questions'] as $class_tid => $questions) {
      foreach ($questions as $tid => $answer) {
        $question_term = Term::load($tid);
        $type_value = $question_term->get('field_vies_question_type')->getValue();
        if (empty($type_value)) {
          continue;
        }
        $type = $type_value[0]['value'];
        $question_answers = $question_term->get('field_vies_answer')->getValue();

        switch ($type) {
          case 'select':
          case 'radios':
            $answer = $question_answers[$answer]['value'];
            break;

          case 'checkboxes':
            foreach ($answer as $answer_key => $value) {
              if ($answer[$answer_key] === 0) {
                unset($answer[$answer_key]);
                continue;
              }
              $answer[$answer_key] = $question_answers[$answer_key]['value'];
            }
            $answer = implode("\n", $answer);
            break;
        }
        if (!empty($question_term)) {
          $this->data['questions'][$class_tid][$tid] = [
            'question_reference' => $tid,
            'question' => $question_term->getName(),
            'answer' => $answer,
          ];
        }
      }
    }

    // About school questions.
    foreach (self::$aboutSchool as $key => $question) {
      if (empty($this->data[$key])) {
        continue;
      }
      $this->data[$key] = [
        'question' => $question,
        'answer' => $this->data[$key],
      ];
    }

    // After school questions.
    foreach (self::$afterSchool as $key => $question) {
      if (empty($this->data[$key])) {
        continue;
      }
      $this->data[$key] = [
        'question' => $question,
        'answer' => $this->data[$key],
      ];
    }
  }

  /**
   * Wrapper function register order.
   *
   * Sending notification email, changing order status,
   * registering on EDB system.
   */
  public function registerOrder() {
    // EDBBrugsen Integration.
    $edb_brugsen_config = \Drupal::configFactory()->getEditable(EdbbrugsenSettingsForm::$configName);
    if ($edb_brugsen_config->get('active')) {
      $username = $edb_brugsen_config->get('username');
      $password = $edb_brugsen_config->get('password');
      $school_code = $edb_brugsen_config->get('school_code');
      $book_number = $edb_brugsen_config->get('book_number');
      if (!empty($this->data['municipality'])) {
        $this->data['municipality'] = 'Vejle';
      }
      $edb_brugsen_integration = new EDBBrugsenIntegration($username, $password, $school_code, $book_number);
      $registration = $edb_brugsen_integration->convertApplicationToRegistration($this->data);

      $studentCpr = $this->data['cpr'];
      // For foreign students with empty CPR we have to send birthday date.
      // We using CPR field to send this data.
      if (empty($studentCpr)) {
        $studentCpr = date('dmy', strtotime($this->data['birthdate'])) . '-1111';
      }

      $gdpr_agr =$this->data['gdpr_accept'];
      $private_car_accept = $this->data['driving_in_private_car_accept'];
      $registration['EgneFelter.EgetFelt29'] = '[Forening4501]' . date('d.m.Y') . ' Web ' . $gdpr_agr;
      $registration['EgneFelter.EgetFelt27'] = '[Forening4503]' . date('d.m.Y') . ' Web ' . $private_car_accept;
      $registration['EgneFelter.EgetFelt28'] = '[Forening4502]' . date('d.m.Y') . ' Web ' . 'Ja';
      $registration = $edb_brugsen_integration->addStudentCprNr($registration, $studentCpr);

      $synchReply = $edb_brugsen_integration->addRegistration($registration);
      $this->application->set('field_vies_edb_synched', $synchReply['status']);
      $this->application->set('field_vies_edb_synch_message', $synchReply['message']);
      $this->application->save();
    }
  }

  /**
   * Wrapper function to save data.
   */
  public function saveData() {
    $application_node = [
      'type' => 'vies_application_form',
      // We restrict direct access to the node in site_preprocess_node hook.
      'status' => 1,
      'title' => $this->t('Application form: @course - @firstName @lastName @date', [
        '@course' => $this->data['courseTitle'],
        '@firstName' => $this->data['firstName'],
        '@lastName' => $this->data['lastName'],
        '@date' => \Drupal::service('date.formatter')->format(time(), 'short'),
      ]),
      // Application references.
      'field_vies_course' => $this->data['course'],
      'field_vies_period' => $this->data['period'],
      'field_vies_class' => $this->data['classes'],
      // Student information.
      'field_vies_first_name' => $this->data['firstName'],
      'field_vies_last_name' => $this->data['lastName'],
      'field_vies_telefon' => $this->data['telefon'],
      'field_vies_email' => $this->data['email'],
      'field_vies_newsletter' => $this->data['newsletter'],
      'field_vies_address' => $this->data['fullAddress'],
      'field_vies_city' => $this->data['city'],
      'field_vies_municipality' => !empty($this->data['municipality']) ? $this->data['municipality'] : 'Vejle',
      'field_vies_zip' => $this->data['zip'],
      'field_vies_gender' => $this->data['gender'],
      'field_vies_country' => $this->data['country'],
      'field_vies_birthday' => $this->data['birthday'],
      'field_vies_no_cpr' => $this->data['nocpr'],
      'field_vies_gdpr_agreement' => ($this->data['gdpr_accept'] == 'Ja')? 0 : 1,
      'field_vies_private_car_accept' => ($this->data['driving_in_private_car_accept'] == 'Ja')? 0 : 1,
    ];

    // Parents information.
    foreach ($this->data['parents'] as $parent_data) {
      if(0 <> $parent_data['nocpr']){
        $birthdate = $parent_data['birthdate'];
      }else{
        //Get birthdate from CPR
        // We need to convert 2 digit year to 4 digit year, not to get 2065 instead of 1965
        $birthdate_year = \DateTime::createFromFormat('y', substr($parent_data['cpr'], 4, 2));
        if ($birthdate_year->format('Y') > date('Y')) {
          $birthdate_year = \DateTime::createFromFormat('Y', '19' . substr($parent_data['cpr'], 4, 2));
        }
          $birthdate = substr($parent_data['cpr'], 0, 4) . $birthdate_year->format('Y');
          $birthdate = \DateTime::createFromFormat('dmY', $birthdate )->format('Y-m-d');
      }
    $parent = Paragraph::create([
        'type' => 'parent',
        'field_parent_type' => $parent_data['type'],
        'field_parent_first_name' => $parent_data['firstName'],
        'field_parent_last_name' => $parent_data['lastName'],
        'field_parent_telefon' => $parent_data['telefon'],
        'field_parent_email' => $parent_data['email'],
        'field_parent_birthdate' => $birthdate,
        'field_parent_no_cpr' => $parent_data['nocpr'],
        'field_parent_country' => $this->data['country'],
        'field_parent_newsletter' => $parent_data['newsletter'],
        'field_parent_address' => $parent_data['fullAddress'],
        'field_parent_city' => $parent_data['city'],
        'field_parent_municipality' => !empty($parent_data['municipality']) ? $$parent_data['municipality'] : 'Vejle',
        'field_parent_zip' => $this->data['zip'],
        'field_parent_country' => $this->data['country'],
      ]);
      $parent->isNew();
      $parent->save();
      $application_node['field_vies_parents'][$parent->id()] = $parent;

      // Parents Mailchimp subscription.
      if ($parent_data['newsletter']) {
        VihSubscriptionUtils::subscribeToMailchimp($parent_data['firstName'], $parent_data['lastName'], $parent_data['email']);
      }
    }
    // Classes questions.
    foreach ($this->data['questions'] as $questions_data) {
      foreach ($questions_data as $question_data) {
        $question = Paragraph::create([
          'type' => 'app_answer',
          'field_question' => $question_data['question'],
          'field_question_reference' => $question_data['question_reference'],
          'field_answer' => $question_data['answer'],
        ]);
        $question->isNew();
        $question->save();
        $application_node['field_vies_class_questions'][$question->id()] = $question;
      }
    }

    // About school questions.
    foreach (self::$aboutSchool as $key => $value) {
      $question_data = $this->data[$key];
      if (empty($question_data)) {
        continue;
      }
      $question = Paragraph::create([
        'type' => 'app_answer',
        'field_question' => $question_data['question'],
        'field_answer' => $question_data['answer'],
      ]);
      $question->isNew();
      $question->save();
      $application_node['field_vies_about_school'][$question->id()] = $question;

    }

    // After school questions.
    foreach (self::$afterSchool as $key => $value) {
      $question_data = $this->data[$key];
      if (empty($question_data)) {
        continue;
      }
      $question = Paragraph::create([
        'type' => 'app_answer',
        'field_question' => $question_data['question'],
        'field_answer' => $question_data['answer'],
      ]);
      $question->isNew();
      $question->save();
      $application_node['field_vies_afterschool'][$question->id()] = $question;
    }
    // Student Mailchimp subscription.
    if ($this->data['newsletter']) {
      VihSubscriptionUtils::subscribeToMailchimp($this->data['firstName'], $this->data['lastName'], $this->data['email']);
    }

    // Saving the application.
    $this->application = Node::create($application_node);
    $this->application->setPromoted(FALSE);
    $this->application->isNew();
    return $this->application->save();
  }

  /**
   * Wrapper function to send notifications.
   */
  public function sendNotification() {
    // Send email.
    $node_view = node_view($this->application, 'email_teaser');
    $application_rendered = render($node_view)->__toString();

    $logo = '<div style="background-color:#ff6400; width:100%; text-align:center">'
      . '<img src="'
      . \Drupal::request()->getSchemeAndHttpHost()
      . '/themes/custom/site/dist/images/layout-header-logo-vies.png" alt="VIH" />'
      . '</div><br>';

    $config = \Drupal::config(SubscriptionsGeneralSettingsForm::$configName);
    $mail_bcc = $config->get('vih_subscription_application_notifications_bcc_da');
    $mail_subject = $config->get('vih_subscription_application_notifications_subject_da');
    $mail_body = $config->get('vih_subscription_application_notifications_body_da');

    $token = ['@subject_name', '@class_name', '@person_name', '@url', '@application'];
    $message = [
      'to' => $this->application->field_vies_email->value,
      'subject' => $mail_subject,
      'body' => $mail_body,
      'Bcc' => $mail_bcc,
    ];

    $application_url = Url::fromRoute('vies_application.application_form')->setAbsolute()->toString();
    $replacement = [
      $this->data['courseTitle'],
      $this->data['classTitle'],
      $this->application->field_vies_first_name->value . ' ' . $this->application->field_vies_last_name->value,
      '<a href="' . $application_url . '"target=_blank >' . $application_url . '</a>',
      $application_rendered,
    ];

    // Add logo to message body.
    $message['body'] = $logo . $message['body'];

    if (!empty($message)) {
      VihSubscriptionUtils::makeReplacements($message, $token, $replacement);
      VihSubscriptionUtils::sendMail($message);

      foreach ($this->data['parents'] as $parent) {
        $message['to'] = $parent['email'];
        VihSubscriptionUtils::sendMail($message);
      }
    }
  }
}
