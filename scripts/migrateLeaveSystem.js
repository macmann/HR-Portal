const { recalculateLeaveBalancesForCycle } = require('../services/leaveAccrualService');

async function migrateLeaveSystem(options = {}) {
  const { now = new Date() } = options;
  const result = await recalculateLeaveBalancesForCycle(now);
  console.log(
    `Processed ${result.processed} employees; updated ${result.updated}; cycle ${result.cycleStart?.toISOString()} - ${result.cycleEnd?.toISOString()}.`
  );
  return result;
}

module.exports = {
  migrateLeaveSystem
};

if (require.main === module) {
  migrateLeaveSystem()
    .then(summary => {
      console.log('Leave system migration complete.', summary);
      process.exit(0);
    })
    .catch(error => {
      console.error('Leave system migration failed:', error);
      process.exit(1);
    });
}
