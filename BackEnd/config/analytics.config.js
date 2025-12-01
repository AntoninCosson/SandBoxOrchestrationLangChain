// BackEnd/config/analytics.config.js

const ANALYTICS_PAGES = [
    "/",
    "/shop",
    "/checkout",
    "/chat",
    "/booking",
    "/payment/success",
  ];
  
  const validatePage = (page) => ANALYTICS_PAGES.includes(page);
  
  module.exports = {
    ANALYTICS_PAGES,
    validatePage,
  };