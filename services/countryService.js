const axios = require('axios');

const getCountryInfo = async (countryName) => {
  try {
    const response = await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}`);
    
    if (!response.data || response.data.length === 0) {
      throw new Error('Country not found');
    }

    const country = response.data[0];
    
    return {
      name: country.name.common,
      officialName: country.name.official,
      flag: country.flags.svg,
      capital: country.capital ? country.capital[0] : 'N/A',
      currency: country.currencies ? Object.values(country.currencies)[0].name : 'N/A',
      currencySymbol: country.currencies ? Object.values(country.currencies)[0].symbol : 'N/A',
      languages: country.languages ? Object.values(country.languages) : [],
      population: country.population,
      region: country.region,
      subregion: country.subregion
    };
  } catch (error) {
    console.error('Error fetching country data:', error);
    throw error;
  }
};

const getAllCountries = async () => {
  try {
    const response = await axios.get('https://restcountries.com/v3.1/all');
    return response.data.map(country => ({
      name: country.name.common,
      code: country.cca2
    })).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error fetching all countries:', error);
    throw error;
  }
};

module.exports = { getCountryInfo, getAllCountries };