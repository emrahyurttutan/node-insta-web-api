const Insta = require("./index");
const InstaClient = new Insta();

(async () => {
  InstaClient.getCookie()
  await InstaClient.login("tughaber", "159753456TUg");
  const profileData = await InstaClient.getProfileData();
  console.log(profileData);
})();
