const Drone = require('../models/Drone');

class DroneStateMachine {
  constructor() {
    this.states = {
      available: ['pickup'],
      pickup: ['delivering', 'available'], // Can cancel
      delivering: ['returning'],
      returning: ['available'],
    };
  }

  canTransition(currentState, nextState) {
    return this.states[currentState]?.includes(nextState) || false;
  }

  async transitionDrone(droneId, nextState) {
    const drone = await Drone.findById(droneId);
    if (!drone) {
      throw new Error('Drone not found');
    }

    if (!this.canTransition(drone.status, nextState)) {
      throw new Error(
        `Invalid state transition: ${drone.status} -> ${nextState}`
      );
    }

    drone.status = nextState;
    await drone.save();

    return drone;
  }
}

module.exports = new DroneStateMachine();
