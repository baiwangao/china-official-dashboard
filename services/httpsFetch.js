async function httpsFetch(url, options = {}) {
  return fetch(url, options);
}

module.exports = { httpsFetch };
