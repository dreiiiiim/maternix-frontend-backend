const normalizeProcedureName = (value: string) =>
  value
    .toUpperCase()
    .replace(/[\u2018\u2019']/g, '')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();

const getProcedureOrder = (name: string) => {
  const normalizedName = normalizeProcedureName(name);

  if (
    normalizedName === 'LEOPOLDS' ||
    normalizedName === 'LEOPOLDS MANEUVER'
  ) {
    return { group: 0, position: 0 };
  }

  if (normalizedName === 'EINC') {
    return { group: 1, position: 0 };
  }

  if (normalizedName.startsWith('EINC ')) {
    return { group: 1, position: 1 };
  }

  if (normalizedName === 'LABOR AND DELIVERY') {
    return { group: 2, position: 0 };
  }

  if (normalizedName === 'INTRAMUSCULAR INJECTION') {
    return { group: 3, position: 0 };
  }

  if (normalizedName === 'INTRADERMAL INJECTION') {
    return { group: 4, position: 0 };
  }

  if (normalizedName === 'NICU') {
    return { group: 5, position: 0 };
  }

  return { group: 999, position: 0 };
};

export const compareProcedureNames = (left: string, right: string) => {
  const leftOrder = getProcedureOrder(left);
  const rightOrder = getProcedureOrder(right);

  if (leftOrder.group !== rightOrder.group) {
    return leftOrder.group - rightOrder.group;
  }

  if (leftOrder.position !== rightOrder.position) {
    return leftOrder.position - rightOrder.position;
  }

  return left.localeCompare(right);
};

export const sortProceduresByName = <T>(
  items: T[],
  getName: (item: T) => string
) => [...items].sort((left, right) => compareProcedureNames(getName(left), getName(right)));
