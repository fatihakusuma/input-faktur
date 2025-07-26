const APOTEK_LOGINS = {
  'https://azpyg.apotekdigital.id': {
    user: process.env.APOTEK_USER_AZZAHRA,
    pass: process.env.APOTEK_PASS_AZZAHRA
  },
  'https://admv1.apotekdigital.id': {
    user: process.env.APOTEK_USER_ADAMEVA,
    pass: process.env.APOTEK_PASS_ADAMEVA
  }
};

const getPharmacyCredentials = (url) => {
  const baseUrl = new URL(url).origin;
  return APOTEK_LOGINS[baseUrl] || {
    user: process.env.APOTEK_USER,
    pass: process.env.APOTEK_PASS
  };
};

module.exports = { getPharmacyCredentials };