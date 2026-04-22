type EvaluationValue = 'performed' | 'not-performed' | null;

type ProcedureKey =
  | "Leopold's Maneuver"
  | 'EINC'
  | 'Labor and Delivery'
  | 'Intramuscular Injection'
  | 'Intradermal Injection'
  | 'NICU'
  | '';

type Threshold = {
  minScore: number;
  grade: number;
};

const LEOPOLDS_THRESHOLDS: Threshold[] = [
  { minScore: 29, grade: 100 },
  { minScore: 28, grade: 92 },
  { minScore: 27, grade: 90 },
  { minScore: 26, grade: 88 },
  { minScore: 25, grade: 87 },
  { minScore: 24, grade: 85 },
  { minScore: 23, grade: 83 },
  { minScore: 22, grade: 82 },
  { minScore: 21, grade: 80 },
  { minScore: 20, grade: 78 },
  { minScore: 19, grade: 77 },
  { minScore: 18, grade: 75 },
  { minScore: 15, grade: 74 },
  { minScore: 12, grade: 73 },
  { minScore: 9, grade: 72 },
  { minScore: 5, grade: 71 },
  { minScore: 1, grade: 70 },
];

const EINC_THRESHOLDS: Threshold[] = [
  { minScore: 13, grade: 100 },
  { minScore: 12, grade: 96 },
  { minScore: 11, grade: 93 },
  { minScore: 10, grade: 89 },
  { minScore: 9, grade: 86 },
  { minScore: 8, grade: 82 },
  { minScore: 7, grade: 79 },
  { minScore: 6, grade: 75 },
  { minScore: 1, grade: 70 },
];

const LABOR_AND_DELIVERY_THRESHOLDS: Threshold[] = [
  { minScore: 199, grade: 100 },
  { minScore: 196, grade: 99 },
  { minScore: 192, grade: 98 },
  { minScore: 189, grade: 97 },
  { minScore: 186, grade: 96 },
  { minScore: 183, grade: 95 },
  { minScore: 180, grade: 94 },
  { minScore: 176, grade: 93 },
  { minScore: 173, grade: 92 },
  { minScore: 170, grade: 91 },
  { minScore: 167, grade: 90 },
  { minScore: 164, grade: 89 },
  { minScore: 160, grade: 88 },
  { minScore: 157, grade: 87 },
  { minScore: 154, grade: 86 },
  { minScore: 151, grade: 85 },
  { minScore: 148, grade: 84 },
  { minScore: 144, grade: 83 },
  { minScore: 141, grade: 82 },
  { minScore: 138, grade: 81 },
  { minScore: 135, grade: 80 },
  { minScore: 132, grade: 79 },
  { minScore: 128, grade: 78 },
  { minScore: 125, grade: 77 },
  { minScore: 122, grade: 76 },
  { minScore: 120, grade: 75 },
  { minScore: 97, grade: 74 },
  { minScore: 74, grade: 73 },
  { minScore: 50, grade: 72 },
  { minScore: 26, grade: 71 },
  { minScore: 1, grade: 70 },
];

const INTRAMUSCULAR_THRESHOLDS: Threshold[] = [
  { minScore: 25, grade: 100 },
  { minScore: 24, grade: 98 },
  { minScore: 23, grade: 95 },
  { minScore: 22, grade: 93 },
  { minScore: 21, grade: 90 },
  { minScore: 20, grade: 88 },
  { minScore: 19, grade: 85 },
  { minScore: 18, grade: 83 },
  { minScore: 17, grade: 80 },
  { minScore: 16, grade: 78 },
  { minScore: 13, grade: 74 },
  { minScore: 10, grade: 73 },
  { minScore: 7, grade: 72 },
  { minScore: 1, grade: 71 },
];

const NICU_THRESHOLDS: Threshold[] = [
  { minScore: 68, grade: 100 },
  { minScore: 67, grade: 99 },
  { minScore: 66, grade: 98 },
  { minScore: 65, grade: 97 },
  { minScore: 64, grade: 96 },
  { minScore: 63, grade: 95 },
  { minScore: 61, grade: 94 },
  { minScore: 60, grade: 93 },
  { minScore: 59, grade: 92 },
  { minScore: 58, grade: 91 },
  { minScore: 57, grade: 90 },
  { minScore: 56, grade: 89 },
  { minScore: 55, grade: 88 },
  { minScore: 54, grade: 87 },
  { minScore: 53, grade: 86 },
  { minScore: 52, grade: 85 },
  { minScore: 51, grade: 84 },
  { minScore: 50, grade: 83 },
  { minScore: 49, grade: 82 },
  { minScore: 47, grade: 81 },
  { minScore: 46, grade: 80 },
  { minScore: 45, grade: 79 },
  { minScore: 44, grade: 78 },
  { minScore: 43, grade: 77 },
  { minScore: 42, grade: 76 },
  { minScore: 41, grade: 75 },
  { minScore: 33, grade: 74 },
  { minScore: 25, grade: 73 },
  { minScore: 16, grade: 72 },
  { minScore: 9, grade: 71 },
  { minScore: 1, grade: 70 },
];

const normalizeProcedureName = (procedureName: string) =>
  procedureName
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

const getProcedureKey = (procedureName: string): ProcedureKey => {
  const normalizedName = normalizeProcedureName(procedureName);

  if (normalizedName === "LEOPOLD'S MANEUVER") return "Leopold's Maneuver";
  if (normalizedName.startsWith('EINC')) return 'EINC';
  if (normalizedName === 'LABOR AND DELIVERY') return 'Labor and Delivery';
  if (normalizedName === 'INTRAMUSCULAR INJECTION') return 'Intramuscular Injection';
  if (normalizedName === 'INTRADERMAL INJECTION') return 'Intradermal Injection';
  if (normalizedName === 'NICU') return 'NICU';

  return '';
};

const getPerformedCount = (evaluations: Record<string, EvaluationValue>) =>
  Object.values(evaluations).filter((value) => value === 'performed').length;

const applyThresholds = (score: number, thresholds: Threshold[]) => {
  const match = thresholds.find((threshold) => score >= threshold.minScore);
  return match?.grade ?? 70;
};

const getRawScore = (procedureKey: ProcedureKey, performedCount: number) => {
  if (procedureKey === 'Labor and Delivery') {
    return performedCount * 5;
  }

  return performedCount;
};

const getGradeFromRawScore = (procedureKey: ProcedureKey, rawScore: number) => {
  if (rawScore <= 0) {
    return 70;
  }

  if (procedureKey === "Leopold's Maneuver") {
    return applyThresholds(rawScore, LEOPOLDS_THRESHOLDS);
  }

  if (procedureKey === 'EINC') {
    return applyThresholds(rawScore, EINC_THRESHOLDS);
  }

  if (procedureKey === 'Labor and Delivery') {
    return applyThresholds(rawScore, LABOR_AND_DELIVERY_THRESHOLDS);
  }

  if (
    procedureKey === 'Intramuscular Injection' ||
    procedureKey === 'Intradermal Injection'
  ) {
    return applyThresholds(rawScore, INTRAMUSCULAR_THRESHOLDS);
  }

  if (procedureKey === 'NICU') {
    return applyThresholds(rawScore, NICU_THRESHOLDS);
  }

  return null;
};

export const calculateProcedureGrade = (
  procedureName: string,
  evaluations: Record<string, EvaluationValue>
) => {
  const values = Object.values(evaluations).filter(
    (value): value is 'performed' | 'not-performed' =>
      value === 'performed' || value === 'not-performed'
  );

  if (values.length === 0) {
    return {
      rawScore: null,
      grade: null,
    };
  }

  const procedureKey = getProcedureKey(procedureName);
  const performedCount = getPerformedCount(evaluations);

  if (!procedureKey) {
    return {
      rawScore: performedCount,
      grade: Number(((performedCount / values.length) * 100).toFixed(2)),
    };
  }

  const rawScore = getRawScore(procedureKey, performedCount);

  return {
    rawScore,
    grade: getGradeFromRawScore(procedureKey, rawScore),
  };
};
