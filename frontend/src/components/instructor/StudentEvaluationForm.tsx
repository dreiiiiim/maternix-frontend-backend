'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, CheckCircle } from 'lucide-react';

type PerformanceCriterion = {
  id: number;
  text: string;
  points: number;
  subCriteria?: {
    id: string;
    text: string;
  }[];
};

type StudentEvaluationFormProps = {
  studentName: string;
  procedureName: string;
  initialFeedback?: string;
  saveLabel?: string;
  onClose: () => void;
  onSave: (data: unknown) => Promise<boolean> | boolean;
};

const leopoldsManeuverCriteria: PerformanceCriterion[] = [
  { id: 1, text: "Defines Leopold's Maneuver", points: 1 },
  { id: 2, text: "States the Rationale for Performing Leopold's Maneuver", points: 1 },
  { id: 3, text: "States the Special Considerations of Leopold's Maneuver", points: 1 },
  { id: 4, text: 'States the procedure and rationale for each action correctly', points: 1 },
  { id: 5, text: 'Prepares the materials needed for examination', points: 1 },
  { id: 6, text: 'Washes hands before the procedure', points: 1 },
  { id: 7, text: 'Greets the patient and introduce yourself', points: 1 },
  { id: 8, text: 'Explain the purpose and procedure to the patient. Instruct to empty her bladder first.', points: 1 },
  { id: 9, text: "Places patient comfortably on bed in a dorsal recumbent position. Instruct the woman to relax her abdominal muscles by bending her knees slightly and do relaxation breathing.", points: 1 },
  { id: 10, text: 'Practices proper draping', points: 1 },
  { id: 11, text: 'Warms hands by rubbing both palmar surface of your hands', points: 1 },
  { id: 12, text: "Rest your hand on the woman's abdomen lightly while reinforce explanation given", points: 1 },
  { id: 13, text: 'Use flat palmar surface of fingers and not fingertips during palpation, and keep fingers of hands together', points: 1 },
  { id: 14, text: 'Applies smooth and gentle deep pressure as firm as necessary', points: 1 },
  {
    id: 15,
    text: "Perform the 1st Leopold's Maneuver (Fundal Grip)",
    points: 3,
    subCriteria: [
      { id: '15a', text: "A. Stand at the woman's side and face the woman; and palpate the fundus using both hands" },
      { id: '15b', text: 'B. Curve the fingers around the top of the uterus and feel for the fetal part lying in the fundus' },
      { id: '15c', text: 'C. Use the palm, palpate the size, shape, consistency and mobility of the fetal part in the fundus.' },
    ],
  },
  {
    id: 16,
    text: "Perform the 2nd Leopold's Maneuver (Umbilical Grip)",
    points: 4,
    subCriteria: [
      { id: '16a', text: "A. Places hands on either side of woman's abdomen about midway between the symphysis pubis and the fundus" },
      { id: '16b', text: 'B. Moves hand to the sides of the abdomen' },
      { id: '16c', text: 'C. With one hand in place to steady the uterus, use the other hand to palpate the opposite side of the uterus with firm circular motions.' },
      { id: '16d', text: 'D. Repeat the maneuver on opposite side of the abdomen' },
    ],
  },
  { id: 17, text: "Performs 3rd Leopold's Maneuver (Pawlik's Grip) Continue facing the woman grasp the portion of the lower abdomen immediately above the symphysis pubis between the thumb and middle finger of one of your hands", points: 1 },
  { id: 18, text: "Performs the 4th Leopold's Maneuver (Pelvic Grip) Face the woman's feet and place the palmar surface of your hands on each side of the woman's abdomen. Use both hands and palpate fetal head using gentle downward press with your fingertips about 2 inches above the inguinal ligament", points: 1 },
  { id: 19, text: 'Warms head of the stethoscope before auscultation', points: 1 },
  { id: 20, text: 'Locate fetal heart rate', points: 1 },
  { id: 21, text: 'Place the zero line of the tape measure on the fundus down to superior border of the symphysis pubis', points: 1 },
  { id: 22, text: 'Assess the patient properly after examination', points: 1 },
  { id: 23, text: 'Takes proper care of articles used after the procedure', points: 1 },
  { id: 24, text: 'Document assessment data accurately and completely', points: 1 },
];

const eincCriteria: PerformanceCriterion[] = [
  { id: 1, text: 'States the definition of rectal temperature', points: 1 },
  { id: 2, text: 'States the purposes of the procedure', points: 1 },
  { id: 3, text: 'States the rationale of each step and the normal rectal temperature.', points: 1 },
  { id: 4, text: 'Prepares complete materials', points: 1 },
  { id: 5, text: 'Wash hands before the procedure and put on nonsterile gloves.', points: 1 },
  { id: 6, text: 'Ensure the digital thermometer is in working condition.', points: 1 },
  { id: 7, text: 'Wipe the thermometer with a wet cotton ball from tip (sensor) to stem (probe).', points: 1 },
  { id: 8, text: 'Apply lubricant (oil) on tip of the thermometer.', points: 1 },
  { id: 9, text: "Position the baby: Hold infant's ankle in your hand. Lift slightly to expose the anus.", points: 1 },
  { id: 10, text: 'Insert gently the thermometer to the anus about 1 inch. Hold it in place till you hear a beep sound. Note the temperature reading on the display.', points: 1 },
  { id: 11, text: 'Remove the thermometer and wipe from stem to tip using cotton ball with alcohol.', points: 1 },
  { id: 12, text: 'Discard used materials, remove the gloves and wash hands.', points: 1 },
  { id: 13, text: 'Document the result.', points: 1 },
];

const intramuscularInjectionCriteria: PerformanceCriterion[] = [
  { id: 1, text: 'States the definition of intramuscular injection.', points: 1 },
  { id: 2, text: 'States the purposes.', points: 1 },
  { id: 3, text: 'States the special considerations.', points: 1 },
  { id: 4, text: 'Enumerate the materials.', points: 1 },
  { id: 5, text: 'States the rationale.', points: 1 },
  { id: 6, text: "Checks the physician's order and compare it with the medication card. Check if patient has allergy.", points: 1 },
  { id: 7, text: 'Washes hands before the procedure.', points: 1 },
  { id: 8, text: 'Prepares a complete material for the procedure', points: 1 },
  { id: 9, text: 'Checks the expiration date of the drug and the action of the drug.', points: 1 },
  { id: 10, text: 'Prepares the medication (vial or ampule) correctly and aseptically using aspirating needle.', points: 1 },
  { id: 11, text: 'Change aspirating needle to needle gauge 25 for pedia and gauge 22-23 for adult.', points: 1 },
  { id: 12, text: 'Greets and identify the patient.', points: 1 },
  { id: 13, text: 'Explains the procedure to the patient and the purpose and action of the medication.', points: 1 },
  { id: 14, text: 'Places patient in a comfortable position and make the necessary assessment before administering the medication.', points: 1 },
  { id: 15, text: 'Put on gloves and cleanse injection site about 3 inches in diameter vigorously with alcohol sponge.', points: 1 },
  { id: 16, text: 'Press tissue down firmly using the thumb and the first two fingers of nondominant hand (for average and overweight person) or grasp the muscle (for thin person).', points: 1 },
  { id: 17, text: 'Holds syringe and quickly dart the needle perpendicularly to the muscle at 90 degree angle.', points: 1 },
  { id: 18, text: 'Uses the thumb and forefinger of nondominant hand to hold the lower part of the syringe and slides dominant hand to end of the plunger.', points: 1 },
  { id: 19, text: 'Aspirates slowly and checks if with blood.', points: 1 },
  { id: 20, text: 'Pushes plunger and injects the solution slowly.', points: 1 },
  { id: 21, text: 'Removes needle steadily and quickly and applies pressure with cotton ball over the puncture site.', points: 1 },
  { id: 22, text: 'Makes patient comfortable and observes for signs of reaction', points: 1 },
  { id: 23, text: 'Discards used materials and clean the injection tray.', points: 1 },
  { id: 24, text: 'Washes hands after the procedure.', points: 1 },
  { id: 25, text: 'Finish the procedure within the allotted Time and sign in the medication sheet.', points: 1 },
];

const intradermalInjectionCriteria: PerformanceCriterion[] = [
  { id: 1, text: 'Define intradermal injection.', points: 1 },
  { id: 2, text: 'State the purposes.', points: 1 },
  { id: 3, text: 'States the special considerations.', points: 1 },
  { id: 4, text: 'Enumerate the materials.', points: 1 },
  { id: 5, text: 'States the rationale.', points: 1 },
  { id: 6, text: "Checks the physician's order and compare it with the medication card.", points: 1 },
  { id: 7, text: 'Washes hands before the procedure.', points: 1 },
  { id: 8, text: 'Prepares a complete materials for the procedure', points: 1 },
  { id: 9, text: 'Checks the expiration date of the drug.', points: 1 },
  { id: 10, text: 'Prepares the medication (vial or ampule) correctly and aseptically. Uses aspirating needle to get .9 ml of distilled water for injection and .1 of the solution.', points: 1 },
  { id: 11, text: 'Change aspirating needle to needle gauge 25.', points: 1 },
  { id: 12, text: 'Greets and identify the patient.', points: 1 },
  { id: 13, text: 'Explains the procedure to the patient.', points: 1 },
  { id: 14, text: 'Places patient in a comfortable position.', points: 1 },
  { id: 15, text: 'Put on gloves and cleanse injection site about 3inches in diameter vigorously with alcohol sponge. Allow the skin to dry.', points: 1 },
  { id: 16, text: 'Pulls the skin taut at the site of the injection with the nondominant hand and hold the syringe 10 – 15 angle from the site.', points: 1 },
  { id: 17, text: 'Thrusts the tip of the needle firmly through the dermal area, with the bevel facing upward.', points: 1 },
  { id: 18, text: 'Introduces the solution slowly (about 0.01cc) to form a wheal or bleb.', points: 1 },
  { id: 19, text: 'Withdraws needle and wipe injection site gently with dry cotton ball and avoid massage.', points: 1 },
  { id: 20, text: 'Encircles the site with black ballpen and write the initials of the drug and the time to read the result.', points: 1 },
  { id: 21, text: 'Makes the patient comfortable and observe for reaction to the injection.', points: 1 },
  { id: 22, text: 'Discards used materials and clean the injection tray.', points: 1 },
  { id: 23, text: 'Washes hands after the procedure.', points: 1 },
  { id: 24, text: 'Checks for any signs of allergy after 30 minutes and record the procedure.', points: 1 },
  { id: 25, text: 'Finish the procedure within the allotted time.', points: 1 },
];

const nicuCriteria: PerformanceCriterion[] = [
  { id: 1, text: 'Checks temperature of the delivery room (25 - 28 °C) and if free of air drafts', points: 1 },
  { id: 2, text: 'Arranges needed materials: Towel, sanitex, bonnet, baby wrap with hood, tape measure, T-syringe, cotton balls, Vitamin K, Ophthalmic Ointment, diaper, baby\'s clothes, ID band, thermometer, stethoscope, receptacle', points: 1 },
  { id: 3, text: 'Washes hands with clean water and soap. Dry hands', points: 1 },
  { id: 4, text: 'Wears sterile glove just before delivery.', points: 1 },
  { id: 5, text: "Places a sterile receiving towel/underpad on mother's abdomen", points: 1 },
  { id: 6, text: "Keeps gloves sterile while waiting for the delivery of the baby. (DR staff to call out the time of baby's birth.) Do APGAR Scoring at 0 minute and inform NICU staff of the newborn admission.", points: 1 },
  { id: 7, text: "Places baby in mother's abdomen facing the DR staff where head is slightly lower than the legs and head is turned to side.", points: 1 },
  { id: 8, text: 'Uses clean, dry cloth or sanitex to thoroughly dry the baby, wiping eyes, face, head, front and back, arms and legs (30 secs)', points: 1 },
  { id: 9, text: 'Removes wet cloth and dispose properly. Replace with dry clean cloth', points: 1 },
  { id: 10, text: "Does a quick checking of baby's breathing while drying, rubs gently the back to stimulate baby to cry", points: 1 },
  { id: 11, text: 'Performs APGAR Scoring (1 minute and after 5 minutes)', points: 1 },
  { id: 12, text: 'Shows to the mother the gender of the baby.', points: 1 },
  { id: 13, text: "Moves the baby close to the mother's chest. Place in frog position.", points: 1 },
  { id: 14, text: "Places the baby in skin-to-skin contact on the mother's chest in between the breasts with the head turned to one side.", points: 1 },
  { id: 15, text: "Keeps the baby's body covered with dry cloth/towel.", points: 1 },
  { id: 16, text: 'Covers the head with bonnet.', points: 1 },
  { id: 17, text: 'Takes vital signs (RR, CR, temperature per rectum to check patency).', points: 1 },
  { id: 18, text: 'Encourages mother to move baby toward the breast.', points: 1 },
  {
    id: 19,
    text: "Gets the identification tag of the newborn and compares it to the mother's tag (nametag, name of mother, date and time of delivery, gender, and name of the attending physician).",
    points: 1,
  },
  { id: 20, text: 'Places identification band on ankle.', points: 1 },
  {
    id: 21,
    text: 'Observes the newborn when newborn shows feeding cues (e.g. opening of mouth, tonguing, licking, rooting).',
    points: 1,
  },
  {
    id: 22,
    text: "Lifts the baby from the mother's chest (after 90 minutes of skin-to-skin) and does non-immediate interventions.",
    points: 1,
  },
  {
    id: 23,
    text: 'Covers weighing scale with clean light cloth, places the naked body of the baby, and weighs the baby properly.',
    points: 1,
  },
  { id: 24, text: 'Takes the anthropometric measurements correctly.', points: 1 },
  { id: 25, text: "Cleans the eyes. Apply CREDE'S prophylaxis on both eyes.", points: 1 },
  {
    id: 26,
    text: 'Injects 1 ml of Vitamin K in right vastus lateralis.',
    points: 5,
    subCriteria: [
      { id: '26a', text: 'a. Positions hands properly when preparing the medication.' },
      { id: '26b', text: 'b. Aspirates the exact amount.' },
      { id: '26c', text: 'c. Observes aseptic technique.' },
      { id: '26d', text: 'd. Positions hands properly when injecting the drug.' },
      { id: '26e', text: 'e. Disposes used syringe in the sharps container.' },
    ],
  },
  {
    id: 27,
    text: 'Injects 0.5 ml Hepatitis B in left vastus lateralis.',
    points: 5,
    subCriteria: [
      { id: '27a', text: 'a. Positions hands properly when preparing the medication.' },
      { id: '27b', text: 'b. Aspirates the exact amount of the drug.' },
      { id: '27c', text: 'c. Observes aseptic technique.' },
      { id: '27d', text: 'd. Positions hands properly when injecting the drug.' },
      { id: '27e', text: 'e. Injects the drug slowly.' },
    ],
  },
  { id: 28, text: 'Assists the NICU staff in doing Ballard Scoring.', points: 1 },
  {
    id: 29,
    text: 'Performs thorough physical examination.',
    points: 9,
    subCriteria: [
      { id: '29a', text: 'a. head' },
      { id: '29b', text: 'b. eyes' },
      { id: '29d', text: 'd. nose' },
      { id: '29e', text: 'e. chest' },
      { id: '29f', text: 'f. back' },
      { id: '29g', text: 'g. genitalia' },
      { id: '29h', text: 'h. upper extremities - hands' },
      { id: '29i', text: 'i. lower extremities - feet' },
      { id: '29j', text: 'j. reflexes' },
    ],
  },
  { id: 30, text: 'Dress up the baby properly.', points: 1 },
  {
    id: 31,
    text: 'Puts the diaper properly. Expose cord stump by folding the diaper below the cord.',
    points: 1,
  },
  { id: 32, text: 'Mummify the baby properly.', points: 1 },
  { id: 33, text: 'Brings the baby to mother.', points: 1 },
  {
    id: 34,
    text: 'Checks the identification tag of the baby and compares it to mother.',
    points: 1,
  },
  { id: 35, text: "Ask the mother to sign in the baby's chart.", points: 1 },
  { id: 36, text: "Cleans the mother's nipple.", points: 1 },
  { id: 37, text: 'Places the baby on chest. Assist the mother in breastfeeding.', points: 1 },
  {
    id: 38,
    text: 'Renders health teaching. Ask what the patient knows regarding infant care.',
    points: 1,
  },
  {
    id: 39,
    text: 'Provides information regarding:',
    points: 7,
    subCriteria: [
      { id: '39a', text: 'BCG' },
      { id: '39b', text: 'Newborn screening' },
      { id: '39c', text: 'Immunization' },
      { id: '39d', text: 'Feeding and burping' },
      { id: '39e', text: 'Bathing' },
      { id: '39f', text: 'Exposure to Sunlight' },
      { id: '39g', text: 'Check-up or appointment date' },
    ],
  },
  {
    id: 40,
    text: 'Provides instruction to the mother on daily cord care, prevention of cord infection and information on when to expect cord to fall off.',
    points: 1,
  },
  {
    id: 41,
    text: 'Examines the newborn. Check for birth injuries, malformations or defects. Look for malformations:',
    points: 20,
    subCriteria: [
      { id: '41a', text: '- Cleft palate or lip' },
      { id: '41b', text: '- Club foot' },
      { id: '41c', text: '- Odd looking, unusual appearance' },
      { id: '41d', text: '- Open tissue on head, abdomen or back' },
    ],
  },
  { id: 42, text: 'Completes all the records.', points: 1 },
  { id: 43, text: 'Gives full warm bath after 6 hours.', points: 1 },
];

const laborAndDeliveryCriteria: PerformanceCriterion[] = [
  { id: 1, text: 'State the Definition', points: 5 },
  { id: 2, text: 'State the Purpose', points: 5 },
  { id: 3, text: 'Ensure that the mother is in her position of choice while in labor.', points: 5 },
  { id: 4, text: 'Ask mother if she wishes to eat/drink or void.', points: 5 },
  { id: 5, text: 'Communicate with the mother – inform her of the progress of labor, give reassurance and encouragement.', points: 5 },
  { id: 6, text: 'Perform the Internal Examination if needed.', points: 5 },
  { id: 7, text: "Transports clients safely to DR while providing privacy.", points: 5 },
  { id: 8, text: 'Check temperature in the DR area to be 25-28o C, eliminate air drafts.', points: 5 },
  { id: 9, text: 'Places mother in lithotomy position. And, ask a woman if she is comfortable in the semi-upright position.', points: 5 },
  { id: 10, text: 'Perform Handwashing', points: 5 },
  { id: 11, text: 'Arrange materials/supplies in a clear sequence: DR Pack (2 Kelly forceps, 1 allis forceps, 1 needle holder, 2 pads/Santex, 1 straight mayo scissor, 1 bandage scissor, 1 kidney basin, 1 eyesheet, 1 pair of lower and 2 receiving blanket) 2 Gloves, suturing needle, 1 10 cc syringe, 1 foley catheter, 1 cordclamp, 1 lidocaine.', points: 5 },
  { id: 12, text: 'Do handwashing again. Aseptically put on 2 pairs of sterile gloves (same worker). Wear gowns and gloves according to hospital policy.', points: 5 },
  { id: 13, text: "Prep the perineal area with betadine aseptically. Also drape mother's abdomen with sterile eyesheet, mother's both legs with sterile leg cover.", points: 5 },
  { id: 14, text: 'Encourage mother to push hard with close mouth and up to 10 seconds only during her intense contraction.', points: 5 },
  { id: 15, text: "Apply perineal support and do controlled delivery of the head. (Ritgen's maneuver)", points: 5 },
  { id: 16, text: 'Do controlled delivery of the head and body of the baby. Call out time of birth, gender of the baby, if cord coil or not, and the color of PCOM.', points: 5 },
  { id: 17, text: 'Inform the mother of the outcome.', points: 5 },
  { id: 18, text: 'Thoroughly dry baby for at least 30 seconds, (from eyes, face, head, chest, back, arms and legs) while performing a quick check for breathing.', points: 5 },
  { id: 19, text: 'Remove the wet cloth.', points: 5 },
  { id: 20, text: "Place the baby in skin-to-skin contact on the mother's abdomen/chest in between the breasts with the head turned to one side.", points: 5 },
  { id: 21, text: 'Cover the baby with dry cloth.', points: 5 },
  { id: 22, text: 'Remove the 1st set of gloves and decontaminate them properly', points: 5 },
  { id: 23, text: 'Palpate umbilical cord to check pulsations.', points: 5 },
  { id: 24, text: 'After pulsations stopped, clamp cord use plastic clamp 2 cm from the base.', points: 5 },
  { id: 25, text: 'Place the instrument clamp 5 cm from the base.', points: 5 },
  { id: 26, text: 'Cut near the plastic clamp (not midway).', points: 5 },
  { id: 27, text: 'Perform the remaining steps of the AMTSL: Wait for strong Uterine Contractions, apply controlled cord traction and counter traction on the uterus until Placenta is delivered. Massage the uterus until firmed.', points: 5 },
  { id: 28, text: 'Call out the time the placenta is out and its type. Examine the completeness and any abnormalities', points: 5 },
  { id: 29, text: "Give oxytocin within one minute of the baby's birth according to the hospital policy either IM or incorporate at the IV", points: 5 },
  { id: 30, text: 'Check the Blood pressure of the mother after placenta is out.', points: 5 },
  { id: 31, text: 'Checks for firmness or boggy uterus. Massage the uterus if boggy.', points: 5 },
  { id: 32, text: 'Inspect the vagina and perineum for lacerations.', points: 5 },
  {
    id: 33,
    text: 'If episiotomy was performed, or if there is a laceration assist in perineorrhaphy.',
    points: 20,
    subCriteria: [
      { id: '33a', text: 'a. Wait for the instruction from trained nurse, trained midwife' },
      { id: '33b', text: 'b. Hold the suture with traction and listen to the instruction' },
      { id: '33c', text: 'c. Pat the blood out from lacerates/cut area with sterile gauze' },
      { id: '33d', text: 'd. Cut the thread when a trained nurse, trained midwife or' },
    ],
  },
  { id: 34, text: 'Clean the perineum with water, apply betadine at the hymen area, and apply a perineal pad or diaper.', points: 5 },
  { id: 35, text: 'Place mother in a comfortable position.', points: 5 },
  { id: 36, text: 'Do aftercare and handwashing.', points: 5 },
  { id: 37, text: 'Complete all the records.', points: 5 },
];

const normalizeProcedureName = (procedureName: string) =>
  procedureName
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

const getProcedureKey = (procedureName: string) => {
  const normalizedName = normalizeProcedureName(procedureName);

  if (normalizedName === "LEOPOLD'S MANEUVER") return "Leopold's Maneuver";
  if (normalizedName.startsWith('EINC')) return 'EINC';
  if (normalizedName === 'LABOR AND DELIVERY') return 'Labor and Delivery';
  if (normalizedName === 'INTRAMUSCULAR INJECTION') return 'Intramuscular Injection';
  if (normalizedName === 'INTRADERMAL INJECTION') return 'Intradermal Injection';
  if (normalizedName === 'NICU') return 'NICU';

  return '';
};

const getProcedureCriteria = (procedureName: string): PerformanceCriterion[] => {
  const procedureKey = getProcedureKey(procedureName);

  if (procedureKey === "Leopold's Maneuver") return leopoldsManeuverCriteria;
  if (procedureKey === 'EINC') return eincCriteria;
  if (procedureKey === 'Labor and Delivery') return laborAndDeliveryCriteria;
  if (procedureKey === 'Intramuscular Injection') return intramuscularInjectionCriteria;
  if (procedureKey === 'Intradermal Injection') return intradermalInjectionCriteria;
  if (procedureKey === 'NICU') return nicuCriteria;
  return [];
};

const getTotalPoints = (procedureName: string): number => {
  return getProcedureCriteria(procedureName).reduce(
    (total, criterion) => total + criterion.points,
    0
  );
};

export function StudentEvaluationForm({
  studentName,
  procedureName,
  initialFeedback,
  saveLabel = 'Save Evaluation',
  onClose,
  onSave,
}: StudentEvaluationFormProps) {
  const [evaluations, setEvaluations] = useState<
    Record<string, 'performed' | 'not-performed' | null>
  >({});
  const [feedback, setFeedback] = useState('');
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const criteria = getProcedureCriteria(procedureName);
  const totalPoints = getTotalPoints(procedureName);

  useEffect(() => {
    setFeedback(initialFeedback ?? '');
    setEvaluations({});
    setSaved(false);
    setIsSaving(false);
    setError('');
  }, [initialFeedback, procedureName, studentName]);

  const handleCheckboxChange = (
    criterionId: string,
    value: 'performed' | 'not-performed'
  ) => {
    setEvaluations((prev) => ({
      ...prev,
      [criterionId]: prev[criterionId] === value ? null : value,
    }));
  };

  const handleSave = async () => {
    const missingCriteria = criteria.some((criterion) => {
      if (criterion.subCriteria) {
        return criterion.subCriteria.some((sub) => !evaluations[sub.id]);
      }

      return !evaluations[criterion.id.toString()];
    });

    if (missingCriteria) {
      setError('Please mark every item as Performed or Not Performed before saving.');
      return;
    }

    setError('');
    setIsSaving(true);

    try {
      const saveSucceeded = await onSave({ evaluations, feedback });
      if (!saveSucceeded) {
        return;
      }
    } finally {
      setIsSaving(false);
    }

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1500);
  };

  const calculateScore = () => {
    let total = 0;
    criteria.forEach((criterion) => {
      if (criterion.subCriteria) {
        criterion.subCriteria.forEach((sub) => {
          if (evaluations[sub.id] === 'performed') {
            total += criterion.points / criterion.subCriteria!.length;
          }
        });
      } else {
        if (evaluations[criterion.id.toString()] === 'performed') {
          total += criterion.points;
        }
      }
    });
    return total;
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border sticky top-0 bg-white z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">
                {procedureName} Evaluation
              </h2>
              <p className="text-muted-foreground">Student: {studentName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Current Score: </span>
              <span className="font-bold" style={{ color: 'var(--brand-green-dark)' }}>
                {calculateScore().toFixed(1)} / {totalPoints}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="space-y-4">
            {criteria.map((criterion) => (
              <div
                key={criterion.id}
                className="border border-border rounded-xl p-5"
                style={{ backgroundColor: 'var(--brand-pink-light)20' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-foreground mb-2">
                      {criterion.id}. {criterion.text}
                    </h4>
                  </div>
                  <span className="ml-4 text-xs font-medium text-muted-foreground whitespace-nowrap">
                    {criterion.points} {criterion.points === 1 ? 'point' : 'points'}
                  </span>
                </div>

                {criterion.subCriteria ? (
                  <div className="space-y-3 ml-4">
                    {criterion.subCriteria.map((sub) => (
                      <div key={sub.id} className="bg-white rounded-lg p-3">
                        <p className="text-sm text-foreground mb-2">{sub.text}</p>
                        <div className="flex gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={evaluations[sub.id] === 'performed'}
                              onChange={() => handleCheckboxChange(sub.id, 'performed')}
                              className="w-4 h-4 rounded"
                              style={{ accentColor: 'var(--brand-green-dark)' }}
                            />
                            <span className="text-sm text-foreground">Performed</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={evaluations[sub.id] === 'not-performed'}
                              onChange={() => handleCheckboxChange(sub.id, 'not-performed')}
                              className="w-4 h-4 rounded"
                              style={{ accentColor: 'var(--brand-pink-dark)' }}
                            />
                            <span className="text-sm text-foreground">Not Performed</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={evaluations[criterion.id.toString()] === 'performed'}
                        onChange={() =>
                          handleCheckboxChange(criterion.id.toString(), 'performed')
                        }
                        className="w-4 h-4 rounded"
                        style={{ accentColor: 'var(--brand-green-dark)' }}
                      />
                      <span className="text-sm text-foreground">Performed</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={evaluations[criterion.id.toString()] === 'not-performed'}
                        onChange={() =>
                          handleCheckboxChange(criterion.id.toString(), 'not-performed')
                        }
                        className="w-4 h-4 rounded"
                        style={{ accentColor: 'var(--brand-pink-dark)' }}
                      />
                      <span className="text-sm text-foreground">Not Performed</span>
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-gray-50">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-foreground">
              Evaluator Feedback
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 min-h-[120px]"
              style={
                { '--tw-ring-color': 'var(--brand-green-medium)' } as React.CSSProperties
              }
              placeholder="Enter your feedback for the student's performance..."
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-foreground">
              Total Score:{' '}
              <span style={{ color: 'var(--brand-green-dark)' }}>
                {calculateScore().toFixed(1)} / {totalPoints}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-border rounded-lg transition-all hover:bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saved || isSaving}
                className="px-6 py-2 text-white rounded-lg transition-all hover:scale-105 flex items-center gap-2"
                style={{
                  backgroundColor: saved ? 'var(--brand-green-medium)' : 'var(--brand-green-dark)',
                }}
              >
                {saved ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Saved!
                  </>
                ) : isSaving ? (
                  <>
                    <Save className="w-5 h-5" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {saveLabel}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
