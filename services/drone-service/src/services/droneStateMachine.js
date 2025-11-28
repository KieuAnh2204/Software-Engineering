const transitions = {
  available: ["pickup"],
  pickup: ["delivering", "returning"],
  delivering: ["returning"],
  returning: ["available"],
};

function canTransition(from, to) {
  return transitions[from]?.includes(to) || false;
}

module.exports = { canTransition, transitions };
