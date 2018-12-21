<?php

/**
 * @file
 * Contains \Drupal\vih_subscription\Misc\EDBBrugsenIntegration.
 */

namespace Drupal\vih_subscription\Misc;

use Drupal\node\NodeInterface;
use Drupal\paragraphs\Entity\Paragraph;
use Drupal\vih_subscription\Form\CourseOrderOptionsList;
use EDBBrugs\Client;
use EDBBrugs\Credentials;
use EDBBrugs\RegistrationRepository;
use EDBBrugs\Utility;

class EDBBrugsenIntegration {

  public $registration_repository;
  public $soapWsdlUrl = 'https://www.webtilmeldinger.dk/TilmeldingsFormularV2Ws/Service.asmx?wsdl';

  /**
   * Creates EDBBrugsenIntegration object.
   *
   * @param $username
   * @param $password
   * @param $school_code
   * @param $book_number
   */
  public function __construct($username, $password, $school_code, $book_number) {
    $this->book_number = $book_number;

    $soap = new \SoapClient($this->soapWsdlUrl, array('trace' => 1));
    $credentials = new Credentials($username, $password, $school_code);
    $client = new Client($credentials, $soap);

    $this->registration_repository = new RegistrationRepository($client);
  }

  /**
   * Converts a long course order node to the registration array, which can later on be added via webservice.
   *
   * @param NodeInterface $longCourseOrder
   *
   * @return array
   */
  public function convertLongCourseToRegistration(NodeInterface $longCourseOrder) {
    $edb_utility = new Utility;
    $registration = array();

    if ($longCourseOrder->getType() == 'vih_long_course_order') {
      $registration['Kursus'] = $longCourseOrder->get('field_vih_lco_course')->entity->getTitle();

      //student = elev information
      $registration['Elev.Fornavn'] = $longCourseOrder->get('field_vih_lco_first_name')->value;
      $registration['Elev.Efternavn'] = $longCourseOrder->get('field_vih_lco_last_name')->value;

      $addressParts = explode('; ', $longCourseOrder->get('field_vih_lco_address')->value);
      $addressArr = [
        'address' => $addressParts[0],
        'houseNumber' => $addressParts[1],
        'houseLetter' => !empty($addressParts[2])? $addressParts[2] : NULL ,
        'houseFloor' => !empty($addressParts[3])? $addressParts[2] : NULL ,
      ];

      $registration['Elev.Adresse'] = VihSubscriptionUtils::formatAddressToString($addressArr);
      $registration['Elev.Lokalby'] = NULL;
      $registration['Elev.Postnr'] = $longCourseOrder->get('field_vih_lco_zip')->value;
      $registration['Elev.Bynavn'] = $longCourseOrder->get('field_vih_lco_city')->value;
      $registration['Elev.Kommune'] = $longCourseOrder->get('field_vih_lco_municipality')->value;
      $registration['Elev.Fastnet'] = $longCourseOrder->get('field_vih_lco_telefon')->value;
      $registration['Elev.Mobil'] = $longCourseOrder->get('field_vih_lco_telefon')->value;
      $registration['Elev.Email'] = $longCourseOrder->get('field_vih_lco_email')->value;
      $registration['Elev.Land'] = $edb_utility->getCountryCode($longCourseOrder->get('field_vih_lco_country')->value);
      $registration['Elev.Notat'] = $longCourseOrder->get('field_vih_lco_message')->value;

      // adult = voksen information
      $registration['Voksen.Fornavn'] = $longCourseOrder->get('field_vih_lco_adult_first_name')->value;
      $registration['Voksen.Efternavn'] = $longCourseOrder->get('field_vih_lco_adult_last_name')->value;

      $addressParts = explode('; ', $longCourseOrder->get('field_vih_lco_adult_address')->value);
      $addressAdultArr = [
        'address' => $addressParts[0],
        'houseNumber' => $addressParts[1],
        'houseLetter' => !empty($addressParts[2])? $addressParts[2] : NULL ,
        'houseFloor' => !empty($addressParts[3])? $addressParts[2] : NULL ,
      ];

      $registration['Voksen.Adresse'] = VihSubscriptionUtils::formatAddressToString($addressAdultArr);
      $registration['Voksen.Lokalby'] = NULL;
      $registration['Voksen.Postnr'] = $longCourseOrder->get('field_vih_lco_adult_zip')->value;
      $registration['Voksen.Bynavn'] = $longCourseOrder->get('field_vih_lco_adult_city')->value;
      $registration['Voksen.Fastnet'] = $longCourseOrder->get('field_vih_lco_adult_telefon')->value;
      $registration['Voksen.Mobil'] = $longCourseOrder->get('field_vih_lco_adult_telefon')->value;
      $registration['Voksen.Email'] = $longCourseOrder->get('field_vih_lco_adult_email')->value;
      $registration['Voksen.Land'] = $edb_utility->getCountryCode($longCourseOrder->get('field_vih_lco_adult_nationality')->value);

      $registration['EgneFelter.EgetFelt1'] = '[Fri132]' . $longCourseOrder->get('field_vih_lco_education')->value;
      
      $registration += $this->getDefaultRegistrationValues();
    }
    elseif ($longCourseOrder->getType() == 'vih_short_course_order') {
      $registration += $this->getDefaultRegistrationValues();
    }

    return $registration;
  }

  /**
   * Converts a Ordered Course Person paragraph to the registration array, which can later on be added via webservice.
   *
   * @param NodeInterface $shortCourseOrder
   * @param Paragraph $order_person
   *
   * @return array
   */
  public function convertShortCourseOrderPersonToRegistration(NodeInterface $shortCourseOrder, Paragraph $order_person) {
    $edb_utility = new Utility;
    $registration = array();

    if ($order_person->getType() == 'vih_ordered_course_person') {
      $registration['Kursus'] = $shortCourseOrder->get('field_vih_sco_course')->entity->getTitle();
      //student = elev information
      $registration['Elev.Fornavn'] = $order_person->field_vih_ocp_first_name->value;
      $registration['Elev.Efternavn'] = $order_person->field_vih_ocp_last_name->value;
      $registration['Elev.Email'] = $order_person->field_vih_ocp_email->value;

      $addressParts = explode('; ', $order_person->field_vih_ocp_address->value);
      $addressArr = [
        'address' => $addressParts[0],
        'houseNumber' => $addressParts[1],
        'houseLetter' => $addressParts[2],
        'houseFloor' => $addressParts[3],
      ];

      $registration['Elev.Adresse'] = VihSubscriptionUtils::formatAddressToString($addressArr);
      $registration['Elev.Lokalby'] = NULL;
      $registration['Elev.Postnr'] = $order_person->field_vih_ocp_zip->value;
      $registration['Elev.Bynavn'] = $order_person->field_vih_ocp_city->value;
      $registration['Elev.Land'] = $edb_utility->getCountryCode($order_person->field_vih_ocp_country->value);
      $registration['Elev.Fastnet'] = $order_person->field_vih_ocp_telephone->value;
      $registration['Elev.Mobil'] = $order_person->field_vih_ocp_telephone->value;

      if ($shortCourseOrder->field_vih_sco_pic_mark_consent->value) {
        $registration['EgneFelter.EgetFelt30'] = '[Fri084]Ja';
      }
      else {
        $registration['EgneFelter.EgetFelt30'] = '[Fri084]Nej';
      }

      //using only Booking number/Kartotek from default values
      $defaultValues = $this->getDefaultRegistrationValues();
      $registration['Kartotek'] = $defaultValues['Kartotek'];
    }

    return $registration;
  }

  /**
   * Converts a Application data to the registration array.
   *
   * @param array $data
   *   Registration data.
   *
   * @return array
   *   Converted registration array.
   */
  public function convertApplicationToRegistration(array $data) {
    $edb_utility = new Utility;
    $registration = array();

    $registration['Kursus'] = $data['courseTitle'];
    $registration['Elev.Linje'] = $data['classTitle'];
    $registration['Elev.Klasse'] = $data['Elev.Klasse'];

    // Student information.
    $registration['Elev.Fornavn'] = $data['firstName'];
    $registration['Elev.Efternavn'] = $data['lastName'];
    $registration['Elev.Adresse'] = $data['fullAddress'];
    $registration['Elev.Lokalby'] = NULL;
    $registration['Elev.Postnr'] = $data['zip'];
    $registration['Elev.Bynavn'] = $data['city'];
    $registration['Elev.Kommune'] = $data['municipality'];
    $registration['Elev.Fastnet'] = $data['telefon'];
    $registration['Elev.Mobil'] = $data['telefon'];
    $registration['Elev.Email'] = $data['email'];
    $registration['Elev.CprNr'] = $data['cpr'];
    $registration['Elev.Land'] = $edb_utility->getCountryCode($data['country']);
    if (isset($data['afterSchoolComment']) && isset($data['afterSchoolComment']['answer'])) {
      $registration['Elev.Notat'] = $data['afterSchoolComment']['answer'];
    }
    
    // Adults information.

    $voksen = NULL;
    $mor = NULL;
    $far = NULL;
    
    foreach($data['parents'] as $adult){
      if($adult['type'] == 'andre'  AND is_null($voksen)){
        $voksen = $adult;
      }
      if($adult['type'] == 'mor' AND is_null($mor)){
        $mor = $adult;
      }
      if($adult['type'] == 'far' AND is_null($far)){
        $far = $adult;
      }
    }
    
    $registration['Voksen.Fornavn'] = $voksen['firstName'];
    $registration['Voksen.Efternavn'] = $voksen['lastName'];
    $registration['Voksen.Adresse'] = $voksen['fullAddress'];
    $registration['Voksen.Lokalby'] = NULL;
    $registration['Voksen.Postnr'] = $voksen['zip'];
    $registration['Voksen.Bynavn'] = $voksen['city'];
    $registration['Voksen.Fastnet'] = $voksen['telefon'];
    $registration['Voksen.Mobil'] = $voksen['telefon'];
    $registration['Voksen.Email'] = $voksen['email'];
    $registration['Voksen.CprNr'] = $voksen['cpr'];
    $registration['Voksen.Land'] = $edb_utility->getCountryCode($voksen['country']);
    
    $registration['Mor.Fornavn'] = $mor['firstName'];
    $registration['Mor.Efternavn'] = $mor['lastName'];
    $registration['Mor.Adresse'] = $mor['fullAddress'];
    $registration['Mor.Lokalby'] = NULL;
    $registration['Mor.Postnr'] = $mor['zip'];
    $registration['Mor.Bynavn'] = $mor['city'];
    $registration['Mor.Fastnet'] = $mor['telefon'];
    $registration['Mor.Mobil'] = $mor['telefon'];
    $registration['Mor.Email'] = $mor['email'];
    $registration['Mor.CprNr'] = $mor['cpr'];
    $registration['Mor.Land'] = $edb_utility->getCountryCode($mor['country']);
    
    $registration['Far.Fornavn'] = $far['firstName'];
    $registration['Far.Efternavn'] = $far['lastName'];
    $registration['Far.Adresse'] = $far['fullAddress'];
    $registration['Far.Lokalby'] = NULL;
    $registration['Far.Postnr'] = $far['zip'];
    $registration['Far.Bynavn'] = $far['city'];
    $registration['Far.Fastnet'] = $far['telefon'];
    $registration['Far.Mobil'] = $far['telefon'];
    $registration['Far.Email'] = $far['email'];
    $registration['Far.CprNr'] = $far['cpr'];
    $registration['Far.Land'] = $edb_utility->getCountryCode($far['country']);
     
    $registration['Elev.TidlSkole'] = $data['schoolFrom']['answer'];

    // Fill in the rest key values;
    $registration += $this->getDefaultRegistrationValues();
    return $registration;
  }

  /**
   * Functions that add student's CPR number to the registration array
   *
   * @param $registration
   * @param $cpr
   */
  public function addStudentCprNr($registration, $cpr) {
    $registration['Elev.CprNr'] = $cpr;

    return $registration;
  }

  /**
   * Adds the registration via webservice.
   *
   * @param $registration
   *
   * @return the response formed as an array, like
   * [
   *    'status' => TRUE/FALSE
   *    'message' => reply from EBD system
   * ]
   */
  public function addRegistration($registration) {
    if (!empty($registration)) {
      $response = $this->registration_repository->addRegistrations(array($registration));
      $response_message = '';
      try {
        $response_message = $response->getBody();
      } catch (\Exception $e) {
        \Drupal::logger('vih_subscription')->error('EDBBrugsenIntegration: ' . $e->getMessage() . '. Order person name: "'
          . $registration['Elev.Fornavn'] . ' ' . $registration['Elev.Efternavn'] . '", course: ' . $registration['Kursus']);
        $response_message = $e->getMessage();
      }

      // Checking if was successful.
      if (intval($response->getCount()) > 0) {
        return [
          'status' => TRUE,
          'message' => $response_message,
        ];
      } else {
        return [
          'status' => FALSE,
          'message' => $response_message,
        ];
      }
    }
  }

  /**
   * Provides default values for registration array
   * @return array
   */
  protected function getDefaultRegistrationValues() {
    $edb_utility = new Utility;
    return array(
      'Kartotek' => $this->book_number,
      'Kursus' => 'Vinterkursus 18/19',
      // The following is available for Elev, Mor, Far, Voksen
      'Elev.Fornavn' => 'Svend Aage',
      'Elev.Efternavn' => 'Thomsen',
      'Elev.Adresse' => 'Ørnebjergvej 28',
      'Elev.Lokalby' => NULL,
      'Elev.Postnr' => '7100',
      'Elev.Bynavn' => 'Vejle',
      'Elev.CprNr' => '010119421942',
      'Elev.Fastnet' => '75820811',
      'Elev.FastnetBeskyttet' => 0,
      // 0 = No, 1 = Yes
      'Elev.Mobil' => '75820811',
      'Elev.MobilBeskyttet' => 0,
      // 0 = No, 1 = Yes
      'Elev.Email' => 'kontor@vih.dk',
      'Elev.Land' => $edb_utility->getCountryCode('Danmark'),
      'Elev.Notat' => '',
      //'Elev.Notat' => 'Svend Aage Thomsen er skolens grundlægger',
      // Specific for student
      //'Elev.Linje' => 'Fodbold',//there is not specific course track that student is subscribing, instead each subscription is a set several of course trackes
      'Voksen.Fornavn' => 'Svend Aage',
      'Voksen.Efternavn' => 'Thomsen',
      'Voksen.Adresse' => 'Ørnebjergvej 28',
      'Voksen.Lokalby' => NULL,
      'Voksen.Postnr' => '7100',
      'Voksen.Bynavn' => 'Vejle',
      'Voksen.Fastnet' => '75820811',
      'Voksen.FastnetBeskyttet' => 0,
      // 0 = No, 1 = Yes
      'Voksen.Mobil' => '75820811',
      'Voksen.MobilBeskyttet' => 0,
      // 0 = No, 1 = Yes
      'Voksen.Email' => 'kontor@vih.dk',
      'Voksen.Land' => $edb_utility->getCountryCode('Danmark'),
      'EgneFelter.EgetFelt7' => '[Fri082]' . date('d.m.Y'),
    );
  }
}
