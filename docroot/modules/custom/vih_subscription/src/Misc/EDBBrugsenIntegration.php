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
    $registration = array();

    if ($longCourseOrder->getType() == 'vih_long_course_order') {
      $registration['Kursus'] = $longCourseOrder->get('field_vih_lco_course')->entity->getTitle();

      //student = elev information
      $registration['Elev.Fornavn'] = $longCourseOrder->get('field_vih_lco_first_name')->value;
      $registration['Elev.Efternavn'] = $longCourseOrder->get('field_vih_lco_last_name')->value;
      $registration['Elev.Adresse'] = $longCourseOrder->get('field_vih_lco_address')->value;
      $registration['Elev.Lokalby'] = $longCourseOrder->get('field_vih_lco_city')->value;
      $registration['Elev.Postnr'] = $longCourseOrder->get('field_vih_lco_zip')->value;
      $registration['Elev.Bynavn'] = $longCourseOrder->get('field_vih_lco_city')->value;
      $registration['Elev.Kommune'] = $longCourseOrder->get('field_vih_lco_municipality')->value;
      $registration['Elev.Fastnet'] = $longCourseOrder->get('field_vih_lco_telefon')->value;
      $registration['Elev.Mobil'] = $longCourseOrder->get('field_vih_lco_telefon')->value;
      $registration['Elev.Email'] = $longCourseOrder->get('field_vih_lco_email')->value;
      $registration['Elev.Land'] = $longCourseOrder->get('field_vih_lco_nationality')->value;
      $registration['Elev.Notat'] = $longCourseOrder->get('field_vih_lco_message')->value;

      // adult = voksen information
      $registration['Voksen.Fornavn'] = $longCourseOrder->get('field_vih_lco_adult_first_name')->value;
      $registration['Voksen.Efternavn'] = $longCourseOrder->get('field_vih_lco_adult_last_name')->value;
      $registration['Voksen.Adresse'] = $longCourseOrder->get('field_vih_lco_adult_address')->value;
      $registration['Voksen.Lokalby'] = $longCourseOrder->get('field_vih_lco_adult_city')->value;
      $registration['Voksen.Postnr'] = $longCourseOrder->get('field_vih_lco_adult_zip')->value;
      $registration['Voksen.Bynavn'] = $longCourseOrder->get('field_vih_lco_adult_city')->value;
      $registration['Voksen.Fastnet'] = $longCourseOrder->get('field_vih_lco_adult_telefon')->value;
      $registration['Voksen.Mobil'] = $longCourseOrder->get('field_vih_lco_adult_telefon')->value;
      $registration['Voksen.Email'] = $longCourseOrder->get('field_vih_lco_adult_email')->value;
      $registration['Voksen.Land'] = $longCourseOrder->get('field_vih_lco_adult_nationality')->value;

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
    $registration = array();

    if ($order_person->getType() == 'vih_ordered_course_person') {
      $registration['Kursus'] = $shortCourseOrder->get('field_vih_sco_course')->entity->getTitle();
      //student = elev information
      $registration['Elev.Fornavn'] = $order_person->field_vih_ocp_first_name->value;
      $registration['Elev.Efternavn'] = $order_person->field_vih_ocp_last_name->value;
      $registration['Elev.Email'] = $order_person->field_vih_ocp_email->value;
      $registration['Elev.Adresse'] = $order_person->field_vih_ocp_address->value;
      $registration['Elev.Lokalby'] = $order_person->field_vih_ocp_city->value;
      $registration['Elev.Postnr'] = $order_person->field_vih_ocp_zip->value;
      $registration['Elev.Bynavn'] = $order_person->field_vih_ocp_city->value;
      $registration['Elev.Land'] = $order_person->field_vih_ocp_country->value;

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
    $registration = array();

    $registration['Kursus'] = $data['courseTitle'];
    $registration['Elev.Linje'] = $data['classTitle'];
    $registration['Elev.Klasse'] = $data['Elev.Klasse'];

    // Student information.
    $registration['Elev.Fornavn'] = $data['firstName'];
    $registration['Elev.Efternavn'] = $data['lastName'];
    $registration['Elev.Adresse'] = $data['address'];
    $registration['Elev.Lokalby'] = $data['city'];
    $registration['Elev.Postnr'] = $data['zip'];
    $registration['Elev.Bynavn'] = $data['city'];
    $registration['Elev.Kommune'] = $data['municipality'];
    $registration['Elev.Fastnet'] = $data['telefon'];
    $registration['Elev.Mobil'] = $data['telefon'];
    $registration['Elev.Email'] = $data['email'];
    $registration['Elev.CprNr'] = $data['cpr'];
    $registration['Elev.Land'] = $data['country'];

    // Adult information.
    $parent = array_shift($data['parents']);
    $registration['Voksen.Fornavn'] = $parent['firstName'];
    $registration['Voksen.Efternavn'] = $parent['lastName'];
    $registration['Voksen.Adresse'] = $parent['address'];
    $registration['Voksen.Lokalby'] = $parent['city'];
    $registration['Voksen.Postnr'] = $parent['zip'];
    $registration['Voksen.Bynavn'] = $parent['city'];
    $registration['Voksen.Fastnet'] = $parent['telefon'];
    $registration['Voksen.Mobil'] = $parent['telefon'];
    $registration['Voksen.Email'] = $parent['email'];
    $registration['Voksen.CprNr'] = $parent['cpr'];
    $registration['Voksen.Land'] = $parent['country'];

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
   */
  public function addRegistration($registration) {
    if (!empty($registration)) {
      $response = $this->registration_repository->addRegistrations(array($registration));
      try {
        $response->getBody();
      } catch (\Exception $e) {
        \Drupal::logger('vih_subscription')->error('EDBBrugsenIntegration: ' . $e->getMessage() . '. Order person name: "'
          . $registration['Elev.Fornavn'] . ' ' . $registration['Elev.Efternavn'] . '", course: ' . $registration['Kursus']);
      }

      // Checking if was successful.
      if (intval($response->getCount()) > 0) {
        return TRUE;
      } else {
        return FALSE;
      }
    }
  }

  /**
   * Provides default values for registration array
   * @return array
   */
  protected function getDefaultRegistrationValues() {
    return array(
      'Kartotek' => $this->book_number,
      'Kursus' => 'Vinterkursus 18/19',
      // The following is available for Elev, Mor, Far, Voksen
      'Elev.Fornavn' => 'Svend Aage',
      'Elev.Efternavn' => 'Thomsen',
      'Elev.Adresse' => 'Ørnebjergvej 28',
      'Elev.Lokalby' => 'Grejs',
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
      'Elev.Land' => 'Danmark',
      'Elev.Notat' => 'Svend Aage Thomsen er skolens grundlægger',
      // Specific for student
      //'Elev.Linje' => 'Fodbold',//there is not specific course track that student is subscribing, instead each subscription is a set several of course trackes
      'Voksen.Fornavn' => 'Svend Aage',
      'Voksen.Efternavn' => 'Thomsen',
      'Voksen.Adresse' => 'Ørnebjergvej 28',
      'Voksen.Lokalby' => 'Grejs',
      'Voksen.Postnr' => '7100',
      'Voksen.Bynavn' => 'Vejle',
      'Voksen.Fastnet' => '75820811',
      'Voksen.FastnetBeskyttet' => 0,
      // 0 = No, 1 = Yes
      'Voksen.Mobil' => '75820811',
      'Voksen.MobilBeskyttet' => 0,
      // 0 = No, 1 = Yes
      'Voksen.Email' => 'kontor@vih.dk',
      'Voksen.Land' => 'Danmark',
    );
  }
}
