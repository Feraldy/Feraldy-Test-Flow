export const NODE_TYPES = {
  START: 'start',
  ACTION: 'action',
} as const;

export const EDGE_TYPES = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
} as const;

export const NODE_CONFIG = {
  start: {
    type: 'start' as const,
    label: 'Start',
    description: 'Beginning of test case',
    category: 'control' as const,
    defaultData: {
      label: 'Start Test',
      testName: 'Test Case',
      isValid: true,
      errors: [],
    },
  },
  action: {
    type: 'action' as const,
    label: 'Action',
    description: 'Perform an action on an element',
    category: 'action' as const,
    defaultData: {
      label: 'Action',
      actionType: 'click' as const,
      selector: '',
      isValid: true,
      errors: [],
      positiveExpectedResult: '',
      negativeExpectedResult: '',
      url: '',
    },
  },
} as const;