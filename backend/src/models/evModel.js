// In-memory data store for EV (Electric Vehicle) information
let evs = [
  {
    id: 1,
    model: 'Tesla Model 3',
    type: 'Sedan',
    batteryCapacity: '75 kWh',
    range: '358 miles',
    owners: ['John Doe', 'Jane Smith'],
    costPerDay: 50,
    available: true
  },
  {
    id: 2,
    model: 'Nissan Leaf',
    type: 'Hatchback',
    batteryCapacity: '62 kWh',
    range: '226 miles',
    owners: ['Alice Johnson'],
    costPerDay: 35,
    available: true
  },
  {
    id: 3,
    model: 'Chevrolet Bolt',
    type: 'Hatchback',
    batteryCapacity: '66 kWh',
    range: '259 miles',
    owners: ['Bob Williams', 'Carol Davis'],
    costPerDay: 40,
    available: false
  }
];

class EVModel {
  static getAll() {
    return evs;
  }

  static getById(id) {
    return evs.find(ev => ev.id === parseInt(id));
  }

  static create(evData) {
    const newEV = {
      id: evs.length > 0 ? Math.max(...evs.map(ev => ev.id)) + 1 : 1,
      ...evData
    };
    evs.push(newEV);
    return newEV;
  }

  static update(id, evData) {
    const index = evs.findIndex(ev => ev.id === parseInt(id));
    if (index !== -1) {
      evs[index] = { ...evs[index], ...evData };
      return evs[index];
    }
    return null;
  }

  static delete(id) {
    const index = evs.findIndex(ev => ev.id === parseInt(id));
    if (index !== -1) {
      const deletedEV = evs[index];
      evs.splice(index, 1);
      return deletedEV;
    }
    return null;
  }
}

module.exports = EVModel;
