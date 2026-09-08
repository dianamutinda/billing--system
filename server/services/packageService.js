const packages = [
  { id: '1hr', label: '1 Hour', amount: 10, durationMinutes: 60 },
  { id: '1day', label: '1 Day', amount: 50, durationMinutes: 1440 },
  { id: '1week', label: '1 Week', amount: 200, durationMinutes: 10080 },
];

function getAllPackages() {
  return packages;
}

function getPackageById(id) {
  return packages.find((pkg) => pkg.id === id);
}

module.exports = { getAllPackages, getPackageById };