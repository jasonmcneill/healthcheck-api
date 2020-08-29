// Use the following middleware function on all protected routes
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token)
    return res
      .status(400)
      .send({ msg: "Missing access token", msgType: "error" });

  jwt.verify(
    token,
    process.env.HEALTH_CHECK_ACCESS_TOKEN_SECRET,
    (err, userdata) => {
      if (err)
        return res
          .status(403)
          .send({ msg: "invalid access token", msgType: "error" });
      req.user = userdata;
      next();
    }
  );
};

exports.sendSms = (recipient, content) => {
  const twilio = require("twilio");
  const client = new twilio(
    process.env.HEALTH_CHECK_TWILIO_ACCOUNT_SID,
    process.env.HEALTH_CHECK_TWILIO_AUTH_TOKEN
  );
  let sender = "+12058518089";
  return new Promise((resolve, reject) => {
    client.messages
      .create({
        from: sender,
        to: recipient,
        body: content,
      })
      .then((message) => {
        console.log(require("util").inspect(message, true, 7, true));
        resolve(message);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

exports.sendEmail = (recipient, sender, subject, body) => {
  const sgMail = require("@sendgrid/mail");
  sgMail.setApiKey(process.env.HEALTH_CHECK_SENDGRID_API_KEY);
  const msg = {
    to: recipient,
    from: sender,
    subject: subject,
    html: body,
  };
  return new Promise((resolve, reject) => {
    resolve(sgMail.send(msg));
  }).catch((error) => {
    reject(error);
  });
};

/*
  METHOD:
  validatePhone

  EXAMPLE RETURN VALUE:
  {
    "isValidForRegion": true,
    "isPossibleNumber": true,
    "numberType": "FIXED_LINE_OR_MOBILE",
    "e164Format": "+12133251382",
    "nationalFormat": "(213) 325-1382"
  }
*/
exports.validatePhone = (number, countryCode) => {
  const PNF = require('google-libphonenumber').PhoneNumberFormat;
  const phoneUtil = require("google-libphonenumber").PhoneNumberUtil.getInstance();
  const phoneNumber = phoneUtil.parse(number, countryCode);
  const isValidForRegion = phoneUtil.isValidNumberForRegion(phoneNumber, countryCode);
  const numberType = phoneUtil.getNumberType(phoneNumber);
  const e164Format = phoneUtil.format(phoneNumber, PNF.E164) || "";
  const nationalFormat = phoneUtil.formatInOriginalFormat(phoneNumber, countryCode) || "";
  const isPossibleNumber = phoneUtil.isPossibleNumber(phoneNumber);

  /* 
    List of types:  
      URL:  https://github.com/google/libphonenumber/blob/master/java/libphonenumber/src/com/google/i18n/phonenumbers/PhoneNumberUtil.java
      Line:  search for "public enum PhoneNumberType"
  */
  const allTypes = [
    "FIXED_LINE",
    "MOBILE",
    "FIXED_LINE_OR_MOBILE",
    "TOLL_FREE",
    "PREMIUM_RATE",
    "SHARED_COST",
    "VOIP",
    "PERSONAL_NUMBER",
    "PAGER",
    "UAN",
    "VOICEMAIL",
    "UNKNOWN"
  ];
  const validSmsTypes = [
    "FIXED_LINE",
    "MOBILE",
    "FIXED_LINE_OR_MOBILE",
    "VOIP",
    "PERSONAL_NUMBER",
    "PAGER",
    "VOICEMAIL",
    "UNKNOWN"
  ];
  const returnedSmsType = allTypes[numberType];
  const isValidSmsType = validSmsTypes.includes(returnedSmsType);
  const returnObject = {
    isPossibleNumber: isPossibleNumber,
    isValidForRegion: isValidForRegion,
    isValidSmsType: isValidSmsType,
    e164Format: e164Format,
    nationalFormat: nationalFormat
  };
  return returnObject;
}

exports.smsToken = () => {
  const token = Math.floor(100000 + Math.random() * 900000);
  return token;
}