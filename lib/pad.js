
function pad(num) {
  if (Number(num) < 10) {
    return '0' + num;
  }
  return num;
}

module.exports = pad
