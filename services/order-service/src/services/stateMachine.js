const VALID = ['Pending', 'Processing', 'Delivering', 'Completed', 'Cancelled'];

const transitions = {
  Pending: ['Processing', 'Cancelled'],
  Processing: ['Delivering', 'Cancelled'],
  Delivering: ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: []
};

function canTransition(from, to) {
  return transitions[from]?.includes(to) || false;
}

module.exports = { VALID_STATUSES: VALID, canTransition };

