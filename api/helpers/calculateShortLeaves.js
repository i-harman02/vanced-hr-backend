const calculateShortLeave = async (userShortLeaves) => {
  const monthlyShortLeaves = userShortLeaves.reduce((acc, leave) => {
    const month = new Date(leave.startDate).getMonth();
    const year = new Date(leave.startDate).getFullYear();
    const key = `${year}-${month}`;

    if (!acc[key]) acc[key] = [];
    acc[key].push(leave);
    return acc;
  }, {});

  // Calculate equivalent leave days
  let totalShortLeaveDays = 0;
  for (const month in monthlyShortLeaves) {
    const shortLeaveCount = monthlyShortLeaves[month].length;

    const equivalentDays = Math.floor(shortLeaveCount / 3) * 0.5;
    totalShortLeaveDays += equivalentDays;
  }

  return totalShortLeaveDays;
};
module.exports = calculateShortLeave;
